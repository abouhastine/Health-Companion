import type { ReactNode } from 'react';
import {
  DescriptionOutlined,
  EventAvailableOutlined,
  InfoOutlined,
  AutoAwesomeOutlined,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import wellnessSheet from '../assets/illustrations/wellness-care-sheet.png';

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
      <Box sx={{ position: 'relative' }}>
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
    <Paper
      sx={{
        p: { xs: 2.25, sm: 3 },
        borderRadius: 4,
        transition: 'transform .18s ease, box-shadow .18s ease',
        ...sx,
      }}
    >
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
  const illustrationPosition =
    kind === 'appointment' ? 'center bottom' : kind === 'document' ? 'center' : 'center top';
  return (
    <Paper
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: 'center',
        borderStyle: 'dashed',
        bgcolor: 'rgba(255,255,255,.78)',
        borderRadius: 4,
      }}
    >
      <Box
        component="img"
        src={wellnessSheet}
        alt=""
        sx={{
          width: 92,
          height: 76,
          objectFit: 'cover',
          objectPosition: illustrationPosition,
          borderRadius: 2,
          display: 'block',
          mx: 'auto',
          mb: 1,
        }}
      />
      <Icon color="primary" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 430, mx: 'auto', mt: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
}

export function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        bgcolor: 'rgba(223,245,240,.38)',
        border: '1px solid rgba(15,118,110,.10)',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography fontWeight={800}>{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {children}
    </Box>
  );
}

export function PageLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={70} />
      <Skeleton variant="rounded" height={180} />
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}

export function FeatureBadge({ children }: { children: ReactNode }) {
  return (
    <Chip
      icon={<AutoAwesomeOutlined />}
      label={children}
      color="secondary"
      sx={{ color: 'secondary.dark', bgcolor: 'secondary.light' }}
    />
  );
}

export function ResponsiveRecordList({
  columns,
  rows,
}: {
  columns: string[];
  rows: { key: string | number; cells: ReactNode[]; actions?: ReactNode }[];
}) {
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          display: { xs: 'none', md: 'block' },
          boxShadow: 'none',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Table size="small" aria-label="Management records">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(223,245,240,.46)' }}>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  {column}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} hover>
                {row.cells.map((cell, index) => (
                  <TableCell key={index}>{cell}</TableCell>
                ))}
                <TableCell align="right">{row.actions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {rows.map((row) => (
          <Paper key={row.key} sx={{ p: 2, borderRadius: 3 }}>
            <Stack spacing={1}>
              {row.cells.map((cell, index) => (
                <Box key={index}>{cell}</Box>
              ))}
              {row.actions ? (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {row.actions}
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </>
  );
}
