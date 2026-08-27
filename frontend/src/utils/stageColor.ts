const palette = ["#4C9773", "#9BCBAE", "#4A6FA5", "#B8863A", "#5D8F70", "#6B8FA5", "#7CBE9C"];

/** Cor determinística por posição de etapa (mesma etapa = mesma cor sempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
