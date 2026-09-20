import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#123A5A', dark: '#0B2942', light: '#E8F0F6', contrastText: '#fff' },
    secondary: { main: '#2B6F9E', dark: '#1B547C', light: '#E8F3FA', contrastText: '#fff' },
    info: { main: '#2B6F9E', light: '#E8F3FA' },
    background: { default: '#F4F6F8', paper: '#FFFFFF' },
    text: { primary: '#132B3F', secondary: '#5D6E7D' },
    success: { main: '#18715F' },
    warning: { main: '#A76416' },
    error: { main: '#B53B48' },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 740, letterSpacing: '-0.04em', lineHeight: 1.1 },
    h4: { fontWeight: 760, letterSpacing: '-0.035em' },
    h5: { fontWeight: 720, letterSpacing: '-0.02em' },
    h6: { fontWeight: 720 },
    button: { fontWeight: 750, textTransform: 'none', letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, backgroundColor: '#F4F6F8' },
        '*': { boxSizing: 'border-box' },
        a: { color: 'inherit', textDecoration: 'none' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 44,
          paddingInline: 18,
          transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease',
          '&:focus-visible': { outline: '3px solid rgba(67, 134, 168, .42)', outlineOffset: 2 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #DCE3E9', boxShadow: '0 4px 14px rgba(19, 43, 63, 0.045)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #DCE3E9', boxShadow: '0 4px 14px rgba(19, 43, 63, .045)' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#fff',
          transition: 'box-shadow .18s ease, border-color .18s ease',
          '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(43, 111, 158, .12)' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
