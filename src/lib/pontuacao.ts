// Arredondamento padrão para 2 casas decimais (mesmo padrão do Cartola FC)
// Exemplo: 76.3798828125 → 76.38
// Exemplo: 82.895 → 82.90
// Exemplo: 54.760009765625 → 54.76
export function arredondar2Decimais(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Formata o valor arredondado como string com 2 casas decimais
export function formatarPontuacao(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "0.00";
  return arredondar2Decimais(valor).toFixed(2);
}

// Alias mantido para compatibilidade
export const truncar2Decimais = arredondar2Decimais;
