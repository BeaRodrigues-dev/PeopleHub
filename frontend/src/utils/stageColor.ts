const palette = ["#2E6B4F", "#7FAE8E", "#4A6FA5", "#B8863A", "#5D8F70", "#6B8FA5", "#4E8F6E"];

/** Cor determinística por posição de etapa (mesma etapa = mesma cor sempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
