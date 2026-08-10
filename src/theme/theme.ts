import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  palette: {
    primary: { main: "#6957e9" },
    background: { default: "#f7f7fb", paper: "#fff" },
    text: { primary: "#27304a", secondary: "#707792" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    h4: { fontWeight: 750, letterSpacing: "-0.04em" },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(31,35,71,.06)",
          border: "1px solid #ececf4",
        },
      },
    },
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 650 } },
    },
  },
});
