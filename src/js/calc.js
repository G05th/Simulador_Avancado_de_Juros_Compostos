export function applyInterest(saldo, taxaPeriodoDecimal){
  return saldo * (1 + taxaPeriodoDecimal);
}

export function applyContribution(saldo, aporte){
  return saldo + aporte;
}

export function derivePeriodRate(taxaAnualPercent, compounding, periodUnit){
  const anualDecimal = taxaAnualPercent / 100;
  if (compounding === 'mensal'){
    return { taxaPeriodoDecimal: Math.pow(1 + anualDecimal, 1/12) - 1, periodsMultiplier: 12 };
  }
  return { taxaPeriodoDecimal: anualDecimal, periodsMultiplier: 1 };
}

export function generateTimeline({ capital, taxaAnual, periodos, periodUnit = 'anos', compounding = 'anual', aporte = 0, inflation = null }){
  const { taxaPeriodoDecimal, periodsMultiplier } = derivePeriodRate(taxaAnual, compounding, periodUnit);

  const totalPeriods = periodUnit === 'anos' ? periodos * periodsMultiplier : periodos;

  let saldo = capital;
  const timeline = [];

  for (let p = 1; p <= totalPeriods; p++){
    const inicial = saldo;
    const comJuros = applyInterest(inicial, taxaPeriodoDecimal);

    // Aporte is always monthly. If period is years, we assume 12 contributions in that period.
    // If period is months, we assume 1 contribution per period.
    const contributionForPeriod = periodUnit === 'anos' ? aporte * 12 : aporte;

    const final = applyContribution(comJuros, contributionForPeriod);

    timeline.push({
      period: p,
      initial: Number(inicial),
      interest: Number((comJuros - inicial)),
      contribution: Number(contributionForPeriod),
      final: Number(final)
    });

    saldo = final;
  }

  const montante = saldo;

  let taxaReal = null;
  if (inflation !== null && inflation !== undefined){
    const iNominal = taxaAnual / 100;
    const iInflation = inflation / 100;
    taxaReal = (1 + iNominal) / (1 + iInflation) - 1;
  }

  return { timeline, montante, taxaReal, periodsTotal: totalPeriods };
}

export function calcCompound(capital, taxaPeriodoDecimal, totalPeriods){
  return capital * Math.pow(1 + taxaPeriodoDecimal, totalPeriods);
}
