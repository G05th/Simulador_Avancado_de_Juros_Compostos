import { generateTimeline } from './calc.js';
import { deleteScenario, listScenarios, loadScenario, saveScenario } from './storage.js';

console.log('main.js loaded');

export function readBaseInputs() {
  const capital = parseFloat(document.getElementById('capital').value) || 0;
  const taxaAnual = parseFloat(document.getElementById('rate').value) || 0;
  const periodos = parseInt(document.getElementById('period').value) || 0;
  const periodUnit = document.getElementById('periodUnit').value;
  const compounding = document.getElementById('compounding').value;
  const aporte = parseFloat(document.getElementById('contribution').value) || 0;
  const inflation = parseFloat(document.getElementById('inflation').value) || 0;
  const localeCurrency = document.getElementById('localeCurrency').value;

  return {
    capital,
    taxaAnual,
    periodos,
    periodUnit,
    compounding,
    aporte,
    inflation,
    localeCurrency
  };
}

const $ = id => document.getElementById(id);
const toNumber = v => { const n = Number(v); return isNaN(n) ? 0 : n; };
const parseLocaleCurrency = (val) => {
  const [locale, currency] = (val || 'pt-BR|BRL').split('|');
  return { locale, currency };
};

function fmtCurrency(val, locale='pt-BR', currency='BRL'){
  try{
    return new Intl.NumberFormat(locale, { style:'currency', currency }).format(val);
  }catch(e){
    return Number(val).toFixed(2);
  }
}

function renderTable(timeline, locale, currency){
  const tbody = document.querySelector('#amortTable tbody');
  tbody.innerHTML = '';
  if (!timeline || timeline.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" class="muted empty-cell">Sem dados — calcule acima</td></tr>';
    return;
  }
  timeline.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.period}</td>
      <td>${fmtCurrency(row.initial, locale, currency)}</td>
      <td>${fmtCurrency(row.interest, locale, currency)}</td>
      <td>${fmtCurrency(row.contribution, locale, currency)}</td>
      <td>${fmtCurrency(row.final, locale, currency)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateResults(montante, taxaReal, periodsTotal, locale, currency){
  const resultBlock = document.querySelector('.result-block');
  if (resultBlock) {
    resultBlock.classList.remove('fade-in');
    void resultBlock.offsetWidth; // trigger reflow
    resultBlock.classList.add('fade-in');
  }

  $('finalAmount').textContent = fmtCurrency(montante, locale, currency);
  $('realRate').textContent = taxaReal == null ? '—' : ((taxaReal*100).toFixed(2) + '%');
  $('periodsInfo').textContent = String(periodsTotal);
}

function downloadCSV(timeline, filename='simulacao.csv'){
  if (!timeline || timeline.length===0) return alert('Sem dados para exportar.');
  const rows = [['period','initial','interest','contribution','final']];
  timeline.forEach(r => rows.push([r.period, r.initial.toFixed(2), r.interest.toFixed(2), r.contribution.toFixed(2), r.final.toFixed(2)]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

let chartInstance = null;
function plotChart(timeline){
  const ctx = document.getElementById('chart').getContext('2d');
  const labels = timeline.map(r => String(r.period));
  const data = timeline.map(r => r.final);
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Saldo', data, tension:0.25, fill:true, borderColor:'#0ea5a4', backgroundColor:'rgba(14,165,164,0.08)' }] },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
}

// Event Handlers
function handleCalculate() {
  console.log('Calculate clicked');
  try {
    $('status').textContent = 'Calculando...';

    const capital = toNumber($('capital').value);
    const taxaAnual = toNumber($('rate').value);
    const period = Math.max(1, Math.floor(toNumber($('period').value) || 1));
    const periodUnit = $('periodUnit').value;
    const compounding = $('compounding').value;
    const aporte = toNumber($('contribution').value) || 0;
    const inflation = $('inflation').value ? toNumber($('inflation').value) : null;
    const { locale, currency } = parseLocaleCurrency($('localeCurrency').value);

    if (capital <= 0){ alert('Capital inicial deve ser maior que 0'); $('status').textContent='Erro'; return; }
    if (taxaAnual < 0){ alert('Taxa não pode ser negativa'); $('status').textContent='Erro'; return; }

    const res = generateTimeline({
      capital,
      taxaAnual,
      periodos: period,
      periodUnit,
      compounding,
      aporte,
      inflation
    });

    renderTable(res.timeline, locale, currency);
    updateResults(res.montante, res.taxaReal, res.periodsTotal, locale, currency);

    if (typeof Chart !== 'undefined') {
      plotChart(res.timeline);
    } else {
      console.warn('Chart.js not loaded');
      $('status').textContent = 'Calculado (Gráfico indisponível)';
    }

    if ($('status').textContent !== 'Calculado (Gráfico indisponível)') {
        $('status').textContent = 'Calculado';
    }
    window.__lastTimeline = res.timeline;
  } catch (e) {
    console.error(e);
    alert('Erro ao calcular: ' + e.message);
    $('status').textContent = 'Erro';
  }
}

function handleExport() {
  const timeline = window.__lastTimeline || [];
  if (!timeline || timeline.length === 0) return alert('Sem dados para exportar.');
  downloadCSV(timeline);
}

function handleReset() {
  if (!confirm('Redefinir todos os campos para padrão?')) return;
  $('capital').value = 10000; $('rate').value = 6; $('period').value = 10; $('periodUnit').value='anos';
  $('compounding').value='anual'; $('contribution').value=200; $('inflation').value=3;
  document.querySelector('#amortTable tbody').innerHTML = '<tr><td colspan="5" class="muted empty-cell">Sem dados — calcule acima</td></tr>';
  $('finalAmount').textContent = 'R$ 0,00'; $('status').textContent = 'Pronto';
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  window.__lastTimeline = [];
}

function handleSaveScenario() {
  const nameInput = document.getElementById('saveName');
  const name = (nameInput.value || '').trim();
  if (!name) return alert('Dê um nome ao cenário.');
  const params = readBaseInputs();
  const results = { timeline: window.__lastTimeline || null, montante: window.__lastTimeline ? window.__lastTimeline.slice(-1)[0]?.final || null : null };
  try {
    saveScenario(name, { params, results }, { overwrite: false });
    renderSavedList();
    alert('Cenário salvo: ' + name);
  } catch (e) {
    if (confirm('Já existe um cenário com esse nome. Substituir?')) {
      saveScenario(name, { params, results }, { overwrite: true });
      renderSavedList();
      alert('Substituído.');
    }
  }
}

function handleSavedListClick(ev) {
  const btn = ev.target.closest('.btn-load, .btn-delete');
  if (!btn) return;
  const name = btn.dataset.name;
  if (btn.classList.contains('btn-load')) {
    const rec = loadScenario(name);
    if (!rec) return alert('Cenário não encontrado.');
    const p = rec.data.params;
    if (!p) return alert('Cenário inválido.');
    $('capital').value = p.capital || 0;
    $('rate').value = p.taxaAnual || 0;
    $('period').value = p.periodos || 1;
    $('periodUnit').value = p.periodUnit || 'anos';
    $('compounding').value = p.compounding || 'anual';
    $('contribution').value = p.aporte || 0;
    $('inflation').value = p.inflation || '';
    $('localeCurrency').value = p.localeCurrency || 'pt-BR|BRL';
    if (rec.data.results && rec.data.results.timeline) {
      renderTable(rec.data.results.timeline, parseLocaleCurrency(p.localeCurrency).locale, parseLocaleCurrency(p.localeCurrency).currency);
      updateResults(rec.data.results.montante || 0, null, (rec.data.results.timeline || []).length, parseLocaleCurrency(p.localeCurrency).locale, parseLocaleCurrency(p.localeCurrency).currency);
      window.__lastTimeline = rec.data.results.timeline;
    }
    alert('Cenário carregado: ' + name);
  } else if (btn.classList.contains('btn-delete')) {
    if (!confirm('Excluir cenário "' + name + '"?')) return;
    const ok = deleteScenario(name);
    if (ok) {
      renderSavedList();
      alert('Excluído: ' + name);
    } else {
      alert('Erro ao excluir.');
    }
  }
}

function renderSavedList() {
  const container = document.getElementById('savedList');
  if (!container) return;
  container.innerHTML = '';
  const items = listScenarios();
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="small muted">Nenhum cenário salvo</div>';
    return;
  }
  items.forEach(item => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.padding = '6px 0';
    row.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600">${escapeHtml(item.name)}</div>
        <div class="small muted">${new Date(item.modifiedAt).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn ghost btn-load" data-name="${escapeHtml(item.name)}">Carregar</button>
        <button class="btn ghost btn-delete" data-name="${escapeHtml(item.name)}">Excluir</button>
      </div>
    `;
    container.appendChild(row);
  });
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Initialize immediately (module is deferred by default, so DOM is ready)
console.log('Initializing Simulator...');

const btnCalc = $('btnCalculate');
if (btnCalc) {
  btnCalc.addEventListener('click', handleCalculate);
  console.log('Calculate button listener added.');
} else {
  console.error('Calculate button not found!');
}

const btnExport = $('btnExportCsv');
if (btnExport) btnExport.addEventListener('click', handleExport);

const btnReset = $('btnReset');
if (btnReset) btnReset.addEventListener('click', handleReset);

const btnSave = $('btnSaveScenario');
if (btnSave) btnSave.addEventListener('click', handleSaveScenario);

const savedList = $('savedList');
if (savedList) savedList.addEventListener('click', handleSavedListClick);

// Initial render of saved scenarios
renderSavedList();

// Atualiza lista ao alterar storage (evento disparado pelo storage.js)
document.addEventListener('jurosim:storage:changed', () => renderSavedList());
