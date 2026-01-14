
import { generateTimeline } from './calc.js';

console.log('--- DEBUG FIX START ---');

const resFix = generateTimeline({
    capital: 10000,
    taxaAnual: 12,
    periodos: 10,
    periodUnit: 'anos',
    compounding: 'anual',
    aporteValor: 500,
    aporteFrequencia: 'mensal',
    aporteTiming: 'fim'
});

console.log('Fixed Logic Result:', resFix.montante.toFixed(2));
console.log('Expected: ~142023.50');

console.log('--- DEBUG FIX END ---');
