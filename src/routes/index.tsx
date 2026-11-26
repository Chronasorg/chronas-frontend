import { Routes, Route, Navigate } from 'react-router';
import { ROUTES } from './routes';
import { AppShell, FeaturePlaceholder, HomePage as HomePageComponent } from '../components';
import { useAnalytics } from '../hooks/useAnalytics';

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
  useAnalytics();

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.CONFIGURATION} element={<ConfigurationPage />} />
      <Route path={ROUTES.DISCOVER} element={<DiscoverPage />} />
      <Route path={ROUTES.ARTICLE} element={<ArticlePage />} />
      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
