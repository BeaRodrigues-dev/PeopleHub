const palette = ["#7C93D6", "#B8A9E3", "#5C74B8", "#C99A52", "#6F86C9", "#7C8FC4", "#A9BBE8"];

/** Color determinístico por posición de etapa (misma etapa = mismo color siempre). */
export function stageColor(order: number): string {
  return palette[order % palette.length];
}
