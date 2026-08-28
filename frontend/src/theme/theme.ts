import { createTheme } from "@mui/material/styles";

// Identidade visual "People Hub" — paleta verde sobre fundo creme claro.
// Sidebar em tom verde escuro (em vez do bordô da v3), acento em verde-sálvia
// suave, tipografia com toque serifado nos títulos para um ar mais "HR OS" premium.
export const theme = createTheme({
  palette: {
    primary: { main: "#4C9773", light: "#7CBE9C", dark: "#4C9773", contrastText: "#fff" },
    secondary: { main: "#9BCBAE", light: "#CFE6D9", dark: "#6FA687", contrastText: "#2E6B4F" },
    background: { default: "#F7FAF6", paper: "#ffffff" },
    text: { primary: "#24302A", secondary: "#6E7D74" },
    divider: "#DCE6DE",
    error: { main: "#C14A4A" },
    success: { main: "#2E7D4F" },
    warning: { main: "#B8863A" },
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
    "0 1px 2px rgba(30,70,50,.06)",
    "0 2px 6px rgba(30,70,50,.07)",
    "0 4px 10px rgba(30,70,50,.08)",
    "0 6px 16px rgba(30,70,50,.09)",
    "0 8px 20px rgba(30,70,50,.1)",
    "0 10px 24px rgba(30,70,50,.11)",
    ...Array(18).fill("0 20px 44px rgba(30,70,50,.16)"),
  ] as unknown as import("@mui/material/styles").Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { scrollbarColor: "#DCE6DE transparent" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #DCE6DE", boxShadow: "0 1px 2px rgba(30,70,50,.05)", borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 650, borderRadius: 10, paddingInline: 16 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: "#DCE6DE" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#EAF0EB" } } },
  },
});
