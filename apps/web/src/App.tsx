import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageSpinner } from '@/components/ui/Spinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const CreateWizardPage = lazy(() => import('@/pages/wizard/CreateWizardPage'));
const PublicNotebookPage = lazy(() => import('@/pages/notebook/PublicNotebookPage'));
const CheckoutPage = lazy(() => import('@/pages/checkout/CheckoutPage'));
const CheckoutResultPage = lazy(() => import('@/pages/checkout/CheckoutResultPage'));
const DashboardLayout = lazy(() => import('@/pages/dashboard/DashboardLayout'));
const DashboardOverviewPage = lazy(() => import('@/pages/dashboard/DashboardOverviewPage'));
const DashboardMessagesPage = lazy(() => import('@/pages/dashboard/DashboardMessagesPage'));
const DashboardGalleryPage = lazy(() => import('@/pages/dashboard/DashboardGalleryPage'));
const DashboardTimelinePage = lazy(() => import('@/pages/dashboard/DashboardTimelinePage'));
const DashboardSettingsPage = lazy(() => import('@/pages/dashboard/DashboardSettingsPage'));
const DashboardSharePage = lazy(() => import('@/pages/dashboard/DashboardSharePage'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminNotebooksPage = lazy(() => import('@/pages/admin/AdminNotebooksPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminPackagesPage = lazy(() => import('@/pages/admin/AdminPackagesPage'));
const AdminThemesPage = lazy(() => import('@/pages/admin/AdminThemesPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateWizardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout/:orderId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/checkout/success" element={<CheckoutResultPage variant="success" />} />
        <Route path="/checkout/cancel" element={<CheckoutResultPage variant="cancel" />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="messages" element={<DashboardMessagesPage />} />
          <Route path="gallery" element={<DashboardGalleryPage />} />
          <Route path="timeline" element={<DashboardTimelinePage />} />
          <Route path="settings" element={<DashboardSettingsPage />} />
          <Route path="share" element={<DashboardSharePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="notebooks" element={<AdminNotebooksPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="themes" element={<AdminThemesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="/d/:slug" element={<PublicNotebookPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
