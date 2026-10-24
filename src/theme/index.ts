import { createTheme } from '@mui/material/styles';

/**
 * Shared Material UI theme for Asri Collection.
 *
 * Keep existing Tailwind/CSS styles unchanged in this foundation-only release.
 * The palette is aligned with the current Asri Collection design token proposal.
 */
export const asriTheme = createTheme({
  palette: {
    primary: {
      main: '#16803D',
      dark: '#126B33',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2563EB',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F3F4F6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
    success: {
      main: '#16803D',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
});
