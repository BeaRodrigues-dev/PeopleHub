import { createTheme } from "@mui/material/styles";

// Identidade visual "People Hub" — estilo SaaS moderno en índigo/violeta:
// sidebar blanca con ítem activo en píldora, cards blancas con badges de
// ícono a color y mini-gráficos, botones redondeados tipo píldora.
export const theme = createTheme({
  palette: {
    primary: { main: "#6C5CE0", light: "#9B8FEA", dark: "#5646C4", contrastText: "#fff" },
    secondary: { main: "#E4DFFB", light: "#F1EEFD", dark: "#C7BBF5", contrastText: "#4B3F99" },
    background: { default: "#F7F7FB", paper: "#ffffff" },
    text: { primary: "#1F2130", secondary: "#6B7086" },
    divider: "#E7E7F0",
    error: { main: "#D2778A" },
    success: { main: "#3FAE82" },
    warning: { main: "#D6A65D" },
  },
  shape: { borderRadius: 14 },
  // Los menús/selects/tooltips nativos de MUI (Popover) usan zIndex.modal por
  // defecto (1300), que queda por debajo de nuestro Modal/SidePanel custom
  // (ver theme/zIndex.ts, hasta 1401). Eso hacía que el dropdown de un
  // <Select> abierto dentro de un modal se renderizara detrás del backdrop
  // del modal (con blur), pareciendo "roto" y bloqueando los clics. Se sube
  // por encima de toda la escala custom para que siempre quede arriba.
  zIndex: { mobileStepper: 1000, appBar: 1100, drawer: 1200, modal: 1450, snackbar: 1460, tooltip: 1470 },
  typography: {
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.7rem", fontFamily: "'Georgia', 'Iowan Old Style', serif" },
    h5: { fontWeight: 700, fontFamily: "'Georgia', 'Iowan Old Style', serif" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { textTransform: "none" },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(60,50,120,.06)",
    "0 2px 6px rgba(60,50,120,.07)",
    "0 4px 10px rgba(60,50,120,.08)",
    "0 6px 16px rgba(60,50,120,.09)",
    "0 8px 20px rgba(60,50,120,.1)",
    "0 10px 24px rgba(60,50,120,.11)",
    ...Array(18).fill("0 20px 44px rgba(60,50,120,.16)"),
  ] as unknown as import("@mui/material/styles").Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { scrollbarColor: "#E7E7F0 transparent" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #E7E7F0", boxShadow: "0 1px 2px rgba(60,50,120,.05)", borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 650, borderRadius: 999, paddingInline: 18 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: "#E7E7F0" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 999 } } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#E7E7F0" } } },
  },
});
