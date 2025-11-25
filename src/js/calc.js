export function applyInterest(saldo, taxa){
  return saldo * (1 + taxa)
}

export function applyContribution(saldo, aporte){
  return saldo + aporte;
}

export function generateTimeLine(config){
  const {capital, taxa, periodos, aporteMensal = 0 } = config
  let saldo = capital;
  const timeLine = [];

  for(let p = 1; p <= periodos; p++){
    const inicial = saldo;
    const comJuros = applyInterest(inicial, taxa)
    const final = applyContribution(comJuros, aporteMensal)

    timeLine.push({
      periodo: p,
      inicial:inicial,
      interest: comJuros - inicial,
      contribution:aporteMensal,
      final: final
    });

    saldo = final;
  }
  return timeLine;
}

export function calcCompound(capital, taxa, periodo){
  return capital * Math.pow(1 + taxa, periodo)
}

console.log(calcCompound(1000, 0.02, 60))
