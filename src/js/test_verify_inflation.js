
import { generateTimeline } from './calc.js';

console.log('--- VERIFICATION START ---');

const tInf = generateTimeline({
    capital: 1000,
    taxaAnual: 10,
    periodos: 1,
    periodUnit: 'anos',
    compounding: 'anual',
    inflation: 5
});
console.log('Test Inflation (1000, 10% nom, 5% inf, 1y):');
console.log('  Nominal Expected 1100. Got:', tInf.montante);
console.log('  Real Value Expected ~1047.62. Got:', tInf.montanteReal.toFixed(2));
console.log('  Real Rate Expected ~4.76%. Got:', (tInf.taxaReal*100).toFixed(2) + '%');

console.log('--- VERIFICATION END ---');
