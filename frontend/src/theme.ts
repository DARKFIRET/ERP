import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue header
    },
    background: {
      default: '#f4f6f8', // Light grey background
    },
    success: {
      main: '#4caf50', // Free (Green)
      contrastText: '#fff',
    },
    error: {
      main: '#f44336', // Occupied (Red)
      contrastText: '#fff',
    },
    warning: {
      main: '#ff9800', // Reserved (Orange)
      contrastText: '#fff',
    },
    info: {
      main: '#9e9e9e', // Dirty (Grey)
      contrastText: '#fff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
      color: '#212121',
    },
    h6: {
      fontWeight: 500,
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1565c0', // Darker blue for header
          boxShadow: 'none',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff', // White sidebar
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        }
      }
    }
  },
});
