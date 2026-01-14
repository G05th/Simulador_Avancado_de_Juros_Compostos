import { generateTimeline } from './calc.js';
import { listScenarios, loadScenario, saveScenario } from './storage.js';

console.log('main.js loaded');

// --- UTILS ---
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

function fmtDate(dateObj, locale='pt-BR'){
    if(!dateObj) return '-';
    return new Intl.DateTimeFormat(locale).format(dateObj);
}

// --- TABS LOGIC ---
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked
            tab.classList.add('active');

            // Hide all contents
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            // Show target
            const targetId = tab.dataset.tab;
            document.getElementById(targetId).classList.remove('hidden');
        });
    });
}

// --- RENDERERS ---
function renderTable(timeline, locale, currency){
  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';

  if (!timeline || timeline.length === 0){
    tbody.innerHTML = '<tr><td colspan="7" class="text-center muted">Sem dados — calcule acima</td></tr>';
    return;
  }

  // Limit rows for performance if too large?
  // For now, render all.
  timeline.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.period}</td>
      <td>${fmtDate(row.date, locale)}</td>
      <td>${fmtCurrency(row.initial, locale, currency)}</td>
      <td>${fmtCurrency(row.interest, locale, currency)}</td>
      <td>${fmtCurrency(row.contribution, locale, currency)}</td>
      <td>${fmtCurrency(row.final, locale, currency)}</td>
      <td>${fmtCurrency(row.realValue, locale, currency)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateKPIs(res, locale, currency){
    $('finalAmount').textContent = fmtCurrency(res.montante, locale, currency);
    $('totalInterest').textContent = fmtCurrency(res.totalInterest, locale, currency);

    // Total Invested = Final - Interest
    const invested = res.montante - res.totalInterest;
    $('totalInvested').textContent = fmtCurrency(invested, locale, currency);

    // Real Value
    $('finalRealAmount').textContent = fmtCurrency(res.montanteReal, locale, currency);

    $('realRate').textContent = res.taxaReal !== null ? (res.taxaReal * 100).toFixed(2) + '%' : '—';
}

let chartInstance = null;
function renderChart(timeline){
    const ctx = document.getElementById('mainChart').getContext('2d');
    const labels = timeline.map(r => r.period);
    const dataBalance = timeline.map(r => r.final);
    const dataReal = timeline.map(r => r.realValue);
    const dataInvested = timeline.map(r => r.final - r.totalInterest); // Approx principal

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Saldo Nominal',
                    data: dataBalance,
                    borderColor: '#0ea5a4',
                    backgroundColor: 'rgba(14, 165, 164, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Saldo Real (Ajustado)',
                    data: dataReal,
                    borderColor: '#f59e0b', // Amber/Orange
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Principal Investido',
                    data: dataInvested,
                    borderColor: '#374151',
                    borderDash: [2, 2],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y); // Simplified currency for tooltip
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function logAudit(params, res) {
    const logDiv = document.getElementById('auditLog');
    const date = new Date().toLocaleString();
    const html = `
        <div class="log-entry" style="border-bottom:1px solid #eee; padding: 10px 0;">
            <strong>[${date}] Cálculo Realizado</strong><br>
            <small>
            Capital: ${params.capital} | Taxa: ${params.taxaAnual}% (${params.compounding}) | Prazo: ${params.periodos} ${params.periodUnit}<br>
            Aporte: ${params.aporteValor} (${params.aporteFrequencia}, ${params.aporteTiming})<br>
            Resultado FV: ${res.montante.toFixed(2)} | Juros Totais: ${res.totalInterest.toFixed(2)}
            </small>
        </div>
    `;
    logDiv.innerHTML = html + logDiv.innerHTML;
}

// --- HANDLERS ---

function handleCalculate() {
    try {
        const capital = toNumber($('capital').value);
        const taxaAnual = toNumber($('rate').value);
        const compounding = $('compounding').value;
        const periodos = toNumber($('period').value);
        const periodUnit = $('periodUnit').value;
        const startDateStr = $('startDate').value;

        const aporteValor = toNumber($('contribution').value);
        const aporteFrequencia = $('contributionFreq').value;
        const aporteTiming = document.querySelector('input[name="timing"]:checked').value;

        const inflation = toNumber($('inflation').value);
        const { locale, currency } = parseLocaleCurrency($('localeCurrency').value);

        const params = {
            capital, taxaAnual, periodos, periodUnit, compounding,
            aporteValor, aporteFrequencia, aporteTiming,
            inflation, startDateStr
        };

        const res = generateTimeline(params);

        renderTable(res.timeline, locale, currency);
        updateKPIs(res, locale, currency);
        renderChart(res.timeline);
        logAudit(params, res);

        window.__lastTimeline = res.timeline;
        window.__lastParams = params;
        window.__lastResults = res;

    } catch (e) {
        console.error(e);
        alert('Erro no cálculo: ' + e.message);
    }
}

function handleExportCsv() {
    const timeline = window.__lastTimeline;
    if(!timeline) return alert('Sem dados.');

    // Use XLSX lib for CSV to handle special chars better? Or simple string
    // Let's use simple string for CSV
    let csv = "Periodo,Data,SaldoInicial,Juros,Aporte,SaldoFinal\n";
    timeline.forEach(r => {
        csv += `${r.period},${r.date.toISOString().split('T')[0]},${r.initial.toFixed(2)},${r.interest.toFixed(2)},${r.contribution.toFixed(2)},${r.final.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'simulacao.csv';
    document.body.appendChild(a); a.click(); a.remove();
}

function handleExportPdf() {
    const timeline = window.__lastTimeline;
    if(!timeline) return alert('Sem dados.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Simulação", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

    const rows = timeline.map(r => [
        r.period,
        r.date.toISOString().split('T')[0],
        r.initial.toFixed(2),
        r.interest.toFixed(2),
        r.contribution.toFixed(2),
        r.final.toFixed(2)
    ]);

    doc.autoTable({
        head: [['#', 'Data', 'Inicial', 'Juros', 'Aporte', 'Final']],
        body: rows,
        startY: 30,
    });

    doc.save('relatorio_simulacao.pdf');
}

function handleReset() {
    if(!confirm('Limpar tudo?')) return;
    $('simForm').reset();
    // Reset defaults manually if needed or rely on form reset
    // Clear results
    $('finalAmount').textContent = '---';
    $('totalInvested').textContent = '---';
    $('totalInterest').textContent = '---';
    $('realRate').textContent = '---';
    if(chartInstance) { chartInstance.destroy(); chartInstance = null; }
    document.querySelector('#scheduleTable tbody').innerHTML = '<tr><td colspan="6" class="text-center muted">Clique em Calcular</td></tr>';
}

function handleSaveScenario() {
    const name = ($('saveName').value || '').trim();
    if(!name) return alert('Digite um nome.');

    if(!window.__lastParams) return alert('Calcule primeiro.');

    const data = {
        params: window.__lastParams,
        results: window.__lastResults
    };

    saveScenario(name, data, { overwrite: true }); // Simple overwrite for now
    renderSavedList();
    alert('Salvo!');
}

function renderSavedList() {
    const list = $('savedList');
    list.innerHTML = '';
    const scenarios = listScenarios();
    if(scenarios.length === 0) {
        list.innerHTML = '<div class="muted small">Nenhum salvo.</div>';
        return;
    }
    scenarios.forEach(s => {
        const div = document.createElement('div');
        div.className = 'saved-item';
        div.innerHTML = `
            <span>${s.name}</span>
            <button class="btn sm ghost btn-load" data-name="${s.name}">Carregar</button>
        `;
        list.appendChild(div);
    });

    // Attach listeners
    list.querySelectorAll('.btn-load').forEach(b => {
        b.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const rec = loadScenario(name);
            if(rec) {
                // Load params into form
                const p = rec.data.params;
                $('capital').value = p.capital;
                $('rate').value = p.taxaAnual;
                $('compounding').value = p.compounding;
                $('period').value = p.periodos;
                $('periodUnit').value = p.periodUnit;
                if(p.startDateStr) $('startDate').value = p.startDateStr;
                $('contribution').value = p.aporteValor;
                $('contributionFreq').value = p.aporteFrequencia;
                // Radio timing
                const radios = document.getElementsByName('timing');
                radios.forEach(r => { if(r.value === p.aporteTiming) r.checked = true; });

                $('inflation').value = p.inflation;

                // Trigger calc
                handleCalculate();
            }
        });
    });
}

// --- INIT ---
initTabs();
$('btnCalculate').addEventListener('click', handleCalculate);
$('btnReset').addEventListener('click', handleReset);
$('btnExportCsv').addEventListener('click', handleExportCsv);
$('btnExportPdf').addEventListener('click', handleExportPdf);
$('btnSaveScenario').addEventListener('click', handleSaveScenario);

renderSavedList();
