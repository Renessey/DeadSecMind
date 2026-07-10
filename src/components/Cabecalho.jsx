import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './Cabecalho.css';
import logo from '../assets/logo.png';

function Header() {
  const [maximized, setMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState(null);

  useEffect(() => {
    let mounted = true;
    let unlistenFn = null;

    // Instancia a janela imediatamente para evitar race conditions
    const currentWindow = getCurrentWindow();
    setAppWindow(currentWindow);

    async function setupListeners() {
      try {
        const isMax = await currentWindow.isMaximized();
        if (mounted) setMaximized(isMax);

        // No Tauri v2, listen() retorna diretamente a função de unlisten de forma síncrona
        unlistenFn = await currentWindow.listen('tauri://resize', async () => {
          const isMax2 = await currentWindow.isMaximized();
          if (mounted) setMaximized(isMax2);
        });
      } catch (error) {
        console.warn('Tauri window API unavailable', error);
      }
    }

    setupListeners();

    // Cleanup limpo e robusto
    return () => {
      mounted = false;
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  const minimize = async () => {
    try {
      const currentWindow = appWindow ?? getCurrentWindow();
      await currentWindow.minimize();
    } catch (error) {
      console.error('Minimize failed', error);
      if (typeof window !== 'undefined') window.blur();
    }
  };

  const toggleMax = async () => {
    try {
      const currentWindow = appWindow ?? getCurrentWindow();
      await currentWindow.toggleMaximize();
      const isMax = await currentWindow.isMaximized();
      setMaximized(isMax);
    } catch (error) {
      console.error('Toggle maximize failed', error);
      // Fallback para navegador
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
        setMaximized(true);
      } else {
        await document.exitFullscreen().catch(() => {});
        setMaximized(false);
      }
    }
  };

  const close = async () => {
    try {
      const currentWindow = appWindow ?? getCurrentWindow();
      await currentWindow.close();
    } catch (error) {
      console.error('Close failed', error);
      if (typeof window !== 'undefined') window.close();
    }
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-logo">
          <img src={logo} alt="Logo do DeadSecMind" className="app-logo-image" />
        </div>
        <span className="app-title">DeadSecMind</span>
      </div>

      <div className="app-header-controls">
        <button className="win-btn win-min" onClick={minimize} aria-label="Minimizar">
          <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor"><rect width="12" height="2"/></svg>
        </button>
        <button className="win-btn win-max" onClick={toggleMax} aria-label={maximized ? 'Restaurar' : 'Maximizar'}>
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="8" height="8" rx="1"/>
              <path d="M4 4V3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H9"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="10" height="10" rx="1"/>
            </svg>
          )}
        </button>
        <button className="win-btn win-close" onClick={close} aria-label="Fechar">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 2l8 8M10 2l-8 8"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;
