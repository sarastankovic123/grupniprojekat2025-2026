import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#556B2F',      // Dark olive green (brand color)
      dark: '#3D4B1F',      // Very dark olive
      light: '#6B8E23',     // Medium olive
      contrastText: '#fff',
    },
    secondary: {
      main: '#6B8E23',      // Medium olive for secondary actions
      dark: '#556B2F',
      light: '#D8E4C0',
      contrastText: '#1F2B14',
    },
    background: {
      default: '#F5F2ED',   // Cream background
      paper: '#FAFAF7',     // Warm white for cards
    },
    text: {
      primary: '#1F2B14',   // Very dark olive-gray
      secondary: '#4A5940', // Medium-dark olive-gray
      disabled: '#6B7566',  // Olive gray
    },
    error: {
      main: '#A84842',      // Muted red
      light: '#C45A54',
      dark: '#8C3A36',
    },
    warning: {
      main: '#C29863',      // Warm amber
      light: '#D4AA7B',
      dark: '#A17F4E',
    },
    success: {
      main: '#556B2F',      // Primary olive
      light: '#6B8E23',
      dark: '#3D4B1F',
    },
    info: {
      main: '#4A7575',      // Teal
      light: '#5F9191',
      dark: '#3A5C5C',
    },
    divider: '#C9C9C0',     // Soft gray
    action: {
      hover: 'rgba(85, 107, 47, 0.08)',
      selected: 'rgba(85, 107, 47, 0.12)',
      disabled: 'rgba(85, 107, 47, 0.26)',
      disabledBackground: 'rgba(85, 107, 47, 0.12)',
    },
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: '2rem',      // 32px
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',    // 24px
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',   // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',  // 18px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',      // 16px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',  // 14px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',  // 14px
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem', // 13px
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',   // 12px
      lineHeight: 1.5,
    },
  },

  spacing: 8, // 8px base unit

  shape: {
    borderRadius: 10, // 10px default border radius
  },

  shadows: [
    'none',
    '0 1px 3px rgba(85, 107, 47, 0.1)',
    '0 2px 6px rgba(85, 107, 47, 0.12)',
    '0 4px 12px rgba(85, 107, 47, 0.15)',
    '0 6px 16px rgba(85, 107, 47, 0.16)',
    '0 8px 24px rgba(85, 107, 47, 0.2)',
    '0 10px 30px rgba(85, 107, 47, 0.22)',
    '0 12px 36px rgba(85, 107, 47, 0.24)',
    '0 14px 42px rgba(85, 107, 47, 0.26)',
    '0 16px 48px rgba(85, 107, 47, 0.28)',
    '0 18px 54px rgba(85, 107, 47, 0.3)',
    '0 20px 60px rgba(85, 107, 47, 0.32)',
    '0 22px 66px rgba(85, 107, 47, 0.34)',
    '0 24px 72px rgba(85, 107, 47, 0.36)',
    '0 26px 78px rgba(85, 107, 47, 0.38)',
    '0 28px 84px rgba(85, 107, 47, 0.4)',
    '0 30px 90px rgba(85, 107, 47, 0.42)',
    '0 32px 96px rgba(85, 107, 47, 0.44)',
    '0 34px 102px rgba(85, 107, 47, 0.46)',
    '0 36px 108px rgba(85, 107, 47, 0.48)',
    '0 38px 114px rgba(85, 107, 47, 0.5)',
    '0 40px 120px rgba(85, 107, 47, 0.52)',
    '0 42px 126px rgba(85, 107, 47, 0.54)',
    '0 44px 132px rgba(85, 107, 47, 0.56)',
    '0 46px 138px rgba(85, 107, 47, 0.58)',
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 2px 6px rgba(85, 107, 47, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(85, 107, 47, 0.2)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(85, 107, 47, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6B8E23',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#556B2F',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(85, 107, 47, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: '48px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          marginBottom: '4px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(85, 107, 47, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(85, 107, 47, 0.08)',
          },
        },
      },
    },
  },
});
