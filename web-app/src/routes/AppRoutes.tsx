import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from '../features/admin/AdminPage';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { AssistantPage, DocumentAssistantPage } from '../features/assistant/AssistantPages';
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
        path="/documents/:id/ask"
        element={
          <PatientRoute>
            <DocumentAssistantPage />
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
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/practitioners" />} />
    </Routes>
  );
}
