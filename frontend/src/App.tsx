import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';

// Code-split pages via dynamic React.lazy
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Customers = lazy(() => import('./pages/Customers/Customers'));
const AddCustomer = lazy(() => import('./pages/Customers/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/Customers/EditCustomer'));
const CustomerDetails = lazy(() => import('./pages/Customers/CustomerDetails'));
const Deliveries = lazy(() => import('./pages/Deliveries/Deliveries'));
const CreateDelivery = lazy(() => import('./pages/Deliveries/CreateDelivery'));
const DeliveryDetails = lazy(() => import('./pages/Deliveries/DeliveryDetails'));
const Agents = lazy(() => import('./pages/Agents/Agents'));
const AgentDetails = lazy(() => import('./pages/Agents/AgentDetails'));
const Collections = lazy(() => import('./pages/Collections/Collections'));
const Chat = lazy(() => import('./pages/Chat/Chat'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Login = lazy(() => import('./pages/Login/Login'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const ComponentShowcase = lazy(() =>
  import('./pages/ComponentShowcase/ComponentShowcase').then((m) => ({
    default: m.ComponentShowcase,
  }))
);

// Contexts & Providers
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { DeliveryProvider } from './context/DeliveryContext';
import { ToastProvider, ErrorBoundary, ProtectedRoute } from './components/common';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

const PageLoadingFallback = () => (
  <div className="p-6 space-y-4 animate-in fade-in duration-200">
    <div className="h-8 w-48 bg-gray-200/80 rounded-lg animate-pulse" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-gray-200/70 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-200/70 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-200/70 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-200/70 rounded-xl animate-pulse" />
    </div>
    <div className="h-64 bg-gray-200/60 rounded-xl animate-pulse" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <CustomerProvider>
              <DeliveryProvider>
                <BrowserRouter>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Public Auth Route */}
                      <Route path="/login" element={<Login />} />

                      {/* Authenticated Dashboard Routes */}
                      <Route
                        element={
                          <ProtectedRoute>
                            <DashboardLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Dashboard: Admin & Manager */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />

                        {/* Customers Module: Admin & Manager */}
                        <Route
                          path="/customers"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <Customers />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/customers/add"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <AddCustomer />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/customers/edit/:id"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <EditCustomer />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/customers/:id"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <CustomerDetails />
                            </ProtectedRoute>
                          }
                        />

                        {/* Deliveries Module: Accessible by All (Admin, Manager, Agent) */}
                        <Route path="/deliveries">
                          <Route index element={<Deliveries />} />
                          <Route path="new" element={<CreateDelivery />} />
                          <Route path=":id" element={<DeliveryDetails />} />
                        </Route>

                        {/* Agents Module: Admin & Manager */}
                        <Route
                          path="/agents"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <Agents />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/agents/:id"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <AgentDetails />
                            </ProtectedRoute>
                          }
                        />

                        {/* Collections Module: Admin Only */}
                        <Route
                          path="/collections"
                          element={
                            <ProtectedRoute allowedRoles={['Admin']}>
                              <Collections />
                            </ProtectedRoute>
                          }
                        />

                        {/* Chat Module: All roles */}
                        <Route path="/chat" element={<Chat />} />

                        {/* Reports Module: Admin & Manager */}
                        <Route
                          path="/reports"
                          element={
                            <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                              <Reports />
                            </ProtectedRoute>
                          }
                        />

                        {/* Settings Module: Admin Only */}
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute allowedRoles={['Admin']}>
                              <Settings />
                            </ProtectedRoute>
                          }
                        />

                        {/* Design System Showcase (Development Only) */}
                        {import.meta.env.DEV && (
                          <Route path="/components" element={<ComponentShowcase />} />
                        )}
                      </Route>

                      {/* 404 Fallback */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </DeliveryProvider>
            </CustomerProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
