import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { AppShell, FeaturePlaceholder } from '../components';

// Placeholder page components
function HomePage() {
  return (
    <AppShell>
      <FeaturePlaceholder
        featureName="Interactive Map"
        description="The main historical map interface will be migrated here."
        migrationPriority="high"
      />
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
  return (
    <AppShell>
      <FeaturePlaceholder
        featureName="Authentication"
        description="Login and registration functionality."
        migrationPriority="high"
      />
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
