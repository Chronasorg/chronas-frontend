import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { ROUTES } from './routes';
import { AppShell, FeaturePlaceholder, HomePage as HomePageComponent } from '../components';

// Lazy-loaded components for code splitting (NFR-1.4)
const LoginForm = lazy(() => import('../components/auth/LoginForm/LoginForm'));
const SignupForm = lazy(() => import('../components/auth/SignupForm/SignupForm'));

// Home page using the new UI components
function HomePage() {
  return (
    <AppShell>
      <HomePageComponent />
    </AppShell>
  );
}

function ConfigurationPage() {
  return (
    <AppShell>
      <FeaturePlaceholder
        featureName="Configuration"
        description="Application settings and preferences."
        migrationPriority="medium"
      />
    </AppShell>
  );
}

function DiscoverPage() {
  return (
    <AppShell>
      <FeaturePlaceholder
        featureName="Discover"
        description="Explore historical content and articles."
        migrationPriority="medium"
      />
    </AppShell>
  );
}

function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  return (
    <AppShell>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>}>
        {mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setMode('login')} />
        )}
      </Suspense>
    </AppShell>
  );
}

function ArticlePage() {
  return (
    <AppShell>
      <FeaturePlaceholder
        featureName="Article Viewer"
        description="Historical article and content display."
        migrationPriority="medium"
      />
    </AppShell>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.CONFIGURATION} element={<ConfigurationPage />} />
      <Route path={ROUTES.DISCOVER} element={<DiscoverPage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.ARTICLE} element={<ArticlePage />} />
      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
