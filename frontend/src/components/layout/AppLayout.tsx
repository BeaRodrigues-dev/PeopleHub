import { useState, type ReactNode } from "react";
import { AppBar, Avatar, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { NavLink, useNavigate } from "react-router-dom";
import { zIndex } from "../../theme/zIndex";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../features/auth/authStore";

const drawerWidth = 248;
const SIDEBAR_BG = "#0F241A";
const SIDEBAR_BORDER = "#1E3A2B";

const navItems = [
  { to: "/", label: "Home", icon: <HomeRoundedIcon fontSize="small" />, end: true },
  { to: "/vagas", label: "Recruitment", icon: <WorkOutlineRoundedIcon fontSize="small" /> },
  { to: "/banco-de-talentos", label: "Talent Pool", icon: <TravelExploreRoundedIcon fontSize="small" /> },
  { to: "/pessoas", label: "People", icon: <PeopleAltRoundedIcon fontSize="small" /> },
  { to: "/onboarding", label: "Onboarding", icon: <RocketLaunchRoundedIcon fontSize="small" /> },
  { to: "/analytics", label: "Analytics", icon: <InsightsRoundedIcon fontSize="small" /> },
  { to: "/consultoria", label: "Consulting", icon: <BusinessCenterRoundedIcon fontSize="small" /> },
  { to: "/insights", label: "Insights", icon: <LightbulbRoundedIcon fontSize="small" /> },
  { to: "/relatorio-semanal", label: "Weekly Report", icon: <SummarizeRoundedIcon fontSize="small" /> },
  { to: "/documentos", label: "Documentos", icon: <LibraryBooksRoundedIcon fontSize="small" /> },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <List sx={{ px: 1.5, pt: 1, display: "flex", flexDirection: "column", gap: 0.25 }}>
      {navItems.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          sx={{
            borderRadius: 2.5,
            py: 1,
            color: "rgba(255,255,255,.65)",
            "&.active": { bgcolor: "primary.main", color: "#fff", "& .MuiListItemIcon-root": { color: "#fff" } },
            "&:not(.active):hover": { bgcolor: "rgba(255,255,255,.07)", color: "#fff" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 700, fontSize: 13.5 } }} />
        </ListItemButton>
      ))}
    </List>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const openAddCandidate = useUIStore((s) => s.openAddCandidate);
  const logout = useAuthStore((s) => s.logout);

  const brand = (
    <Box sx={{ height: 66, display: "flex", alignItems: "center", px: 2.75, gap: 1.1 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "8px",
          background: "linear-gradient(135deg, #2E6B4F, #7FAE8E)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        P
      </Box>
      <Box sx={{ overflow: "hidden" }}>
        <Typography fontWeight={800} fontSize={15.5} letterSpacing="-0.01em" color="#fff" noWrap>People Hub</Typography>
        <Typography fontSize={11} color="rgba(255,255,255,.5)" noWrap>HR OS</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{ borderBottom: "1px solid", borderColor: "divider", zIndex: zIndex.header, bgcolor: "rgba(250,248,245,.86)", backdropFilter: "blur(10px)" }}
      >
        <Toolbar sx={{ minHeight: "66px !important", gap: 1 }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }}>
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="text"
            startIcon={<PersonAddAltRoundedIcon fontSize="small" />}
            onClick={() => openAddCandidate(null)}
            sx={{ display: { xs: "none", sm: "inline-flex" }, color: "text.secondary" }}
          >
            Adicionar candidato
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => navigate("/criar-vaga")} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            Criar vaga
          </Button>
          <IconButton onClick={() => navigate("/criar-vaga")} size="small" sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" }, display: { xs: "inline-flex", sm: "none" } }}>
            <AddRoundedIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.light", color: "primary.dark", fontSize: 13, fontWeight: 700, ml: 0.5 }}>BR</Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: SIDEBAR_BG, borderRight: "1px solid", borderColor: SIDEBAR_BORDER },
        }}
      >
        {brand}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Nav />
        </Box>
        <Box sx={{ borderTop: "1px solid", borderColor: SIDEBAR_BORDER, p: 2, display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            onClick={() => navigate("/configuracoes")}
            sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0, cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5, "&:hover": { bgcolor: "rgba(255,255,255,.06)" } }}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: "secondary.light", color: "primary.dark", fontSize: 12.5, fontWeight: 700 }}>BR</Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography fontSize={12.5} fontWeight={700} color="#fff" noWrap>Beatriz Rodrigues</Typography>
              <Typography fontSize={11} color="rgba(255,255,255,.5)" noWrap>HR Manager</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => navigate("/configuracoes")} size="small" title="Configurações" sx={{ color: "rgba(255,255,255,.55)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,.07)" } }}>
            <SettingsRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={logout} size="small" title="Sair" sx={{ color: "rgba(255,255,255,.55)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,.07)" } }}>
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Drawer>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { bgcolor: SIDEBAR_BG } }}>
        <Box sx={{ width: drawerWidth }}>
          {brand}
          <Nav onNavigate={() => setMobileOpen(false)} />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, pt: "66px", minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
