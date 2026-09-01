import { createTheme } from "@mui/material/styles";

// Identidade visual "People Hub" — paleta pastel azul/lavanda sobre fundo
// claro. Sidebar en tono azul marino oscuro, acentos en lavanda suave,
// tipografía con toque serifado en los títulos para un aire "HR OS" premium.
export const theme = createTheme({
  palette: {
    primary: { main: "#7C93D6", light: "#A9BBE8", dark: "#5C74B8", contrastText: "#fff" },
    secondary: { main: "#B8A9E3", light: "#D6D3F0", dark: "#9285C4", contrastText: "#4E5FA6" },
    background: { default: "#F6F7FC", paper: "#ffffff" },
    text: { primary: "#2E3148", secondary: "#6B6F8C" },
    divider: "#E2E4F1",
    error: { main: "#C4677E" },
    success: { main: "#4C9B7C" },
    warning: { main: "#C99A52" },
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
    "0 1px 2px rgba(45,50,110,.06)",
    "0 2px 6px rgba(45,50,110,.07)",
    "0 4px 10px rgba(45,50,110,.08)",
    "0 6px 16px rgba(45,50,110,.09)",
    "0 8px 20px rgba(45,50,110,.1)",
    "0 10px 24px rgba(45,50,110,.11)",
    ...Array(18).fill("0 20px 44px rgba(45,50,110,.16)"),
  ] as unknown as import("@mui/material/styles").Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { scrollbarColor: "#E2E4F1 transparent" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #E2E4F1", boxShadow: "0 1px 2px rgba(45,50,110,.05)", borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 650, borderRadius: 10, paddingInline: 16 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: "#E2E4F1" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#ECECF5" } } },
  },
});
