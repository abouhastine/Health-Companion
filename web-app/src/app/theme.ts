import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#167a72', dark: '#0e514d', light: '#e4f4f1', contrastText: '#fff' },
    secondary: { main: '#3a78a6', light: '#e8f1f8' },
    background: { default: '#f4f8f8', paper: '#ffffff' },
    text: { primary: '#18302f', secondary: '#607371' },
    success: { main: '#27855d' },
    warning: { main: '#b7791f' },
    error: { main: '#c54d4d' },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: { fontWeight: 780, letterSpacing: '-0.045em' },
    h4: { fontWeight: 760, letterSpacing: '-0.035em' },
    h5: { fontWeight: 720, letterSpacing: '-0.02em' },
    h6: { fontWeight: 720 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { minWidth: 320, backgroundColor: '#f4f8f8' },
        '*': { boxSizing: 'border-box' },
        a: { color: 'inherit', textDecoration: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 42, paddingInline: 18 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #dce9e7', boxShadow: '0 8px 24px rgba(21, 75, 70, 0.055)' },
      },
    },
    MuiCard: { styleOverrides: { root: { border: '1px solid #dce9e7', boxShadow: 'none' } } },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10, backgroundColor: '#fff' } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
