const palette = ["#6C5CE0", "#E4DFFB", "#5646C4", "#D6A65D", "#9B8FEA", "#6C5CE0", "#9B8FEA"];

/** Color determinístico por posición de etapa (misma etapa = mismo color siempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
