import { createTheme } from "@mui/material/styles";

// Identidade visual "People Hub" — paleta bordô/rosa sobre fundo creme,
// aproximando-se da referência de design (Figma Make). Sidebar em tom
// bordô escuro (em vez do grafite neutro da v2), acento em rosa suave,
// tipografia com toque serifado nos títulos para um ar mais "HR OS" premium.
export const theme = createTheme({
  palette: {
    primary: { main: "#7D3A52", light: "#A5607A", dark: "#5A2A3C", contrastText: "#fff" },
    secondary: { main: "#C4849A", light: "#E8B4C4", dark: "#8C4A62", contrastText: "#5A2A3C" },
    background: { default: "#FAF8F5", paper: "#ffffff" },
    text: { primary: "#2D2425", secondary: "#8C7570" },
    divider: "#E5DDD5",
    error: { main: "#C14A4A" },
    success: { main: "#5A8A6A" },
    warning: { main: "#C4843A" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.7rem", fontFamily: "'Georgia', 'Iowan Old Style', serif" },
    h5: { fontWeight: 700, fontFamily: "'Georgia', 'Iowan Old Style', serif" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { textTransform: "none" },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(93,42,60,.06)",
    "0 2px 6px rgba(93,42,60,.07)",
    "0 4px 10px rgba(93,42,60,.08)",
    "0 6px 16px rgba(93,42,60,.09)",
    "0 8px 20px rgba(93,42,60,.1)",
    "0 10px 24px rgba(93,42,60,.11)",
    ...Array(18).fill("0 20px 44px rgba(93,42,60,.16)"),
  ] as unknown as import("@mui/material/styles").Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { scrollbarColor: "#E5DDD5 transparent" } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid #E5DDD5", boxShadow: "0 1px 2px rgba(93,42,60,.05)", borderRadius: 16 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 650, borderRadius: 10, paddingInline: 16 },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: "#E5DDD5" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#F0EBE5" } } },
  },
});
