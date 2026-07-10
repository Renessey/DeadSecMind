import React, { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ItemDaBarraLateral from './ItemDaBarraLateral';
import './BarraLateral.css';

const navItems = [
  { key: 'dashboard', label: 'Painel', icon: 'dashboard' },
  { key: 'scan', label: 'Verificar', icon: 'scan' },
  { key: 'protection', label: 'Proteção', icon: 'protection' },
  { key: 'privacy', label: 'Privacidade', icon: 'privacy' },
  { key: 'performance', label: 'Configuração', icon: 'performance' },
];

function Sidebar({ selectedPage, onSelect, collapsed = false, onToggle = () => {} }) {
  const [protectionStatus, setProtectionStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProtectionStatus = async () => {
      try {
        setLoadingStatus(true);
        setStatusError(null);

        const result = await invoke('get_security_protections_status');
        if (!isMounted) return;
        setProtectionStatus(result);
      } catch (err) {
        if (!isMounted) return;
        setStatusError(err);
        setProtectionStatus(null);
      } finally {
        if (!isMounted) return;
        setLoadingStatus(false);
      }
    };

    fetchProtectionStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const isProtected = useMemo(() => {
    if (!protectionStatus) return false;
    return Boolean(protectionStatus.firewall && protectionStatus.cloud);
  }, [protectionStatus]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        type="button"
        onClick={() => onToggle()}
        aria-label={collapsed ? 'Expandir barra' : 'Fechar barra'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          {collapsed ? <path d="M6 3l5 5-5 5" /> : <path d="M10 3l-5 5 5 5" />}
        </svg>
      </button>

      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <div className="logo-area">
            <span className="logo-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            {!collapsed && (
              <div className="logo-text">
                <h3>DEADSECMIND</h3>
                <p>SECURITY SUITE</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-body">
        <nav className="menu-nav">
          {navItems.map(({ key, label, icon }) => (
            <ItemDaBarraLateral
              key={key}
              label={label}
              iconKey={icon}
              active={selectedPage === key}
              collapsed={collapsed}
              onClick={() => onSelect(key)}
            />
          ))}
        </nav>

        <div className="system-status">
          <p>{collapsed ? 'STATUS' : 'STATUS DO SISTEMA'}</p>
          <span
            className="status-secure"
            title={statusError ? String(statusError) : undefined}
          >
            {!collapsed && (
              <span
                className="status-dot"
                style={{
                  background: loadingStatus
                    ? 'rgba(0, 255, 102, 0.4)'
                    : isProtected
                      ? 'var(--neon-green)'
                      : '#ff3333',
                  boxShadow: loadingStatus
                    ? '0 0 8px rgba(0, 255, 102, 0.25)'
                    : isProtected
                      ? '0 0 8px var(--neon-green)'
                      : '0 0 8px rgba(255, 51, 51, 0.7)',
                }}
              />
            )}
            {loadingStatus ? '...' : isProtected ? 'PROTEGIDO' : 'OK'}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

