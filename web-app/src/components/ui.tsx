import type { ReactNode } from 'react';
import { DescriptionOutlined, EventAvailableOutlined, InfoOutlined } from '@mui/icons-material';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ sm: 'flex-end' }}
      spacing={2}
      mb={4}
    >
      <Box>
        {eyebrow ? (
          <Typography
            color="primary.main"
            variant="overline"
            fontWeight={800}
            letterSpacing=".08em"
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3" fontSize={{ xs: '2rem', sm: '2.5rem' }}>
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 630 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

export function SectionCard({
  title,
  action,
  children,
  sx,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Paper sx={{ p: { xs: 2.25, sm: 3 }, borderRadius: 3, ...sx }}>
      {title || action ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          mb={2.5}
        >
          {title ? <Typography variant="h6">{title}</Typography> : <span />}
          {action}
        </Stack>
      ) : null}
      {children}
    </Paper>
  );
}

export function StatusChip({ status }: { status: string }) {
  const color =
    status === 'AVAILABLE' || status === 'CONFIRMED' || status === 'COMPLETED'
      ? 'success'
      : status === 'PROCESSING'
        ? 'warning'
        : status === 'FAILED' || status === 'CANCELLED'
          ? 'error'
          : 'default';
  return <Chip color={color} size="small" label={status.replace(/_/g, ' ').toLowerCase()} />;
}

export function EmptyState({
  title,
  description,
  kind = 'info',
}: {
  title: string;
  description: string;
  kind?: 'appointment' | 'document' | 'info';
}) {
  const Icon =
    kind === 'appointment'
      ? EventAvailableOutlined
      : kind === 'document'
        ? DescriptionOutlined
        : InfoOutlined;
  return (
    <Paper
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: 'center',
        borderStyle: 'dashed',
        bgcolor: 'rgba(255,255,255,.65)',
      }}
    >
      <Icon color="primary" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 430, mx: 'auto', mt: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
}
