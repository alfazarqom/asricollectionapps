import { createTheme } from '@mui/material/styles';

/**
 * Shared Material UI theme for Asri Collection.
 *
 * Values are mapped from the Asri Collection design_system.json.
 * Keep global CSS and storefront component styles unchanged in this
 * foundation-only release.
 */
export const asriTheme = createTheme({
  palette: {
    primary: {
      main: '#16A34A',
      light: '#F0FDF4',
      dark: '#166534',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EE4D2D',
      light: '#FFF1ED',
      dark: '#D94325',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F8FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#171717',
      secondary: '#525252',
      disabled: '#737373',
    },
    divider: '#E5E7EB',
    success: {
      main: '#15803D',
      light: '#F0FDF4',
    },
    warning: {
      main: '#B45309',
      light: '#FFFBEB',
    },
    error: {
      main: '#DC2626',
      light: '#FEF2F2',
    },
    info: {
      main: '#2563EB',
      light: '#EFF6FF',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 16,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '&.MuiButton-containedPrimary:hover': {
            backgroundColor: '#15803D',
          },
          '&.MuiButton-containedPrimary:active': {
            backgroundColor: '#166534',
          },
          '&.MuiButton-containedSecondary:hover': {
            backgroundColor: '#D94325',
          },
        },
      },
    },
  },
});
