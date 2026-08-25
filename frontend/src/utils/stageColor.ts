const palette = ["#7D3A52", "#C4849A", "#4A6FA5", "#C4843A", "#5A8A6A", "#8A5DA5", "#A5607A"];

/** Cor determinística por posição de etapa (mesma etapa = mesma cor sempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
