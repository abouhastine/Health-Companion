import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { role, token } from '../services/session';

export function ProtectedRoute({ children }: PropsWithChildren) {
  return token() ? <>{children}</> : <Navigate to="/login" />;
}

export function PatientRoute({ children }: PropsWithChildren) {
  if (!token()) return <Navigate to="/login" />;
  return role() === 'PATIENT' ? <>{children}</> : <Navigate to="/admin" />;
}

export function AdminRoute({ children }: PropsWithChildren) {
  return token() && role() === 'ADMIN' ? <>{children}</> : <Navigate to="/practitioners" />;
}
