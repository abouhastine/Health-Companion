import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f766e', dark: '#115e59', light: '#dff5f0', contrastText: '#fff' },
    secondary: { main: '#e76f51', dark: '#bc4d33', light: '#fff0e9', contrastText: '#fff' },
    info: { main: '#4386a8', light: '#e9f5fb' },
    background: { default: '#f8f7f2', paper: '#ffffff' },
    text: { primary: '#183634', secondary: '#647573' },
    success: { main: '#27855d' },
    warning: { main: '#b7791f' },
    error: { main: '#c54d4d' },
  },
  typography: {
    fontFamily:
      'Inter, ui-rounded, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.08 },
    h4: { fontWeight: 760, letterSpacing: '-0.035em' },
    h5: { fontWeight: 720, letterSpacing: '-0.02em' },
    h6: { fontWeight: 720 },
    button: { fontWeight: 750, textTransform: 'none', letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, backgroundColor: '#f8f7f2' },
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
          borderRadius: 12,
          minHeight: 44,
          paddingInline: 18,
          transition: 'transform .18s ease, box-shadow .18s ease, background-color .18s ease',
          '&:focus-visible': { outline: '3px solid rgba(67, 134, 168, .42)', outlineOffset: 2 },
          '&:not(.Mui-disabled):active': { transform: 'translateY(1px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #e2ebe5', boxShadow: '0 10px 28px rgba(26, 70, 64, 0.07)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e2ebe5', boxShadow: '0 8px 22px rgba(26, 70, 64, .045)' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#fff',
          transition: 'box-shadow .18s ease, border-color .18s ease',
          '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(15, 118, 110, .10)' },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
