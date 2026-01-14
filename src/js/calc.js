
// Wrapper for Decimal to ensure we always use it
const D = (val) => new Decimal(val);

/**
 * Converts a nominal annual rate to a rate per period.
 * @param {number|Decimal} annualRatePercent - Nominal annual rate in percent (e.g., 12 for 12%)
 * @param {string} compounding - 'anual', 'semestral', 'trimestral', 'mensal', 'diaria', 'continua'
 * @param {string} periodUnit - 'anos', 'meses' (used to determine the target period for the schedule)
 * @returns {Decimal}
 */
export function getRatePerPeriod(annualRatePercent, compounding, periodUnit) {
  const r = D(annualRatePercent).div(100);

  if (compounding === 'continua') {
    return r;
  }

  let m = 1;
  switch (compounding) {
    case 'anual': m = 1; break;
    case 'semestral': m = 2; break;
    case 'trimestral': m = 4; break;
    case 'mensal': m = 12; break;
    case 'diaria': m = 365; break; // simplistic
    default: m = 1;
  }

  // Rate per compounding period
  const i_m = r.div(m);

  let stepsPerYear = 1;
  if (periodUnit === 'meses') stepsPerYear = 12;
  if (periodUnit === 'anos') stepsPerYear = 1;


  const base = i_m.plus(1);
  const exponent = D(m).div(stepsPerYear);

  return base.pow(exponent).minus(1);
}

/**
 * Generates the amortization/projection schedule.
 * @param {Object} params
 */
export function generateTimeline({
  capital,
  taxaAnual,
  periodos,
  periodUnit, // 'anos', 'meses'
  compounding, // 'anual', 'mensal', 'diaria', 'continua'
  aporteValor,
  aporteFrequencia, // 'mensal', 'anual'
  aporteTiming, // 'inicio', 'fim'
  inflation,
  startDateStr
}) {
  let saldo = D(capital);
  const timeline = [];


  let stepUnit = 'anos'; // default
  if (periodUnit === 'meses' || compounding === 'mensal' || aporteFrequencia === 'mensal') {
      stepUnit = 'meses';
  }

  let totalSteps = 0;
  if (periodUnit === 'anos') {
      totalSteps = parseInt(periodos) * (stepUnit === 'meses' ? 12 : 1);
  } else {
      totalSteps = parseInt(periodos);
  }


  let ratePerStep = D(0);
  if (compounding === 'continua') {
      let t_step = stepUnit === 'meses' ? 1/12 : 1;
      ratePerStep = Decimal.exp(D(taxaAnual).div(100).times(t_step)).minus(1);
  } else {
      let m = 1;
      if (compounding === 'anual') m = 1;
      else if (compounding === 'semestral') m = 2;
      else if (compounding === 'trimestral') m = 4;
      else if (compounding === 'mensal') m = 12;
      else if (compounding === 'diaria') m = 365;

      const r_nom = D(taxaAnual).div(100);
      const i_m = r_nom.div(m);

      let stepsPerYear = stepUnit === 'meses' ? 12 : 1;

      const base = i_m.plus(1);
      const exponent = D(m).div(stepsPerYear);
      ratePerStep = base.pow(exponent).minus(1);
  }

  // 4. Inflation per Step
  let inflationPerStep = D(0);
  if (inflation) {
    const infAnnual = D(inflation).div(100);
    let stepsPerYear = stepUnit === 'meses' ? 12 : 1;
    inflationPerStep = infAnnual.plus(1).pow(D(1).div(stepsPerYear)).minus(1);
  }
  let currentDate = startDateStr ? new Date(startDateStr) : new Date();

  timeline.push({
    period: 0,
    date: new Date(currentDate),
    initial: saldo.toNumber(),
    interest: 0,
    contribution: 0,
    final: saldo.toNumber(),
    totalInterest: 0,
    realValue: saldo.toNumber(),
    realValueAdjusted: saldo.toNumber() // Just to be safe
  });

  let totalInterest = D(0);
  let accumulatedInflationFactor = D(1);

  for (let step = 1; step <= totalSteps; step++) {
    const saldoInicial = saldo;
    let interest = D(0);
    let contribution = D(0);

    // Determine if contribution happens this step
    let isContributionStep = false;
    if (aporteValor > 0) {
        if (aporteFrequencia === 'mensal') {
            // If step is month, yes. If step is year, yes (aggregated? No, we switched to monthly steps).
            // Since we switched to monthly steps if freq is monthly, this is simple.
            isContributionStep = true;
        } else if (aporteFrequencia === 'anual') {
            // If step is month, only on month 12, 24...
            if (stepUnit === 'meses') {
                if (step % 12 === 0) isContributionStep = true;
            } else {
                // Step is year
                isContributionStep = true;
            }
        }
    }

    let contribAmount = isContributionStep ? D(aporteValor) : D(0);

    // Timing
    if (isContributionStep && aporteTiming === 'inicio') {
        saldo = saldo.plus(contribAmount);
        contribution = contribAmount;
    }

    // Interest
    interest = saldo.times(ratePerStep);
    saldo = saldo.plus(interest);

    // Timing End
    if (isContributionStep && aporteTiming === 'fim') {
        saldo = saldo.plus(contribAmount);
        contribution = contribAmount; // If both start and end? No, radio button.
    }

    totalInterest = totalInterest.plus(interest);

    // Inflation
    accumulatedInflationFactor = accumulatedInflationFactor.times(inflationPerStep.plus(1));
    const realValue = saldo.div(accumulatedInflationFactor);

    // Date
    if (stepUnit === 'meses') currentDate.setMonth(currentDate.getMonth() + 1);
    else currentDate.setFullYear(currentDate.getFullYear() + 1);

    timeline.push({
      period: step, // This is step number, might be months.
      stepUnit: stepUnit, // To know if it's month or year
      date: new Date(currentDate),
      initial: saldoInicial.toNumber(),
      interest: interest.toNumber(),
      contribution: contribution.toNumber(),
      final: saldo.toNumber(),
      totalInterest: totalInterest.toNumber(),
      realValue: realValue.toNumber()
    });
  }

  const montante = saldo;
  const montanteReal = timeline.length > 0 ? timeline[timeline.length - 1].realValue : montante.toNumber();

  // Real Rate
  let taxaReal = null;
  if (inflation) {
      const nom = D(taxaAnual).div(100);
      const inf = D(inflation).div(100);
      taxaReal = nom.plus(1).div(inf.plus(1)).minus(1).toNumber();
  }

  return {
    timeline,
    montante: montante.toNumber(),
    montanteReal,
    taxaReal,
    totalInterest: totalInterest.toNumber(),
    periodsTotal: totalSteps
  };
}
