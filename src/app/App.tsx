import { useEffect } from 'react';
import { AppRoutes } from './routes';
import { ThemeBridge } from './ThemeBridge';
import { LocalModeBanner } from '@/components/LocalModeBanner';
import { initProfileSync } from '@/lib/sync';

export default function App() {
  useEffect(() => {
    initProfileSync();
  }, []);

  return (
    <>
      <ThemeBridge />
      <LocalModeBanner />
      <AppRoutes />
    </>
  );
}
