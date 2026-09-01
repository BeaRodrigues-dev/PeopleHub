import { createTheme } from "@mui/material/styles";

// Identidade visual "People Hub" — paleta pastel verde-salvia, toda clara y
// "calma": sin bloques oscuros, sidebar en verde pastel muy suave, acentos
// en menta claro, tipografía con toque serifado en los títulos.
export const theme = createTheme({
  palette: {
    primary: { main: "#7FB396", light: "#ADD1BB", dark: "#5F9678", contrastText: "#fff" },
    secondary: { main: "#B7DCC0", light: "#D9EEDE", dark: "#93C2A2", contrastText: "#3D6A52" },
    background: { default: "#F6FAF7", paper: "#ffffff" },
    text: { primary: "#33423A", secondary: "#6C8177" },
    divider: "#DCEBE1",
    error: { main: "#C48A94" },
    success: { main: "#5F9678" },
    warning: { main: "#C29A55" },
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
    "0 1px 2px rgba(50,90,70,.06)",
    "0 2px 6px rgba(50,90,70,.07)",
    "0 4px 10px rgba(50,90,70,.08)",
    "0 6px 16px rgba(50,90,70,.09)",
    "0 8px 20px rgba(50,90,70,.1)",
    "0 10px 24px rgba(50,90,70,.11)",
    ...Array(18).fill("0 20px 44px rgba(50,90,70,.16)"),
  ] as unknown as import("@mui/material/styles").Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { scrollbarColor: "#DCEBE1 transparent" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #DCEBE1", boxShadow: "0 1px 2px rgba(50,90,70,.05)", borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 650, borderRadius: 10, paddingInline: 16 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: "#DCEBE1" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#E4EFE8" } } },
  },
});
