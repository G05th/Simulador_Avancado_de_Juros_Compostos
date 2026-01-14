
import { generateTimeline } from './calc.js';

console.log('--- DEBUG START ---');

// User Case:
// Capital: 10000
// Rate: 12% (Nominal Annual)
// Period: 10 Years
// Compounding: Annual (default)
// Contribution: 500 (default)
// Freq: Monthly (default)
// Timing: End (default)

// Current Logic (Annual Steps)
const resCurrent = generateTimeline({
    capital: 10000,
    taxaAnual: 12,
    periodos: 10,
    periodUnit: 'anos',
    compounding: 'anual',
    aporteValor: 500,
    aporteFrequencia: 'mensal',
    aporteTiming: 'fim'
});
console.log('Current Logic (Annual Steps):', resCurrent.montante.toFixed(2));

const resMonthlySteps = generateTimeline({
    capital: 10000,
    taxaAnual: 12,
    periodos: 120,
    periodUnit: 'meses',
    compounding: 'anual',
    aporteValor: 500,
    aporteFrequencia: 'mensal',
    aporteTiming: 'fim'
});
console.log('Monthly Steps (Annual Compounding):', resMonthlySteps.montante.toFixed(2));

const resMonthlyComp = generateTimeline({
    capital: 10000,
    taxaAnual: 12,
    periodos: 120,
    periodUnit: 'meses',
    compounding: 'mensal',
    aporteValor: 500,
    aporteFrequencia: 'mensal',
    aporteTiming: 'fim'
});
console.log('Monthly Steps (Monthly Compounding):', resMonthlyComp.montante.toFixed(2));

console.log('--- DEBUG END ---');
