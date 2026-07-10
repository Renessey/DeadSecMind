import React, { useCallback, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Verificacao.css';

function Scan() {
  const [mode, setMode] = useState(null); // 'quick' | 'full' | null
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const cards = useMemo(
    () => [
      {
        key: 'quick',
        title: 'Verificação rápida',
        description: 'Escaneia os pontos mais críticos do sistema em poucos minutos.',
      },
      {
        key: 'full',
        title: 'Verificação completa',
        description: 'Escaneia todos os arquivos, processos e configurações em profundidade.',
      },
    ],
    []
  );

  const onSelect = useCallback((nextMode) => {
    setError('');
    setResult(null);
    setMode(nextMode);
  }, []);

  const onStart = useCallback(async () => {
    setError('');
    setResult(null);

    if (!mode) {
      setError('Selecione um tipo de verificação: rápida ou completa.');
      return;
    }

    setIsRunning(true);
    try {
      const res = await invoke('run_verification', { mode });
      setResult(res);
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String(e.message)
          : 'Falha ao iniciar a verificação.';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  }, [mode]);

  return (
    <section className="page-content scan-page">
      <div className="page-header">
        <div>
          <h2>Verificação de processos</h2>
          <p>Identifique riscos nos processos ativos e mantenha seus arquivos limpos.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onStart}
          disabled={isRunning}
          aria-disabled={isRunning}
        >
          {isRunning ? 'Executando...' : 'Iniciar verificação'}
        </button>
      </div>

      {error ? (
        <div className="scan-error" role="alert">
          <span className="scan-error-title">Erro:</span> {error}
        </div>
      ) : null}

      {result ? (
        <div className="scan-result" aria-live="polite">
          <div className="scan-result-header">
            <div>
              <h3>Relatório de verificação</h3>
              <p>
                Tipo: <b>{result.mode_label}</b>
              </p>
            </div>
            <div className="scan-result-meta">
              <div className="scan-badge">CPU: {result.summary.cpu_usage_percent.toFixed(1)}%</div>
              <div className="scan-badge">RAM: {result.summary.memory_usage_percent.toFixed(1)}%</div>
              <div className="scan-badge">Processos: {result.summary.process_count}</div>
            </div>
          </div>

          <div className="scan-findings">
            <h4>Achados</h4>
            {result.findings.length ? (
              <ul className="scan-finding-list">
                {result.findings.map((f) => (
                  <li key={f.id} className={`scan-finding scan-${f.severity.toLowerCase()}`}>
                    <div className="scan-finding-top">
                      <span className="scan-finding-title">{f.title}</span>
                      <span className="scan-finding-severity">{f.severity}</span>
                    </div>
                    <p className="scan-finding-desc">{f.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="scan-ok">Nenhum risco crítico detectado nesta verificação.</div>
            )}
          </div>
        </div>
      ) : null}

      <div className="dashboard-grid">
        {cards.map((c) => {
          const selected = mode === c.key;
          return (
            <article
              key={c.key}
              className={`info-card info-card-select ${selected ? 'selected' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(c.key);
              }}
              aria-pressed={selected}
            >
              <h4>{c.title}</h4>
              <p>{c.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Scan;

