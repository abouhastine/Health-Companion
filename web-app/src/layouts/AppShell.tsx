import type { PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import {
  CalendarMonthOutlined,
  Close,
  DashboardOutlined,
  DescriptionOutlined,
  FavoriteBorder,
  Logout,
  Menu,
  MedicalServicesOutlined,
  PersonOutline,
  PsychologyOutlined,
  SearchOutlined,
  ScheduleOutlined,
  GroupOutlined,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { clearSession, role } from '../services/session';
import wellnessSheet from '../assets/illustrations/wellness-care-sheet.png';

type NavItem = { label: string; to: string; icon: ReactNode };

function Brand() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} px={1} py={1.5}>
      <Box
        sx={{
          width: 37,
          height: 37,
          borderRadius: 2.5,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 7px 16px rgba(22, 122, 114, .22)',
        }}
      >
        <FavoriteBorder fontSize="small" />
      </Box>
      <Box>
        <Typography fontWeight={850} lineHeight={1.1}>
          Health Companion
        </Typography>
        <Typography color="text.secondary" variant="caption">
          Your care, in one place
        </Typography>
      </Box>
    </Stack>
  );
}

function Sidebar({ close }: { close?: () => void }) {
  const currentRole = role();
  const location = useLocation();
  const navigation: NavItem[] =
    currentRole === 'ADMIN'
      ? [
          { label: 'Overview', to: '/admin', icon: <DashboardOutlined /> },
          { label: 'User accounts', to: '/admin/users', icon: <GroupOutlined /> },
          { label: 'Documents', to: '/admin/documents', icon: <DescriptionOutlined /> },
          { label: 'Practitioners', to: '/admin/practitioners', icon: <MedicalServicesOutlined /> },
          { label: 'Availability', to: '/admin/availability', icon: <ScheduleOutlined /> },
          { label: 'Appointments', to: '/admin/appointments', icon: <CalendarMonthOutlined /> },
        ]
      : [
          { label: 'Overview', to: '/home', icon: <DashboardOutlined /> },
          { label: 'Find care', to: '/practitioners', icon: <SearchOutlined /> },
          { label: 'Appointments', to: '/appointments', icon: <CalendarMonthOutlined /> },
          { label: 'Medical results', to: '/documents', icon: <DescriptionOutlined /> },
          { label: 'Health assistant', to: '/assistant', icon: <PsychologyOutlined /> },
        ];

  return (
    <Box sx={{ width: 274, height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Brand />
      <Typography
        color="text.secondary"
        variant="overline"
        fontWeight={800}
        sx={{ px: 1, mt: 4, mb: 1 }}
      >
        {currentRole === 'ADMIN' ? 'Administration' : 'My health'}
      </Typography>
      <List disablePadding>
        {navigation.map((item) => (
          <ListItemButton
            component={NavLink}
            to={item.to}
            end={item.to === '/admin'}
            key={item.to}
            selected={
              location.pathname === item.to ||
              (item.to !== '/admin' && location.pathname.startsWith(`${item.to}/`))
            }
            onClick={close}
            sx={{
              mb: 0.5,
              minHeight: 46,
              borderRadius: 2.5,
              '&.active, &.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' },
              '&.Mui-selected:hover': { bgcolor: 'primary.light' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 39, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 2 }} />
      <List disablePadding>
        {currentRole ? (
          <ListItemButton
            component={NavLink}
            to={currentRole === 'ADMIN' ? '/admin/profile' : '/profile'}
            onClick={close}
            sx={{ borderRadius: 2.5 }}
          >
            <ListItemIcon sx={{ minWidth: 39 }}>
              <PersonOutline />
            </ListItemIcon>
            <ListItemText
              primary={currentRole === 'ADMIN' ? 'My admin profile' : 'Profile'}
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>
        ) : null}
        <ListItemButton
          onClick={() => {
            clearSession();
            window.location.assign('/login');
          }}
          sx={{ borderRadius: 2.5 }}
        >
          <ListItemIcon sx={{ minWidth: 39 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ fontWeight: 700 }} />
        </ListItemButton>
      </List>
    </Box>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const currentRole = role();
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="nav" sx={{ display: { xs: 'none', lg: 'block' }, width: 274, flexShrink: 0 }}>
        <Box
          sx={{
            position: 'fixed',
            width: 274,
            height: '100vh',
            bgcolor: '#fff',
            borderRight: '1px solid #dce9e7',
          }}
        >
          <Sidebar />
        </Box>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 68,
            px: 2,
            bgcolor: 'rgba(255,255,255,.93)',
            borderBottom: '1px solid #dce9e7',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(12px)',
          }}
        >
          <IconButton onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu />
          </IconButton>
          <Typography fontWeight={850}>Health Companion</Typography>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {currentRole === 'ADMIN' ? 'A' : 'H'}
          </Avatar>
        </Box>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{ sx: { borderRadius: '0 20px 20px 0' } }}
        >
          <Box sx={{ position: 'relative', height: '100%' }}>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              sx={{ position: 'absolute', right: 10, top: 12, zIndex: 1 }}
            >
              <Close fontSize="small" />
            </IconButton>
            <Sidebar close={() => setOpen(false)} />
          </Box>
        </Drawer>
        <Box sx={{ width: 'min(1180px, 100%)', mx: 'auto', p: { xs: 2, sm: 3, md: 5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { md: 'minmax(380px, .95fr) 1.05fr' },
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 7 },
          color: 'white',
          background:
            'radial-gradient(circle at 15% 15%, #3aa79f 0, transparent 34%), linear-gradient(145deg, #0d514e, #183c5d)',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FavoriteBorder />
          <Typography fontWeight={850}>Health Companion</Typography>
        </Stack>
        <Box maxWidth={440}>
          <Box
            component="img"
            src={wellnessSheet}
            alt=""
            sx={{
              width: 150,
              height: 150,
              objectFit: 'cover',
              objectPosition: 'center top',
              borderRadius: '50%',
              mb: 2,
              display: { md: 'block', lg: 'none' },
            }}
          />
          <Typography variant="h3" fontSize={{ md: '2.7rem', lg: '3.4rem' }}>
            A clearer view of your care.
          </Typography>
          <Typography
            sx={{ mt: 2, color: 'rgba(255,255,255,.76)', fontSize: '1.08rem', lineHeight: 1.65 }}
          >
            Appointments, medical results and trusted explanations—organized around you.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography color="rgba(255,255,255,.62)" variant="body2">
            Private by design. Health information, not medical advice.
          </Typography>
          <Box
            component="img"
            src={wellnessSheet}
            alt=""
            sx={{
              width: 152,
              height: 152,
              objectFit: 'cover',
              objectPosition: 'center top',
              borderRadius: 5,
              display: { md: 'none', lg: 'block' },
              opacity: 0.96,
            }}
          />
        </Stack>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 5 } }}>{children}</Box>
    </Box>
  );
}
