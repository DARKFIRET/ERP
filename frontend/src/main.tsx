import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { ThemeSettingsProvider, useThemeSettings } from './contexts/ThemeSettingsContext';
import './index.css';

function ThemedApp() {
  const { settings } = useThemeSettings();

  const theme = useMemo(() => createTheme({
    breakpoints: {
      values: { xs: 0, sm: 600, md: 1100, lg: 1200, xl: 1500 },
    },
    palette: {
      mode: settings.mode,
      primary: { main: settings.primaryColor },
      background: settings.mode === 'light'
        ? { default: '#f4f6f8' }
        : { default: '#0f1117', paper: '#1a1d27' },
      success: { main: '#4caf50', contrastText: '#fff' },
      error:   { main: '#f44336', contrastText: '#fff' },
      warning: { main: '#ff9800', contrastText: '#fff' },
      info:    { main: '#9e9e9e', contrastText: '#fff' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 4, fontWeight: 500 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 8 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&:hover': { backgroundColor: theme.palette.action.hover },
          }),
        },
      },
    },
  }), [settings.mode, settings.primaryColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeSettingsProvider>
      <ThemedApp />
    </ThemeSettingsProvider>
  </React.StrictMode>
);
