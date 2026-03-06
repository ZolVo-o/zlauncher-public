import { useEffect } from 'react';
import LauncherApp from './LauncherApp';
import { Website } from './components/Website';

export default function App() {
  const isDesktop = Boolean(window.zlauncher?.isDesktop);

  useEffect(() => {
    document.body.classList.toggle('desktop-mode', isDesktop);
    document.body.classList.toggle('web-mode', !isDesktop);
  }, [isDesktop]);

  if (isDesktop) {
    return <LauncherApp />;
  }
  return <Website />;
}
