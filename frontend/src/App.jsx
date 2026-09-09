import { Toaster } from 'sonner';
import AppRoutes from './routes/AppRoutes';
import LucySplash from './components/LucySplash';
import { useState, useEffect } from 'react';
import { useAuth } from './features/auth/hooks/useAuth';

export default function App() {
  const { loading: authLoading } = useAuth();
  const [themeReady, setThemeReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Apply theme immediately so splash and background have correct colors
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    let theme;
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    setThemeReady(true);
  }, []);

  const handleSplashDone = () => {
    setSplashDone(true);
  };

  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" />
      {!splashDone && (
        <LucySplash loading={authLoading || !themeReady} onDone={handleSplashDone} />
      )}
    </>
  );
}
