import { generateTimeline } from './calc.js';

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

$('btnCalculate').addEventListener('click', () => {
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
  plotChart(res.timeline);
  $('status').textContent = 'Calculado';
  window.__lastTimeline = res.timeline;
});

$('btnExportCsv').addEventListener('click', () => {
  const timeline = window.__lastTimeline || [];
  if (!timeline || timeline.length === 0) return alert('Sem dados para exportar.');
  downloadCSV(timeline);
});

$('btnReset').addEventListener('click', () => {
  if (!confirm('Redefinir todos os campos para padrão?')) return;
  $('capital').value = 10000; $('rate').value = 6; $('period').value = 10; $('periodUnit').value='anos';
  $('compounding').value='anual'; $('contribution').value=200; $('inflation').value=3;
  document.querySelector('#amortTable tbody').innerHTML = '<tr><td colspan="5" class="muted empty-cell">Sem dados — calcule acima</td></tr>';
  $('finalAmount').textContent = 'R$ 0,00'; $('status').textContent = 'Pronto';
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  window.__lastTimeline = [];
});

