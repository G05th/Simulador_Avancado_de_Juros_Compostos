

import { generateTimeline } from './calc.js';

console.log('--- VERIFICATION START ---');

const t1 = generateTimeline({
    capital: 1000,
    taxaAnual: 10,
    periodos: 1,
    periodUnit: 'anos',
    compounding: 'anual'
});
console.log('Test 1 (1000, 10%, 1y): Expected 1100. Got:', t1.montante);

const t2 = generateTimeline({
    capital: 1000,
    taxaAnual: 12,
    periodos: 1,
    periodUnit: 'anos',
    compounding: 'mensal'
});
console.log('Test 2 (1000, 12% nom, 1y, monthly comp): Expected ~1126.83. Got:', t2.montante.toFixed(2));

const t3 = generateTimeline({
    capital: 0,
    taxaAnual: 0,
    periodos: 1,
    periodUnit: 'anos',
    compounding: 'anual',
    aporteValor: 100,
    aporteFrequencia: 'mensal',
    aporteTiming: 'fim'
});
console.log('Test 3 (0 cap, 100/mo, 1y, 0% int): Expected 1200. Got:', t3.montante);

console.log('--- VERIFICATION END ---');
