const NTFY_TOPIC = 'sdvidros_aprovacoes_85996119824';
const NTFY_PORTAL = 'sdvidros_portal_notificacoes';
const SD_ZAP_NUM = '5585996119824';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const isPost = req.method === 'POST';
  const q = req.query || {};
  const b = req.body || {};

  const id = String(b.id || q.id || '').trim();
  const cliente = String(b.cliente || q.cliente || 'Cliente').trim();
  const tipo = String(b.tipo || q.tipo || 'Medição Técnica').trim();
  const data = String(b.data || q.data || '').trim();
  const hora = String(b.hora || q.hora || '').trim();
  const acao = String(b.acao || q.acao || '').trim().toLowerCase();
  const nota = b.nota || q.nota || 5;
  const comentario = String(b.comentario || q.comentario || '').trim();

  const dataFmt = data ? data.split('-').reverse().join('/') : '';
  const dataHora = new Date().toISOString();

  // Se houver uma ação executada (confirmar, reagendar, avaliar)
  if (acao === 'confirmar' || acao === 'reagendar' || acao === 'avaliar') {
    const evento = {
      tipo: 'confirmacao_agendamento',
      id: id,
      cliente: cliente,
      tipo_atendimento: tipo,
      data: data,
      hora: hora,
      acao: acao,
      nota: Number(nota) || 5,
      comentario: comentario,
      dataHora: dataHora,
      origem: 'pagina_interativa_cliente'
    };

    // Publica em tempo real no barramento ntfy
    try {
      const promises = [
        fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
          method: 'POST',
          headers: {
            'Title': `Agendamento ${acao.toUpperCase()}: ${cliente}`,
            'Tags': acao === 'confirmar' ? 'white_check_mark' : (acao === 'reagendar' ? 'arrows_counterclockwise' : 'star'),
            'Priority': 'urgent'
          },
          body: JSON.stringify(evento)
        }),
        fetch(`https://ntfy.sh/${NTFY_PORTAL}`, {
          method: 'POST',
          headers: { 'Title': `Agenda: ${cliente} escolheu ${acao}` },
          body: JSON.stringify(evento)
        })
      ];
      await Promise.all(promises);
    } catch (e) {
      console.warn('Erro ao notificar ntfy:', e.message);
    }

    if (isPost || (q.format && q.format === 'json')) {
      return res.status(200).json({
        ok: true,
        acao: acao,
        id: id,
        cliente: cliente,
        status: acao === 'confirmar' ? 'confirmado' : acao
      });
    }

    // Tela de confirmação HTML de sucesso estilizada
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const titulos = {
      confirmar: 'Agendamento Confirmado!',
      reagendar: 'Solicitação de Reagendamento Enviada!',
      avaliar: 'Avaliação Registrada!'
    };
    const descricoes = {
      confirmar: `Olá <strong>${cliente}</strong>, seu agendamento de <strong>${tipo}</strong> para o dia <strong>${dataFmt}</strong> às <strong>${hora}</strong> foi <strong>confirmado com sucesso</strong>! Nossa equipe já foi notificada.`,
      reagendar: `Olá <strong>${cliente}</strong>, recebemos seu pedido de reagendamento para <strong>${tipo}</strong>. Nossa equipe entrará em contato pelo WhatsApp para combinar o melhor horário!`,
      avaliar: `Muito obrigado por sua avaliação de <strong>${nota} estrelas</strong>! A <strong>SD Móveis Projetados</strong> agradece sua confiança!`
    };
    const icones = {
      confirmar: '✅',
      reagendar: '🔄',
      avaliar: '⭐'
    };
    const cores = {
      confirmar: '#10b981',
      reagendar: '#38bdf8',
      avaliar: '#facc15'
    };

    return res.status(200).send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulos[acao]} – SD Móveis Projetados</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: #07070b;
      color: #f0ece4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
    }
    .card {
      background: #10111a;
      border: 1.5px solid ${cores[acao]};
      box-shadow: 0 0 40px rgba(0,0,0,0.8), 0 0 25px ${cores[acao]}33;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
    }
    .icon { font-size: 58px; line-height: 1; margin-bottom: 14px; }
    h1 { font-size: 22px; font-weight: 900; color: #fff; margin-bottom: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 22px; }
    p strong { color: #fff; }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 999px;
      background: ${cores[acao]}22;
      border: 1px solid ${cores[acao]}55;
      color: ${cores[acao]};
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 18px;
    }
    .btn-zap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: #fff;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      padding: 13px 22px;
      border-radius: 12px;
      box-shadow: 0 4px 18px rgba(37,211,102,0.35);
      transition: all 0.2s;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icones[acao]}</div>
    <div class="badge">${acao === 'confirmar' ? 'Status: Confirmado' : (acao === 'reagendar' ? 'Status: Reagendamento' : 'Status: Avaliado')}</div>
    <h1>${titulos[acao]}</h1>
    <p>${descricoes[acao]}</p>
    <a href="https://wa.me/${SD_ZAP_NUM}" class="btn-zap">💬 Falar com a SD Móveis</a>
  </div>
</body>
</html>
    `);
  }

  // Se o cliente abriu a tela para ESCOLHER entre Confirmar, Reagendar e Avaliar:
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opções do seu Agendamento – SD Móveis Projetados</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: #07070b;
      color: #f0ece4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: #10111a;
      border: 1.5px solid rgba(201,168,76,0.35);
      box-shadow: 0 0 50px rgba(0,0,0,0.85);
      border-radius: 22px;
      padding: 28px 20px;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 900;
      color: #C9A84C;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .sub {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 18px;
    }
    .info-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 14px;
      text-align: left;
      font-size: 13px;
      margin-bottom: 22px;
      line-height: 1.6;
    }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .info-row span { color: #94a3b8; }
    .info-row strong { color: #fff; }
    .btn-action {
      width: 100%;
      padding: 15px;
      border-radius: 12px;
      border: none;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }
    .btn-confirmar {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      box-shadow: 0 4px 18px rgba(16,185,129,0.35);
    }
    .btn-confirmar:hover { transform: translateY(-2px); }
    .btn-reagendar {
      background: rgba(56,189,248,0.15);
      border: 1.5px solid #38bdf8;
      color: #38bdf8;
    }
    .btn-avaliar {
      background: rgba(234,179,8,0.15);
      border: 1.5px solid #eab308;
      color: #facc15;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 99;
    }
    .modal-box {
      background: #141624;
      border: 1.5px solid rgba(201,168,76,0.4);
      border-radius: 18px;
      padding: 24px;
      max-width: 380px;
      width: 100%;
      text-align: center;
    }
    .stars {
      display: flex;
      justify-content: center;
      gap: 8px;
      font-size: 32px;
      margin: 14px 0;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🏠 SD MÓVEIS PROJETADOS</div>
    <div class="sub">Confirmação de Atendimento ao Cliente</div>

    <div class="info-box">
      <div class="info-row">
        <span>Cliente:</span>
        <strong>${cliente}</strong>
      </div>
      <div class="info-row">
        <span>Serviço:</span>
        <strong style="color:#C9A84C;">${tipo}</strong>
      </div>
      ${data ? `
      <div class="info-row">
        <span>Data:</span>
        <strong>${dataFmt}</strong>
      </div>` : ''}
      ${hora ? `
      <div class="info-row">
        <span>Horário:</span>
        <strong>${hora}</strong>
      </div>` : ''}
    </div>

    <p style="font-size:12.5px;color:#94a3b8;margin-bottom:16px;">
      Escolha uma opção abaixo para atualizar seu agendamento instantaneamente:
    </p>

    <!-- 1. BOTAO CONFIRMAR -->
    <a href="?id=${encodeURIComponent(id)}&cliente=${encodeURIComponent(cliente)}&tipo=${encodeURIComponent(tipo)}&data=${encodeURIComponent(data)}&hora=${encodeURIComponent(hora)}&acao=confirmar" style="text-decoration:none;">
      <button class="btn-action btn-confirmar">
        ✅ CONFIRMAR AGENDAMENTO
      </button>
    </a>

    <!-- 2. BOTAO REAGENDAR -->
    <a href="?id=${encodeURIComponent(id)}&cliente=${encodeURIComponent(cliente)}&tipo=${encodeURIComponent(tipo)}&data=${encodeURIComponent(data)}&hora=${encodeURIComponent(hora)}&acao=reagendar" style="text-decoration:none;">
      <button class="btn-action btn-reagendar">
        🔄 SOLICITAR REAGENDAMENTO
      </button>
    </a>

    <!-- 3. BOTAO AVALIAR -->
    <button class="btn-action btn-avaliar" onclick="abrirAvaliacao()">
      ⭐ AVALIAR ATENDIMENTO
    </button>
  </div>

  <!-- MODAL DE AVALIACAO -->
  <div class="modal" id="modal-avaliacao" onclick="fecharAvaliacao()">
    <div class="modal-box" onclick="event.stopPropagation()">
      <h3 style="color:#fff;font-size:18px;margin-bottom:6px;">⭐ Avaliar Atendimento</h3>
      <p style="font-size:12.5px;color:#94a3b8;margin-bottom:10px;">Como foi sua experiência com a SD Móveis?</p>
      <div class="stars" id="star-box">
        <span onclick="setNota(1)">⭐</span>
        <span onclick="setNota(2)">⭐</span>
        <span onclick="setNota(3)">⭐</span>
        <span onclick="setNota(4)">⭐</span>
        <span onclick="setNota(5)">⭐</span>
      </div>
      <textarea id="comentario-avaliacao" placeholder="Deixe um comentário opcional..." style="width:100%;height:75px;background:#090a12;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px;color:#fff;font-family:sans-serif;font-size:12px;margin-bottom:14px;resize:none;"></textarea>
      <div style="display:flex;gap:8px;">
        <button onclick="fecharAvaliacao()" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,0.06);border:none;color:#fff;cursor:pointer;font-weight:700;">Cancelar</button>
        <button onclick="enviarAvaliacao()" style="flex:1.5;padding:10px;border-radius:8px;background:#eab308;border:none;color:#000;cursor:pointer;font-weight:900;">Enviar Avaliação</button>
      </div>
    </div>
  </div>

  <script>
    let notaEscolhida = 5;
    function abrirAvaliacao() {
      document.getElementById('modal-avaliacao').style.display = 'flex';
    }
    function fecharAvaliacao() {
      document.getElementById('modal-avaliacao').style.display = 'none';
    }
    function setNota(n) {
      notaEscolhida = n;
      const spans = document.querySelectorAll('#star-box span');
      spans.forEach((s, idx) => {
        s.style.opacity = idx < n ? '1' : '0.25';
      });
    }
    function enviarAvaliacao() {
      const c = document.getElementById('comentario-avaliacao').value;
      const url = '?id=' + encodeURIComponent('${id}') +
        '&cliente=' + encodeURIComponent('${cliente}') +
        '&tipo=' + encodeURIComponent('${tipo}') +
        '&data=' + encodeURIComponent('${data}') +
        '&hora=' + encodeURIComponent('${hora}') +
        '&acao=avaliar&nota=' + notaEscolhida +
        '&comentario=' + encodeURIComponent(c);
      window.location.href = url;
    }
  </script>
</body>
</html>
  `);
};
