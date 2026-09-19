import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminOverviewPage, AdminPage } from '../features/admin/AdminPage';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { AssistantPage } from '../features/assistant/AssistantPages';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { DocumentDetailPage, DocumentListPage } from '../features/documents/DocumentPages';
import { PatientHomePage } from '../features/home/PatientHomePage';
import {
  PractitionerDetailPage,
  PractitionerListPage,
} from '../features/practitioners/PractitionerPages';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AdminRoute, PatientRoute, ProtectedRoute } from './RouteGuards';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/home"
        element={
          <PatientRoute>
            <PatientHomePage />
          </PatientRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practitioners"
        element={
          <PatientRoute>
            <PractitionerListPage />
          </PatientRoute>
        }
      />
      <Route
        path="/practitioners/:id"
        element={
          <PatientRoute>
            <PractitionerDetailPage />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <PatientRoute>
            <AppointmentsPage />
          </PatientRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PatientRoute>
            <DocumentListPage />
          </PatientRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <PatientRoute>
            <DocumentDetailPage />
          </PatientRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <PatientRoute>
            <AssistantPage />
          </PatientRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminOverviewPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminPage section="users" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <AdminRoute>
            <AdminPage section="documents" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/practitioners"
        element={
          <AdminRoute>
            <AdminPage section="practitioners" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/availability"
        element={
          <AdminRoute>
            <AdminPage section="availability" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <AdminRoute>
            <AdminPage section="appointments" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <AdminRoute>
            <ProfilePage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/practitioners" />} />
    </Routes>
  );
}
