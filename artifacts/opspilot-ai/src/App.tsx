import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AiAssistantPage, AnalyticsPage, AuditLogsPage, AuthPage, CustomerDetailPage, CustomersPage, DashboardPage, KnowledgePage, NotificationsPage, NotFoundPage, SettingsPage, TeamPage, TicketDetailPage, TicketsPage, UnauthorizedPage } from '@/pages/op-pages';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/tickets" component={TicketsPage} />
        <Route path="/tickets/:id" component={TicketDetailPage} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/customers/:id" component={CustomerDetailPage} />
        <Route path="/knowledge" component={KnowledgePage} />
        <Route path="/ai-assistant" component={AiAssistantPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/audit-logs" component={AuditLogsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/settings/:section" component={SettingsPage} />
        <Route path="/login"><AuthPage mode="login" /></Route>
        <Route path="/register"><AuthPage mode="register" /></Route>
        <Route path="/forgot-password"><AuthPage mode="forgot" /></Route>
        <Route path="/unauthorized" component={UnauthorizedPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
