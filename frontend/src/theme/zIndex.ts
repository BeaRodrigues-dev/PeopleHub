// Escala de z-index centralizada. El header fijo de la app usa `header`; todo
// painel/drawer/modal criado com o componente SidePanel/Modal fica sempre
// acima dele, garantido pelo Portal + estes valores (em vez de depender da
// ordem de montagem no DOM, que era a causa do bug do drawer "atrás do header").
export const zIndex = {
  header: 1100,
  sidebar: 1000,
  sidePanelBackdrop: 1300,
  sidePanel: 1301,
  modalBackdrop: 1400,
  modal: 1401,
  toast: 1500,
} as const;
