
// ══════════════════════════════════════════════════════════════════
//  MÓDULO: CRONOGRAMA (Semana, Mês, Ano + Pedido de Material)
// ══════════════════════════════════════════════════════════════════

const K_CRONO = {
  eventos: 'sdv_cronograma_eventos',
  materiais: 'sdv_pedidos_material',
  whatsapp: 'sdv_material_whatsapp',
  comissoes: 'sdv_comissoes'
};

// Estado local do cronograma
let _cronoAbaAtual = 'semana';
let _cronoSemanaOffset = 0;   // quantas semanas a partir de hoje
let _cronoMesOffset = 0;      // quantas meses a partir de hoje
let _cronoAnoOffset = 0;      // quantos anos a partir de hoje
let _cronoDiaSelecionado = null;

// ── NAVEGAÇÃO ENTRE ABAS ────────────────────────────────────────
function mudarAbaCronograma(aba) {
  _cronoAbaAtual = aba;
  const abas = ['semana', 'mes', 'ano', 'material'];
  abas.forEach(a => {
    const btn = document.getElementById('crono-tab-' + a);
    const panel = document.getElementById('crono-panel-' + a);
    if (btn) {
      if (a === aba) {
        btn.className = 'btn btn-primary btn-sm';
        btn.style.fontWeight = '800';
      } else {
        btn.className = 'btn btn-sec btn-sm';
        btn.style.fontWeight = '700';
      }
    }
    if (panel) panel.style.display = (a === aba) ? '' : 'none';
  });
  if (aba === 'semana') renderCronoSemana();
  else if (aba === 'mes') renderCronoMes();
  else if (aba === 'ano') renderCronoAno();
  else if (aba === 'material') renderPedidosMaterial();
}

// ── HELPERS DE DATA ─────────────────────────────────────────────
function formatDataBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function isoHoje() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function nomeMes(idx) {
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][idx];
}
function nomeDiaSemana(idx) {
  return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][idx];
}

// ── EVENTOS DO CRONOGRAMA ────────────────────────────────────────
function carregarEventosCrono() {
  try { return JSON.parse(localStorage.getItem(K_CRONO.eventos) || '[]'); } catch(_) { return []; }
}
function salvarEventosCrono(arr) {
  try { localStorage.setItem(K_CRONO.eventos, JSON.stringify(arr)); } catch(_) {}
}

function eventosNaData(iso) {
  return carregarEventosCrono().filter(e => e.data === iso);
}

function tipoEventoInfo(tipo) {
  const m = {
    entrega: { emoji: '🚚', color: '#38bdf8' },
    instalacao: { emoji: '🔧', color: '#fbbf24' },
    medicao: { emoji: '📏', color: '#a78bfa' },
    reuniao: { emoji: '🤝', color: '#34d399' },
    pagamento: { emoji: '💰', color: '#4ade80' },
    prazo: { emoji: '⏰', color: '#f87171' },
    outro: { emoji: '📌', color: '#94a3b8' }
  };
  return m[tipo] || { emoji: '📌', color: '#94a3b8' };
}

// ── SEMANA ───────────────────────────────────────────────────────
function navCronoSemana(dir) {
  if (dir === 0) _cronoSemanaOffset = 0;
  else _cronoSemanaOffset += dir;
  renderCronoSemana();
}

function renderCronoSemana() {
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay() + (_cronoSemanaOffset * 7));

  const lbl = document.getElementById('crono-semana-label');
  if (lbl) {
    const fim = new Date(inicioSemana);
    fim.setDate(inicioSemana.getDate() + 6);
    lbl.textContent = `${formatDataBR(toISO(inicioSemana))} – ${formatDataBR(toISO(fim))}`;
  }

  const grid = document.getElementById('crono-semana-grid');
  if (!grid) return;

  const hojeISO = isoHoje();
  let gridHTML = '';
  let eventosDaSemana = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    const iso = toISO(d);
    const eventos = eventosNaData(iso);
    const isHoje = iso === hojeISO;
    const isSel = iso === _cronoDiaSelecionado;
    eventosDaSemana.push(...eventos.map(ev => ({...ev, _iso: iso})));

    gridHTML += `<div onclick="selecionarDiaCrono('${iso}')" style="
      padding:8px 4px;border-radius:10px;text-align:center;cursor:pointer;
      background:${isSel ? 'rgba(201,168,76,0.25)' : isHoje ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)'};
      border:1.5px solid ${isSel ? 'rgba(201,168,76,0.6)' : isHoje ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.07)'};
      transition:all 0.2s;">
      <div style="font-size:10px;color:var(--muted);font-weight:700;">${nomeDiaSemana(d.getDay())}</div>
      <div style="font-size:17px;font-weight:900;color:${isHoje ? '#38bdf8' : isSel ? 'var(--gold-light)' : '#fff'};margin:2px 0;">${d.getDate()}</div>
      ${eventos.length ? `<div style="font-size:9px;background:rgba(201,168,76,0.35);color:var(--gold-light);border-radius:20px;padding:1px 5px;">${eventos.length}</div>` : '<div style="height:15px;"></div>'}
    </div>`;
  }
  grid.innerHTML = gridHTML;

  // Lista de eventos da semana
  const evList = document.getElementById('crono-semana-eventos');
  if (evList) {
    if (!eventosDaSemana.length) {
      evList.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:12px;">Nenhum evento nessa semana.</div>`;
    } else {
      evList.innerHTML = eventosDaSemana.map(ev => renderEventoCard(ev)).join('');
    }
  }
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function selecionarDiaCrono(iso) {
  _cronoDiaSelecionado = iso;
  renderCronoSemana();
}

// ── MÊS ──────────────────────────────────────────────────────────
function navCronoMes(dir) {
  if (dir === 0) _cronoMesOffset = 0;
  else _cronoMesOffset += dir;
  renderCronoMes();
}

function renderCronoMes() {
  const agora = new Date();
  const base = new Date(agora.getFullYear(), agora.getMonth() + _cronoMesOffset, 1);
  const ano = base.getFullYear();
  const mes = base.getMonth();

  const lbl = document.getElementById('crono-mes-label');
  if (lbl) lbl.textContent = `${nomeMes(mes)} ${ano}`;

  const grid = document.getElementById('crono-mes-grid');
  if (!grid) return;

  const hoje = isoHoje();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  let html = '';
  // Cabeçalho
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => {
    html += `<div style="text-align:center;font-size:10px;font-weight:800;color:var(--muted);padding:5px 2px;">${d}</div>`;
  });
  // Dias vazios
  for (let i = 0; i < primeiroDia; i++) {
    html += `<div></div>`;
  }
  // Dias do mês
  for (let dia = 1; dia <= totalDias; dia++) {
    const iso = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    const evts = eventosNaData(iso);
    const isHoje = iso === hoje;
    const isSel = iso === _cronoDiaSelecionado;
    html += `<div onclick="selecionarDiaCrono('${iso}')" style="
      padding:6px 2px;border-radius:8px;text-align:center;cursor:pointer;min-height:42px;
      background:${isSel ? 'rgba(201,168,76,0.25)' : isHoje ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.02)'};
      border:1px solid ${isSel ? 'rgba(201,168,76,0.6)' : isHoje ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.06)'};
      transition:all 0.2s;">
      <div style="font-size:13px;font-weight:800;color:${isHoje ? '#38bdf8' : isSel ? 'var(--gold-light)' : '#fff'};">${dia}</div>
      ${evts.length ? `<div style="font-size:9px;background:rgba(201,168,76,0.35);color:var(--gold-light);border-radius:20px;padding:1px 4px;margin-top:2px;">${evts.length}</div>` : ''}
    </div>`;
  }
  grid.innerHTML = html;

  // Eventos do mês
  const evList = document.getElementById('crono-mes-eventos');
  if (evList) {
    const evMes = carregarEventosCrono().filter(e => e.data && e.data.startsWith(`${ano}-${String(mes+1).padStart(2,'0')}`)).sort((a,b) => a.data.localeCompare(b.data));
    if (!evMes.length) {
      evList.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:12px;">Nenhum evento nesse mês.</div>`;
    } else {
      evList.innerHTML = evMes.map(ev => renderEventoCard(ev)).join('');
    }
  }
}

// ── ANO ───────────────────────────────────────────────────────────
function navCronoAno(dir) {
  if (dir === 0) _cronoAnoOffset = 0;
  else _cronoAnoOffset += dir;
  renderCronoAno();
}

function renderCronoAno() {
  const ano = new Date().getFullYear() + _cronoAnoOffset;
  const lbl = document.getElementById('crono-ano-label');
  if (lbl) lbl.textContent = String(ano);

  const grid = document.getElementById('crono-ano-grid');
  if (!grid) return;

  const hoje = isoHoje();
  let html = '';

  for (let m = 0; m < 12; m++) {
    const totalDias = new Date(ano, m + 1, 0).getDate();
    const evMes = carregarEventosCrono().filter(e => e.data && e.data.startsWith(`${ano}-${String(m+1).padStart(2,'0')}`));
    const temHojeMes = hoje.startsWith(`${ano}-${String(m+1).padStart(2,'0')}`);

    html += `<div style="background:rgba(255,255,255,0.03);border:1.5px solid ${temHojeMes ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'};border-radius:12px;padding:12px;">
      <div style="font-size:13px;font-weight:900;color:${temHojeMes ? '#38bdf8' : 'var(--gold-light)'};margin-bottom:8px;">${nomeMes(m)}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
        ${['D','S','T','Q','Q','S','S'].map(d => `<div style="text-align:center;font-size:8px;color:var(--muted);font-weight:700;">${d}</div>`).join('')}
        ${'<div></div>'.repeat(new Date(ano, m, 1).getDay())}
        ${Array.from({length: totalDias}, (_, i) => {
          const dia = i + 1;
          const iso = `${ano}-${String(m+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
          const hasEv = eventosNaData(iso).length > 0;
          const isHj = iso === hoje;
          return `<div onclick="goTab('cronograma');mudarAbaCronograma('mes');_cronoMesOffset=${m - new Date().getMonth() + (ano - new Date().getFullYear())*12};renderCronoMes();" style="text-align:center;font-size:9px;font-weight:700;padding:2px;border-radius:3px;cursor:pointer;background:${isHj ? 'rgba(56,189,248,0.3)' : hasEv ? 'rgba(201,168,76,0.25)' : 'transparent'};color:${isHj ? '#38bdf8' : hasEv ? 'var(--gold-light)' : '#9ca3af'};">${dia}</div>`;
        }).join('')}
      </div>
      ${evMes.length ? `<div style="font-size:10px;color:var(--gold-light);margin-top:6px;font-weight:700;">📌 ${evMes.length} evento${evMes.length > 1 ? 's' : ''}</div>` : ''}
    </div>`;
  }
  grid.innerHTML = html;
}

// ── CARD DE EVENTO ──────────────────────────────────────────────
function renderEventoCard(ev) {
  const info = tipoEventoInfo(ev.tipo);
  return `<div style="background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.07);border-left:4px solid ${info.color};border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;">${info.emoji} ${esc(ev.titulo || '')}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px;">
        📅 ${formatDataBR(ev.data)}${ev.hora ? ' · ⏰ ' + ev.hora : ''}${ev.responsavel ? ' · 👤 ' + esc(ev.responsavel) : ''}
      </div>
      ${ev.desc ? `<div style="font-size:11.5px;color:var(--text2);margin-top:4px;">${esc(ev.desc)}</div>` : ''}
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0;">
      <button onclick="editarEventoCronograma('${ev.id}')" title="Editar" style="padding:4px 7px;font-size:12px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.35);border-radius:6px;color:var(--gold-light);cursor:pointer;">✏️</button>
      <button onclick="excluirEventoCronograma('${ev.id}')" title="Excluir" style="padding:4px 7px;font-size:12px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#f87171;cursor:pointer;">🗑️</button>
    </div>
  </div>`;
}

// ── MODAL: NOVO EVENTO ──────────────────────────────────────────
function abrirModalNovoEventoCronograma(id) {
  const m = document.getElementById('modal-novo-evento-cronograma');
  if (!m) return;
  document.getElementById('evento-cronograma-edit-id').value = '';
  document.getElementById('evento-cronograma-titulo').textContent = 'Novo Evento / Prazo';
  document.getElementById('evento-form-titulo').value = '';
  document.getElementById('evento-form-data').value = _cronoDiaSelecionado || isoHoje();
  document.getElementById('evento-form-hora').value = '';
  document.getElementById('evento-form-tipo').value = 'entrega';
  document.getElementById('evento-form-responsavel').value = '';
  document.getElementById('evento-form-cliente-nome').value = '';
  document.getElementById('evento-form-cliente-endereco').value = '';
  document.getElementById('evento-form-desc').value = '';

  if (id) {
    const ev = carregarEventosCrono().find(e => e.id === id);
    if (ev) {
      document.getElementById('evento-cronograma-edit-id').value = ev.id;
      document.getElementById('evento-cronograma-titulo').textContent = 'Editar Evento';
      document.getElementById('evento-form-titulo').value = ev.titulo || '';
      document.getElementById('evento-form-data').value = ev.data || '';
      document.getElementById('evento-form-hora').value = ev.hora || '';
      document.getElementById('evento-form-tipo').value = ev.tipo || 'outro';
      document.getElementById('evento-form-responsavel').value = ev.responsavel || '';
      document.getElementById('evento-form-desc').value = ev.desc || '';
    }
  }
  m.style.display = 'flex';
}

function fecharModalNovoEventoCronograma() {
  const m = document.getElementById('modal-novo-evento-cronograma');
  if (m) m.style.display = 'none';
}

function salvarEventoCronograma() {
  const titulo = (document.getElementById('evento-form-titulo').value || '').trim();
  const data = document.getElementById('evento-form-data').value;
  if (!titulo || !data) { alert('Preencha o título e a data do evento.'); return; }

  const lista = carregarEventosCrono();
  const editId = document.getElementById('evento-cronograma-edit-id').value;

  const obj = {
    id: editId || `ev_${Date.now()}`,
    titulo,
    data,
    hora: document.getElementById('evento-form-hora').value,
    tipo: document.getElementById('evento-form-tipo').value,
    responsavel: document.getElementById('evento-form-responsavel').value.trim(),
    clienteNome: (document.getElementById('evento-form-cliente-nome').value || '').trim(),
    clienteEndereco: (document.getElementById('evento-form-cliente-endereco').value || '').trim(),
    desc: document.getElementById('evento-form-desc').value.trim(),
    criadoEm: editId ? undefined : new Date().toISOString()
  };

  if (editId) {
    const idx = lista.findIndex(e => e.id === editId);
    if (idx >= 0) lista[idx] = {...lista[idx], ...obj};
    else lista.push(obj);
  } else {
    lista.push(obj);
  }

  salvarEventosCrono(lista);
  fecharModalNovoEventoCronograma();
  if (_cronoAbaAtual === 'semana') renderCronoSemana();
  else if (_cronoAbaAtual === 'mes') renderCronoMes();
  else if (_cronoAbaAtual === 'ano') renderCronoAno();
}

function editarEventoCronograma(id) {
  abrirModalNovoEventoCronograma(id);
}

function excluirEventoCronograma(id) {
  if (!confirm('Excluir este evento?')) return;
  let lista = carregarEventosCrono().filter(e => e.id !== id);
  salvarEventosCrono(lista);
  if (_cronoAbaAtual === 'semana') renderCronoSemana();
  else if (_cronoAbaAtual === 'mes') renderCronoMes();
}

// ══════════════════════════════════════════════════════════════════
//  MÓDULO: PEDIDO DE MATERIAL
// ══════════════════════════════════════════════════════════════════

function carregarMateriais() {
  try { return JSON.parse(localStorage.getItem(K_CRONO.materiais) || '[]'); } catch(_) { return []; }
}
function salvarMateriais(arr) {
  try { localStorage.setItem(K_CRONO.materiais, JSON.stringify(arr)); } catch(_) {}
}

function renderPedidosMaterial() {
  const lista = carregarMateriais();
  const busca = (document.getElementById('material-busca') || {}).value || '';
  const filtroStatus = (document.getElementById('material-filtro-status') || {}).value || 'todos';

  // Contadores
  const counts = { a_comprar: 0, pendente: 0, comprado: 0 };
  lista.forEach(it => { if (counts.hasOwnProperty(it.status)) counts[it.status]++; });
  ['a_comprar', 'pendente', 'comprado'].forEach(s => {
    const el = document.getElementById(`material-count-${s}`);
    if (el) el.textContent = counts[s];
  });

  let filtrado = lista;
  if (filtroStatus !== 'todos') filtrado = filtrado.filter(it => it.status === filtroStatus);
  if (busca.trim()) {
    const b = busca.toLowerCase().trim();
    filtrado = filtrado.filter(it => (it.nome||'').toLowerCase().includes(b) || (it.fornecedor||'').toLowerCase().includes(b));
  }

  const cont = document.getElementById('material-lista');
  if (!cont) return;

  if (!filtrado.length) {
    cont.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:20px;">Nenhum item encontrado.</div>`;
    return;
  }

  const statusInfo = {
    a_comprar: { label: '🛒 A Comprar', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
    pendente: { label: '⏳ Pendente', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    comprado: { label: '✅ Comprado', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' }
  };

  const urgInfo = {
    normal: { label: '📋 Normal', color: '#94a3b8' },
    urgente: { label: '🔥 Urgente', color: '#fbbf24' },
    critico: { label: '🚨 Crítico', color: '#f87171' }
  };

  cont.innerHTML = filtrado.map(it => {
    const st = statusInfo[it.status] || statusInfo.a_comprar;
    const urg = urgInfo[it.urgencia] || urgInfo.normal;
    const total = it.qtd && it.valor ? (parseFloat(it.qtd) * parseFloat(it.valor)).toFixed(2).replace('.', ',') : null;
    return `<div style="background:rgba(255,255,255,0.03);border:1.5px solid ${st.border};border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:900;font-size:13.5px;color:#fff;">${esc(it.nome || '')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">
            ${it.qtd ? `Qtd: <strong style="color:#fff;">${it.qtd} ${it.unidade||'un'}</strong>` : ''}
            ${it.valor ? ` · Unit: <strong style="color:#fff;">R$ ${parseFloat(it.valor).toFixed(2).replace('.',',')}</strong>` : ''}
            ${total ? ` · Total: <strong style="color:var(--gold-light);">R$ ${total}</strong>` : ''}
            ${it.fornecedor ? ` · 🏪 ${esc(it.fornecedor)}` : ''}
          </div>
          ${it.obs ? `<div style="font-size:11px;color:var(--text2);margin-top:4px;">${esc(it.obs)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span style="font-size:10.5px;font-weight:800;background:${st.bg};color:${st.color};border:1px solid ${st.border};padding:3px 8px;border-radius:20px;">${st.label}</span>
          <span style="font-size:10px;color:${urg.color};">${urg.label}</span>
        </div>
      </div>
      <!-- AÇÕES -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button onclick="alterarStatusMaterial('${it.id}','a_comprar')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${it.status==='a_comprar'?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${it.status==='a_comprar'?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'};color:${it.status==='a_comprar'?'#f87171':'#9ca3af'};">🛒 A Comprar</button>
        <button onclick="alterarStatusMaterial('${it.id}','pendente')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${it.status==='pendente'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${it.status==='pendente'?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.1)'};color:${it.status==='pendente'?'#fbbf24':'#9ca3af'};">⏳ Pendente</button>
        <button onclick="alterarStatusMaterial('${it.id}','comprado')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${it.status==='comprado'?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${it.status==='comprado'?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.1)'};color:${it.status==='comprado'?'#34d399':'#9ca3af'};">✅ Comprado</button>
        <button onclick="editarPedidoMaterial('${it.id}')" title="Editar" style="padding:5px 8px;font-size:12px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:6px;color:var(--gold-light);cursor:pointer;">✏️</button>
        <button onclick="excluirPedidoMaterial('${it.id}')" title="Excluir" style="padding:5px 8px;font-size:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#f87171;cursor:pointer;">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function alterarStatusMaterial(id, novoStatus) {
  const lista = carregarMateriais();
  const idx = lista.findIndex(it => it.id === id);
  if (idx >= 0) { lista[idx].status = novoStatus; salvarMateriais(lista); }
  renderPedidosMaterial();
}

function editarPedidoMaterial(id) {
  const it = carregarMateriais().find(x => x.id === id);
  if (!it) return;
  abrirModalNovoPedidoMaterial(it);
}

function excluirPedidoMaterial(id) {
  if (!confirm('Excluir este item?')) return;
  salvarMateriais(carregarMateriais().filter(x => x.id !== id));
  renderPedidosMaterial();
}

function abrirModalNovoPedidoMaterial(it) {
  const m = document.getElementById('modal-novo-pedido-material');
  if (!m) return;
  document.getElementById('pedido-material-edit-id').value = it ? it.id : '';
  document.getElementById('pedido-material-titulo').textContent = it ? 'Editar Item' : 'Novo Item de Material';
  document.getElementById('pedido-form-nome').value = it ? (it.nome||'') : '';
  document.getElementById('pedido-form-qtd').value = it ? (it.qtd||'') : '';
  document.getElementById('pedido-form-unidade').value = it ? (it.unidade||'un') : 'un';
  document.getElementById('pedido-form-valor').value = it ? (it.valor||'') : '';
  document.getElementById('pedido-form-urgencia').value = it ? (it.urgencia||'normal') : 'normal';
  document.getElementById('pedido-form-fornecedor').value = it ? (it.fornecedor||'') : '';
  document.getElementById('pedido-form-status').value = it ? (it.status||'a_comprar') : 'a_comprar';
  document.getElementById('pedido-form-obs').value = it ? (it.obs||'') : '';
  m.style.display = 'flex';
}

function fecharModalNovoPedidoMaterial() {
  const m = document.getElementById('modal-novo-pedido-material');
  if (m) m.style.display = 'none';
}

function salvarPedidoMaterial() {
  const nome = (document.getElementById('pedido-form-nome').value || '').trim();
  if (!nome) { alert('Informe o nome do material.'); return; }

  const lista = carregarMateriais();
  const editId = document.getElementById('pedido-material-edit-id').value;

  const obj = {
    id: editId || `mat_${Date.now()}`,
    nome,
    qtd: document.getElementById('pedido-form-qtd').value,
    unidade: document.getElementById('pedido-form-unidade').value,
    valor: document.getElementById('pedido-form-valor').value,
    urgencia: document.getElementById('pedido-form-urgencia').value,
    fornecedor: document.getElementById('pedido-form-fornecedor').value.trim(),
    status: document.getElementById('pedido-form-status').value,
    obs: document.getElementById('pedido-form-obs').value.trim(),
    criadoEm: editId ? undefined : new Date().toISOString()
  };

  if (editId) {
    const idx = lista.findIndex(x => x.id === editId);
    if (idx >= 0) lista[idx] = {...lista[idx], ...obj};
    else lista.push(obj);
  } else {
    lista.push(obj);
  }

  salvarMateriais(lista);
  fecharModalNovoPedidoMaterial();
  renderPedidosMaterial();
}

// ── ENVIO VIA WHATSAPP ───────────────────────────────────────────
function abrirModalConfigWhatsappMaterial() {
  const m = document.getElementById('modal-config-whatsapp-material');
  if (!m) return;
  try {
    const cfg = JSON.parse(localStorage.getItem(K_CRONO.whatsapp) || '{}');
    document.getElementById('config-whatsapp-numero').value = cfg.numero || '';
    document.getElementById('config-whatsapp-nome').value = cfg.nome || '';
  } catch(_) {}
  m.style.display = 'flex';
}

function fecharModalConfigWhatsappMaterial() {
  const m = document.getElementById('modal-config-whatsapp-material');
  if (m) m.style.display = 'none';
}

function salvarConfigWhatsappMaterial() {
  const numero = (document.getElementById('config-whatsapp-numero').value || '').trim();
  const nome = (document.getElementById('config-whatsapp-nome').value || '').trim();
  if (!numero) { alert('Informe o número do WhatsApp.'); return; }
  try { localStorage.setItem(K_CRONO.whatsapp, JSON.stringify({numero, nome})); } catch(_) {}
  fecharModalConfigWhatsappMaterial();
  alert(`✅ WhatsApp de pedidos salvo: ${numero}${nome ? ' (' + nome + ')' : ''}`);
}

function enviarPedidoMaterialWhatsApp() {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(K_CRONO.whatsapp) || '{}'); } catch(_) {}

  if (!cfg.numero) {
    if (confirm('Nenhum número de WhatsApp configurado para pedidos. Deseja configurar agora?')) {
      abrirModalConfigWhatsappMaterial();
    }
    return;
  }

  const lista = carregarMateriais();
  const filtroStatus = (document.getElementById('material-filtro-status') || {}).value || 'todos';
  const itens = filtroStatus !== 'todos' ? lista.filter(it => it.status === filtroStatus) : lista.filter(it => it.status !== 'comprado');

  if (!itens.length) {
    alert('Nenhum item para enviar com o filtro atual.');
    return;
  }

  const nomeEmp = (typeof obterEmpresaAtivaGlobal === 'function' ? obterEmpresaAtivaGlobal() : null)?.nome || 'SD Móveis Projetados';
  const hoje = new Date().toLocaleDateString('pt-BR');

  let msg = `📦 *PEDIDO DE MATERIAL – ${nomeEmp}*\n📅 Data: ${hoje}\n\n`;

  const statusLabel = { a_comprar: '🛒 A Comprar', pendente: '⏳ Pendente', comprado: '✅ Comprado' };
  const grupos = {};
  itens.forEach(it => {
    const g = it.status || 'a_comprar';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(it);
  });

  Object.keys(grupos).forEach(st => {
    msg += `*${statusLabel[st] || st}*\n`;
    grupos[st].forEach((it, i) => {
      msg += `${i+1}. ${it.nome}${it.qtd ? ' – ' + it.qtd + ' ' + (it.unidade||'un') : ''}${it.urgencia === 'urgente' ? ' 🔥' : it.urgencia === 'critico' ? ' 🚨' : ''}${it.fornecedor ? ' (' + it.fornecedor + ')' : ''}\n`;
    });
    msg += '\n';
  });

  msg += `_Enviado via SD Móveis Projetados_`;

  const tel = cfg.numero.replace(/\D/g, '');
  const url = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ══════════════════════════════════════════════════════════════════
//  MÓDULO: COMISSÕES POR SERVIÇOS FINALIZADOS
// ══════════════════════════════════════════════════════════════════

function carregarComissoes() {
  try { return JSON.parse(localStorage.getItem(K_CRONO.comissoes) || '[]'); } catch(_) { return []; }
}
function salvarComissoes(arr) {
  try { localStorage.setItem(K_CRONO.comissoes, JSON.stringify(arr)); } catch(_) {}
}

function abrirModalComissoes() {
  const m = document.getElementById('modal-comissoes');
  if (!m) return;
  // Popula select de funcionários
  popularSelectComissoesFuncionarios();
  renderComissoes();
  m.style.display = 'flex';
}

// Alias chamado pelo painel Financeiro
function abrirModalComissoesFinanceiro() {
  abrirModalComissoes();
}

// Renderiza comissões agrupadas por funcionário na aba Financeiro
function renderFinComissoesPorFuncionario() {
  const cont = document.getElementById('fin-comissoes-por-funcionario');
  const kpiEl = document.getElementById('fin-kpi-comissoes');
  const kpiSub = document.getElementById('fin-kpi-comissoes-sub');
  if (!cont) return;

  const lista = carregarComissoes();
  const funcionarios = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista)) ? funcionariosLista : [];

  // Agrupar por funcionário
  const grupos = {};
  lista.forEach(c => {
    const fid = c.funcId || 'desconhecido';
    if (!grupos[fid]) grupos[fid] = { nome: c.funcNome || fid, itens: [] };
    grupos[fid].itens.push(c);
  });

  // Atualizar KPI de comissões
  const totalGeral = lista.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const totalPendente = lista.filter(c => (c.status || 'pendente') === 'pendente').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const totalPago = lista.filter(c => c.status === 'pago').reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
  const qtdPendentes = lista.filter(c => (c.status || 'pendente') !== 'pago').length;
  const qtdPagas = lista.filter(c => c.status === 'pago').length;
  if (kpiEl) kpiEl.textContent = 'R$ ' + totalGeral.toFixed(2).replace('.', ',');
  if (kpiSub) kpiSub.textContent = `${qtdPendentes} pendente${qtdPendentes!==1?'s':''} · ${qtdPagas} paga${qtdPagas!==1?'s':''}`;

  if (Object.keys(grupos).length === 0) {
    cont.innerHTML = '<div class="empty">Nenhuma comissão cadastrada ainda.</div>';
    return;
  }

  const fmt = v => 'R$ ' + (parseFloat(v)||0).toFixed(2).replace('.',',');
  const statusColor = { pendente: '#fbbf24', agendado: '#38bdf8', pago: '#34d399' };
  const statusLabel = { pendente: '⏳ A Receber', agendado: '📅 Agendado', pago: '✅ Pago' };

  cont.innerHTML = Object.entries(grupos).map(([fid, grp]) => {
    const tot = grp.itens.reduce((s, c) => s + (parseFloat(c.valor)||0), 0);
    const porStatus = {};
    grp.itens.forEach(c => {
      const st = c.status || 'pendente';
      if (!porStatus[st]) porStatus[st] = 0;
      porStatus[st] += parseFloat(c.valor)||0;
    });
    const badges = Object.entries(porStatus).map(([st, v]) =>
      `<span style="font-size:11px;padding:3px 8px;border-radius:20px;background:rgba(255,255,255,0.06);color:${statusColor[st]||'#aaa'};font-weight:700;">${statusLabel[st]||st}: ${fmt(v)}</span>`
    ).join(' ');
    const rows = grp.itens.map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:rgba(255,255,255,0.03);border-radius:8px;gap:8px;flex-wrap:wrap;">
        <div>
          <div style="font-size:12.5px;font-weight:700;color:#fff;">💰 ${esc(c.descricao||'Comissão')}</div>
          <div style="font-size:11px;color:var(--muted);">${c.dataRecebimento ? '📅 Receber em: '+c.dataRecebimento.split('-').reverse().join('/') : ''} ${c.pct ? '· '+c.pct+'%' : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:13px;font-weight:900;color:${statusColor[c.status||'pendente']||'#fff'};">${fmt(c.valor)}</span>
          <span style="font-size:10px;padding:2px 7px;border-radius:12px;background:rgba(255,255,255,0.06);color:${statusColor[c.status||'pendente']||'#aaa'};">${statusLabel[c.status||'pendente']||c.status}</span>
        </div>
      </div>`).join('');
    return `<div style="border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px;background:rgba(255,255,255,0.02);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
        <div style="font-size:13.5px;font-weight:900;color:#fff;">👷 ${esc(grp.nome)}</div>
        <div style="font-size:15px;font-weight:900;color:#fbbf24;">${fmt(tot)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">${badges}</div>
      <div style="display:flex;flex-direction:column;gap:6px;">${rows}</div>
    </div>`;
  }).join('');
}

function fecharModalComissoes() {
  const m = document.getElementById('modal-comissoes');
  if (m) m.style.display = 'none';
}

function popularSelectComissoesFuncionarios() {
  const sel = document.getElementById('comissao-filtro-func');
  if (!sel) return;
  const lista = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista)) ? funcionariosLista : [];
  sel.innerHTML = '<option value="todos">👷 Todos os Funcionários</option>' +
    lista.map(f => `<option value="${f.id}">${esc(f.nome||'')}</option>`).join('');
}

function renderComissoes() {
  const lista = carregarComissoes();
  const filtroFunc = (document.getElementById('comissao-filtro-func') || {}).value || 'todos';
  const filtroStatus = (document.getElementById('comissao-filtro-status') || {}).value || 'todos';

  // Totais
  let totPendente = 0, totAgendado = 0, totPago = 0;
  lista.forEach(c => {
    const v = parseFloat(c.valor || 0);
    if (c.status === 'pendente') totPendente += v;
    else if (c.status === 'agendado') totAgendado += v;
    else if (c.status === 'pago') totPago += v;
  });
  const fmtR = v => `R$ ${v.toFixed(2).replace('.',',')}`;
  const el1 = document.getElementById('comissao-total-pendente');
  const el2 = document.getElementById('comissao-total-agendado');
  const el3 = document.getElementById('comissao-total-pago');
  if (el1) el1.textContent = fmtR(totPendente);
  if (el2) el2.textContent = fmtR(totAgendado);
  if (el3) el3.textContent = fmtR(totPago);

  // Badge
  const badge = document.getElementById('badge-comissoes-pendentes');
  const pendCnt = lista.filter(c => c.status === 'pendente' || c.status === 'agendado').length;
  if (badge) {
    if (pendCnt > 0) { badge.textContent = pendCnt; badge.style.display = ''; }
    else badge.style.display = 'none';
  }

  let filtrado = lista;
  if (filtroFunc !== 'todos') filtrado = filtrado.filter(c => String(c.funcId) === String(filtroFunc));
  if (filtroStatus !== 'todos') filtrado = filtrado.filter(c => c.status === filtroStatus);
  filtrado = filtrado.sort((a,b) => (a.dataServico||'').localeCompare(b.dataServico||''));

  const cont = document.getElementById('comissao-lista');
  if (!cont) return;

  if (!filtrado.length) {
    cont.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:20px;">Nenhuma comissão registrada.</div>`;
    return;
  }

  const stInfo = {
    pendente: { label: '⏳ Pendente', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    agendado: { label: '📅 Agendado', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)' },
    pago: { label: '✅ Pago', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' }
  };

  cont.innerHTML = filtrado.map(c => {
    const st = stInfo[c.status] || stInfo.pendente;
    const func = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista))
      ? funcionariosLista.find(f => String(f.id) === String(c.funcId)) : null;
    return `<div style="background:rgba(255,255,255,0.03);border:1.5px solid ${st.border};border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:900;font-size:13.5px;color:#fff;">💰 ${esc(c.descricao || 'Comissão')}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;">
            ${func ? `👷 ${esc(func.nome)} · ` : ''}
            ${c.dataServico ? `📅 Serviço: ${formatDataBR(c.dataServico)}` : ''}
          </div>
          ${c.dataRecebimento ? `<div style="font-size:11px;color:#38bdf8;margin-top:2px;">📅 Receber em: <strong>${formatDataBR(c.dataRecebimento)}</strong></div>` : ''}
          ${c.obs ? `<div style="font-size:11px;color:var(--text2);margin-top:4px;">${esc(c.obs)}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <span style="font-size:16px;font-weight:900;color:var(--gold-light);">R$ ${parseFloat(c.valor||0).toFixed(2).replace('.',',')}</span>
          <span style="font-size:10.5px;font-weight:800;background:${st.bg};color:${st.color};border:1px solid ${st.border};padding:3px 8px;border-radius:20px;">${st.label}</span>
        </div>
      </div>
      <!-- AÇÕES DE STATUS -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button onclick="alterarStatusComissao('${c.id}','pendente')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${c.status==='pendente'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${c.status==='pendente'?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.1)'};color:${c.status==='pendente'?'#fbbf24':'#9ca3af'};">⏳ Pendente</button>
        <button onclick="alterarStatusComissao('${c.id}','agendado')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${c.status==='agendado'?'rgba(56,189,248,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${c.status==='agendado'?'rgba(56,189,248,0.5)':'rgba(255,255,255,0.1)'};color:${c.status==='agendado'?'#38bdf8':'#9ca3af'};">📅 Agendado</button>
        <button onclick="alterarStatusComissao('${c.id}','pago')" style="flex:1;padding:5px 4px;font-size:10.5px;font-weight:700;border-radius:6px;cursor:pointer;background:${c.status==='pago'?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.04)'};border:1px solid ${c.status==='pago'?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.1)'};color:${c.status==='pago'?'#34d399':'#9ca3af'};">✅ Pago</button>
        <button onclick="editarComissao('${c.id}')" title="Editar" style="padding:5px 8px;font-size:12px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:6px;color:var(--gold-light);cursor:pointer;">✏️</button>
        <button onclick="excluirComissao('${c.id}')" title="Excluir" style="padding:5px 8px;font-size:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#f87171;cursor:pointer;">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function alterarStatusComissao(id, novoStatus) {
  const lista = carregarComissoes();
  const idx = lista.findIndex(c => c.id === id);
  if (idx >= 0) { lista[idx].status = novoStatus; salvarComissoes(lista); }
  renderComissoes();
}

function editarComissao(id) {
  const c = carregarComissoes().find(x => x.id === id);
  if (!c) return;
  abrirModalNovaComissao(c);
}

function excluirComissao(id) {
  if (!confirm('Excluir esta comissão?')) return;
  salvarComissoes(carregarComissoes().filter(x => x.id !== id));
  renderComissoes();
}

function abrirModalNovaComissao(c) {
  const m = document.getElementById('modal-nova-comissao');
  if (!m) return;

  // Popula select de funcionários
  const selFunc = document.getElementById('comissao-form-func');
  if (selFunc) {
    const lista = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista)) ? funcionariosLista : [];
    selFunc.innerHTML = '<option value="">-- Selecione o Funcionário --</option>' +
      lista.map(f => `<option value="${f.id}">${esc(f.nome||'')}</option>`).join('');
  }

  document.getElementById('comissao-edit-id').value = c ? c.id : '';
  document.getElementById('nova-comissao-titulo').textContent = c ? 'Editar Comissão' : 'Nova Comissão';
  if (selFunc) selFunc.value = c ? (c.funcId||'') : '';
  document.getElementById('comissao-form-descricao').value = c ? (c.descricao||'') : '';
  document.getElementById('comissao-form-valor').value = c ? (c.valor||'') : '';
  document.getElementById('comissao-form-pct').value = c ? (c.pct||'') : '';
  document.getElementById('comissao-form-data-servico').value = c ? (c.dataServico||'') : isoHoje();
  document.getElementById('comissao-form-data-recebimento').value = c ? (c.dataRecebimento||'') : '';
  document.getElementById('comissao-form-status').value = c ? (c.status||'pendente') : 'pendente';
  document.getElementById('comissao-form-obs').value = c ? (c.obs||'') : '';

  m.style.display = 'flex';
}

function fecharModalNovaComissao() {
  const m = document.getElementById('modal-nova-comissao');
  if (m) m.style.display = 'none';
}

function salvarComissao() {
  const funcId = document.getElementById('comissao-form-func').value;
  const descricao = (document.getElementById('comissao-form-descricao').value || '').trim();
  const valor = document.getElementById('comissao-form-valor').value;
  const dataServico = document.getElementById('comissao-form-data-servico').value;

  if (!funcId) { alert('Selecione o funcionário.'); return; }
  if (!descricao) { alert('Informe a descrição do serviço.'); return; }
  if (!valor || isNaN(parseFloat(valor))) { alert('Informe o valor da comissão.'); return; }

  const func = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista))
    ? funcionariosLista.find(f => String(f.id) === String(funcId)) : null;
  const funcNome = func ? func.nome : funcId;

  const lista = carregarComissoes();
  const editId = document.getElementById('comissao-edit-id').value;

  const obj = {
    id: editId || `com_${Date.now()}`,
    funcId,
    funcNome,
    descricao,
    valor: parseFloat(valor).toFixed(2),
    pct: document.getElementById('comissao-form-pct').value,
    dataServico,
    dataRecebimento: document.getElementById('comissao-form-data-recebimento').value,
    status: document.getElementById('comissao-form-status').value,
    obs: document.getElementById('comissao-form-obs').value.trim(),
    criadoEm: editId ? undefined : new Date().toISOString()
  };

  if (editId) {
    const idx = lista.findIndex(x => x.id === editId);
    if (idx >= 0) lista[idx] = {...lista[idx], ...obj};
    else lista.push(obj);
  } else {
    lista.push(obj);
  }

  salvarComissoes(lista);
  fecharModalNovaComissao();
  renderComissoes();
  if (typeof renderFinComissoesPorFuncionario === 'function') renderFinComissoesPorFuncionario();

  // Notifica se houver data de recebimento agendada
  if (obj.dataRecebimento) {
    const func = (typeof funcionariosLista !== 'undefined' && Array.isArray(funcionariosLista))
      ? funcionariosLista.find(f => String(f.id) === String(funcId)) : null;
    const nomeFunc = func ? func.nome : 'Funcionário';
    try {
      const notifs = JSON.parse(localStorage.getItem('sdv_registro_notificacoes') || '[]');
      notifs.unshift({
        id: `notif_com_${Date.now()}`,
        tipo: 'comissao_agendada',
        titulo: '💰 Comissão Agendada',
        msg: `Comissão de R$ ${parseFloat(obj.valor).toFixed(2).replace('.',',')} para ${nomeFunc} (${descricao}) programada para ${formatDataBR(obj.dataRecebimento)}.`,
        data: new Date().toISOString()
      });
      localStorage.setItem('sdv_registro_notificacoes', JSON.stringify(notifs.slice(0, 200)));
      if (typeof atualizarBadgeNotificacoes === 'function') atualizarBadgeNotificacoes();
    } catch(_) {}
  }
}


// ══════════════════════════════════════════════════════════════════
//  MÓDULO CÂMERA ULTRA ZOOM HD
// ══════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  /* ── Estado interno ── */
  let _stream = null;
  let _zoomAtual = 1;
  let _filtroAtual = 'nitidez';
  let _congelado = false;
  let _torchAtivo = false;
  let _rafId = null;
  let _offsetX = 0, _offsetY = 0;
  let _isDragging = false, _dragStartX = 0, _dragStartY = 0;
  let _camFacingMode = 'environment';
  let _capturas = (() => {
    try {
      const s = localStorage.getItem('sdm_cam_capturas');
      if (s) {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr;
      }
    } catch(_) {}
    return [];
  })(); // array de {dataUrl, data, zoom}
  let _lightboxIdx = -1;

  /* ── Helpers de UI ── */
  function $id(id) { return document.getElementById(id); }

  function atualizarHUDZoom(z) {
    const v = parseFloat(z).toFixed(1) + 'x';
    if ($id('cam-hud-zoom-val'))  $id('cam-hud-zoom-val').textContent  = v;
    if ($id('cam-val-display-zoom')) $id('cam-val-display-zoom').textContent = v;
    if ($id('cam-slider-zoom'))   $id('cam-slider-zoom').value = z;
  }

  function atualizarRadar(z, ox, oy) {
    const box = $id('cam-radar-box');
    if (!box) return;
    const pct = Math.max(5, Math.round(100 / z));
    box.style.width  = pct + '%';
    box.style.height = pct + '%';
    const cx = 50 + (ox * (50 - pct/2) / 100);
    const cy = 50 + (oy * (50 - pct/2) / 100);
    box.style.left = Math.max(0, Math.min(100 - pct, cx - pct/2)) + '%';
    box.style.top  = Math.max(0, Math.min(100 - pct, cy - pct/2)) + '%';
  }

  /* ── Mapas de filtros com aceleração nativa por GPU ── */
  const _mapaFiltrosCSS = {
    'nitidez': 'contrast(135%) brightness(105%) saturate(110%)',
    'dehaze': 'contrast(140%) brightness(95%) saturate(120%)',
    'pb': 'grayscale(100%) contrast(150%) brightness(105%)',
    'noturno': 'brightness(150%) contrast(125%) saturate(130%)',
    'natural': 'none'
  };

  /* ── Render loop de Alta Performance via Canvas (60 FPS Fluído) ── */
  function renderFrame() {
    const video  = $id('cam-raw-video');
    const canvas = $id('cam-render-canvas');
    if (!canvas || !video || video.readyState < 2) { _rafId = requestAnimationFrame(renderFrame); return; }

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    // Evita reflow contínuo do navegador: só redimensiona se dimensões reais mudaram
    const targetW = canvas.offsetWidth || 640;
    const targetH = canvas.offsetHeight || 360;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
    }
    const W = canvas.width, H = canvas.height;

    if (_congelado) { _rafId = requestAnimationFrame(renderFrame); return; }

    const vw = video.videoWidth  || W;
    const vh = video.videoHeight || H;
    const z  = _zoomAtual;

    // Viewport: janela de captura de alta resolução no vídeo
    const srcW = vw / z;
    const srcH = vh / z;
    // Offset em pixels no vídeo
    const ox = (_offsetX / 100) * ((vw - srcW) / 2);
    const oy = (_offsetY / 100) * ((vh - srcH) / 2);
    const sx = Math.max(0, Math.min(vw - srcW, (vw - srcW) / 2 + ox));
    const sy = Math.max(0, Math.min(vh - srcH, (vh - srcH) / 2 + oy));

    // Renderiza o frame direto na GPU (ultra rápido e fluido)
    ctx.drawImage(video, sx, sy, Math.min(srcW, vw - sx), Math.min(srcH, vh - sy), 0, 0, W, H);

    // Aplica o filtro selecionado direto no hardware da GPU (sem loop CPU que travava o celular)
    const cssFiltro = _mapaFiltrosCSS[_filtroAtual] || 'none';
    if (canvas.style.filter !== cssFiltro) {
      canvas.style.filter = cssFiltro;
    }

    atualizarRadar(z, _offsetX, _offsetY);
    _rafId = requestAnimationFrame(renderFrame);
  }

  /* ── Iniciar stream ── */
  window.iniciarStreamCamera = async function() {
    try {
      if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
      const constraints = {
        video: {
          facingMode: { ideal: _camFacingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, max: 60 }
        }
      };
      _stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = $id('cam-raw-video');
      video.srcObject = _stream;
      await video.play();

      const prompt = $id('cam-start-prompt');
      if (prompt) prompt.style.display = 'none';

      const badge = $id('cam-badge-sensor');
      if (badge) badge.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#34d399;display:inline-block;animation:pulseCamDot 1s infinite alternate;"></span> Câmera Ativa';

      if (_rafId) cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(renderFrame);
    } catch(err) {
      alert('Não foi possível acessar a câmera: ' + err.message);
    }
  };

  /* ── Zoom ── */
  window.definirZoomCamera = function(z) {
    _zoomAtual = Math.max(1, Math.min(100, parseFloat(z)));
    _offsetX = 0; _offsetY = 0;
    atualizarHUDZoom(_zoomAtual);
    // Atualizar botões ativos
    [1,5,15,30,60,100].forEach(v => {
      const btn = $id('btn-zoom-' + v);
      if (btn) btn.classList.toggle('active', v === _zoomAtual);
    });
  };

  window.aoMudarSliderZoom = function(val) {
    _zoomAtual = parseFloat(val);
    atualizarHUDZoom(_zoomAtual);
    [1,5,15,30,60,100].forEach(v => {
      const btn = $id('btn-zoom-' + v);
      if (btn) btn.classList.toggle('active', v === _zoomAtual);
    });
  };

  window.ajustarZoomPasso = function(delta) {
    const novos = [1,2,3,5,8,10,15,20,30,50,60,80,100];
    let idx = novos.findIndex(v => v >= _zoomAtual);
    idx = Math.max(0, Math.min(novos.length - 1, idx + delta));
    definirZoomCamera(novos[idx]);
  };

  /* ── Filtros ── */
  window.definirFiltroCamera = function(nome) {
    _filtroAtual = nome;
    ['nitidez','dehaze','pb','noturno','natural'].forEach(f => {
      const btn = $id('btn-flt-' + f);
      if (btn) btn.classList.toggle('active', f === nome);
    });
    if ($id('cam-hud-filtro-val')) {
      const nomes = {nitidez:'Super Nitidez',dehaze:'Anti-Névoa',pb:'P&B Alto Contraste',noturno:'Ganho Noturno',natural:'Cores Naturais'};
      $id('cam-hud-filtro-val').textContent = nomes[nome] || nome;
    }
  };

  /* ── Congelar ── */
  window.alternarCongelamentoImagem = function() {
    _congelado = !_congelado;
    const btn = $id('btn-cam-freeze');
    const txt = $id('txt-btn-cam-freeze');
    const hud = $id('cam-hud-status-freeze');
    if (btn) btn.style.borderColor = _congelado ? '#fbbf24' : '#38bdf8';
    if (txt) txt.textContent = _congelado ? 'Descongelar' : 'Congelar & Estabilizar';
    if (hud) hud.style.display = _congelado ? 'block' : 'none';
  };

  /* ── Centralizar ── */
  window.centralizarMiraCamera = function() {
    _offsetX = 0; _offsetY = 0;
  };

  /* ── Tela Cheia ── */
  window.alternarTelaCheiaCamera = function() {
    const cont = $id('cam-visor-container');
    if (!cont) return;
    if (!document.fullscreenElement) {
      cont.requestFullscreen && cont.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  };

  /* ── Lanterna ── */
  window.alternarLanternaCamera = async function() {
    if (!_stream) return;
    try {
      const track = _stream.getVideoTracks()[0];
      _torchAtivo = !_torchAtivo;
      await track.applyConstraints({ advanced: [{ torch: _torchAtivo }] });
      const txt = $id('txt-btn-torch');
      if (txt) txt.textContent = _torchAtivo ? 'Lanterna ON' : 'Lanterna';
    } catch(e) { alert('Lanterna não suportada neste dispositivo.'); }
  };

  /* ── Trocar Sensor ── */
  window.trocarSensorCamera = async function() {
    _camFacingMode = _camFacingMode === 'environment' ? 'user' : 'environment';
    if (_stream) await iniciarStreamCamera();
  };

  /* ── Drag para mover mira ── */
  function onPointerDown(e) {
    _isDragging = true;
    _dragStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    _dragStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  }
  function onPointerMove(e) {
    if (!_isDragging || _zoomAtual <= 1) return;
    const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    _offsetX = Math.max(-100, Math.min(100, _offsetX - (cx - _dragStartX) * 0.4));
    _offsetY = Math.max(-100, Math.min(100, _offsetY - (cy - _dragStartY) * 0.4));
    _dragStartX = cx; _dragStartY = cy;
  }
  function onPointerUp() { _isDragging = false; }

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = $id('cam-render-canvas');
    if (canvas) {
      canvas.addEventListener('mousedown',  onPointerDown);
      canvas.addEventListener('mousemove',  onPointerMove);
      canvas.addEventListener('mouseup',    onPointerUp);
      canvas.addEventListener('touchstart', onPointerDown, {passive:true});
      canvas.addEventListener('touchmove',  onPointerMove, {passive:true});
      canvas.addEventListener('touchend',   onPointerUp);
    }

    // Criar lightbox DOM ao carregar
    _criarLightbox();
  });

  /* ══════════════════════════════════════════════════════════════
     CAPTURAR FOTO + GALERIA ESTILO ANDROID NATIVO
  ══════════════════════════════════════════════════════════════ */

  window.capturarFotoUltraHD = function() {
    const canvas = $id('cam-render-canvas');
    if (!canvas) return;

    // Renderiza snapshot preservando a resolução e filtros ativos
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = canvas.width;
    snapCanvas.height = canvas.height;
    const snapCtx = snapCanvas.getContext('2d');
    if (snapCtx.filter !== undefined) {
      snapCtx.filter = _mapaFiltrosCSS[_filtroAtual] || 'none';
    }
    snapCtx.drawImage(canvas, 0, 0);
    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.95);

    const captura = {
      dataUrl,
      data: new Date(),
      zoom: _zoomAtual,
      filtro: _filtroAtual
    };
    _capturas.unshift(captura);
    try { localStorage.setItem('sdm_cam_capturas', JSON.stringify(_capturas.slice(0, 40))); } catch(_) {}
    _renderGaleriaGrid();

    // Flash visual de captura de foto
    const visor = $id('cam-visor-container');
    if (visor) {
      const flash = document.createElement('div');
      flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0.85;pointer-events:none;z-index:99;border-radius:16px;transition:opacity 0.3s ease';
      visor.appendChild(flash);
      setTimeout(() => flash.style.opacity = '0', 40);
      setTimeout(() => flash.remove(), 350);
    }

    // Feedback visual animado no botão do topo
    const btnTopo = $id('btn-cam-capturar-topo');
    if (btnTopo) {
      const originalHTML = btnTopo.innerHTML;
      btnTopo.innerHTML = '<span>✅</span> <span>Capturado!</span>';
      btnTopo.style.background = 'linear-gradient(135deg,#10b981,#047857)';
      setTimeout(() => {
        btnTopo.innerHTML = originalHTML;
        btnTopo.style.background = 'linear-gradient(135deg,#059669,#10b981)';
      }, 1200);
    }
  };

  function _renderGaleriaGrid() {
    const grid  = $id('cam-galeria-grid');
    const count = $id('cam-galeria-count');
    const vazia = $id('cam-galeria-vazia');
    if (!grid) return;
    if (count) count.textContent = _capturas.length + ' foto' + (_capturas.length !== 1 ? 's':'');
    if (vazia) vazia.style.display = _capturas.length ? 'none' : '';

    // Remover thumbs anteriores
    grid.querySelectorAll('.cam-thumb').forEach(el => el.remove());

    _capturas.forEach((cap, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'cam-thumb';
      thumb.style.cssText = `
        position:relative;background:#000;border-radius:10px;overflow:hidden;
        aspect-ratio:4/3;cursor:pointer;border:2px solid rgba(255,255,255,0.08);
        transition:transform 0.2s,border-color 0.2s;box-shadow:0 4px 16px rgba(0,0,0,0.6);
      `;
      thumb.innerHTML = `
        <img src="${cap.dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.85));padding:6px 8px 5px;">
          <div style="font-size:10px;color:#fff;font-weight:700;">${_dataFormatada(cap.data)}</div>
          <div style="font-size:9px;color:#94a3b8;">${cap.zoom.toFixed(1)}x · ${cap.filtro}</div>
        </div>
        <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;">📸</div>
      `;
      thumb.addEventListener('mouseenter', () => { thumb.style.transform='scale(1.03)'; thumb.style.borderColor='rgba(212,175,55,0.6)'; });
      thumb.addEventListener('mouseleave', () => { thumb.style.transform=''; thumb.style.borderColor='rgba(255,255,255,0.08)'; });
      thumb.addEventListener('click', () => abrirLightbox(idx));
      grid.insertBefore(thumb, grid.firstChild);
    });
  }

  function _dataFormatada(d) {
    const meses = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'];
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }
  function _horaFormatada(d) {
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  /* ── LIGHTBOX ESTILO GALERIA ANDROID NATIVA ── */
  function _criarLightbox() {
    if ($id('cam-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'cam-lightbox';
    lb.style.cssText = `
      display:none;position:fixed;inset:0;z-index:9999;
      background:#000;flex-direction:column;
      touch-action:pan-y;
    `;
    lb.innerHTML = `
      <!-- Topo: data + botão fechar -->
      <div id="lb-header" style="
        display:flex;flex-direction:column;padding:14px 16px 10px;
        background:linear-gradient(to bottom,rgba(0,0,0,0.85) 0%,transparent 100%);
        position:absolute;top:0;left:0;right:0;z-index:10;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <button onclick="fecharLightbox()" style="
            background:none;border:none;color:#fff;font-size:22px;cursor:pointer;
            padding:4px;line-height:1;display:flex;align-items:center;gap:8px;
          ">
            <span style="font-size:20px;">←</span>
          </button>
          <div style="display:flex;gap:8px;">
            <button onclick="_lbCompartilhar()" title="Compartilhar" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>
        <div id="lb-data-titulo" style="color:#fff;font-size:16px;font-weight:700;margin-top:4px;">27 de set. de 2026</div>
        <div id="lb-hora-sub" style="color:#aaa;font-size:13px;">07:39</div>
      </div>

      <!-- Imagem central -->
      <div id="lb-img-area" style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin:0;">
        <!-- Botão esquerda -->
        <button id="lb-prev" onclick="navegarLightbox(-1)" style="
          position:absolute;left:8px;top:50%;transform:translateY(-50%);
          background:rgba(255,255,255,0.12);border:none;border-radius:50%;
          width:44px;height:44px;display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:22px;cursor:pointer;z-index:5;
          backdrop-filter:blur(4px);transition:background 0.2s;
        ">‹</button>

        <img id="lb-img" src="" style="
          max-width:100%;max-height:100%;object-fit:contain;
          user-select:none;-webkit-user-drag:none;
          transition:opacity 0.18s ease;
        " />

        <!-- Botão direita -->
        <button id="lb-next" onclick="navegarLightbox(1)" style="
          position:absolute;right:8px;top:50%;transform:translateY(-50%);
          background:rgba(255,255,255,0.12);border:none;border-radius:50%;
          width:44px;height:44px;display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:22px;cursor:pointer;z-index:5;
          backdrop-filter:blur(4px);transition:background 0.2s;
        ">›</button>

        <!-- Indicadores de posição -->
        <div id="lb-dots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:5;"></div>
      </div>

      <!-- Barra inferior de ações -->
      <div style="
        background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 100%);
        padding:12px 0 24px;
        display:flex;justify-content:space-around;align-items:center;
        position:absolute;bottom:0;left:0;right:0;
      ">
        <button onclick="_lbCompartilhar()" style="${_btnAcaoStyle()}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span style="font-size:11px;margin-top:3px;">Compart...</span>
        </button>
        <button id="lb-fav-btn" onclick="_lbFavoritar()" style="${_btnAcaoStyle()}">
          <svg id="lb-fav-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span style="font-size:11px;margin-top:3px;">Favorito</span>
        </button>
        <button onclick="_lbBaixar()" style="${_btnAcaoStyle()}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span style="font-size:11px;margin-top:3px;">Salvar</span>
        </button>
        <button onclick="_lbExcluir()" style="${_btnAcaoStyle(true)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          <span style="font-size:11px;margin-top:3px;">Excluir</span>
        </button>
      </div>
    `;
    document.body.appendChild(lb);

    // Fechar ao clicar no fundo (área da imagem fora dos botões)
    $id('lb-img').addEventListener('click', fecharLightbox);

    // Swipe gesture
    let tx = 0;
    lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true});
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) navegarLightbox(dx < 0 ? 1 : -1);
    }, {passive:true});
  }

  function _btnAcaoStyle(danger) {
    return `background:none;border:none;color:${danger ? '#ff6b6b' : '#fff'};cursor:pointer;
      display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 16px;
      font-weight:600;opacity:0.9;`;
  }

  window.abrirLightbox = function(idx) {
    _lightboxIdx = idx;
    const lb = $id('cam-lightbox');
    if (!lb) return;
    lb.style.display = 'flex';
    lb.style.flexDirection = 'column';
    document.body.style.overflow = 'hidden';
    _renderLightboxSlide();
  };

  window.fecharLightbox = function() {
    const lb = $id('cam-lightbox');
    if (lb) lb.style.display = 'none';
    document.body.style.overflow = '';
    _lightboxIdx = -1;
  };

  window.navegarLightbox = function(delta) {
    if (!_capturas.length) return;
    _lightboxIdx = (_lightboxIdx + delta + _capturas.length) % _capturas.length;
    _renderLightboxSlide();
  };

  function _renderLightboxSlide() {
    const cap = _capturas[_lightboxIdx];
    if (!cap) return;
    const img = $id('lb-img');
    if (img) {
      img.style.opacity = '0';
      setTimeout(() => { img.src = cap.dataUrl; img.style.opacity = '1'; }, 80);
    }
    if ($id('lb-data-titulo')) $id('lb-data-titulo').textContent = _dataFormatada(cap.data);
    if ($id('lb-hora-sub'))    $id('lb-hora-sub').textContent    = _horaFormatada(cap.data);

    // Atualizar dots
    const dotsEl = $id('lb-dots');
    if (dotsEl) {
      dotsEl.innerHTML = _capturas.map((_, i) => `
        <div style="width:${i === _lightboxIdx ? 14 : 7}px;height:7px;border-radius:999px;
          background:${i === _lightboxIdx ? '#fff' : 'rgba(255,255,255,0.35)'};
          transition:all 0.25s ease;"></div>
      `).join('');
    }

    // Botões prev/next
    if ($id('lb-prev')) $id('lb-prev').style.opacity = _capturas.length > 1 ? '1' : '0';
    if ($id('lb-next')) $id('lb-next').style.opacity = _capturas.length > 1 ? '1' : '0';

    // Favorito
    const favIcon = $id('lb-fav-icon');
    if (favIcon) favIcon.setAttribute('fill', cap.favorito ? '#ff6b6b' : 'none');
    if (favIcon) favIcon.setAttribute('stroke', cap.favorito ? '#ff6b6b' : 'currentColor');
  }

  window._lbCompartilhar = async function() {
    const cap = _capturas[_lightboxIdx];
    if (!cap) return;
    try {
      const res = await fetch(cap.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto Ultra Zoom HD' });
      } else {
        _lbBaixar();
      }
    } catch(e) { _lbBaixar(); }
  };

  window._lbFavoritar = function() {
    const cap = _capturas[_lightboxIdx];
    if (!cap) return;
    cap.favorito = !cap.favorito;
    _renderLightboxSlide();
    _renderGaleriaGrid();
  };

  window._lbBaixar = function() {
    const cap = _capturas[_lightboxIdx];
    if (!cap) return;
    const a = document.createElement('a');
    a.href = cap.dataUrl;
    a.download = `sdmoveis_foto_${Date.now()}.jpg`;
    a.click();
  };

  window._lbExcluir = function() {
    if (_lightboxIdx < 0) return;
    if (!confirm('Excluir esta foto?')) return;
    _capturas.splice(_lightboxIdx, 1);
    _renderGaleriaGrid();
    if (!_capturas.length) { fecharLightbox(); return; }
    _lightboxIdx = Math.min(_lightboxIdx, _capturas.length - 1);
    _renderLightboxSlide();
  };

  // Fechar com ESC
  document.addEventListener('keydown', e => {
    if ($id('cam-lightbox') && $id('cam-lightbox').style.display !== 'none') {
      if (e.key === 'Escape') fecharLightbox();
      if (e.key === 'ArrowLeft')  navegarLightbox(-1);
      if (e.key === 'ArrowRight') navegarLightbox(1);
    }
  });

})();

// ── INICIALIZAÇÃO DO MÓDULO CRONOGRAMA ──────────────────────────
(function initCronograma() {
  // Renderiza quando a aba for clicada
  const origGoTab = typeof goTab === 'function' ? goTab : null;
  if (origGoTab) {
    const _goTabOrig = window.goTab;
    window.goTab = function(t) {
      _goTabOrig(t);
      if (t === 'cronograma') {
        setTimeout(() => mudarAbaCronograma(_cronoAbaAtual || 'semana'), 50);
      }
      if (t === 'financeiro') {
        setTimeout(() => { if (typeof renderFinComissoesPorFuncionario === 'function') renderFinComissoesPorFuncionario(); }, 80);
      }
    };
  }
  // Atualiza badge de comissões
  setTimeout(() => {
    try {
      const lista = carregarComissoes();
      const badge = document.getElementById('badge-comissoes-pendentes');
      const cnt = lista.filter(c => c.status === 'pendente' || c.status === 'agendado').length;
      if (badge && cnt > 0) { badge.textContent = cnt; badge.style.display = ''; }
    } catch(_) {}
  }, 1000);
  // Inicializa comissões no painel financeiro
  setTimeout(() => { if (typeof renderFinComissoesPorFuncionario === 'function') renderFinComissoesPorFuncionario(); }, 1200);
})();

// ══════════════════════════════════════════════
//  PORTAL DO CLIENTE — ABRIR COM OS ESPECÍFICA
// ══════════════════════════════════════════════
function abrirPortalClienteComOs(osId) {
  const lic = (typeof obterLicencaAtiva === 'function') ? obterLicencaAtiva() : null;
  const empId = (lic && lic.id) ? lic.id : (localStorage.getItem('sdv_licenca_ativa') || 'sdvidros');
  const empNome = (lic && lic.nome) ? lic.nome : 'SD Vidros';
  localStorage.setItem('sdv_licenca_ativa', empId);
  // Salva o osId para o portal abrir já na OS certa
  localStorage.setItem('sdv_portal_os_foco', String(osId));
  const url = 'cliente.html?empresa=' + encodeURIComponent(empId) + '&nome=' + encodeURIComponent(empNome) + '&os=' + encodeURIComponent(osId) + '&admin=1';
  window.open(url, '_blank');
}

// ══════════════════════════════════════════════
//  FERRAMENTAS DE OBRA — RENDER & CALCULADORAS
// ══════════════════════════════════════════════
// ── CONFIGURAÇÃO PADRÃO DAS FERRAMENTAS ─────────────────────────────────────
const FERRAMENTAS_PADRAO = [
  { id:'area',     icon:'📐', nome:'Calculadora de Área',  sub:'m² e cm²',            cor:'#3b82f6', bg:'rgba(59,130,246,0.1)',  bd:'rgba(59,130,246,0.35)'  },
  { id:'vidro',    icon:'🪟', nome:'Plano de Corte / Vidro', sub:'Espelhos e vidros',   cor:'#22d3ee', bg:'rgba(6,182,212,0.1)',   bd:'rgba(6,182,212,0.35)'   },
  { id:'movel',    icon:'🪑', nome:'Móveis / MDF',         sub:'Chapas e cortes',      cor:'#c084fc', bg:'rgba(168,85,247,0.1)', bd:'rgba(168,85,247,0.35)'  },
  { id:'conversao',icon:'📏', nome:'Conversão',            sub:'mm ↔ cm ↔ m ↔ pol',  cor:'#34d399', bg:'rgba(16,185,129,0.1)', bd:'rgba(16,185,129,0.35)'  },
  { id:'desconto', icon:'💰', nome:'Desconto / Margem',    sub:'% de lucro e desconto',cor:'#fbbf24', bg:'rgba(245,158,11,0.1)', bd:'rgba(245,158,11,0.35)'  },
  { id:'calc',     icon:'🔢', nome:'Calculadora',          sub:'Cálculos rápidos',     cor:'#f87171', bg:'rgba(239,68,68,0.1)',  bd:'rgba(239,68,68,0.35)'   }
];

function obterConfigFerramentas() {
  try {
    const s = localStorage.getItem('sdv_ferramentas_config');
    if (s) {
      const cfg = JSON.parse(s);
      if (Array.isArray(cfg) && cfg.length) return cfg;
    }
  } catch(_) {}
  return JSON.parse(JSON.stringify(FERRAMENTAS_PADRAO));
}

function salvarConfigFerramentas(cfg) {
  try { localStorage.setItem('sdv_ferramentas_config', JSON.stringify(cfg)); } catch(_) {}
}

function renderGridFerramentas() {
  const grid = document.getElementById('ferr-grid');
  if (!grid) return;
  const cfg = obterConfigFerramentas();
  grid.innerHTML = '';

  cfg.forEach((f, idx) => {
    const el = document.createElement('div');
    el.className = 'ferr-card';
    el.setAttribute('data-ferr-id', f.id);
    el.setAttribute('data-ferr-idx', idx);
    el.setAttribute('draggable', 'true');
    el.style.cssText = `background:${f.bg};border:1.5px solid ${f.bd};border-radius:14px;padding:16px;cursor:pointer;text-align:center;transition:all 0.2s;user-select:none;position:relative;`;
    el.innerHTML = `
      <div style="font-size:32px;margin-bottom:8px;">${f.icon}</div>
      <div style="font-size:13px;font-weight:800;color:${f.cor};">${f.nome}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px;">${f.sub}</div>
    `;

    // ─── Hover ───────────────────────────────────────────────────────────────
    el.addEventListener('mouseenter', () => { el.style.transform='scale(1.04)'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'; });
    el.addEventListener('mouseleave', () => { el.style.transform=''; el.style.boxShadow=''; });

    // ─── LONG PRESS (touch) ──────────────────────────────────────────────────
    let pressTimer = null;
    let pressStarted = false;

    el.addEventListener('touchstart', (e) => {
      pressStarted = true;
      pressTimer = setTimeout(() => {
        if (!pressStarted) return;
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(60);
        abrirModalEditarFerramenta(f.id);
      }, 450);
    }, { passive: false });

    el.addEventListener('touchend',   () => { pressStarted = false; clearTimeout(pressTimer); });
    el.addEventListener('touchmove',  () => { pressStarted = false; clearTimeout(pressTimer); });
    el.addEventListener('touchcancel',() => { pressStarted = false; clearTimeout(pressTimer); });

    // ─── LONG PRESS (mouse) ──────────────────────────────────────────────────
    let mouseTimer = null;
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      mouseTimer = setTimeout(() => {
        abrirModalEditarFerramenta(f.id);
      }, 500);
    });
    el.addEventListener('mouseup',    () => clearTimeout(mouseTimer));
    el.addEventListener('mouseleave', () => clearTimeout(mouseTimer));

    // ─── CLICK (tap rápido) ──────────────────────────────────────────────────
    el.addEventListener('click', (e) => {
      if (el.getAttribute('data-dragging') === '1') { el.removeAttribute('data-dragging'); return; }
      abrirFerramenta(f.id);
    });

    // ─── DRAG & DROP ─────────────────────────────────────────────────────────
    el.addEventListener('dragstart', (e) => {
      el.setAttribute('data-dragging', '1');
      e.dataTransfer.setData('text/plain', String(idx));
      el.style.opacity = '0.5';
    });
    el.addEventListener('dragend', () => { el.style.opacity = ''; });
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.style.outline='2px dashed var(--gold)'; });
    el.addEventListener('dragleave',() => { el.style.outline=''; });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.style.outline='';
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const toIdx   = parseInt(el.getAttribute('data-ferr-idx'));
      if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) return;
      const cfg2 = obterConfigFerramentas();
      const [moved] = cfg2.splice(fromIdx, 1);
      cfg2.splice(toIdx, 0, moved);
      salvarConfigFerramentas(cfg2);
      renderGridFerramentas();
    });

    grid.appendChild(el);
  });
}

function renderFerramentas() {
  renderGridFerramentas();
  const p = document.getElementById('ferr-painel');
  if (p) p.innerHTML = '<div style="color:var(--muted);text-align:center;padding:32px 0;font-size:13px;">Selecione uma ferramenta acima para começar.</div>';
}

// ── MODAL EDITAR FERRAMENTA ──────────────────────────────────────────────────
function abrirModalEditarFerramenta(ferrId) {
  const cfg = obterConfigFerramentas();
  const idx = cfg.findIndex(f => f.id === ferrId);
  if (idx < 0) return;
  const f = cfg[idx];

  document.getElementById('modal-ferr-id').value          = ferrId;
  document.getElementById('modal-ferr-titulo').textContent = 'Personalizar: ' + f.nome;
  document.getElementById('modal-ferr-input-nome').value  = f.nome;
  document.getElementById('modal-ferr-input-sub').value   = f.sub;
  document.getElementById('modal-ferr-input-icon').value  = f.icon;
  document.getElementById('modal-ferr-pos-text').textContent = 'Posição ' + (idx+1) + ' de ' + cfg.length;

  const card = document.getElementById('modal-ferr-preview-card');
  card.style.background  = f.bg;
  card.style.borderColor = f.bd;
  document.getElementById('modal-ferr-prev-icon').textContent  = f.icon;
  document.getElementById('modal-ferr-prev-nome').textContent  = f.nome;
  document.getElementById('modal-ferr-prev-nome').style.color  = f.cor;
  document.getElementById('modal-ferr-prev-sub').textContent   = f.sub;

  document.getElementById('modal-editar-ferramenta').style.display = 'flex';
}

function fecharModalEditarFerramenta(e) {
  if (e && e.target !== document.getElementById('modal-editar-ferramenta')) return;
  document.getElementById('modal-editar-ferramenta').style.display = 'none';
}

function atualizarPreviewModalFerr() {
  const nome = document.getElementById('modal-ferr-input-nome').value;
  const sub  = document.getElementById('modal-ferr-input-sub').value;
  const icon = document.getElementById('modal-ferr-input-icon').value;
  document.getElementById('modal-ferr-prev-icon').textContent = icon || '🔧';
  document.getElementById('modal-ferr-prev-nome').textContent = nome || '(sem nome)';
  document.getElementById('modal-ferr-prev-sub').textContent  = sub  || '';
}

function setModalFerrIcon(emoji) {
  document.getElementById('modal-ferr-input-icon').value = emoji;
  atualizarPreviewModalFerr();
}

function salvarModalEditarFerramenta() {
  const ferrId = document.getElementById('modal-ferr-id').value;
  const nome   = (document.getElementById('modal-ferr-input-nome').value || '').trim();
  const sub    = (document.getElementById('modal-ferr-input-sub').value  || '').trim();
  const icon   = (document.getElementById('modal-ferr-input-icon').value || '').trim();
  if (!nome) { alert('O nome do botão não pode ficar vazio.'); return; }
  const cfg = obterConfigFerramentas();
  const idx = cfg.findIndex(f => f.id === ferrId);
  if (idx < 0) return;
  cfg[idx].nome = nome;
  cfg[idx].sub  = sub;
  cfg[idx].icon = icon || cfg[idx].icon;
  salvarConfigFerramentas(cfg);
  renderGridFerramentas();
  document.getElementById('modal-editar-ferramenta').style.display = 'none';
}

function moverFerramentaAtual(delta) {
  const ferrId = document.getElementById('modal-ferr-id').value;
  const cfg = obterConfigFerramentas();
  const idx = cfg.findIndex(f => f.id === ferrId);
  if (idx < 0) return;
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= cfg.length) return;
  const [item] = cfg.splice(idx, 1);
  cfg.splice(newIdx, 0, item);
  salvarConfigFerramentas(cfg);
  renderGridFerramentas();
  // Atualiza texto de posição
  document.getElementById('modal-ferr-pos-text').textContent = 'Posição ' + (newIdx+1) + ' de ' + cfg.length;
}

function restaurarPadraoFerramentas() {
  if (!confirm('Restaurar a ordem e nomes padrão das ferramentas?')) return;
  localStorage.removeItem('sdv_ferramentas_config');
  renderGridFerramentas();
  document.getElementById('modal-editar-ferramenta').style.display = 'none';
}


// ── CONFIGURAÇÃO DE UNIDADE DE MEDIDA (MM, CM, MT) ──────────────────────────
window._unidadeMovel = window._unidadeMovel || 'mm';
window._unidadeVidro = window._unidadeVidro || 'mm';

function setUnidadeFerr(tipo, novaUnidade) {
  const isMovel = (tipo === 'movel');
  const unitAtual = isMovel ? (window._unidadeMovel || 'mm') : (window._unidadeVidro || 'mm');
  if (unitAtual === novaUnidade) return;

  const largInp = document.getElementById(isMovel ? 'ferr-m-larg' : 'ferr-v-larg');
  const altInp  = document.getElementById(isMovel ? 'ferr-m-alt'  : 'ferr-v-alt');
  const lblLarg = document.getElementById(isMovel ? 'lbl-ferr-m-larg' : 'lbl-ferr-v-larg');
  const lblAlt  = document.getElementById(isMovel ? 'lbl-ferr-m-alt'  : 'lbl-ferr-v-alt');

  // Converte valores numéricos atuais se preenchidos
  if (largInp && largInp.value) {
    const val = parseFloat(largInp.value);
    if (!isNaN(val)) {
      let mm = val;
      if (unitAtual === 'cm') mm = val * 10;
      else if (unitAtual === 'mt') mm = val * 1000;

      let novoVal = mm;
      if (novaUnidade === 'cm') novoVal = mm / 10;
      else if (novaUnidade === 'mt') novoVal = mm / 1000;
      largInp.value = Number(novoVal.toFixed(3));
    }
  }

  if (altInp && altInp.value) {
    const val = parseFloat(altInp.value);
    if (!isNaN(val)) {
      let mm = val;
      if (unitAtual === 'cm') mm = val * 10;
      else if (unitAtual === 'mt') mm = val * 1000;

      let novoVal = mm;
      if (novaUnidade === 'cm') novoVal = mm / 10;
      else if (novaUnidade === 'mt') novoVal = mm / 1000;
      altInp.value = Number(novoVal.toFixed(3));
    }
  }

  // Atualiza labels e placeholders
  const unitLabel = novaUnidade === 'mt' ? 'm' : novaUnidade;
  const phLarg = isMovel ? (novaUnidade === 'mm' ? 'ex: 600' : (novaUnidade === 'cm' ? 'ex: 60' : 'ex: 0.60'))
                         : (novaUnidade === 'mm' ? 'ex: 1200' : (novaUnidade === 'cm' ? 'ex: 120' : 'ex: 1.20'));
  const phAlt  = isMovel ? (novaUnidade === 'mm' ? 'ex: 720' : (novaUnidade === 'cm' ? 'ex: 72' : 'ex: 0.72'))
                         : (novaUnidade === 'mm' ? 'ex: 900' : (novaUnidade === 'cm' ? 'ex: 90' : 'ex: 0.90'));

  if (lblLarg) lblLarg.textContent = isMovel ? `Largura peça (${unitLabel})` : `Largura da peça (${unitLabel})`;
  if (lblAlt)  lblAlt.textContent  = isMovel ? `Altura peça (${unitLabel})`  : `Altura da peça (${unitLabel})`;
  if (largInp) largInp.placeholder = phLarg;
  if (altInp)  altInp.placeholder  = phAlt;

  // Atualiza estilo dos botões
  if (isMovel) {
    window._unidadeMovel = novaUnidade;
    ['mm', 'cm', 'mt'].forEach(u => {
      const btn = document.getElementById('btn-unit-m-' + u);
      if (btn) {
        if (u === novaUnidade) {
          btn.style.background = '#a855f7';
          btn.style.color = '#fff';
          btn.style.borderColor = '#c084fc';
          btn.style.boxShadow = '0 0 10px rgba(168,85,247,0.4)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.05)';
          btn.style.color = '#aaa';
          btn.style.borderColor = 'rgba(255,255,255,0.12)';
          btn.style.boxShadow = 'none';
        }
      }
    });
    const res = document.getElementById('ferr-m-res');
    if (res && res.style.display !== 'none' && largInp && largInp.value && altInp && altInp.value) {
      calcMovel();
    }
  } else {
    window._unidadeVidro = novaUnidade;
    ['mm', 'cm', 'mt'].forEach(u => {
      const btn = document.getElementById('btn-unit-v-' + u);
      if (btn) {
        if (u === novaUnidade) {
          btn.style.background = '#0891b2';
          btn.style.color = '#fff';
          btn.style.borderColor = '#22d3ee';
          btn.style.boxShadow = '0 0 10px rgba(6,182,212,0.4)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.05)';
          btn.style.color = '#aaa';
          btn.style.borderColor = 'rgba(255,255,255,0.12)';
          btn.style.boxShadow = 'none';
        }
      }
    });
    const res = document.getElementById('ferr-v-res');
    if (res && res.style.display !== 'none' && largInp && largInp.value && altInp && altInp.value) {
      calcVidro();
    }
  }
}

function abrirFerramenta(tipo) {
  const p = document.getElementById('ferr-painel');
  if (!p) return;

  const card = (titulo, cor, conteudo) => `
    <div class="card" style="border:1.5px solid ${cor}33;margin-top:0;">
      <div class="card-title" style="color:${cor};margin-bottom:16px;">${titulo}</div>
      ${conteudo}
    </div>`;

  const inp = (id, label, ph='', tipo='number') => `
    <div style="margin-bottom:10px;">
      <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">${label}</label>
      <input id="${id}" type="${tipo}" placeholder="${ph}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;" oninput="calcFerr('${tipo}')" />
    </div>`;

  const res = (id) => `<div id="${id}" style="margin-top:14px;padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;font-size:15px;font-weight:800;color:#fff;text-align:center;min-height:44px;"></div>`;

  const btnCalc = (fn, label='Calcular', cor='#3b82f6') => `
    <button onclick="${fn}" style="margin-top:12px;width:100%;padding:12px;background:${cor};border:none;border-radius:12px;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">${label}</button>`;

  if (tipo === 'area') {
    p.innerHTML = card('📐 Calculadora de Área', '#3b82f6', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Largura</label>
          <input id="ferr-a-larg" type="number" placeholder="ex: 1.20" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Altura</label>
          <input id="ferr-a-alt" type="number" placeholder="ex: 0.90" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Unidade</label>
        <select id="ferr-a-unit" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
          <option value="m">Metros (m)</option>
          <option value="cm">Centímetros (cm)</option>
          <option value="mm">Milímetros (mm)</option>
        </select>
      </div>
      ${btnCalc('calcArea()', '📐 Calcular Área', '#3b82f6')}
      <div id="ferr-a-res" style="margin-top:14px;padding:14px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:12px;font-size:15px;font-weight:800;color:#60a5fa;text-align:center;min-height:44px;display:none;"></div>
    `);
  } else if (tipo === 'vidro') {
    p.innerHTML = card('🪟 Vidro / m² — Corte e Plano Visual', '#22d3ee', `
      <!-- SELEÇÃO E CADASTRO DO CLIENTE (PASTA DO CLIENTE) -->
      <div style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.25);border-radius:12px;padding:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:800;color:#22d3ee;display:flex;align-items:center;gap:6px;">
            📁 Pasta / Cadastro do Cliente:
          </span>
          <div style="display:flex;gap:6px;">
            <button type="button" onclick="abrirCadastroRapidoClienteFerr('vidro')" style="background:rgba(6,182,212,0.2);border:1px solid #22d3ee;color:#fff;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:800;cursor:pointer;">
              ➕ Novo Cliente
            </button>
            <button type="button" onclick="abrirModalPastaClienteCortes('vidro')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#cbd5e1;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;">
              📂 Ver Pasta
            </button>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <select id="ferr-v-cliente" style="flex:1;padding:9px 12px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-size:13px;">
            <option value="">-- Selecione o Cliente / Projeto --</option>
          </select>
          <button type="button" onclick="salvarCortePastaCliente('vidro')" style="padding:9px 14px;background:linear-gradient(135deg,#06b6d4,#0891b2);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">
            💾 Salvar na Pasta
          </button>
        </div>
        <div id="ferr-v-cli-aviso" style="display:none;margin-top:8px;font-size:12px;color:#67e8f9;font-weight:700;"></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:12px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:6px;">
          ⚙️ Unidade de Medida:
        </span>
        <div style="display:flex;gap:6px;">
          <button type="button" id="btn-unit-v-mm" onclick="setUnidadeFerr('vidro', 'mm')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${(window._unidadeVidro||'mm')==='mm'?'#0891b2':'rgba(255,255,255,0.05)'};color:${(window._unidadeVidro||'mm')==='mm'?'#fff':'#aaa'};border:1px solid ${(window._unidadeVidro||'mm')==='mm'?'#22d3ee':'rgba(255,255,255,0.12)'};box-shadow:${(window._unidadeVidro||'mm')==='mm'?'0 0 10px rgba(6,182,212,0.4)':'none'};">mm</button>
          <button type="button" id="btn-unit-v-cm" onclick="setUnidadeFerr('vidro', 'cm')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${window._unidadeVidro==='cm'?'#0891b2':'rgba(255,255,255,0.05)'};color:${window._unidadeVidro==='cm'?'#fff':'#aaa'};border:1px solid ${window._unidadeVidro==='cm'?'#22d3ee':'rgba(255,255,255,0.12)'};box-shadow:${window._unidadeVidro==='cm'?'0 0 10px rgba(6,182,212,0.4)':'none'};">cm</button>
          <button type="button" id="btn-unit-v-mt" onclick="setUnidadeFerr('vidro', 'mt')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${window._unidadeVidro==='mt'?'#0891b2':'rgba(255,255,255,0.05)'};color:${window._unidadeVidro==='mt'?'#fff':'#aaa'};border:1px solid ${window._unidadeVidro==='mt'?'#22d3ee':'rgba(255,255,255,0.12)'};box-shadow:${window._unidadeVidro==='mt'?'0 0 10px rgba(6,182,212,0.4)':'none'};">mt</button>
        </div>
      </div>

      <!-- SEÇÃO PARA ADICIONAR PEÇAS -->
      <div style="background:rgba(255,255,255,0.02);border:1.5px solid rgba(6,182,212,0.2);border-radius:14px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:800;color:#22d3ee;display:flex;align-items:center;gap:6px;">
            🧩 Dimensões da Peça de Vidro
          </span>
          <span style="font-size:11px;color:#94a3b8;">Preencha e toque em Adicionar</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label id="lbl-ferr-v-larg" style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Largura da peça (${(window._unidadeVidro||'mm')==='mt'?'m':(window._unidadeVidro||'mm')})</label>
            <input id="ferr-v-larg" type="number" step="any" placeholder="${(window._unidadeVidro||'mm')==='mm'?'ex: 1200':((window._unidadeVidro||'mm')==='cm'?'ex: 120':'ex: 1.20')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label id="lbl-ferr-v-alt" style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Altura da peça (${(window._unidadeVidro||'mm')==='mt'?'m':(window._unidadeVidro||'mm')})</label>
            <input id="ferr-v-alt" type="number" step="any" placeholder="${(window._unidadeVidro||'mm')==='mm'?'ex: 900':((window._unidadeVidro||'mm')==='cm'?'ex: 90':'ex: 0.90')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Qtd de peças</label>
            <input id="ferr-v-qtd" type="number" placeholder="ex: 4" min="1" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Identificação (opcional)</label>
            <input id="ferr-v-nome" type="text" placeholder="ex: Vidro Fixo, Porta" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
        </div>

        <button type="button" onclick="adicionarPecaVidro()" style="margin-top:12px;width:100%;padding:11px;background:rgba(6,182,212,0.18);border:1.5px dashed #22d3ee;border-radius:10px;color:#67e8f9;font-weight:800;font-size:13.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;">
          ➕ Adicionar Peça à Lista
        </button>

        <!-- LISTA DE PEÇAS ADICIONADAS -->
        <div id="ferr-v-lista-pecas" style="margin-top:10px;"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Chapa de vidro padrão</label>
          <select id="ferr-v-chapa" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
            <option value="3210x2250">3210×2250mm — Jumbo Float</option>
            <option value="2440x1830">2440×1830mm — Full Sheet</option>
            <option value="2000x1500">2000×1500mm — Padrão</option>
            <option value="1800x1200">1800×1200mm — Meia-chapa</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Espessura do vidro (mm)</label>
          <select id="ferr-v-esp" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
            <option value="3">3mm (~7,5 kg/m²)</option>
            <option value="4">4mm (~10 kg/m²)</option>
            <option value="6" selected>6mm (~15 kg/m²)</option>
            <option value="8">8mm (~20 kg/m²)</option>
            <option value="10">10mm (~25 kg/m²)</option>
            <option value="12">12mm (~30 kg/m²)</option>
          </select>
        </div>
        <div style="grid-column: span 2;">
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Preço por m² (R$) — opcional</label>
          <input id="ferr-v-preco" type="number" placeholder="ex: 85.00" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
      </div>
      ${btnCalc('calcVidro()', '🪟 Calcular e Ver Plano de Corte', '#06b6d4')}
      <div id="ferr-v-res" style="margin-top:14px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.25);border-radius:12px;font-size:14px;font-weight:700;color:#67e8f9;display:none;"></div>
    `);
    renderSelectClientesFerr('vidro');
    renderListaPecasVidro();
  } else if (tipo === 'movel') {
    p.innerHTML = card('🪑 Móveis / Chapas MDF', '#c084fc', `
      <!-- SELEÇÃO E CADASTRO DO CLIENTE (PASTA DO CLIENTE) -->
      <div style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.25);border-radius:12px;padding:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:800;color:#c084fc;display:flex;align-items:center;gap:6px;">
            📁 Pasta / Cadastro do Cliente:
          </span>
          <div style="display:flex;gap:6px;">
            <button type="button" onclick="abrirCadastroRapidoClienteFerr('movel')" style="background:rgba(168,85,247,0.2);border:1px solid #c084fc;color:#fff;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:800;cursor:pointer;">
              ➕ Novo Cliente
            </button>
            <button type="button" onclick="abrirModalPastaClienteCortes('movel')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#cbd5e1;border-radius:8px;padding:4px 10px;font-size:11.5px;font-weight:700;cursor:pointer;">
              📂 Ver Pasta
            </button>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <select id="ferr-m-cliente" style="flex:1;padding:9px 12px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-size:13px;">
            <option value="">-- Selecione o Cliente / Projeto --</option>
          </select>
          <button type="button" onclick="salvarCortePastaCliente('movel')" style="padding:9px 14px;background:linear-gradient(135deg,#a855f7,#7e22ce);border:none;border-radius:10px;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">
            💾 Salvar na Pasta
          </button>
        </div>
        <div id="ferr-m-cli-aviso" style="display:none;margin-top:8px;font-size:12px;color:#d8b4fe;font-weight:700;"></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:12px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:6px;">
          ⚙️ Unidade de Medida:
        </span>
        <div style="display:flex;gap:6px;">
          <button type="button" id="btn-unit-m-mm" onclick="setUnidadeFerr('movel', 'mm')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${(window._unidadeMovel||'mm')==='mm'?'#a855f7':'rgba(255,255,255,0.05)'};color:${(window._unidadeMovel||'mm')==='mm'?'#fff':'#aaa'};border:1px solid ${(window._unidadeMovel||'mm')==='mm'?'#c084fc':'rgba(255,255,255,0.12)'};box-shadow:${(window._unidadeMovel||'mm')==='mm'?'0 0 10px rgba(168,85,247,0.4)':'none'};">mm</button>
          <button type="button" id="btn-unit-m-cm" onclick="setUnidadeFerr('movel', 'cm')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${window._unidadeMovel==='cm'?'#a855f7':'rgba(255,255,255,0.05)'};color:${window._unidadeMovel==='cm'?'#fff':'#aaa'};border:1px solid ${window._unidadeMovel==='cm'?'#c084fc':'rgba(255,255,255,0.12)'};box-shadow:${window._unidadeMovel==='cm'?'0 0 10px rgba(168,85,247,0.4)':'none'};">cm</button>
          <button type="button" id="btn-unit-m-mt" onclick="setUnidadeFerr('movel', 'mt')" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;background:${window._unidadeMovel==='mt'?'#a855f7':'rgba(255,255,255,0.05)'};color:${window._unidadeMovel==='mt'?'#fff':'#aaa'};border:1px solid ${window._unidadeMovel==='mt'?'#c084fc':'rgba(255,255,255,0.12)'};box-shadow:${window._unidadeMovel==='mt'?'0 0 10px rgba(168,85,247,0.4)':'none'};">mt</button>
        </div>
      </div>

      <!-- SEÇÃO PARA ADICIONAR PEÇAS -->
      <div style="background:rgba(255,255,255,0.02);border:1.5px solid rgba(168,85,247,0.25);border-radius:14px;padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:800;color:#c084fc;display:flex;align-items:center;gap:6px;">
            🧩 Dimensões da Peça MDF
          </span>
          <span style="font-size:11px;color:#94a3b8;">Preencha e toque em Adicionar</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label id="lbl-ferr-m-larg" style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Largura peça (${(window._unidadeMovel||'mm')==='mt'?'m':(window._unidadeMovel||'mm')})</label>
            <input id="ferr-m-larg" type="number" step="any" placeholder="${(window._unidadeMovel||'mm')==='mm'?'ex: 600':((window._unidadeMovel||'mm')==='cm'?'ex: 60':'ex: 0.60')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label id="lbl-ferr-m-alt" style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Altura peça (${(window._unidadeMovel||'mm')==='mt'?'m':(window._unidadeMovel||'mm')})</label>
            <input id="ferr-m-alt" type="number" step="any" placeholder="${(window._unidadeMovel||'mm')==='mm'?'ex: 720':((window._unidadeMovel||'mm')==='cm'?'ex: 72':'ex: 0.72')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Qtd peças</label>
            <input id="ferr-m-qtd" type="number" placeholder="ex: 4" min="1" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Identificação (opcional)</label>
            <input id="ferr-m-nome" type="text" placeholder="ex: Lateral, Prateleira" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;" />
          </div>
        </div>

        <button type="button" onclick="adicionarPecaMovel()" style="margin-top:12px;width:100%;padding:11px;background:rgba(168,85,247,0.18);border:1.5px dashed #c084fc;border-radius:10px;color:#d8b4fe;font-weight:800;font-size:13.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;">
          ➕ Adicionar Peça à Lista
        </button>

        <!-- LISTA DE PEÇAS ADICIONADAS -->
        <div id="ferr-m-lista-pecas" style="margin-top:10px;"></div>
      </div>

      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Chapa padrão</label>
        <select id="ferr-m-chapa" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
          <option value="2750x1850">2750×1850mm (padrão)</option>
          <option value="2750x1220">2750×1220mm</option>
          <option value="2440x1220">2440×1220mm</option>
        </select>
      </div>
      ${btnCalc('calcMovel()', '🪑 Calcular chapas', '#a855f7')}
      <div id="ferr-m-res" style="margin-top:14px;padding:14px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:12px;font-size:14px;font-weight:700;color:#c084fc;display:none;"></div>
    `);
    renderSelectClientesFerr('movel');
    renderListaPecasMovel();
  } else if (tipo === 'conversao') {
    p.innerHTML = card('📏 Conversão de Medidas', '#34d399', `
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Valor</label>
        <input id="ferr-c-val" type="number" placeholder="ex: 1500" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">De</label>
        <select id="ferr-c-de" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
          <option value="mm">Milímetros (mm)</option>
          <option value="cm">Centímetros (cm)</option>
          <option value="m">Metros (m)</option>
          <option value="pol">Polegadas (″)</option>
        </select>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Para</label>
        <select id="ferr-c-para" style="width:100%;padding:10px;background:rgba(20,20,35,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;">
          <option value="mm">Milímetros (mm)</option>
          <option value="cm" selected>Centímetros (cm)</option>
          <option value="m">Metros (m)</option>
          <option value="pol">Polegadas (″)</option>
        </select>
      </div>
      ${btnCalc('calcConversao()', '📏 Converter', '#10b981')}
      <div id="ferr-c-res" style="margin-top:14px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;font-size:15px;font-weight:800;color:#34d399;text-align:center;display:none;"></div>
    `);
  } else if (tipo === 'desconto') {
    p.innerHTML = card('💰 Calculadora de Desconto / Margem', '#fbbf24', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Valor original (R$)</label>
          <input id="ferr-d-orig" type="number" placeholder="ex: 1200.00" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Desconto (%)</label>
          <input id="ferr-d-pct" type="number" placeholder="ex: 10" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Custo (R$)</label>
          <input id="ferr-d-custo" type="number" placeholder="ex: 700.00" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Margem desejada (%)</label>
          <input id="ferr-d-marg" type="number" placeholder="ex: 40" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-size:14px;" />
        </div>
      </div>
      ${btnCalc('calcDesconto()', '💰 Calcular', '#d97706')}
      <div id="ferr-d-res" style="margin-top:14px;padding:14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;font-size:14px;font-weight:700;color:#fbbf24;display:none;"></div>
    `);
  } else if (tipo === 'calc') {
    p.innerHTML = card('🔢 Calculadora Rápida', '#f87171', `
      <div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:14px;">
        <div id="ferr-calc-display" style="text-align:right;font-size:24px;font-weight:900;color:#fff;padding:10px;min-height:52px;word-break:break-all;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:12px;">0</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
          ${['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='].map(k => {
            const isOp = ['÷','×','−','+','='].includes(k);
            const isSp = ['C','±','%'].includes(k);
            const bg = k==='=' ? '#3b82f6' : isOp ? 'rgba(59,130,246,0.25)' : isSp ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)';
            return `<button onclick="calcRapida('${k}')" style="padding:14px;background:${bg};border:none;border-radius:10px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.opacity='0.8'" onmouseleave="this.style.opacity='1'">${k}</button>`;
          }).join('')}
        </div>
      </div>
    `);
    window._cr = { expr: '', prev: '0' };
  }
}

// Calculadora de Área
function calcArea() {
  const l = parseFloat(document.getElementById('ferr-a-larg').value) || 0;
  const a = parseFloat(document.getElementById('ferr-a-alt').value) || 0;
  const u = document.getElementById('ferr-a-unit').value;
  const res = document.getElementById('ferr-a-res');
  if (!l || !a) { res.style.display='block'; res.textContent='⚠️ Preencha largura e altura.'; return; }
  let area = l * a;
  let label = u + '²';
  let extra = '';
  if (u === 'cm') { extra = ` = ${(area/10000).toLocaleString('pt-BR',{maximumFractionDigits:4})} m²`; }
  if (u === 'mm') { extra = ` = ${(area/1000000).toLocaleString('pt-BR',{maximumFractionDigits:6})} m²`; }
  res.style.display = 'block';
  res.innerHTML = `<span style="font-size:22px;">📐 ${area.toLocaleString('pt-BR',{maximumFractionDigits:4})} ${label}</span>${extra ? '<br><span style="font-size:14px;color:var(--muted);">'+extra+'</span>' : ''}`;
}


// ══════════════════════════════════════════════════════════════════════════════
//  GERENCIAMENTO DE PEÇAS, CLIENTES, PASTAS E STATUS DE ENVIO
// ══════════════════════════════════════════════════════════════════════════════
window._listaPecasVidro = window._listaPecasVidro || [];
window._listaPecasMovel = window._listaPecasMovel || [];
window._ferrClienteAtivo = window._ferrClienteAtivo || { vidro: null, movel: null };

// --- POPULAR SELETORES DE CLIENTES ---
function renderSelectClientesFerr(tipo) {
  const selId = tipo === 'vidro' ? 'ferr-v-cliente' : 'ferr-m-cliente';
  const sel = document.getElementById(selId);
  if (!sel) return;

  const cliSalvos = Array.isArray(clientes) ? clientes : [];
  let html = '<option value="">-- Selecione o Cliente / Projeto --</option>';
  cliSalvos.forEach(c => {
    const isSelected = window._ferrClienteAtivo[tipo] === String(c.id);
    html += `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${esc(c.nome)} ${c.whatsapp ? '(' + c.whatsapp + ')' : ''}</option>`;
  });
  sel.innerHTML = html;
}

// --- CADASTRO RÁPIDO DE CLIENTE ---
let _ferrTipoCadastroAtual = 'vidro';
function abrirCadastroRapidoClienteFerr(tipo) {
  _ferrTipoCadastroAtual = tipo || 'vidro';
  ['ferr-cli-nome', 'ferr-cli-tel', 'ferr-cli-bairro'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const m = document.getElementById('modal-ferr-novo-cliente');
  if (m) m.style.display = 'flex';
  setTimeout(() => {
    const inp = document.getElementById('ferr-cli-nome');
    if (inp) inp.focus();
  }, 100);
}

function fecharModalCadastroRapidoClienteFerr() {
  const m = document.getElementById('modal-ferr-novo-cliente');
  if (m) m.style.display = 'none';
}

function salvarNovoClienteFerr() {
  const nome = (document.getElementById('ferr-cli-nome')?.value || '').trim();
  if (!nome) {
    alert('Por favor, informe o nome do cliente.');
    return;
  }
  const tel = (document.getElementById('ferr-cli-tel')?.value || '').trim();
  const bairro = (document.getElementById('ferr-cli-bairro')?.value || '').trim();

  const novo = {
    id: Date.now(),
    nome: nome,
    whatsapp: tel,
    bairro: bairro,
    cidade: 'Itaitinga'
  };

  clientes.push(novo);
  save(K.clients, clientes);
  if (typeof renderCli === 'function') renderCli();

  // Garante a criação da pasta do cliente com o nome dele
  if (!Array.isArray(sdmComparativo.pastas)) sdmComparativo.pastas = [];
  const pastaExiste = sdmComparativo.pastas.find(p => p.nome.toUpperCase() === nome.toUpperCase());
  if (!pastaExiste) {
    sdmComparativo.pastas.push({ id: 'pasta_' + Date.now(), nome: nome.toUpperCase() });
    if (typeof salvarDadosComparativo === 'function') salvarDadosComparativo();
  }

  // Atualiza e seleciona o cliente no seletor
  window._ferrClienteAtivo[_ferrTipoCadastroAtual] = String(novo.id);
  renderSelectClientesFerr(_ferrTipoCadastroAtual);

  const selId = _ferrTipoCadastroAtual === 'vidro' ? 'ferr-v-cliente' : 'ferr-m-cliente';
  const sel = document.getElementById(selId);
  if (sel) sel.value = String(novo.id);

  fecharModalCadastroRapidoClienteFerr();

  const avisoId = _ferrTipoCadastroAtual === 'vidro' ? 'ferr-v-cli-aviso' : 'ferr-m-cli-aviso';
  const aviso = document.getElementById(avisoId);
  if (aviso) {
    aviso.style.display = 'block';
    aviso.innerHTML = `✅ Cliente "<strong>${esc(nome)}</strong>" cadastrado e pasta criada!`;
  }
}

// --- SALVAR CORTE NA PASTA DO CLIENTE ---
function salvarCortePastaCliente(tipo) {
  const selId = tipo === 'vidro' ? 'ferr-v-cliente' : 'ferr-m-cliente';
  const sel = document.getElementById(selId);
  const cliId = sel ? sel.value : '';

  if (!cliId) {
    alert('Por favor, selecione ou cadastre um cliente antes de salvar na pasta.');
    if (sel) sel.focus();
    return;
  }

  const cli = clientes.find(c => String(c.id) === String(cliId));
  const cliNome = cli ? cli.nome : 'Cliente';

  const pecas = tipo === 'vidro' ? window._listaPecasVidro : window._listaPecasMovel;
  const isVidro = tipo === 'vidro';

  let dadosPecasSalvar = [];
  if (pecas && pecas.length > 0) {
    dadosPecasSalvar = JSON.parse(JSON.stringify(pecas));
  } else {
    // Se não tem na lista, tenta pegar dos inputs atuais
    const larg = parseFloat(document.getElementById(isVidro ? 'ferr-v-larg' : 'ferr-m-larg')?.value) || 0;
    const alt = parseFloat(document.getElementById(isVidro ? 'ferr-v-alt' : 'ferr-m-alt')?.value) || 0;
    const qtd = parseFloat(document.getElementById(isVidro ? 'ferr-v-qtd' : 'ferr-m-qtd')?.value) || 1;
    const unit = isVidro ? (window._unidadeVidro || 'mm') : (window._unidadeMovel || 'mm');
    if (!larg || !alt) {
      alert('Preencha as medidas da peça ou adicione peças à lista antes de salvar na pasta.');
      return;
    }
    dadosPecasSalvar = [{
      id: 1,
      nome: 'Peça Principal',
      larg,
      alt,
      qtd,
      unit,
      largMm: unit === 'cm' ? larg * 10 : (unit === 'mt' ? larg * 1000 : larg),
      altMm: unit === 'cm' ? alt * 10 : (unit === 'mt' ? alt * 1000 : alt)
    }];
  }

  const chapa = (document.getElementById(isVidro ? 'ferr-v-chapa' : 'ferr-m-chapa')?.value || (isVidro ? '3210x2250' : '2750x1850'));
  const chapaParts = chapa.split('x');
  const chapaW = parseFloat(chapaParts[0]) || 2750;
  const chapaH = parseFloat(chapaParts[1]) || 1850;

  // Calcula estatísticas
  let totalPecasQtd = 0;
  let areaTotalM2 = 0;
  dadosPecasSalvar.forEach(p => {
    totalPecasQtd += (p.qtd || 1);
    areaTotalM2 += ((p.largMm / 1000) * (p.altMm / 1000) * (p.qtd || 1));
  });

  const areaChapaM2 = (chapaW / 1000) * (chapaH / 1000);
  const chapasEst = Math.max(1, Math.ceil(areaTotalM2 / (areaChapaM2 * 0.85)));

  const corteSalvo = {
    id: 'corte_' + Date.now(),
    tipo: isVidro ? 'Vidro / m²' : 'Móveis / Chapas MDF',
    cliente_id: cliId,
    cliente_nome: cliNome,
    data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5),
    chapaPadrao: chapa,
    totalPecas: totalPecasQtd,
    areaTotalM2: areaTotalM2.toFixed(3),
    chapasEstimadas: chapasEst,
    pecas: dadosPecasSalvar
  };

  // Salva no storage sob a pasta de cortes
  let cortesTodos = [];
  try {
    cortesTodos = JSON.parse(localStorage.getItem('sdm_cortes_clientes') || '[]');
  } catch(_) {}
  cortesTodos.unshift(corteSalvo);
  localStorage.setItem('sdm_cortes_clientes', JSON.stringify(cortesTodos));

  // Garante que a pasta existe no comparativo
  if (!Array.isArray(sdmComparativo.pastas)) sdmComparativo.pastas = [];
  if (!sdmComparativo.pastas.some(p => p.nome.toUpperCase() === cliNome.toUpperCase())) {
    sdmComparativo.pastas.push({ id: 'pasta_' + Date.now(), nome: cliNome.toUpperCase() });
    if (typeof salvarDadosComparativo === 'function') salvarDadosComparativo();
  }

  const avisoId = isVidro ? 'ferr-v-cli-aviso' : 'ferr-m-cli-aviso';
  const aviso = document.getElementById(avisoId);
  if (aviso) {
    aviso.style.display = 'block';
    aviso.innerHTML = `📁 Salvo com sucesso na pasta de <strong>${esc(cliNome)}</strong> (${corteSalvo.totalPecas} peças)! <a href="javascript:void(0)" onclick="abrirModalPastaClienteCortes('${tipo}')" style="color:#fde047;text-decoration:underline;margin-left:6px;">Ver Pasta</a>`;
  }
}

// --- MODAL: VER CORTES DA PASTA DO CLIENTE ---
function abrirModalPastaClienteCortes(tipo) {
  const selId = tipo === 'vidro' ? 'ferr-v-cliente' : 'ferr-m-cliente';
  const sel = document.getElementById(selId);
  const cliId = sel ? sel.value : '';

  let cortesTodos = [];
  try {
    cortesTodos = JSON.parse(localStorage.getItem('sdm_cortes_clientes') || '[]');
  } catch(_) {}

  let cortesFiltrados = cortesTodos;
  let titulo = 'Todos os Cortes Salvos nas Pastas';
  if (cliId) {
    const cli = clientes.find(c => String(c.id) === String(cliId));
    if (cli) {
      cortesFiltrados = cortesTodos.filter(c => String(c.cliente_id) === String(cliId));
      titulo = 'Pasta de: ' + esc(cli.nome);
    }
  }

  const titEl = document.getElementById('modal-pasta-cortes-titulo');
  if (titEl) titEl.textContent = titulo;

  const listaEl = document.getElementById('modal-pasta-cortes-lista');
  if (listaEl) {
    if (!cortesFiltrados.length) {
      listaEl.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px;">
        Nenhum projeto de corte salvo nesta pasta ainda.<br><br>
        <span style="font-size:12px;color:#64748b;">Adicione peças e clique em "💾 Salvar na Pasta" para arquivar.</span>
      </div>`;
    } else {
      listaEl.innerHTML = cortesFiltrados.map(c => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px;position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <div>
              <span style="font-size:11px;background:rgba(56,189,248,0.15);color:#38bdf8;padding:2px 8px;border-radius:6px;font-weight:800;">${esc(c.tipo)}</span>
              <span style="font-size:11.5px;color:#94a3b8;margin-left:6px;">📅 ${esc(c.data)}</span>
            </div>
            <button type="button" onclick="excluirCorteSalvo('${c.id}', '${tipo}')" style="background:none;border:none;color:#ef4444;font-size:14px;cursor:pointer;padding:2px 6px;" title="Excluir este projeto de corte">✕</button>
          </div>
          <div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;">👤 ${esc(c.cliente_nome)}</div>
          <div style="font-size:12px;color:#cbd5e1;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
            <span>🧩 ${c.totalPecas} peças</span>
            <span>📐 ${c.areaTotalM2} m²</span>
            <span>📦 Chapa: ${esc(c.chapaPadrao)}</span>
          </div>
          <div style="background:rgba(0,0,0,0.25);border-radius:8px;padding:8px;font-size:11.5px;color:#94a3b8;max-height:80px;overflow-y:auto;margin-bottom:8px;">
            ${(c.pecas || []).map((p, idx) => `<div>• ${p.nome ? p.nome + ': ' : ''}${p.larg}${p.unit} × ${p.alt}${p.unit} (${p.qtd} un)</div>`).join('')}
          </div>
          <button type="button" class="btn btn-sm btn-gold" onclick="carregarCorteSalvo('${c.id}', '${tipo}')" style="width:100%;font-size:12px;padding:6px;">
            📥 Carregar Peças deste Projeto
          </button>
        </div>`).join('');
    }
  }

  const m = document.getElementById('modal-pasta-cortes-cliente');
  if (m) m.style.display = 'flex';
}

function fecharModalPastaClienteCortes() {
  const m = document.getElementById('modal-pasta-cortes-cliente');
  if (m) m.style.display = 'none';
}

function carregarCorteSalvo(corteId, tipo) {
  let cortesTodos = [];
  try {
    cortesTodos = JSON.parse(localStorage.getItem('sdm_cortes_clientes') || '[]');
  } catch(_) {}
  const corte = cortesTodos.find(c => c.id === corteId);
  if (!corte) return;

  const isVidro = (corte.tipo && corte.tipo.includes('Vidro')) || tipo === 'vidro';
  if (isVidro) {
    window._listaPecasVidro = JSON.parse(JSON.stringify(corte.pecas || []));
    renderListaPecasVidro();
    calcVidro();
  } else {
    window._listaPecasMovel = JSON.parse(JSON.stringify(corte.pecas || []));
    renderListaPecasMovel();
    calcMovel();
  }
  fecharModalPastaClienteCortes();
}

function excluirCorteSalvo(corteId, tipo) {
  if (!confirm('Deseja excluir este projeto de corte salvo da pasta?')) return;
  let cortesTodos = [];
  try {
    cortesTodos = JSON.parse(localStorage.getItem('sdm_cortes_clientes') || '[]');
  } catch(_) {}
  cortesTodos = cortesTodos.filter(c => c.id !== corteId);
  localStorage.setItem('sdm_cortes_clientes', JSON.stringify(cortesTodos));
  abrirModalPastaClienteCortes(tipo);
}

// --- ADICIONAR E GERENCIAR PEÇAS VIDRO ---
function adicionarPecaVidro() {
  const largEl = document.getElementById('ferr-v-larg');
  const altEl = document.getElementById('ferr-v-alt');
  const qtdEl = document.getElementById('ferr-v-qtd');
  const nomeEl = document.getElementById('ferr-v-nome');

  const unit = window._unidadeVidro || 'mm';
  const larg = parseFloat(largEl ? largEl.value : 0) || 0;
  const alt = parseFloat(altEl ? altEl.value : 0) || 0;
  const qtd = parseInt(qtdEl ? qtdEl.value : 1) || 1;
  const nome = (nomeEl ? nomeEl.value : '').trim() || ('Peça ' + (window._listaPecasVidro.length + 1));

  if (!larg || !alt) {
    alert('Por favor preencha a largura e a altura da peça de vidro.');
    if (largEl) largEl.focus();
    return;
  }

  let largMm = larg;
  let altMm = alt;
  if (unit === 'cm') { largMm = larg * 10; altMm = alt * 10; }
  else if (unit === 'mt') { largMm = larg * 1000; altMm = alt * 1000; }

  const areaUnitM2 = (largMm / 1000) * (altMm / 1000);
  const areaTotalM2 = areaUnitM2 * qtd;

  window._listaPecasVidro.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    nome,
    larg,
    alt,
    qtd,
    unit,
    largMm,
    altMm,
    areaUnitM2,
    areaTotalM2
  });

  if (largEl) largEl.value = '';
  if (altEl) altEl.value = '';
  if (qtdEl) qtdEl.value = '';
  if (nomeEl) nomeEl.value = '';
  if (largEl) largEl.focus();

  renderListaPecasVidro();
  calcVidro();
}

function removerPecaVidro(idx) {
  window._listaPecasVidro.splice(idx, 1);
  renderListaPecasVidro();
  if (window._listaPecasVidro.length > 0) {
    calcVidro();
  } else {
    const res = document.getElementById('ferr-v-res');
    if (res) res.style.display = 'none';
  }
}

function limparPecasVidro() {
  window._listaPecasVidro = [];
  renderListaPecasVidro();
  const res = document.getElementById('ferr-v-res');
  if (res) res.style.display = 'none';
}

function renderListaPecasVidro() {
  const container = document.getElementById('ferr-v-lista-pecas');
  if (!container) return;

  if (!window._listaPecasVidro.length) {
    container.innerHTML = '';
    return;
  }

  let totalQtd = 0;
  let totalArea = 0;
  window._listaPecasVidro.forEach(p => {
    totalQtd += p.qtd;
    totalArea += p.areaTotalM2;
  });

  container.innerHTML = `
    <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:12px;padding:10px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;font-weight:900;color:#22d3ee;">
          📋 Peças Adicionadas (${window._listaPecasVidro.length} tipos • ${totalQtd} unidades • ${totalArea.toFixed(2)} m²)
        </span>
        <button type="button" onclick="limparPecasVidro()" style="background:none;border:none;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;">Limpar tudo</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
        ${window._listaPecasVidro.map((p, idx) => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);padding:6px 10px;border-radius:8px;font-size:12px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="color:#22d3ee;font-weight:800;">#${idx + 1}</span>
              <span style="color:#fff;font-weight:700;">${esc(p.nome)}:</span>
              <span style="color:#cbd5e1;">${p.larg}${p.unit} × ${p.alt}${p.unit}</span>
              <span style="background:rgba(6,182,212,0.25);color:#67e8f9;padding:1px 6px;border-radius:6px;font-weight:800;font-size:11px;">${p.qtd} un</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="color:#94a3b8;font-size:11px;">${p.areaTotalM2.toFixed(2)} m²</span>
              <button type="button" onclick="removerPecaVidro(${idx})" style="background:none;border:none;color:#f87171;font-size:14px;cursor:pointer;padding:0 4px;" title="Remover">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- ADICIONAR E GERENCIAR PEÇAS MÓVEIS / MDF ---
function adicionarPecaMovel() {
  const largEl = document.getElementById('ferr-m-larg');
  const altEl = document.getElementById('ferr-m-alt');
  const qtdEl = document.getElementById('ferr-m-qtd');
  const nomeEl = document.getElementById('ferr-m-nome');

  const unit = window._unidadeMovel || 'mm';
  const larg = parseFloat(largEl ? largEl.value : 0) || 0;
  const alt = parseFloat(altEl ? altEl.value : 0) || 0;
  const qtd = parseInt(qtdEl ? qtdEl.value : 1) || 1;
  const nome = (nomeEl ? nomeEl.value : '').trim() || ('Peça ' + (window._listaPecasMovel.length + 1));

  if (!larg || !alt) {
    alert('Por favor preencha a largura e a altura da peça MDF.');
    if (largEl) largEl.focus();
    return;
  }

  let largMm = larg;
  let altMm = alt;
  if (unit === 'cm') { largMm = larg * 10; altMm = alt * 10; }
  else if (unit === 'mt') { largMm = larg * 1000; altMm = alt * 1000; }

  const areaUnitM2 = (largMm / 1000) * (altMm / 1000);
  const areaTotalM2 = areaUnitM2 * qtd;

  window._listaPecasMovel.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    nome,
    larg,
    alt,
    qtd,
    unit,
    largMm,
    altMm,
    areaUnitM2,
    areaTotalM2
  });

  if (largEl) largEl.value = '';
  if (altEl) altEl.value = '';
  if (qtdEl) qtdEl.value = '';
  if (nomeEl) nomeEl.value = '';
  if (largEl) largEl.focus();

  renderListaPecasMovel();
  calcMovel();
}

function removerPecaMovel(idx) {
  window._listaPecasMovel.splice(idx, 1);
  renderListaPecasMovel();
  if (window._listaPecasMovel.length > 0) {
    calcMovel();
  } else {
    const res = document.getElementById('ferr-m-res');
    if (res) res.style.display = 'none';
  }
}

function limparPecasMovel() {
  window._listaPecasMovel = [];
  renderListaPecasMovel();
  const res = document.getElementById('ferr-m-res');
  if (res) res.style.display = 'none';
}

function renderListaPecasMovel() {
  const container = document.getElementById('ferr-m-lista-pecas');
  if (!container) return;

  if (!window._listaPecasMovel.length) {
    container.innerHTML = '';
    return;
  }

  let totalQtd = 0;
  let totalArea = 0;
  window._listaPecasMovel.forEach(p => {
    totalQtd += p.qtd;
    totalArea += p.areaTotalM2;
  });

  container.innerHTML = `
    <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:10px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;font-weight:900;color:#c084fc;">
          📋 Peças MDF Adicionadas (${window._listaPecasMovel.length} tipos • ${totalQtd} unidades • ${totalArea.toFixed(2)} m²)
        </span>
        <button type="button" onclick="limparPecasMovel()" style="background:none;border:none;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;">Limpar tudo</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
        ${window._listaPecasMovel.map((p, idx) => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);padding:6px 10px;border-radius:8px;font-size:12px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="color:#c084fc;font-weight:800;">#${idx + 1}</span>
              <span style="color:#fff;font-weight:700;">${esc(p.nome)}:</span>
              <span style="color:#cbd5e1;">${p.larg}${p.unit} × ${p.alt}${p.unit}</span>
              <span style="background:rgba(168,85,247,0.25);color:#d8b4fe;padding:1px 6px;border-radius:6px;font-weight:800;font-size:11px;">${p.qtd} un</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="color:#94a3b8;font-size:11px;">${p.areaTotalM2.toFixed(2)} m²</span>
              <button type="button" onclick="removerPecaMovel(${idx})" style="background:none;border:none;color:#f87171;font-size:14px;cursor:pointer;padding:0 4px;" title="Remover">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- MODAL: STATUS DE ENVIO PARA ASSINATURA DIGITAL ---
function abrirModalStatusEnvio(osId) {
  let os = historico.find(x => String(x.id) === String(osId) || String(x.numero) === String(osId));
  if (!os) {
    const numLimpo = String(osId).replace(/\D/g, '');
    if (numLimpo) os = historico.find(x => String(x.numero || '').replace(/\D/g, '') === numLimpo);
  }
  if (!os) {
    alert('Ordem de serviço não encontrada.');
    return;
  }

  const subtitulo = document.getElementById('modal-envio-subtitulo');
  if (subtitulo) subtitulo.textContent = `O.S. ${esc(os.numero)} • ${esc(os.nome || 'Cliente')}`;

  const corpo = document.getElementById('modal-envio-corpo');
  const acoes = document.getElementById('modal-envio-acoes');

  const foiEnviado = !!(os.enviado_assinatura || os.enviado_assinatura_em);
  const dataEnvioFormatada = os.enviado_assinatura_em ? new Date(os.enviado_assinatura_em).toLocaleString('pt-BR') : '';

  if (corpo) {
    corpo.innerHTML = `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;color:var(--muted);font-weight:700;">Status do Envio:</span>
          ${foiEnviado
            ? `<span style="background:rgba(6,182,212,0.2);border:1px solid #06b6d4;color:#22d3ee;font-weight:900;padding:4px 10px;border-radius:8px;font-size:12.5px;">✅ Enviado para Assinatura</span>`
            : `<span style="background:rgba(234,179,8,0.2);border:1px solid #fbbf24;color:#fbbf24;font-weight:900;padding:4px 10px;border-radius:8px;font-size:12.5px;">⏳ Não Enviado ainda</span>`}
        </div>
        ${dataEnvioFormatada ? `<div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;">Enviado em: <strong>${dataEnvioFormatada}</strong></div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
          <div><span style="color:#94a3b8;">Cliente:</span> <strong style="color:#fff;">${esc(os.nome)}</strong></div>
          <div><span style="color:#94a3b8;">WhatsApp:</span> <strong style="color:#fff;">${esc((os.dados && os.dados.tel) || '')}</strong></div>
          <div><span style="color:#94a3b8;">Valor Total:</span> <strong style="color:var(--gold-light);">${esc(os.total || 'R$ 0,00')}</strong></div>
          <div><span style="color:#94a3b8;">Status da O.S.:</span> <strong style="color:#fff;">${esc(os.status || 'pendente')}</strong></div>
        </div>
      </div>
    `;
  }

  if (acoes) {
    acoes.innerHTML = `
      <button type="button" class="btn btn-primary" onclick="enviarLinkAssinaturaWhatsDireto('${os.id}')" style="background:linear-gradient(135deg,#059669,#10b981);border:none;font-weight:800;font-size:13.5px;padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;">
        🚀 ${foiEnviado ? 'Reenviar' : 'Enviar'} Assinatura Digital no WhatsApp
      </button>

      <button type="button" class="btn btn-sec" onclick="alternarStatusEnvioAssinatura('${os.id}')" style="font-weight:700;font-size:13px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;">
        🔄 Alternar Status: Marcar como "${foiEnviado ? 'Não Enviado' : 'Enviado'}"
      </button>

      <button type="button" class="btn btn-gold" onclick="copiarLinkAssinaturaOs('${os.id}')" style="font-weight:700;font-size:13px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;">
        📋 Copiar Link de Assinatura Online
      </button>
    `;
  }

  const m = document.getElementById('modal-status-envio-os');
  if (m) m.style.display = 'flex';
}

function fecharModalStatusEnvio() {
  const m = document.getElementById('modal-status-envio-os');
  if (m) m.style.display = 'none';
}

function alternarStatusEnvioAssinatura(osId) {
  let os = historico.find(x => String(x.id) === String(osId) || String(x.numero) === String(osId));
  if (!os) return;

  const novoStatus = !(os.enviado_assinatura || os.enviado_assinatura_em);
  os.enviado_assinatura = novoStatus;
  os.enviado_assinatura_em = novoStatus ? new Date().toISOString() : null;

  save(K.orders, historico);
  renderHist();
  abrirModalStatusEnvio(osId);
}

function enviarLinkAssinaturaWhatsDireto(osId) {
  let os = historico.find(x => String(x.id) === String(osId) || String(x.numero) === String(osId));
  if (!os) return;

  os.enviado_assinatura = true;
  os.enviado_assinatura_em = new Date().toISOString();
  save(K.orders, historico);
  renderHist();

  const d = os.dados || os;
  enviarWhatsComAprovacao(d);
  fecharModalStatusEnvio();
}

function copiarLinkAssinaturaOs(osId) {
  let os = historico.find(x => String(x.id) === String(osId) || String(x.numero) === String(osId));
  if (!os) return;

  const baseUrl = (window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : 'https://sdvidros.vercel.app';

  const numLimpo = String(os.numero || '').replace(/\D/g, '');
  const dParam = (typeof gerarParametroD === 'function') ? gerarParametroD(os.dados || os) : '';
  const lic = (typeof obterLicencaAtiva === 'function') ? obterLicencaAtiva() : { id: 'sdmoveis' };

  const queryParams = [`os=${encodeURIComponent(numLimpo)}`];
  if (dParam) queryParams.push(`d=${dParam}`);
  queryParams.push(`empresa=${encodeURIComponent(lic.id || 'sdmoveis')}`);
  const link = `${baseUrl}/assinar.html?${queryParams.join('&')}`;

  navigator.clipboard.writeText(link).then(() => {
    alert('✅ Link de assinatura digital copiado para a área de transferência!\n\n' + link);
  }).catch(() => {
    prompt('Copie o link abaixo:', link);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  CALCULADORA DE VIDRO — PLANO DE CORTE VISUAL 2D (IDÊNTICO AO MDF)
// ══════════════════════════════════════════════════════════════════════════════
window._planoCorteVidroAtual = null;

window.mudarChapaPlanoCorteVidro = function(idx) {
  if (!window._planoCorteVidroAtual) return;
  const container = document.getElementById('ferr-v-desenho-svg');
  if (container) container.innerHTML = gerarSvgPlanoDeCorteVidro(window._planoCorteVidroAtual, idx);
  document.querySelectorAll('.btn-tab-chapa-v').forEach(btn => {
    const active = parseInt(btn.getAttribute('data-idx')) === idx;
    btn.style.background   = active ? 'linear-gradient(135deg,#06b6d4,#0e7490)' : 'rgba(255,255,255,0.06)';
    btn.style.color        = active ? '#fff' : '#cbd5e1';
    btn.style.borderColor  = active ? '#22d3ee' : 'rgba(255,255,255,0.12)';
  });
};

function gerarSvgPlanoDeCorteVidro(plano, chapaIndex = 1) {
  const chapa = plano.chapas[chapaIndex - 1];
  if (!chapa) return '';

  const W   = plano.chapW;
  const H   = plano.chapH;
  const ref = plano.refilo;

  const areaTotalChapa = (W / 1000) * (H / 1000);
  const areaPecasChapa = chapa.pecas.reduce((acc, p) => acc + (p.w / 1000) * (p.h / 1000), 0);
  const aproveitamento = ((areaPecasChapa / areaTotalChapa) * 100).toFixed(1);

  let maxUsadoX = 0, maxUsadoY = 0;
  chapa.pecas.forEach(p => {
    if (p.x + p.w > maxUsadoX) maxUsadoX = p.x + p.w;
    if (p.y + p.h > maxUsadoY) maxUsadoY = p.y + p.h;
  });

  const rects = chapa.pecas.map(p => {
    const px       = ref + p.x;
    const py       = ref + p.y;
    const fontSize = Math.max(28, Math.min(p.w, p.h) * 0.12);
    const fontSub  = Math.max(18, fontSize * 0.65);
    return `
      <g class="peca-corte-item">
        <rect x="${px}" y="${py}" width="${p.w}" height="${p.h}"
              fill="url(#gradVidPeca)" stroke="#22d3ee" stroke-width="4" rx="6" />
        <rect x="${px+4}" y="${py+4}" width="${Math.max(0,p.w-8)}" height="${Math.max(0,p.h-8)}"
              fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" rx="4" />
        <text x="${px+p.w/2}" y="${py+p.h/2 - fontSize*0.4}" fill="#ffffff" font-size="${fontSize}px"
              font-weight="900" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">
          #${p.id}
        </text>
        <text x="${px+p.w/2}" y="${py+p.h/2 + fontSize*0.6}" fill="#e0f7fa" font-size="${fontSub}px"
              font-weight="700" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">
          ${p.w} × ${p.h} mm
        </text>
      </g>`;
  }).join('');

  let sobraSvg = '';
  const sobraLivreX = W - (ref + maxUsadoX);
  if (sobraLivreX > 80) {
    const sx = ref + maxUsadoX + plano.kerf;
    const sw = W - sx - ref;
    const sh = H - 2 * ref;
    if (sw > 50 && sh > 50) sobraSvg = `
      <g opacity="0.9">
        <rect x="${sx}" y="${ref}" width="${sw}" height="${sh}"
              fill="url(#padraoHachuraV)" stroke="#fbbf24" stroke-width="3" stroke-dasharray="12,8" rx="8" />
        <text x="${sx+sw/2}" y="${ref+sh/2}" fill="#fde047"
              font-size="${Math.max(28,Math.min(sw,sh)*0.08)}px" font-weight="900"
              font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">
          ♻️ SOBRA: ${Math.round(sw)}×${Math.round(sh)}mm
        </text>
      </g>`;
  }

  return `
    <svg viewBox="-90 -70 ${W+180} ${H+130}" style="width:100%;height:auto;max-height:460px;background:#060e14;border-radius:14px;box-shadow:inset 0 0 25px rgba(0,0,0,0.95);display:block;margin:0 auto;user-select:none;">
      <defs>
        <linearGradient id="gradVidFundo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#071520" />
          <stop offset="100%" stop-color="#041018" />
        </linearGradient>
        <linearGradient id="gradVidPeca" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#0e7490" />
          <stop offset="50%"  stop-color="#0891b2" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
        <pattern id="padraoHachuraV" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="24" stroke="rgba(251,191,36,0.25)" stroke-width="3.5" />
        </pattern>
      </defs>

      <!-- Fundo da chapa -->
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#gradVidFundo)" stroke="#22d3ee" stroke-width="5" rx="10" />
      <!-- Refilo -->
      <rect x="${ref}" y="${ref}" width="${W-2*ref}" height="${H-2*ref}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="8,6" rx="6" />
      <!-- Sobra -->
      ${sobraSvg}
      <!-- Peças -->
      ${rects}

      <!-- Cota largura -->
      <line x1="0" y1="-25" x2="${W}" y2="-25" stroke="#22d3ee" stroke-width="3" />
      <polygon points="0,-25 15,-30 15,-20" fill="#22d3ee" />
      <polygon points="${W},-25 ${W-15},-30 ${W-15},-20" fill="#22d3ee" />
      <rect x="${W/2-100}" y="-44" width="200" height="32" fill="#060e14" rx="6" stroke="rgba(6,182,212,0.3)" />
      <text x="${W/2}" y="-23" fill="#67e8f9" font-size="24px" font-weight="900" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">CHAPA ${W} mm</text>

      <!-- Cota altura -->
      <line x1="-30" y1="0" x2="-30" y2="${H}" stroke="#22d3ee" stroke-width="3" />
      <polygon points="-30,0 -35,15 -25,15" fill="#22d3ee" />
      <polygon points="-30,${H} -35,${H-15} -25,${H-15}" fill="#22d3ee" />
      <text x="-48" y="${H/2}" fill="#67e8f9" font-size="24px" font-weight="900" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 -48 ${H/2})">${H} mm</text>

      <text x="${W/2}" y="${H+35}" fill="#94a3b8" font-size="22px" font-weight="800" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">
        Chapa ${chapaIndex} de ${plano.totalChapas} · ${chapa.pecas.length} peças · Aproveitamento: ${aproveitamento}%
      </text>
    </svg>`;
}

function calcVidro() {
  const unit = window._unidadeVidro || 'mm';
  const lRaw = parseFloat(document.getElementById('ferr-v-larg')?.value) || 0;
  const aRaw = parseFloat(document.getElementById('ferr-v-alt')?.value) || 0;
  const qtd  = parseFloat(document.getElementById('ferr-v-qtd')?.value)  || 1;
  const preco= parseFloat(document.getElementById('ferr-v-preco')?.value) || 0;
  const esp  = parseInt(document.getElementById('ferr-v-esp')?.value)   || 6;
  const chapaStr = (document.getElementById('ferr-v-chapa')?.value || '3210x2250').split('x');
  const res  = document.getElementById('ferr-v-res');

  const temLista = window._listaPecasVidro && window._listaPecasVidro.length > 0;

  if (!temLista && (!lRaw || !aRaw)) {
    res.style.display = 'block';
    res.innerHTML = '<div style="padding:14px;">⚠️ Preencha largura e altura da peça ou adicione peças à lista.</div>';
    return;
  }

  const chapL = parseFloat(chapaStr[0]) || 3210;
  const chapA = parseFloat(chapaStr[1]) || 2250;

  let plano;
  let areaTotalPecas = 0;
  let qtdTotalPecas = 0;

  if (temLista) {
    plano = calcularPlanoDeCorteMultiplasPecas(window._listaPecasVidro, chapL, chapA, 3, 15);
    window._listaPecasVidro.forEach(p => {
      areaTotalPecas += (p.areaTotalM2 || ((p.largMm / 1000) * (p.altMm / 1000) * p.qtd));
      qtdTotalPecas += p.qtd;
    });
  } else {
    let l = lRaw;
    let a = aRaw;
    if (unit === 'cm') { l = lRaw * 10; a = aRaw * 10; }
    else if (unit === 'mt') { l = lRaw * 1000; a = aRaw * 1000; }
    plano = calcularPlanoDeCorteMdf(l, a, qtd, chapL, chapA, 3, 15);
    areaTotalPecas = (l / 1000) * (a / 1000) * qtd;
    qtdTotalPecas = qtd;
  }
  if (plano.erro) {
    res.style.display = 'block';
    res.innerHTML = `<div style="padding:14px;">⚠️ ${plano.erro}</div>`;
    return;
  }

  window._planoCorteVidroAtual = plano;

  const kgM2           = { 3:7.5, 4:10, 6:15, 8:20, 10:25, 12:30 }[esp] || 15;
  const areaPecaUnit   = qtdTotalPecas ? (areaTotalPecas / qtdTotalPecas) : 0;
  const areaChapa      = (chapL / 1000) * (chapA / 1000);
  const areaTotalCh    = plano.totalChapas * areaChapa;
  const pesoTotal      = areaTotalPecas * kgM2;
  const aprovGlobal    = ((areaTotalPecas / areaTotalCh) * 100).toFixed(1);
  const valorTotal     = preco ? areaTotalCh * preco : 0;

  let abasHtml = '';
  if (plano.totalChapas > 1) {
    abasHtml = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 8px;justify-content:center;">
      ${plano.chapas.map(c => `
        <button type="button" class="btn-tab-chapa-v" data-idx="${c.index}" onclick="mudarChapaPlanoCorteVidro(${c.index})"
                style="padding:6px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;
                       border:1px solid ${c.index===1?'#22d3ee':'rgba(255,255,255,0.12)'};
                       background:${c.index===1?'linear-gradient(135deg,#06b6d4,#0e7490)':'rgba(255,255,255,0.06)'};
                       color:${c.index===1?'#fff':'#cbd5e1'};">
          🪟 Chapa ${c.index} (${c.pecas.length} peças)
        </button>`).join('')}
    </div>`;
  }

  res.style.display = 'block';
  res.innerHTML = `
    <!-- 1. RESUMO MÉTRICAS -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;padding:14px;text-align:center;">
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(6,182,212,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Área Peças</div>
        <div style="font-size:16px;color:#fff;font-weight:900;">🪟 ${areaTotalPecas.toLocaleString('pt-BR',{maximumFractionDigits:4})} m²</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(6,182,212,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Chapas Necessárias</div>
        <div style="font-size:18px;color:#22d3ee;font-weight:900;">📦 ${plano.totalChapas} chapa${plano.totalChapas!==1?'s':''}</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(6,182,212,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Peso Total (${esp}mm)</div>
        <div style="font-size:16px;color:#67e8f9;font-weight:900;">⚖️ ${pesoTotal.toLocaleString('pt-BR',{maximumFractionDigits:2})} kg</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(6,182,212,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Aproveitamento</div>
        <div style="font-size:16px;color:#facc15;font-weight:900;">♻️ ${aprovGlobal}% útil</div>
      </div>
      ${preco ? `
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(6,182,212,0.2);grid-column:1/-1;">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Custo estimado (chapas)</div>
        <div style="font-size:22px;color:#22d3ee;font-weight:900;">💰 R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      </div>` : ''}
    </div>

    <!-- 2. PLANO VISUAL 2D -->
    <div style="background:#04080f;border:1.5px solid rgba(6,182,212,0.45);border-radius:16px;padding:14px;margin:0 14px 14px;box-shadow:0 8px 30px rgba(0,0,0,0.7);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">📐</span>
          <span style="font-size:13.5px;font-weight:900;color:#fff;">Desenho do Plano de Corte 2D — Vidro</span>
        </div>
        <div style="font-size:11px;color:#22d3ee;font-weight:800;background:rgba(6,182,212,0.15);padding:3px 8px;border-radius:6px;border:1px solid rgba(6,182,212,0.3);">
          Disco: 3mm · Refilo: 15mm
        </div>
      </div>
      ${abasHtml}
      <div id="ferr-v-desenho-svg" style="width:100%;margin-top:6px;">
        ${gerarSvgPlanoDeCorteVidro(plano, 1)}
      </div>
      <!-- Legenda -->
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:#94a3b8;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="width:12px;height:12px;background:#0891b2;border:1px solid #22d3ee;border-radius:3px;display:inline-block;"></span>
            Peça (${unit === 'mm' ? `${l}×${a}mm` : (unit === 'cm' ? `${lRaw}×${aRaw}cm (${l}×${a}mm)` : `${lRaw}×${aRaw}m (${l}×${a}mm)`)})
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="width:12px;height:12px;background:rgba(251,191,36,0.3);border:1px dashed #fbbf24;border-radius:3px;display:inline-block;"></span>
            Sobra Reaproveitável
          </span>
        </div>
        <span style="color:#06b6d4;font-weight:800;">SD Móveis Projetados</span>
      </div>
    </div>
  `;
}


// ══════════════════════════════════════════════════════════════════════════════
//  CALCULADORA DE MÓVEIS / MDF & PLANO DE CORTE VISUAL 2D
// ══════════════════════════════════════════════════════════════════════════════
window._planoCorteAtual = null;


// ══════════════════════════════════════════════════════════════════════════════
//  ENGINE DE PLANO DE CORTE PARA MÚLTIPLAS PEÇAS
// ══════════════════════════════════════════════════════════════════════════════
function calcularPlanoDeCorteMultiplasPecas(pecasArray, chapW, chapH, kerf = 4, refilo = 10) {
  const usableW = Math.max(0, chapW - 2 * refilo);
  const usableH = Math.max(0, chapH - 2 * refilo);

  const pecasPendentes = [];
  let globalId = 1;
  (pecasArray || []).forEach(p => {
    const qtd = parseInt(p.qtd) || 1;
    const w = parseFloat(p.largMm) || 0;
    const h = parseFloat(p.altMm) || 0;
    for (let i = 0; i < qtd; i++) {
      pecasPendentes.push({
        id: globalId++,
        nome: p.nome || ('#' + globalId),
        w,
        h,
        rotacionada: false
      });
    }
  });

  // Verifica se alguma peça é maior que a chapa
  const pecaInvalida = pecasPendentes.find(p => (p.w > usableW && p.w > usableH) || (p.h > usableW && p.h > usableH));
  if (pecaInvalida) {
    return { erro: `A peça "${pecaInvalida.nome}" (${pecaInvalida.w}×${pecaInvalida.h}mm) é maior que o espaço útil da chapa (${usableW}×${usableH}mm).` };
  }

  // Ordena por maior dimensão decrescente
  pecasPendentes.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));

  const chapas = [];
  let restantes = [...pecasPendentes];

  while (restantes.length > 0) {
    const chapaIndex = chapas.length + 1;
    const pecasNestaChapa = [];
    const naoCouberam = [];

    let curX = 0;
    let curY = 0;
    let shelfH = 0;

    for (let i = 0; i < restantes.length; i++) {
      const p = restantes[i];
      let fitW = p.w;
      let fitH = p.h;
      let rot = false;

      // Testa orientação padrão
      let cabeAqui = (curX + fitW <= usableW) && (curY + fitH <= usableH);

      // Testa se cabe rotacionada
      if (!cabeAqui && (curX + p.h <= usableW) && (curY + p.w <= usableH)) {
        fitW = p.h;
        fitH = p.w;
        rot = true;
        cabeAqui = true;
      }

      // Se não coube na prateleira atual, tenta nova prateleira
      if (!cabeAqui) {
        const novoY = curY + shelfH + kerf;
        const cabeNovaPrateleiraPadrao = (fitW <= usableW) && (novoY + fitH <= usableH);
        const cabeNovaPrateleiraRot = (p.h <= usableW) && (novoY + p.w <= usableH);

        if (cabeNovaPrateleiraPadrao || cabeNovaPrateleiraRot) {
          curX = 0;
          curY = novoY;
          shelfH = 0;
          if (!cabeNovaPrateleiraPadrao && cabeNovaPrateleiraRot) {
            fitW = p.h;
            fitH = p.w;
            rot = true;
          }
          cabeAqui = true;
        }
      }

      if (cabeAqui) {
        pecasNestaChapa.push({
          id: p.id,
          nome: p.nome,
          x: curX,
          y: curY,
          w: fitW,
          h: fitH,
          rotacionada: rot
        });
        curX += fitW + kerf;
        shelfH = Math.max(shelfH, fitH);
      } else {
        naoCouberam.push(p);
      }
    }

    if (pecasNestaChapa.length === 0) {
      // Segurança contra loop infinito
      break;
    }

    chapas.push({
      index: chapaIndex,
      pecas: pecasNestaChapa,
      totalSlots: pecasNestaChapa.length
    });

    restantes = naoCouberam;
  }

  return {
    chapW,
    chapH,
    refilo,
    kerf,
    totalChapas: chapas.length,
    chapas,
    pecasOriginais: pecasArray
  };
}

function calcularPlanoDeCorteMdf(largPeca, altPeca, qtdTotal, chapW, chapH, kerf = 4, refilo = 10) {
  const usableW = Math.max(0, chapW - 2 * refilo);
  const usableH = Math.max(0, chapH - 2 * refilo);

  // Orientação A: Peça em pé (largPeca x altPeca)
  const colsA = Math.floor((usableW + kerf) / (largPeca + kerf));
  const rowsA = Math.floor((usableH + kerf) / (altPeca + kerf));
  const capA = Math.max(0, colsA * rowsA);

  const sobraWA = usableW - (colsA * (largPeca + kerf));
  const extraColsA = (sobraWA >= altPeca) ? Math.floor((sobraWA + kerf) / (altPeca + kerf)) : 0;
  const extraRowsA = (extraColsA > 0) ? Math.floor((usableH + kerf) / (largPeca + kerf)) : 0;
  const totalCapA = capA + (extraColsA * extraRowsA);

  // Orientação B: Peça deitada (altPeca x largPeca)
  const colsB = Math.floor((usableW + kerf) / (altPeca + kerf));
  const rowsB = Math.floor((usableH + kerf) / (largPeca + kerf));
  const capB = Math.max(0, colsB * rowsB);

  const sobraWB = usableW - (colsB * (altPeca + kerf));
  const extraColsB = (sobraWB >= largPeca) ? Math.floor((sobraWB + kerf) / (largPeca + kerf)) : 0;
  const extraRowsB = (extraColsB > 0) ? Math.floor((usableH + kerf) / (altPeca + kerf)) : 0;
  const totalCapB = capB + (extraColsB * extraRowsB);

  let melhorModo = 'A';
  if (totalCapB > totalCapA) {
    melhorModo = 'B';
  }

  const templateSlots = [];
  if (melhorModo === 'A') {
    for (let r = 0; r < rowsA; r++) {
      for (let c = 0; c < colsA; c++) {
        templateSlots.push({
          x: c * (largPeca + kerf),
          y: r * (altPeca + kerf),
          w: largPeca,
          h: altPeca,
          rotacionada: false
        });
      }
    }
    if (extraColsA > 0 && extraRowsA > 0) {
      const startX = colsA * (largPeca + kerf);
      for (let r = 0; r < extraRowsA; r++) {
        for (let c = 0; c < extraColsA; c++) {
          templateSlots.push({
            x: startX + c * (altPeca + kerf),
            y: r * (largPeca + kerf),
            w: altPeca,
            h: largPeca,
            rotacionada: true
          });
        }
      }
    }
  } else {
    for (let r = 0; r < rowsB; r++) {
      for (let c = 0; c < colsB; c++) {
        templateSlots.push({
          x: c * (altPeca + kerf),
          y: r * (largPeca + kerf),
          w: altPeca,
          h: largPeca,
          rotacionada: true
        });
      }
    }
    if (extraColsB > 0 && extraRowsB > 0) {
      const startX = colsB * (altPeca + kerf);
      for (let r = 0; r < extraRowsB; r++) {
        for (let c = 0; c < extraColsB; c++) {
          templateSlots.push({
            x: startX + c * (largPeca + kerf),
            y: r * (altPeca + kerf),
            w: largPeca,
            h: altPeca,
            rotacionada: false
          });
        }
      }
    }
  }

  if (templateSlots.length === 0) {
    return { erro: 'A peça (' + largPeca + '×' + altPeca + 'mm) é maior que a chapa (' + chapW + '×' + chapH + 'mm).' };
  }

  const chapas = [];
  let restantes = qtdTotal;
  let globalId = 1;

  while (restantes > 0) {
    const chapaIndex = chapas.length + 1;
    const pecasNestaChapa = [];

    for (let i = 0; i < templateSlots.length && restantes > 0; i++) {
      const slot = templateSlots[i];
      pecasNestaChapa.push({
        id: globalId++,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        rotacionada: slot.rotacionada
      });
      restantes--;
    }

    chapas.push({
      index: chapaIndex,
      pecas: pecasNestaChapa,
      totalSlots: templateSlots.length
    });
  }

  return {
    chapW,
    chapH,
    refilo,
    kerf,
    largPeca,
    altPeca,
    qtdTotal,
    capPorChapa: templateSlots.length,
    totalChapas: chapas.length,
    chapas
  };
}

function gerarSvgPlanoDeCorte(plano, chapaIndex = 1) {
  const chapa = plano.chapas[chapaIndex - 1];
  if (!chapa) return '';

  const W = plano.chapW;
  const H = plano.chapH;
  const ref = plano.refilo;

  const areaTotalChapa = (W / 1000) * (H / 1000);
  const areaPecasChapa = chapa.pecas.reduce((acc, p) => acc + (p.w / 1000) * (p.h / 1000), 0);
  const aproveitamento = ((areaPecasChapa / areaTotalChapa) * 100).toFixed(1);

  let maxUsadoX = 0;
  let maxUsadoY = 0;
  chapa.pecas.forEach(p => {
    if (p.x + p.w > maxUsadoX) maxUsadoX = p.x + p.w;
    if (p.y + p.h > maxUsadoY) maxUsadoY = p.y + p.h;
  });

  const rects = chapa.pecas.map(p => {
    const px = ref + p.x;
    const py = ref + p.y;
    const fontSize = Math.max(30, Math.min(p.w, p.h) * 0.12);
    const fontSub = Math.max(20, fontSize * 0.65);
    return `
      <g class="peca-corte-item">
        <rect x="${px}" y="${py}" width="${p.w}" height="${p.h}" 
              fill="url(#gradMdfPeca)" stroke="#c084fc" stroke-width="4" rx="6" />
        <rect x="${px + 4}" y="${py + 4}" width="${Math.max(0, p.w - 8)}" height="${Math.max(0, p.h - 8)}" 
              fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" rx="4" />
        <text x="${px + p.w/2}" y="${py + p.h/2 - fontSize*0.4}" fill="#ffffff" font-size="${fontSize}px" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle">
          #${p.id}
        </text>
        <text x="${px + p.w/2}" y="${py + p.h/2 + fontSize*0.6}" fill="#f3e8ff" font-size="${fontSub}px" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle">
          ${p.w} × ${p.h} mm
        </text>
      </g>
    `;
  }).join('');

  let sobraSvg = '';
  const sobraLivreX = W - (ref + maxUsadoX);
  if (sobraLivreX > 80) {
    const sx = ref + maxUsadoX + plano.kerf;
    const sw = W - sx - ref;
    const sh = H - 2 * ref;
    if (sw > 50 && sh > 50) {
      sobraSvg += `
        <g opacity="0.9">
          <rect x="${sx}" y="${ref}" width="${sw}" height="${sh}" fill="url(#padraoHachura)" stroke="#fbbf24" stroke-width="3" stroke-dasharray="12,8" rx="8" />
          <text x="${sx + sw/2}" y="${ref + sh/2}" fill="#fde047" font-size="${Math.max(28, Math.min(sw, sh)*0.08)}px" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle">
            ♻️ SOBRA: ${Math.round(sw)}×${Math.round(sh)}mm
          </text>
        </g>
      `;
    }
  }

  return `
    <svg viewBox="-90 -70 ${W + 180} ${H + 130}" style="width:100%;height:auto;max-height:460px;background:#090b14;border-radius:14px;box-shadow:inset 0 0 25px rgba(0,0,0,0.95);display:block;margin:0 auto;user-select:none;">
      <defs>
        <linearGradient id="gradMdfFundo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#181528" />
          <stop offset="100%" stop-color="#0f0c1c" />
        </linearGradient>

        <linearGradient id="gradMdfPeca" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7e22ce" />
          <stop offset="50%" stop-color="#9333ea" />
          <stop offset="100%" stop-color="#6b21a8" />
        </linearGradient>

        <pattern id="padraoHachura" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="24" stroke="rgba(251,191,36,0.25)" stroke-width="3.5" />
        </pattern>
      </defs>

      <!-- 1. Borda da Chapa MDF Completa -->
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#gradMdfFundo)" stroke="#a855f7" stroke-width="5" rx="10" />

      <!-- 2. Linha tracejada do Refilo Útil (10mm) -->
      <rect x="${ref}" y="${ref}" width="${W - 2*ref}" height="${H - 2*ref}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="8,6" rx="6" />

      <!-- 3. Sobra / Retalho -->
      ${sobraSvg}

      <!-- 4. Peças Cortadas -->
      ${rects}

      <!-- 5. Cotas de Medida da Chapa -->
      <line x1="0" y1="-25" x2="${W}" y2="-25" stroke="#a855f7" stroke-width="3" />
      <polygon points="0,-25 15,-30 15,-20" fill="#a855f7" />
      <polygon points="${W},-25 ${W-15},-30 ${W-15},-20" fill="#a855f7" />
      <rect x="${W/2 - 100}" y="-44" width="200" height="32" fill="#090b14" rx="6" stroke="rgba(168,85,247,0.3)" />
      <text x="${W/2}" y="-23" fill="#c084fc" font-size="24px" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle">
        CHAPA ${W} mm
      </text>

      <line x1="-30" y1="0" x2="-30" y2="${H}" stroke="#a855f7" stroke-width="3" />
      <polygon points="-30,0 -35,15 -25,15" fill="#a855f7" />
      <polygon points="-30,${H} -35,${H-15} -25,${H-15}" fill="#a855f7" />
      <text x="-48" y="${H/2}" fill="#c084fc" font-size="24px" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 -48 ${H/2})">
        ${H} mm
      </text>

      <text x="${W/2}" y="${H + 35}" fill="#94a3b8" font-size="22px" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle">
        Chapa ${chapaIndex} de ${plano.totalChapas} · ${chapa.pecas.length} peças nesta chapa · Aproveitamento: ${aproveitamento}%
      </text>
    </svg>
  `;
}

window.mudarChapaPlanoCorte = function(idx) {
  if (!window._planoCorteAtual) return;
  const container = document.getElementById('ferr-m-desenho-svg');
  if (container) {
    container.innerHTML = gerarSvgPlanoDeCorte(window._planoCorteAtual, idx);
  }
  document.querySelectorAll('.btn-tab-chapa').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.getAttribute('data-idx')) === idx);
    if (parseInt(btn.getAttribute('data-idx')) === idx) {
      btn.style.background = 'linear-gradient(135deg,#a855f7,#7e22ce)';
      btn.style.color = '#fff';
      btn.style.borderColor = '#c084fc';
    } else {
      btn.style.background = 'rgba(255,255,255,0.06)';
      btn.style.color = '#cbd5e1';
      btn.style.borderColor = 'rgba(255,255,255,0.12)';
    }
  });
};

function calcMovel() {
  const unit = window._unidadeMovel || 'mm';
  const lRaw = parseFloat(document.getElementById('ferr-m-larg')?.value) || 0;
  const aRaw = parseFloat(document.getElementById('ferr-m-alt')?.value) || 0;
  const qtd = parseFloat(document.getElementById('ferr-m-qtd')?.value) || 1;
  const chapaStr = (document.getElementById('ferr-m-chapa')?.value || '2750x1850').split('x');
  const res = document.getElementById('ferr-m-res');

  const temLista = window._listaPecasMovel && window._listaPecasMovel.length > 0;

  if (!temLista && (!lRaw || !aRaw)) {
    res.style.display = 'block';
    res.innerHTML = '⚠️ Por favor preencha a largura e a altura da peça ou adicione peças à lista.';
    return;
  }

  const chapL = parseFloat(chapaStr[0]) || 2750;
  const chapA = parseFloat(chapaStr[1]) || 1850;

  let plano;
  let areaTotalPecas = 0;
  let qtdTotalPecas = 0;

  if (temLista) {
    plano = calcularPlanoDeCorteMultiplasPecas(window._listaPecasMovel, chapL, chapA, 4, 10);
    window._listaPecasMovel.forEach(p => {
      areaTotalPecas += (p.areaTotalM2 || ((p.largMm / 1000) * (p.altMm / 1000) * p.qtd));
      qtdTotalPecas += p.qtd;
    });
  } else {
    let l = lRaw;
    let a = aRaw;
    if (unit === 'cm') { l = lRaw * 10; a = aRaw * 10; }
    else if (unit === 'mt') { l = lRaw * 1000; a = aRaw * 1000; }
    plano = calcularPlanoDeCorteMdf(l, a, qtd, chapL, chapA, 4, 10);
    areaTotalPecas = (l / 1000) * (a / 1000) * qtd;
    qtdTotalPecas = qtd;
  }
  if (plano.erro) {
    res.style.display = 'block';
    res.innerHTML = `⚠️ ${plano.erro}`;
    return;
  }

  window._planoCorteAtual = plano;

  const areaPecaUnitaria = qtdTotalPecas ? (areaTotalPecas / qtdTotalPecas) : 0;
  const areaChapa = (chapL / 1000) * (chapA / 1000);
  const areaTotalChapas = plano.totalChapas * areaChapa;
  const aproveitamentoGlobal = ((areaTotalPecas / areaTotalChapas) * 100).toFixed(1);

  // Botões de Chapa caso tenha mais de 1
  let abasChapasHtml = '';
  if (plano.totalChapas > 1) {
    abasChapasHtml = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 8px;justify-content:center;">
        ${plano.chapas.map(c => `
          <button type="button" class="btn-tab-chapa" data-idx="${c.index}" onclick="mudarChapaPlanoCorte(${c.index})" 
                  style="padding:6px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;border:1px solid ${c.index===1?'#c084fc':'rgba(255,255,255,0.12)'};background:${c.index===1?'linear-gradient(135deg,#a855f7,#7e22ce)':'rgba(255,255,255,0.06)'};color:${c.index===1?'#fff':'#cbd5e1'};">
            📄 Chapa ${c.index} (${c.pecas.length} peças)
          </button>
        `).join('')}
      </div>
    `;
  }

  res.style.display = 'block';
  res.innerHTML = `
    <!-- 1. RESUMO DOS DADOS DE CORTE -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;text-align:center;margin-bottom:14px;">
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Área Peças</div>
        <div style="font-size:16px;color:#fff;font-weight:900;">📦 ${areaTotalPecas.toLocaleString('pt-BR',{maximumFractionDigits:4})} m²</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Chapas Necessárias</div>
        <div style="font-size:18px;color:#c084fc;font-weight:900;">🪑 ${plano.totalChapas} chapa${plano.totalChapas!==1?'s':''}</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Por Chapa</div>
        <div style="font-size:16px;color:#4ade80;font-weight:900;">🧩 até ${plano.capPorChapa} peças</div>
      </div>
      <div style="background:rgba(0,0,0,0.25);padding:10px;border-radius:10px;border:1px solid rgba(168,85,247,0.2);">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;">Aproveitamento</div>
        <div style="font-size:16px;color:#facc15;font-weight:900;">♻️ ${aproveitamentoGlobal}% útil</div>
      </div>
    </div>

    <!-- 2. DESENHO DO PLANO DE CORTE VISUAL 2D -->
    <div style="background:#060810;border:1.5px solid rgba(168,85,247,0.45);border-radius:16px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,0.7);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">📐</span>
          <span style="font-size:13.5px;font-weight:900;color:#fff;">Desenho do Plano de Corte 2D</span>
        </div>
        <div style="font-size:11px;color:#c084fc;font-weight:800;background:rgba(168,85,247,0.15);padding:3px 8px;border-radius:6px;border:1px solid rgba(168,85,247,0.3);">
          Serra: 4mm · Refilo: 10mm
        </div>
      </div>

      ${abasChapasHtml}

      <!-- Contêiner do SVG Proporcional -->
      <div id="ferr-m-desenho-svg" style="width:100%;margin-top:6px;">
        ${gerarSvgPlanoDeCorte(plano, 1)}
      </div>

      <!-- Legenda explicativa -->
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:#94a3b8;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="width:12px;height:12px;background:#9333ea;border:1px solid #c084fc;border-radius:3px;display:inline-block;"></span>
            Peça (${unit === 'mm' ? `${l}×${a}mm` : (unit === 'cm' ? `${lRaw}×${aRaw}cm (${l}×${a}mm)` : `${lRaw}×${aRaw}m (${l}×${a}mm)`)})
          </span>
          <span style="display:inline-flex;align-items:center;gap:5px;">
            <span style="width:12px;height:12px;background:rgba(251,191,36,0.3);border:1px dashed #fbbf24;border-radius:3px;display:inline-block;"></span>
            Sobra Reaproveitável
          </span>
        </div>
        <span style="color:#a855f7;font-weight:800;">SD Móveis Projetados</span>
      </div>
    </div>
  `;
}

// Conversão de medidas
function calcConversao() {
  const v = parseFloat(document.getElementById('ferr-c-val').value);
  const de = document.getElementById('ferr-c-de').value;
  const para = document.getElementById('ferr-c-para').value;
  const res = document.getElementById('ferr-c-res');
  if (isNaN(v)) { res.style.display='block'; res.textContent='⚠️ Insira um valor.'; return; }
  // converte tudo para mm primeiro
  const toMm = { mm:1, cm:10, m:1000, pol:25.4 };
  const fromMm = { mm:1, cm:0.1, m:0.001, pol:1/25.4 };
  const mm = v * toMm[de];
  const result = mm * fromMm[para];
  const labels = { mm:'mm', cm:'cm', m:'m', pol:'″' };
  res.style.display = 'block';
  res.textContent = `${v.toLocaleString('pt-BR')} ${labels[de]} = ${result.toLocaleString('pt-BR',{maximumFractionDigits:6})} ${labels[para]}`;
}

// Calculadora de Desconto / Margem
function calcDesconto() {
  const orig = parseFloat(document.getElementById('ferr-d-orig').value) || 0;
  const pct  = parseFloat(document.getElementById('ferr-d-pct').value) || 0;
  const custo= parseFloat(document.getElementById('ferr-d-custo').value) || 0;
  const marg = parseFloat(document.getElementById('ferr-d-marg').value) || 0;
  const res  = document.getElementById('ferr-d-res');
  let html = '';
  if (orig && pct) {
    const final = orig * (1 - pct/100);
    html += `<div>Valor com ${pct}% de desconto: <strong>R$ ${final.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong> (economiza R$ ${(orig-final).toLocaleString('pt-BR',{minimumFractionDigits:2})})</div>`;
  }
  if (custo && marg) {
    const preco = custo / (1 - marg/100);
    const lucro = preco - custo;
    html += `<div style="margin-top:8px;">Preço com ${marg}% de margem: <strong>R$ ${preco.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong> (lucro R$ ${lucro.toLocaleString('pt-BR',{minimumFractionDigits:2})})</div>`;
  }
  if (!html) html = '⚠️ Preencha pelo menos Valor+Desconto ou Custo+Margem.';
  res.style.display = 'block';
  res.innerHTML = html;
}

// Calculadora rápida de teclado
function calcRapida(k) {
  if (!window._cr) window._cr = { expr:'', prev:'0' };
  const d = document.getElementById('ferr-calc-display');
  if (!d) return;
  const cr = window._cr;
  if (k === 'C') { cr.expr = ''; d.textContent = '0'; return; }
  if (k === '⌫') { cr.expr = cr.expr.slice(0,-1); d.textContent = cr.expr || '0'; return; }
  if (k === '=') {
    try {
      const expr2 = cr.expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      const r = Function('"use strict";return ('+expr2+')')();
      d.textContent = parseFloat(r.toFixed(10)).toLocaleString('pt-BR', {maximumFractionDigits:10});
      cr.expr = String(r);
    } catch(e) { d.textContent = 'Erro'; cr.expr = ''; }
    return;
  }
  if (k === '±') { cr.expr = cr.expr.startsWith('-') ? cr.expr.slice(1) : (cr.expr ? '-'+cr.expr : ''); d.textContent = cr.expr || '0'; return; }
  if (k === '%') {
    try {
      const expr2 = cr.expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      const r = Function('"use strict";return ('+expr2+')')() / 100;
      cr.expr = String(r);
      d.textContent = parseFloat(r.toFixed(10)).toLocaleString('pt-BR', {maximumFractionDigits:10});
    } catch(e) {}
    return;
  }
  cr.expr += k === '.' ? '.' : k === '−' ? '-' : k;
  d.textContent = cr.expr;
}
