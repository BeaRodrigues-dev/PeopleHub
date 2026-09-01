const palette = ["#7FB396", "#B7DCC0", "#5F9678", "#C29A55", "#6FA985", "#8B7FBF", "#ADD1BB"];

/** Color determinístico por posición de etapa (misma etapa = mismo color siempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
