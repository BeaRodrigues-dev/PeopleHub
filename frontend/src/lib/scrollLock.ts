/**
 * Bloqueo de scroll del body con conteo de referencias.
 *
 * Modal y SidePanel pueden abrirse simultáneamente (p. ej. un drawer de
 * detalle abierto y, sobre él, un modal de edición). Si cada componente
 * guarda y restaura `document.body.style.overflow` de forma independiente,
 * cerrar uno antes que el otro puede sobrescribir el valor original con
 * "hidden" y dejar el scroll bloqueado para siempre. Un contador global
 * evita esa condición de carrera: el overflow solo se restaura cuando ya
 * no queda ningún modal/panel abierto.
 */
let lockCount = 0;
let originalOverflow = "";

export function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = originalOverflow;
    }
  };
}
