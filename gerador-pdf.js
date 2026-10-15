// ══════════════════════════════════════════════════════════════════
//  GERADOR E VISUALIZADOR DE PDF PROFISSIONAL (SD MÓVEIS & SD VIDROS)
//  Compatível com index.html e cliente.html (Mobile e Desktop)
// ══════════════════════════════════════════════════════════════════

let currentPdfBlobUrl = null;
let currentPdfFileName = 'Orcamento.pdf';

function parseNum(val) {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).replace(/R\$/g, '').replace(/\s/g, '').trim();
  if (!str) return 0;
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function formatarValorPtBr(val) {
  if (val === '' || val === null || val === undefined) return '0,00';
  const n = parseNum(val);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizarDadosParaPdf(orig) {
  if (!orig) return {};
  const d = orig.dados ? { ...orig.dados, numero: orig.numero || orig.dados.numero, nome: orig.nome || orig.dados.nome, total: orig.total || orig.dados.total } : { ...orig };

  let bNome = (d.bairro || '').trim();
  let cNome = (d.cidade || '').trim();
  if (bNome.includes(',')) {
    const parts = bNome.split(',').map(s => s.trim());
    bNome = parts[0] || '';
    cNome = parts[1] || cNome;
  } else if (bNome.includes('-')) {
    const parts = bNome.split('-').map(s => s.trim());
    bNome = parts[0] || '';
    cNome = parts[1] || cNome;
  }

  let endCompleto = (d.endereco || d.end || '').trim();
  if (d.num && !endCompleto.includes(d.num)) {
    endCompleto = endCompleto ? `${endCompleto}, Nº ${d.num}` : `Nº ${d.num}`;
  }

  return {
    numero: d.numero || '#0001',
    dataStr: d.dataStr || d.data_orc || d.data || new Date().toLocaleDateString('pt-BR'),
    nome: d.nome || 'Cliente',
    cnpj: d.cnpj || '',
    tel: d.tel || '',
    endereco: endCompleto,
    bairro: bNome,
    cidade: cNome,
    apto: d.apto || '',
    resp: d.resp || '',
    itens: Array.isArray(d.itens) ? d.itens : [],
    total: d.total || 'R$ 0,00',
    forma: d.forma || d.condicaoPagamento || '',
    obs: d.obs || '',
    prazo: d.prazo || '',
    garantia: d.garantia || '',
    valProdutos: d.valProdutos,
    valServico: d.valServico,
    valAcrescimo: d.valAcrescimo,
    valFrete: d.valFrete,
    valDesconto: d.valDesconto,
    taxaDesconto: d.taxaDesconto,
    tipoDesconto: d.tipoDesconto,
    status: d.status,
    assinatura_base64: d.assinatura_base64
  };
}

async function gerarPdfOrcamentoDoc(dados) {
  if (typeof PDFLib === 'undefined') {
    throw new Error('PDFLib não carregado.');
  }

  let lic = { id: "sdmoveis", nome: "SD Móveis Projetados", telefone: "(85) 99611-9824" };
  if (typeof obterLicencaAtiva === "function") {
    lic = obterLicencaAtiva() || lic;
  } else if (typeof obterLicencaAtivaCliente === "function") {
    lic = obterLicencaAtivaCliente() || lic;
  }

  const ehMoveis = (lic.tipoContrato === "moveis" || lic.id === "sdmoveis" || (lic.nome && lic.nome.toLowerCase().includes("moveis")));
  const { PDFDocument, StandardFonts, rgb } = PDFLib;

  // Paleta de Cores Premium SD
  const DARK = rgb(0.09, 0.12, 0.18);
  const GOLD = rgb(0.79, 0.63, 0.22);
  const GRAY = rgb(0.42, 0.46, 0.54);
  const BORDER = rgb(0.86, 0.89, 0.93);
  const BOX_BG = rgb(0.98, 0.98, 0.99);
  const HEADER_BG = rgb(0.93, 0.95, 0.98);
  const ROW_ALT = rgb(0.97, 0.98, 0.99);
  const WHITE = rgb(1, 1, 1);
  const GREEN_BG = rgb(0.93, 0.97, 0.94);
  const GREEN_TXT = rgb(0.12, 0.48, 0.24);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN_X = 32;
  const CONTENT_W = PAGE_W - (MARGIN_X * 2);

  function sanitizePdf(text) {
    if (text == null) return '';
    return String(text)
      .replace(/[^\x00-\x7F\xA0-\xFF\u2022]/g, '')
      .trim();
  }

  function wrapText(text, font, size, maxWidth) {
    const words = sanitizePdf(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage = null;
  try {
    let logoUrl = lic.logo;
    if (!logoUrl || logoUrl === 'logo.jpg') {
      logoUrl = ehMoveis ? 'logo_moveis.jpg' : 'logo.jpg';
    }

    if (typeof logoUrl === 'string' && logoUrl.startsWith('data:')) {
      const isPng = logoUrl.startsWith('data:image/png');
      const base64Data = logoUrl.split(',')[1];
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      logoImage = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
    } else {
      const resp = await fetch(logoUrl);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        if (logoUrl.toLowerCase().endsWith('.png')) {
          logoImage = await pdfDoc.embedPng(buf);
        } else {
          logoImage = await pdfDoc.embedJpg(buf);
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar logo personalizada no PDF:', e);
    try {
      const fallbackUrl = ehMoveis ? 'logo_moveis.jpg' : 'logo.jpg';
      const resp = await fetch(fallbackUrl);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        logoImage = await pdfDoc.embedJpg(buf);
      }
    } catch (_) {}
  }

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const {
    numero, dataStr, nome, cnpj, tel, endereco, bairro, cidade, apto, resp,
    itens, total, forma, obs, prazo, garantia
  } = dados;

  // 1. Faixa decorativa superior dourada
  page.drawRectangle({
    x: MARGIN_X,
    y: PAGE_H - 24,
    width: CONTENT_W,
    height: 3.5,
    color: GOLD
  });

  // ---------------- 2. CABEÇALHO ELEGANTE ----------------
  const headerY = PAGE_H - 34;

  if (logoImage) {
    const logoSize = 48;
    page.drawRectangle({
      x: MARGIN_X,
      y: headerY - logoSize,
      width: logoSize,
      height: logoSize,
      borderColor: BORDER,
      borderWidth: 0.8,
      color: WHITE
    });
    page.drawImage(logoImage, {
      x: MARGIN_X + 2,
      y: headerY - logoSize + 2,
      width: logoSize - 4,
      height: logoSize - 4
    });
  }

  const textX = logoImage ? MARGIN_X + 56 : MARGIN_X;
  const nomeEmpresaUpper = sanitizePdf((lic.nome || (ehMoveis ? "SD MÓVEIS PROJETADOS" : "SD VIDROS")).toUpperCase());
  page.drawText(nomeEmpresaUpper, { x: textX, y: headerY - 14, size: 16, font: fontBold, color: DARK });

  let sloganTxt = (lic.segmento || lic.slogan || '').trim();
  if (ehMoveis) {
    if (!sloganTxt || /vidra|vidro|esquadria/i.test(sloganTxt)) {
      sloganTxt = "MÓVEIS PROJETADOS & AMBIENTES SOB MEDIDA";
    }
  } else if (!sloganTxt) {
    sloganTxt = "SOLUÇÕES EM VIDROS TEMPERADOS E ESQUADRIAS DE ALUMÍNIO";
  }
  const sloganEmpresa = sanitizePdf(sloganTxt.toUpperCase());
  page.drawText(sloganEmpresa, { x: textX, y: headerY - 26, size: 7.2, font: fontBold, color: GOLD });

  let endEmpresa = "";
  if (lic.id === "sdvidros") {
    endEmpresa = "Rua Jorge Figueiredo 740, Barrocão - Itaitinga-CE • CNPJ: 49.226.611/0001-33";
  } else {
    const cid = lic.cidade || "Itaitinga-CE";
    const cnp = lic.cnpj ? (" • CNPJ: " + lic.cnpj) : "";
    endEmpresa = cid + cnp;
  }
  page.drawText(sanitizePdf(endEmpresa), { x: textX, y: headerY - 37, size: 7, font: fontRegular, color: GRAY });

  let contatosEmpresa = "";
  const zapEmpresa = lic.telefone || "(85) 99611-9824";
  if (lic.id === "sdvidros") {
    contatosEmpresa = `WhatsApp: ${zapEmpresa} • 99760-2237 • 98574-9606 | sdvidros2025@gmail.com`;
  } else {
    contatosEmpresa = `WhatsApp: ${zapEmpresa} | ${lic.email || "Atendimento & Projetos Sob Medida"}`;
  }
  page.drawText(sanitizePdf(contatosEmpresa), { x: textX, y: headerY - 48, size: 7, font: fontRegular, color: GRAY });

  const badgeW = 138;
  const badgeH = 50;
  const badgeX = MARGIN_X + CONTENT_W - badgeW;
  const badgeY = headerY - badgeH;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: DARK
  });

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: 3.5,
    height: badgeH,
    color: GOLD
  });

  const numLimpo = String(numero || '000001').replace('#', '').padStart(6, '0');
  page.drawText('PROPOSTA COMERCIAL', { x: badgeX + 10, y: badgeY + 35, size: 7, font: fontBold, color: GOLD });
  page.drawText(`Nº ${numLimpo}`, { x: badgeX + 10, y: badgeY + 20, size: 12, font: fontBold, color: WHITE });

  const agora = new Date();
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataFormatada = dataStr || agora.toLocaleDateString('pt-BR');
  page.drawText(`Emissão: ${dataFormatada} às ${horaStr}`, { x: badgeX + 10, y: badgeY + 8, size: 6.8, font: fontRegular, color: rgb(0.85, 0.88, 0.93) });

  // ---------------- 3. CARD: DADOS DO CLIENTE & LOCAL ----------------
  const clientCardY = badgeY - 14;
  const clientCardH = 58;
  const clientCardBoxY = clientCardY - clientCardH;

  page.drawRectangle({
    x: MARGIN_X,
    y: clientCardBoxY,
    width: CONTENT_W,
    height: clientCardH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  page.drawRectangle({
    x: MARGIN_X,
    y: clientCardY - 15,
    width: CONTENT_W,
    height: 15,
    color: HEADER_BG
  });
  page.drawText('IDENTIFICAÇÃO DO CLIENTE & LOCAL DA INSTALAÇÃO', { x: MARGIN_X + 10, y: clientCardY - 11, size: 7, font: fontBold, color: DARK });

  const nomeCliente = String(nome || 'CLIENTE NÃO INFORMADO').toUpperCase();
  const telCliente = String(tel || '').trim();
  const endLimpo = String(endereco || '').toUpperCase();
  const bairroNome = String(bairro || '').toUpperCase();
  const cidadeNome = String(cidade || '').toUpperCase();
  const bairroCidade = [bairroNome, cidadeNome ? cidadeNome + ' - CE' : 'CE'].filter(Boolean).join(', ');

  page.drawText('CLIENTE:', { x: MARGIN_X + 10, y: clientCardY - 27, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(nomeCliente.substring(0, 48), { x: MARGIN_X + 56, y: clientCardY - 27, size: 8, font: fontBold, color: DARK });

  page.drawText('WHATSAPP / TEL:', { x: MARGIN_X + 340, y: clientCardY - 27, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(telCliente || '-', { x: MARGIN_X + 420, y: clientCardY - 27, size: 8, font: fontBold, color: DARK });

  page.drawText('ENDEREÇO:', { x: MARGIN_X + 10, y: clientCardY - 41, size: 6.8, font: fontBold, color: GRAY });
  page.drawText((endLimpo || 'Não informado').substring(0, 52), { x: MARGIN_X + 68, y: clientCardY - 41, size: 7.5, font: fontRegular, color: DARK });

  page.drawText('BAIRRO / CID:', { x: MARGIN_X + 340, y: clientCardY - 41, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(bairroCidade || 'Itaitinga - CE', { x: MARGIN_X + 406, y: clientCardY - 41, size: 7.5, font: fontRegular, color: DARK });

  page.drawText('CPF / CNPJ:', { x: MARGIN_X + 10, y: clientCardY - 54, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(cnpj || 'Não informado', { x: MARGIN_X + 68, y: clientCardY - 54, size: 7.5, font: fontRegular, color: DARK });

  if (apto) {
    page.drawText('COMPL / APTO:', { x: MARGIN_X + 220, y: clientCardY - 54, size: 6.8, font: fontBold, color: GRAY });
    page.drawText(String(apto).toUpperCase(), { x: MARGIN_X + 284, y: clientCardY - 54, size: 7.5, font: fontRegular, color: DARK });
  }

  // ---------------- 4. TABELA DE ITENS & SERVIÇOS ----------------
  const tableHeaderY = clientCardBoxY - 14;
  const tableHeaderH = 19;

  page.drawRectangle({
    x: MARGIN_X,
    y: tableHeaderY - tableHeaderH,
    width: CONTENT_W,
    height: tableHeaderH,
    color: DARK
  });

  page.drawText('DESCRIÇÃO DO PRODUTO / SERVIÇO', { x: MARGIN_X + 8, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('MEDIDAS (L x A)', { x: MARGIN_X + 250, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('ÁREA (M²)', { x: MARGIN_X + 338, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('QTD', { x: MARGIN_X + 395, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('VL. UNIT (R$)', { x: MARGIN_X + 434, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('TOTAL (R$)', { x: MARGIN_X + 486, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });

  let curY = tableHeaderY - tableHeaderH;
  const itensList = Array.isArray(itens) && itens.length ? itens : [];

  if (!itensList.length) {
    const rowH = 24;
    curY -= rowH;
    page.drawRectangle({
      x: MARGIN_X,
      y: curY,
      width: CONTENT_W,
      height: rowH,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 0.6
    });
    const defaultServicoTxt = ehMoveis ? 'SERVIÇOS DE MARCENARIA E MÓVEIS PROJETADOS SOB MEDIDA' : 'SERVIÇOS DE VIDRAÇARIA E ESQUADRIAS DE ALUMÍNIO';
    page.drawText(defaultServicoTxt, { x: MARGIN_X + 8, y: curY + 8, size: 7.5, font: fontBold, color: DARK });
    page.drawText('Sob Medida', { x: MARGIN_X + 250, y: curY + 8, size: 7.5, font: fontRegular, color: GRAY });
    page.drawText('-', { x: MARGIN_X + 350, y: curY + 8, size: 7.5, font: fontRegular, color: GRAY });
    page.drawText('1 UND', { x: MARGIN_X + 395, y: curY + 8, size: 7.5, font: fontRegular, color: DARK });

    const valTot = String(total || '0,00').replace('R$', '').trim();
    page.drawText(valTot, { x: MARGIN_X + 438, y: curY + 8, size: 7.5, font: fontRegular, color: DARK });
    page.drawText(valTot, { x: MARGIN_X + 490, y: curY + 8, size: 8, font: fontBold, color: DARK });
  } else {
    itensList.forEach((it, idx) => {
      let descTxt = String(it.desc || '').toUpperCase();
      if (it.cor) descTxt += ` (${String(it.cor).toUpperCase()})`;

      const descLines = wrapText(descTxt, fontRegular, 7.5, 230);
      const rowH = Math.max(22, descLines.length * 11 + 9);
      curY -= rowH;

      page.drawRectangle({
        x: MARGIN_X,
        y: curY,
        width: CONTENT_W,
        height: rowH,
        color: idx % 2 === 0 ? WHITE : ROW_ALT,
        borderColor: BORDER,
        borderWidth: 0.5
      });

      descLines.forEach((l, lIdx) => {
        page.drawText(l, { x: MARGIN_X + 8, y: curY + rowH - 12 - (lIdx * 10), size: 7.5, font: lIdx === 0 ? fontBold : fontRegular, color: DARK });
      });

      let medTxt = '-';
      if (it.larg && it.alt) {
        medTxt = `${it.larg} x ${it.alt} m`;
      }
      page.drawText(medTxt, { x: MARGIN_X + 250, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      const m2Txt = it.m2 ? String(it.m2).replace('m²', '').trim() + ' m²' : '-';
      page.drawText(m2Txt, { x: MARGIN_X + 338, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      page.drawText(`${it.qtd || 1} UND`, { x: MARGIN_X + 395, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      const vUnitTxt = (it.v_unit && String(it.v_unit).trim() !== '-' && parseNum(it.v_unit) > 0) ? String(it.v_unit).replace('R$', '').trim() : '';
      page.drawText(vUnitTxt, { x: MARGIN_X + 438, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      const vTotTxt = String(it.total || '0,00').replace('R$', '').trim();
      page.drawText(vTotTxt, { x: MARGIN_X + 488, y: curY + rowH - 13, size: 7.8, font: fontBold, color: DARK });
    });
  }

  const minBottomSectionTop = 330;
  let bottomY = curY - 14;
  if (bottomY > minBottomSectionTop) {
    bottomY = minBottomSectionTop;
  }

  // ---------------- 5. CARDS INFERIORES (CONDIÇÕES COMERCIAIS & TOTAIS) ----------------
  const cardBottomH = 150;
  const cardBottomY = bottomY - cardBottomH;

  const leftCardW = 320;
  page.drawRectangle({
    x: MARGIN_X,
    y: cardBottomY,
    width: leftCardW,
    height: cardBottomH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  page.drawRectangle({
    x: MARGIN_X,
    y: bottomY - 16,
    width: leftCardW,
    height: 16,
    color: HEADER_BG
  });
  page.drawText('CONDIÇÕES COMERCIAIS & FORMAS DE PAGAMENTO', { x: MARGIN_X + 8, y: bottomY - 12, size: 7, font: fontBold, color: DARK });

  let condY = bottomY - 28;
  const formaTxt = forma ? String(forma).toUpperCase() : 'À VISTA';
  page.drawText(`• Forma Escolhida: ${formaTxt}`, { x: MARGIN_X + 8, y: condY, size: 7.2, font: fontBold, color: DARK });
  condY -= 11;
  const opcoesPag = lic.opcoesPagamento || '50% na entrada + 50% na entrega | Até 10x s/ juros no cartão';
  page.drawText(sanitizePdf(`• Opções: ${opcoesPag}`), { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: GRAY });
  condY -= 11;
  const prazoFinal = prazo || lic.prazoEntrega || '15 dias úteis após confirmação';
  page.drawText(sanitizePdf(`• Prazo de Execução: ${prazoFinal}`), { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: DARK });
  condY -= 11;
  const garantiaFinal = garantia || lic.garantia || '1 Ano de garantia legal e de instalação';
  page.drawText(sanitizePdf(`• Garantia: ${garantiaFinal}`), { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: DARK });

  if (obs) {
    condY -= 11;
    page.drawText(`• Observações: ${String(obs).substring(0, 50)}`, { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: GRAY });
  }

  // Box PIX no rodapé do Card Esquerdo
  const pixBoxH = 46;
  const pixBoxY = cardBottomY + 7;
  page.drawRectangle({
    x: MARGIN_X + 8,
    y: pixBoxY,
    width: leftCardW - 16,
    height: pixBoxH,
    color: GREEN_BG,
    borderColor: rgb(0.72, 0.85, 0.76),
    borderWidth: 0.8
  });
  page.drawText('DADOS PARA PAGAMENTO VIA PIX:', { x: MARGIN_X + 16, y: pixBoxY + 32, size: 6.8, font: fontBold, color: GREEN_TXT });
  const pixChave = lic.pix || (lic.id === 'sdvidros' ? '49.226.611/0001-33' : '85997602237');
  const titularPix = lic.titularPix || (lic.id === 'sdvidros' ? 'SD Vidros' : 'Samuel David - SD Móveis Projetados');
  const wppPix = lic.whatsappPix || lic.telefone || (lic.id === 'sdvidros' ? '(85) 99611-9824' : '(85) 98574-9686');
  page.drawText(sanitizePdf(`Chave PIX: ${pixChave} (${titularPix})`), { x: MARGIN_X + 16, y: pixBoxY + 20, size: 6.8, font: fontBold, color: DARK });
  page.drawText(sanitizePdf(`WhatsApp / Contato: ${wppPix}`), { x: MARGIN_X + 16, y: pixBoxY + 9, size: 6.8, font: fontRegular, color: DARK });

  // CARD DIREITO: RESUMO FINANCEIRO E TOTAL
  const rightCardW = CONTENT_W - leftCardW - 12;
  const rightCardX = MARGIN_X + leftCardW + 12;

  page.drawRectangle({
    x: rightCardX,
    y: cardBottomY,
    width: rightCardW,
    height: cardBottomH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  page.drawRectangle({
    x: rightCardX,
    y: bottomY - 16,
    width: rightCardW,
    height: 16,
    color: HEADER_BG
  });
  page.drawText('RESUMO FINANCEIRO', { x: rightCardX + 8, y: bottomY - 12, size: 7, font: fontBold, color: DARK });

  let totY = bottomY - 32;
  const valorTotalLimpo = String(total || '0,00').replace('R$', '').trim();

  const valProdNum = parseNum(dados.valProdutos);
  const valServNum = parseNum(dados.valServico);
  const valAcrescimoNum = parseNum(dados.valAcrescimo);
  const valFreteNum = parseNum(dados.valFrete);
  const valDescNum = parseNum(dados.valDesconto);
  const valServicoFinal = valServNum > 0 ? valServNum : valAcrescimoNum;

  const txtValProdutos = valProdNum > 0 ? ('R$ ' + formatarValorPtBr(valProdNum)) : ('R$ ' + valorTotalLimpo);
  page.drawText('Valor dos Produtos / Materiais:', { x: rightCardX + 10, y: totY, size: 6.8, font: fontRegular, color: GRAY });
  page.drawText(txtValProdutos, { x: rightCardX + rightCardW - 10 - fontBold.widthOfTextAtSize(txtValProdutos, 7.2), y: totY, size: 7.2, font: fontBold, color: DARK });

  totY -= 13;
  const txtValServico = valServicoFinal > 0 ? ('R$ ' + formatarValorPtBr(valServicoFinal)) : '';
  page.drawText('Mão de Obra e Instalação:', { x: rightCardX + 10, y: totY, size: 6.8, font: fontRegular, color: GRAY });
  page.drawText(txtValServico, { x: rightCardX + rightCardW - 10 - (valServicoFinal > 0 ? fontBold : fontRegular).widthOfTextAtSize(txtValServico, 7.2), y: totY, size: 7.2, font: valServicoFinal > 0 ? fontBold : fontRegular, color: DARK });

  totY -= 13;
  const txtValFrete = valFreteNum > 0 ? ('R$ ' + formatarValorPtBr(valFreteNum)) : '';
  page.drawText('Frete e Deslocamento:', { x: rightCardX + 10, y: totY, size: 6.8, font: fontRegular, color: GRAY });
  page.drawText(txtValFrete, { x: rightCardX + rightCardW - 10 - (valFreteNum > 0 ? fontBold : fontRegular).widthOfTextAtSize(txtValFrete, 7.2), y: totY, size: 7.2, font: valFreteNum > 0 ? fontBold : fontRegular, color: DARK });

  if (valDescNum > 0) {
    totY -= 13;
    const taxaDescPct = parseNum(dados.taxaDesconto);
    const labelDesc = (taxaDescPct > 0 || dados.tipoDesconto === 'porc')
      ? `Desconto Especial (${taxaDescPct > 0 ? taxaDescPct.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : ''}%):`
      : 'Desconto Especial:';
    const txtDesc = '- R$ ' + formatarValorPtBr(valDescNum);
    page.drawText(labelDesc, { x: rightCardX + 10, y: totY, size: 6.8, font: fontRegular, color: rgb(0.8, 0.2, 0.2) });
    page.drawText(txtDesc, { x: rightCardX + rightCardW - 10 - fontBold.widthOfTextAtSize(txtDesc, 7.2), y: totY, size: 7.2, font: fontBold, color: rgb(0.8, 0.2, 0.2) });
  }

  // Bloco de destaque do VALOR TOTAL
  const totalBoxH = 50;
  const totalBoxY = cardBottomY + 7;
  page.drawRectangle({
    x: rightCardX + 8,
    y: totalBoxY,
    width: rightCardW - 16,
    height: totalBoxH,
    color: DARK
  });
  page.drawRectangle({
    x: rightCardX + 8,
    y: totalBoxY,
    width: rightCardW - 16,
    height: totalBoxH,
    borderColor: GOLD,
    borderWidth: 1.2
  });

  page.drawText('TOTAL DO ORÇAMENTO', { x: rightCardX + 18, y: totalBoxY + 34, size: 7, font: fontBold, color: GOLD });
  page.drawText(`R$ ${valorTotalLimpo}`, { x: rightCardX + 18, y: totalBoxY + 14, size: 14, font: fontBold, color: WHITE });

  // ---------------- 6. RODAPÉ DE APROVAÇÃO & ASSINATURA ----------------
  const rodapeCardH = 68;
  const rodapeCardY = 32;

  page.drawRectangle({
    x: MARGIN_X,
    y: rodapeCardY,
    width: CONTENT_W,
    height: rodapeCardH,
    color: WHITE,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  page.drawText('Autorizo a execução dos serviços conforme as especificações e valores discriminados nesta proposta.', {
    x: MARGIN_X + 10,
    y: rodapeCardY + rodapeCardH - 14,
    size: 6.8,
    font: fontRegular,
    color: DARK
  });

  page.drawText('[  ] APROVADO     [  ] AJUSTAR DETALHES', {
    x: MARGIN_X + CONTENT_W - 200,
    y: rodapeCardY + rodapeCardH - 14,
    size: 7.5,
    font: fontBold,
    color: DARK
  });

  page.drawText('Assinatura do Cliente: __________________________________________________', {
    x: MARGIN_X + 10,
    y: rodapeCardY + 30,
    size: 7.5,
    font: fontBold,
    color: DARK
  });
  page.drawText('Data: _____ / _____ / ________', {
    x: MARGIN_X + CONTENT_W - 145,
    y: rodapeCardY + 30,
    size: 7.5,
    font: fontBold,
    color: DARK
  });

  const respNome = String(resp || lic.responsavel || 'SAMUEL DAVID').toUpperCase();
  page.drawText(`Responsável: ${respNome} • Situação: Aguardando Aprovação`, {
    x: MARGIN_X + 10,
    y: rodapeCardY + 12,
    size: 6.8,
    font: fontRegular,
    color: GRAY
  });

  // Se aprovado e tem assinatura real, embute no PDF
  const statusPdf = dados.status || '';
  const aprovadoPdf = statusPdf === 'aprovado';
  if (aprovadoPdf && dados.assinatura_base64) {
    try {
      const sigData = dados.assinatura_base64;
      let sigImg = null;
      const b64 = sigData.includes(',') ? sigData.split(',')[1] : sigData;
      const bin = atob(b64);
      const sigBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) sigBytes[i] = bin.charCodeAt(i);
      if (sigData.startsWith('data:image/png')) {
        try { sigImg = await pdfDoc.embedPng(sigBytes); } catch(_) {}
      } else if (sigData.startsWith('data:image/jpeg') || sigData.startsWith('data:image/jpg')) {
        try { sigImg = await pdfDoc.embedJpg(sigBytes); } catch(_) {}
      }
      if (sigImg) {
        const sigDims = sigImg.scale(0.25);
        const sigX = MARGIN_X + 140;
        const sigY = rodapeCardY + 22;
        page.drawImage(sigImg, {
          x: sigX,
          y: sigY,
          width: Math.min(sigDims.width, 180),
          height: Math.min(sigDims.height, 40),
          opacity: 1
        });
      }
    } catch(sigErr) {
      console.warn('Erro ao embutir assinatura no PDF:', sigErr);
    }
  }

  const telRodapeZap = (lic && lic.telefone) ? lic.telefone : "(85) 99611-9824";
  page.drawText(sanitizePdf(`Confirmação rápida WhatsApp: ${telRodapeZap}`), {
    x: MARGIN_X + CONTENT_W - 205,
    y: rodapeCardY + 12,
    size: 6.8,
    font: fontBold,
    color: GOLD
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function obterPdfOrcamentoBlob(dados) {
  if (typeof PDFLib !== 'undefined') {
    try {
      return await gerarPdfOrcamentoDoc(dados);
    } catch (e) {
      console.warn('Tentando fallback na API /api/gerar-pdf-orcamento:', e);
    }
  }
  const r = await fetch('/api/gerar-pdf-orcamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar PDF do orçamento.');
  }
  return await r.blob();
}

function abrirPdfNovaAba() {
  if (currentPdfBlobUrl) {
    const a = document.createElement('a');
    a.href = currentPdfBlobUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert('Nenhum documento PDF pronto para exibição.');
  }
}

function baixarPdfAtualDoPreview() {
  if (!currentPdfBlobUrl) return;
  const a = document.createElement('a');
  a.href = currentPdfBlobUrl;
  a.download = currentPdfFileName || 'Orcamento.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function fecharModalPreviewPdf(e) {
  if (!e || e.target === document.getElementById('modal-preview-pdf')) {
    const m = document.getElementById('modal-preview-pdf');
    if (m) m.style.display = 'none';
    const corpo = document.getElementById('preview-pdf-corpo');
    if (corpo) corpo.innerHTML = '';
  }
}

async function abrirVisualizadorPdfParaDados(dadosRaw, tituloModal, fileName) {
  const modal = document.getElementById('modal-preview-pdf');
  const tituloEl = document.getElementById('preview-pdf-titulo');
  const container = document.getElementById('preview-pdf-corpo');
  if (!modal || !container) {
    console.error('Modal de visualização do PDF não encontrado.');
    return;
  }

  const dadosPdf = normalizarDadosParaPdf(dadosRaw);

  if (tituloEl) tituloEl.textContent = '⏳ Gerando visualização do PDF...';
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:300px;color:var(--gold-light);">
      <div style="display:inline-block;width:36px;height:36px;border:3px solid rgba(201,168,76,0.25);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:14px;"></div>
      <div style="font-size:14px;font-weight:700;">Renderizando PDF em alta resolução...</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">Aguarde um instante</div>
    </div>`;

  modal.style.zIndex = '9999999';
  modal.style.display = 'flex';

  try {
    const blob = await obterPdfOrcamentoBlob(dadosPdf);
    if (currentPdfBlobUrl) {
      try { URL.revokeObjectURL(currentPdfBlobUrl); } catch (e) {}
    }
    currentPdfBlobUrl = URL.createObjectURL(blob);
    currentPdfFileName = fileName || 'Orcamento.pdf';

    if (tituloEl) tituloEl.textContent = tituloModal || '👁️ Visualizar PDF';

    // 1. Tenta renderizar via PDF.js em canvas
    let renderizouComSucesso = false;
    if (typeof pdfjsLib !== 'undefined') {
      try {
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
        }
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        container.innerHTML = '';
        const wrapperGeral = document.createElement('div');
        wrapperGeral.style.display = 'flex';
        wrapperGeral.style.flexDirection = 'column';
        wrapperGeral.style.gap = '14px';
        wrapperGeral.style.padding = '4px';
        wrapperGeral.style.alignItems = 'center';

        const larguraDisponivel = Math.min(container.clientWidth || window.innerWidth * 0.9, 780);

        for (let numPag = 1; numPag <= pdfDoc.numPages; numPag++) {
          const page = await pdfDoc.getPage(numPag);
          const viewportPadrao = page.getViewport({ scale: 1.0 });
          const escala = (larguraDisponivel / viewportPadrao.width) || 1.3;
          const dpr = Math.max(window.devicePixelRatio || 1, 1.5);
          const viewport = page.getViewport({ scale: escala * dpr });

          const pageCard = document.createElement('div');
          pageCard.style.position = 'relative';
          pageCard.style.maxWidth = '100%';
          pageCard.style.borderRadius = '10px';
          pageCard.style.overflow = 'hidden';
          pageCard.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
          pageCard.style.background = '#ffffff';

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = (viewport.width / dpr) + 'px';
          canvas.style.maxWidth = '100%';
          canvas.style.display = 'block';

          pageCard.appendChild(canvas);
          wrapperGeral.appendChild(pageCard);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        container.appendChild(wrapperGeral);
        renderizouComSucesso = true;
      } catch (errPdfJs) {
        console.warn('Falha na renderização PDF.js, tentando fallback com iframe:', errPdfJs);
      }
    }

    // 2. Se PDF.js não estiver disponível ou falhou, usa iframe nativo
    if (!renderizouComSucesso) {
      container.innerHTML = `<iframe src="${currentPdfBlobUrl}" style="width:100%;height:100%;min-height:75vh;border:none;border-radius:10px;background:#fff;" title="Visualizador do PDF"></iframe>`;
    }

  } catch (err) {
    alert('Erro ao carregar pré-visualização do PDF: ' + (err.message || err));
    fecharModalPreviewPdf();
  }
}

async function visualizarPdfOsCliente() {
  const sessao = (typeof clienteSessao !== 'undefined' && clienteSessao) ? clienteSessao : null;
  const ordens = (typeof carregarOrdensDoStorage === 'function') ? carregarOrdensDoStorage() : [];
  const numOsSessao = sessao ? String(sessao.os || '').toLowerCase().replace('#', '') : '';
  
  let o = ordens.find(x => {
    const oNum = String(x.numero || '').toLowerCase().replace('#', '');
    return (numOsSessao && oNum === numOsSessao) || String(x.numero) === String(sessao ? sessao.os : '');
  }) || (sessao ? sessao.ordem : null);

  let dadosRaw = o ? (o.dados || o) : null;
  if (!dadosRaw && sessao) {
    dadosRaw = {
      numero: sessao.os || '#0001',
      nome: sessao.nomeClienteOs || sessao.nome || 'Cliente',
      total: sessao.valorTotal || 'R$ 0,00',
      forma: sessao.condicaoPagamento || '',
      itens: []
    };
  }

  if (!dadosRaw) {
    alert('Nenhuma Ordem de Serviço encontrada para exibição do PDF.');
    return;
  }

  const numOsLabel = (o && o.numero) ? o.numero : (sessao ? sessao.os : '0001');
  const titulo = `👁️ Visualizar PDF - O.S. ${numOsLabel}`;
  const fileName = `Orcamento-${String(numOsLabel).replace('#', '')}.pdf`;

  const btn = document.getElementById('btn-visualizar-pdf-cliente');
  const lbl = document.getElementById('btn-pdf-cliente-lbl');
  const txtAntigo = lbl ? lbl.textContent : '';
  if (lbl) lbl.textContent = 'Gerando PDF...';
  if (btn) btn.disabled = true;

  try {
    await abrirVisualizadorPdfParaDados(dadosRaw, titulo, fileName);
  } catch (err) {
    console.error('Erro ao abrir PDF da O.S.:', err);
    alert('Não foi possível gerar a pré-visualização do PDF: ' + (err.message || err));
  } finally {
    if (lbl) lbl.textContent = txtAntigo || 'Visualizar PDF';
    if (btn) btn.disabled = false;
  }
}
