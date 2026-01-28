import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useAuthStore } from './stores';

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  // Initialize stores on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
