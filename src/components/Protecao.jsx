import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, X, Network, Cloud, ShieldAlert } from "lucide-react";

import { invoke } from '@tauri-apps/api/core';
import './Protecao.css';

function StatusPill({ variant, children }) {
  return <span className={`status-pill ${variant}`}>{children}</span>;
}

function Protection() {
  const [protections, setProtections] = useState({
    firewall: null,
    cloud: null,
  });

  const [error, setError] = useState('');

  const totalToCheck = 2;

  const activeCount = useMemo(() => {
    let count = 0;
    if (protections.firewall === true) count += 1;
    if (protections.cloud === true) count += 1;
    return count;
  }, [protections]);

  const allActive = activeCount === totalToCheck;

  const headerStatus = useMemo(() => {
    if (error) return { variant: 'unknown', text: 'Proteção não verificada' };

    // Se nada veio ainda do backend, mantém neutro
    if (protections.firewall === null && protections.cloud === null) {
      return { variant: 'unknown', text: 'Proteção não verificada' };
    }

    if (allActive) return { variant: 'active', text: 'Proteção ativa' };
    return { variant: 'semi-active', text: 'Proteção semi ativa' };
  }, [allActive, error, protections.cloud, protections.firewall]);

  const mapProtectionToItem = useCallback((key, title, subtitle, Icon) => {
    const value = protections[key];

    const isChecked = value === true;
    const isMissing = value === false;

    return (
      <article className="protection-item" key={key}>
        <div className="protection-item-left">
          <div className="protection-icon" aria-hidden="true">
            <Icon size={18} />
          </div>

          <div className="protection-item-text">
            <h4>{title}</h4>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="protection-item-right">
          {value === null ? (
            <div className="status-row unknown" role="status" aria-live="polite">
              <span className="status-icon">?</span>
              <span>Não verificado</span>
            </div>
          ) : isChecked ? (
            <div className="status-row active" role="status" aria-live="polite">
              <ShieldCheck className="status-row-icon" size={18} />
              <span>Ativa</span>
            </div>
          ) : isMissing ? (
            <div className="status-row inactive" role="status" aria-live="polite">
              <X className="status-row-icon" size={18} />
              <span>Inativa</span>
            </div>
          ) : (
            <div className="status-row unknown" role="status" aria-live="polite">
              <span className="status-icon">?</span>
              <span>Indisponível</span>
            </div>
          )}
        </div>
      </article>
    );
  }, [protections]);

  useEffect(() => {
    let cancelled = false;

    const loadProtections = async () => {
      setError('');
      try {
        // Backend ainda pode não ter esse comando.
        // Se não existir, cai no fallback sem quebrar o app.
        const res = await invoke('get_security_protections_status');
        if (cancelled) return;

        // Quando o Rust retorna None, a UI mantém status como "não verificado".
        setProtections({
          firewall: res && typeof res.firewall === 'boolean' ? res.firewall : null,
          cloud: res && typeof res.cloud === 'boolean' ? res.cloud : null,
        });
      } catch (e) {
        if (cancelled) return;
        setProtections({ firewall: null, cloud: null });
        setError('Sem verificação em tempo real do PC.');
      }
    };

    loadProtections();

    return () => {
      cancelled = true;
    };
  }, []);

  const getNetworkSummary = useMemo(() => {
    if (error) return 'Status indisponível no backend atual.';
    if (protections.firewall === null && protections.cloud === null) {
      return 'Aguardando verificação no PC...';
    }

    const missing = totalToCheck - activeCount;
    if (missing === 0) return 'Todas as proteções de rede estão ativas.';
    return `${missing} proteção(ões) de rede não estão ativas.`;
  }, [activeCount, error, protections.cloud, protections.firewall]);

  return (
    <section className="page-content protection-page">
      <div className="page-header">
        <div>
          <h2>Proteção</h2>
          <p>Proteção da rede e camadas de segurança do dispositivo.</p>
        </div>

        <StatusPill variant={headerStatus.variant}>{headerStatus.text}</StatusPill>
      </div>

      <div className="protection-summary">
        <div className="protection-summary-left">
          <div className="protection-summary-icon" aria-hidden="true">
            <Network size={18} />
          </div>
          <div>
            <h3>Proteção da rede</h3>
            <p>{getNetworkSummary}</p>
          </div>
        </div>

        <div className="protection-summary-right">
          <div className="active-meter" aria-label="Proteções ativas">
            <span className="active-meter-value">{activeCount}</span>
            <span className="active-meter-total">/ {totalToCheck}</span>
          </div>
          <div className="active-meter-label">Proteções ativas</div>
        </div>
      </div>

      <div className="protection-grid">
        {mapProtectionToItem(
          'firewall',
          'Firewall',
          'Controle de rede em tempo real para bloquear tráfego suspeito.',
          ShieldAlert
        )}

        {mapProtectionToItem(
          'cloud',
          'Proteção em nuvem',
          'Detecção e atualização automática de novas ameaças.',
          Cloud
        )}
      </div>
    </section>
  );
}

export default Protection;

