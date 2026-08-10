import { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { NavLink } from "react-router-dom";
const drawerWidth = 244;
const nav = (
  <List sx={{ px: 1.5, pt: 2 }}>
    <ListItemButton
      component={NavLink}
      to="/candidates"
      sx={{
        borderRadius: 2,
        mb: 0.5,
        "&.active": { bgcolor: "#eeeaff", color: "primary.main" },
      }}
    >
      <ListItemIcon sx={{ minWidth: 38 }}>
        <PeopleAltRoundedIcon color="primary" />
      </ListItemIcon>
      <ListItemText
        primary="Candidatos"
        primaryTypographyProps={{ fontWeight: 700 }}
      />
    </ListItemButton>
    <ListItemButton sx={{ borderRadius: 2, mb: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 38 }}>
        <DashboardRoundedIcon />
      </ListItemIcon>
      <ListItemText primary="Visão geral" />
    </ListItemButton>
    <ListItemButton sx={{ borderRadius: 2 }}>
      <ListItemIcon sx={{ minWidth: 38 }}>
        <SettingsRoundedIcon />
      </ListItemIcon>
      <ListItemText primary="Configurações" />
    </ListItemButton>
  </List>
);
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = (
    <>
      <Box sx={{ height: 68, display: "flex", alignItems: "center", px: 3 }}>
        <Box
          sx={{
            width: 29,
            height: 29,
            bgcolor: "primary.main",
            borderRadius: 1.2,
            mr: 1.25,
          }}
        />
        <Typography fontWeight={800} fontSize={19}>
          talentflow
        </Typography>
      </Box>
      {nav}
    </>
  );
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          borderBottom: "1px solid #ebebf2",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, mr: 1 }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1.5 }}>
            Equipe de People
          </Typography>
          <Avatar sx={{ width: 34, height: 34, bgcolor: "#f19a6d" }}>MP</Avatar>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #ebebf2",
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { md: "none" } }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flex: 1, pt: "68px", minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}
