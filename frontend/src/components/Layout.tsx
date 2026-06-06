import React, { useState, useMemo } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
  ListItemButton,
  Button,
  Avatar,
  useTheme,
  Stack,
} from "@mui/material";
import {
  Menu as MenuIcon,
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  UserCog,
  LogOut,
  ChevronRight,
  BarChart2,
  Package,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { roleTranslations } from "../utils/constants";
import { useThemeSettings } from "../contexts/ThemeSettingsContext";

const drawerWidth = 260;

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout, username } = useAuth();
  const theme = useTheme();
  const { settings } = useThemeSettings();

  const appInitials = settings.appName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'E';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      text: "Бронирование",
      icon: <LayoutDashboard size={22} />,
      path: "/admin",
      roles: ["admin", "manager"],
    },
    {
      text: "Официант",
      icon: <UtensilsCrossed size={22} />,
      path: "/waiter",
      roles: ["waiter", "manager"],
    },
    {
      text: "Кухня",
      icon: <ChefHat size={22} />,
      path: "/kitchen",
      roles: ["cook", "manager"],
    },
    {
      text: "Управление",
      icon: <UserCog size={22} />,
      path: "/management",
      roles: ["manager"],
    },
    {
      text: "Статистика",
      icon: <BarChart2 size={22} />,
      path: "/management/statistics",
      roles: ["manager"],
    },
    {
      text: "Склад",
      icon: <Package size={22} />,
      path: "/management/inventory",
      roles: ["manager"],
    },
    {
      text: "Настройки",
      icon: <Settings size={22} />,
      path: "/management/settings",
      roles: ["manager"],
    },
  ];

  const filteredMenuItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(role || "")),
    [role]
  );

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar
        sx={{
          px: 3,
          py: 2,
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={settings.iconDataUrl ?? undefined}
          sx={{
            bgcolor: "primary.main",
            width: 40,
            height: 40,
            fontWeight: "bold",
            fontSize: "0.7rem",
          }}
        >
          {!settings.iconDataUrl && appInitials}
        </Avatar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 800,
            color: "text.primary",
            letterSpacing: "-0.5px",
          }}
        >
          {settings.appName}
        </Typography>
      </Toolbar>

      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ pl: 2, fontWeight: 600, letterSpacing: "1px" }}
        >
          МЕНЮ
        </Typography>
      </Box>

      <List sx={{ px: 2, flex: 1 }}>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? "inherit" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: isSelected ? 600 : 500,
                  }}
                />
                {isSelected && <ChevronRight size={18} opacity={0.8} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2, px: 1 }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "secondary.main",
              fontSize: "1rem",
            }}
          >
            {username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {username}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ textTransform: "capitalize" }}
            >
              {roleTranslations[role || ""] || role}
            </Typography>
          </Box>
        </Stack>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogOut size={18} />}
          onClick={() => {
            logout();
            navigate("/login");
          }}
          sx={{
            borderRadius: 2,
            py: 1,
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
            },
          }}
        >
          Выйти
        </Button>
      </Box>
    </Box>
  );

  const isWaiterInterface = location.pathname.startsWith("/waiter");

  // Find the current page title based on the path
  const currentPage = menuItems.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const pageTitle = currentPage ? currentPage.text : "Управление залом";

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xl: `calc(100% - ${drawerWidth}px)` },
          ml: { xl: `${drawerWidth}px` },
          bgcolor: "background.default",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xl: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}
            >
              {pageTitle}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { xl: drawerWidth }, flexShrink: { xl: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", xl: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "none",
              boxShadow: theme.shadows[4],
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", xl: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isWaiterInterface ? 0 : { xs: 2, sm: 3, md: 4 }, // Responsive padding
          width: { xl: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "background.default",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar sx={{ minHeight: 72 }} />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
