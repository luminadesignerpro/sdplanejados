const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook WhatsApp SD Vidros pronto para receber POST.');
  }

  try {
    const body = req.body || {};
    
    // Tenta extrair o texto de diferentes formatos comuns de webhooks WhatsApp (Evolution, Z-API, Baileys, etc.)
    let texto = '';
    if (typeof body === 'string') {
      texto = body;
    } else {
      texto = body.message || body.text || body.body || (body.data && (body.data.message || body.data.body)) || '';
      if (typeof texto === 'object' && texto !== null) {
        texto = texto.conversation || texto.text || texto.body || JSON.stringify(texto);
      }
    }

    texto = String(texto || '').trim();
    const textoMinusculo = texto.toLowerCase();

    if (!texto) {
      return res.status(200).json({ ok: false, msg: 'Nenhum texto de mensagem detectado no payload.' });
    }

    // ── Resposta de Agendamento (CONFIRMAR, REAGENDAR, AVALIAR) ──
    const ehConfirmarAgenda = textoMinusculo.includes('confirmar') || textoMinusculo === 'confirmado' || textoMinusculo === 'confirmo';
    const ehReagendarAgenda = textoMinusculo.includes('reagendar');
    const ehAvaliarAgenda = textoMinusculo.includes('avaliar');

    if (ehConfirmarAgenda || ehReagendarAgenda || ehAvaliarAgenda) {
      const acaoAgenda = ehConfirmarAgenda ? 'confirmar' : (ehReagendarAgenda ? 'reagendar' : 'avaliar');
      const sender = String(body.from || body.phone || body.sender || (body.data && (body.data.from || body.data.phone)) || '').replace(/\D/g, '');
      const dataHora = new Date().toISOString();
      const NTFY_TOPIC = 'sdvidros_aprovacoes_85996119824';
      const NTFY_PORTAL = 'sdvidros_portal_notificacoes';

      try {
        await Promise.all([
          fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
            method: 'POST',
            headers: {
              'Title': `Agendamento ${acaoAgenda.toUpperCase()} via WhatsApp`,
              'Tags': acaoAgenda === 'confirmar' ? 'white_check_mark' : (acaoAgenda === 'reagendar' ? 'arrows_counterclockwise' : 'star'),
              'Priority': 'urgent'
            },
            body: JSON.stringify({
              tipo: 'confirmacao_agendamento',
              acao: acaoAgenda,
              texto: texto,
              telefone: sender,
              dataHora: dataHora,
              origem: 'whatsapp_resposta_direta'
            })
          }),
          fetch(`https://ntfy.sh/${NTFY_PORTAL}`, {
            method: 'POST',
            headers: { 'Title': `Agendamento ${acaoAgenda.toUpperCase()}` },
            body: JSON.stringify({
              tipo: 'confirmacao_agendamento',
              acao: acaoAgenda,
              texto: texto,
              telefone: sender,
              dataHora: dataHora
            })
          })
        ]);
      } catch (_) {}

      return res.status(200).json({
        ok: true,
        tipo: 'agendamento',
        acao: acaoAgenda,
        msg: `Agendamento processado como ${acaoAgenda}.`
      });
    }

    // Verifica se a mensagem contém indicação de aprovação de O.S.
    const ehAprovacao = textoMinusculo.includes('aprovo') ||
                        textoMinusculo.includes('aprovado') ||
                        textoMinusculo.includes('pode iniciar a produção') ||
                        textoMinusculo.includes('pode iniciar a producao') ||
                        textoMinusculo.includes('autorizo');

    if (!ehAprovacao) {
      return res.status(200).json({ ok: false, msg: 'Mensagem recebida, mas não é uma confirmação de aprovação ou agendamento.' });
    }

    // Extrai o número da OS (ex: "#0006" ou "0006")
    const matchOs = texto.match(/#(\d{3,5})/i) || texto.match(/orçamento\s*(?:nº|n°|n\.|#)?\s*(\d{3,5})/i);
    if (!matchOs) {
      return res.status(200).json({ ok: false, msg: 'Número da O.S. não encontrado no texto da mensagem.' });
    }

    const numDigitos = matchOs[1];
    const numOs = '#' + numDigitos.padStart(4, '0');

    const NTFY_TOPIC = 'sdvidros_aprovacoes_85996119824';
    const dataHora = new Date().toISOString();

    // 1. Notifica o barramento de tempo real instantâneo
    try {
      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: { 'Title': `Orçamento ${numOs} Aprovado via Webhook`, 'Tags': 'white_check_mark' },
        body: JSON.stringify({
          numero_os: numOs,
          cliente: 'Cliente',
          status: 'aprovado',
          assinado: true,
          assinante_nome: 'Confirmado via WhatsApp',
          assinado_em: dataHora,
          origem: 'webhook_whatsapp'
        })
      });
    } catch (_) {}

    // 2. Tenta atualizar no Supabase (se disponível)
    let dbOk = false;
    let dbMsg = '';
    try {
      const supabase = getClient();
      const { data: existente } = await supabase
        .from('contratos')
        .select('id, cliente_nome')
        .eq('numero_os', numOs)
        .limit(1);

      if (existente && existente.length > 0) {
        await supabase
          .from('contratos')
          .update({
            assinado: true,
            assinante_nome: existente[0].cliente_nome || 'Confirmado via WhatsApp',
            assinado_em: dataHora
          })
          .eq('id', existente[0].id);
      } else {
        await supabase
          .from('contratos')
          .insert({
            numero_os: numOs,
            cliente_nome: 'Cliente',
            cliente_tel: '',
            texto: texto,
            assinado: true,
            assinante_nome: 'Confirmado via WhatsApp',
            assinado_em: dataHora
          });
      }
      dbOk = true;
    } catch (e) {
      dbMsg = e.message;
    }

    return res.status(200).json({
      ok: true,
      numero_os: numOs,
      status: 'aprovado',
      db_salvo: dbOk,
      db_info: dbMsg
    });
  } catch (err) {
    console.error('Erro no webhook de WhatsApp:', err);
    return res.status(500).json({ error: err.message });
  }
};
