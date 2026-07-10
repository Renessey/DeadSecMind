import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Configuracao.css';

function Configuracao() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const v = localStorage.getItem('dsm_notifications_enabled');
      if (v === '1') return true;
      if (v === '0') return false;
    } catch {
      // ignore
    }
    return true;
  });

  const [notifySeverity, setNotifySeverity] = useState(() => {
    try {
      const v = localStorage.getItem('dsm_notify_severity');
      return v ? v : 'critical';
    } catch {
      return 'critical';
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const v = localStorage.getItem('dsm_notify_sound_enabled');
      return v === '0' ? false : true;
    } catch {
      return true;
    }
  });

  const [maxBurstPerMinute, setMaxBurstPerMinute] = useState(() => {
    try {
      const v = localStorage.getItem('dsm_notify_burst');
      const n = Number(v);
      if (Number.isFinite(n) && n >= 1 && n <= 20) return n;
      return 5;
    } catch {
      return 5;
    }
  });

  const [testing, setTesting] = useState(false);
  const lastShownRef = useRef([]); // timestamps

  const persist = useCallback((key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    persist('dsm_notifications_enabled', notificationsEnabled ? '1' : '0');
  }, [notificationsEnabled, persist]);

  useEffect(() => {
    persist('dsm_notify_severity', notifySeverity);
  }, [notifySeverity, persist]);

  useEffect(() => {
    persist('dsm_notify_sound_enabled', soundEnabled ? '1' : '0');
  }, [soundEnabled, persist]);

  useEffect(() => {
    persist('dsm_notify_burst', String(maxBurstPerMinute));
  }, [maxBurstPerMinute, persist]);

  const canShowNow = useCallback(() => {
    const now = Date.now();
    const windowMs = 60_000;

    lastShownRef.current = lastShownRef.current.filter((t) => now - t <= windowMs);
    if (lastShownRef.current.length >= maxBurstPerMinute) return false;

    lastShownRef.current.push(now);
    return true;
  }, [maxBurstPerMinute]);

  const sendTauriNotification = useCallback(
    async ({ title, body, severity }) => {
      // Não vamos spammar: checagem de burst
      if (!notificationsEnabled) return;
      if (!canShowNow()) return;

      // Filtro por severidade (simples)
      const order = { info: 1, warning: 2, critical: 3 };
      const current = order[notifySeverity] ?? 3;
      const incoming = order[severity] ?? 3;
      if (incoming < current) return;

      // Com plugin do Tauri, o app envia notificação no Windows.
      // Se o comando não existir no backend, cai em fallback visual (sem quebrar).
      try {
        await invoke('notify_app', {
          title,
          body,
          severity,
          soundEnabled,
        });
      } catch (e) {
        // Fallback: usa Notification do navegador (não é perfeito no Tauri, mas evita quebra)
        try {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              // eslint-disable-next-line no-new
              new Notification(title, { body });
            }
          }
        } catch {
          // ignore
        }
      }
    },
    [canShowNow, notificationsEnabled, notifySeverity, soundEnabled]
  );

  const handleToggleNotifications = useCallback(async () => {
    setNotificationsEnabled((v) => !v);
    // Ao ativar/desativar, mandamos apenas 1 notificação (se habilitado)
  }, []);

  useEffect(() => {
    let alive = true;

    // Apenas para garantir que as notificações funcionam sem depender do restante do app.
    // Mostra uma notificação inicial somente uma vez por sessão quando habilitado.
    if (!notificationsEnabled) return;

    const key = 'dsm_notifications_initial_shown';
    try {
      const already = sessionStorage.getItem(key);
      if (already === '1') return;
    } catch {
      // ignore
    }

    (async () => {
      if (!alive) return;
      await sendTauriNotification({
        title: 'DeadSecMind',
        body: 'Notificações ativadas. Alertas serão enviados quando necessário.',
        severity: 'info',
      });
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [notificationsEnabled, sendTauriNotification]);

  const handleTestNotification = useCallback(async () => {
    setTesting(true);
    try {
      await sendTauriNotification({
        title: 'Teste de notificação',
        body: `Severidade: ${notifySeverity}. Burst máx.: ${maxBurstPerMinute}/min.`,
        severity: 'critical',
      });
    } finally {
      setTesting(false);
    }
  }, [maxBurstPerMinute, notifySeverity, sendTauriNotification]);

  const headerPill = useMemo(() => {
    if (!notificationsEnabled) return { cls: 'unknown', text: 'Notificações desativadas' };
    if (notifySeverity === 'critical') return { cls: 'active', text: 'Modo SOC: Critical' };
    if (notifySeverity === 'warning') return { cls: 'semi-active', text: 'Modo SOC: Warning+' };
    return { cls: 'semi-active', text: 'Modo SOC: Todos os alertas' };
  }, [notifySeverity, notificationsEnabled]);

  return (
    <section className="page-content config-page cyber-dashboard">
      <div className="page-header cyber-header">
        <div>
          <h2>Configuração</h2>
          <p>Preferências operacionais, auditoria e alertas — no mesmo padrão corporativo do SOC.</p>
        </div>
        <span className={`status-pill ${headerPill.cls}`}>{headerPill.text}</span>
      </div>

      <div className="dashboard-grid cyber-grid">
        <div className="grid-main">
          <div className="config-section">
            <div className="config-section-title">
              <h3>Notificações do App</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="metric-badge">Windows • 2º plano</span>
              </div>
            </div>

            <div className="config-row">
              <div className="config-card">
                <div className="cfg-controls config-controls">
                  <div className="cfg-toggle" role="group" aria-label="Ativar/desativar notificações">
                    <div className="cfg-toggle-left">
                      <strong>Notificações</strong>
                      <span>Alertas do sistema sem roubar foco.</span>
                    </div>

                    <div
                      className={`cfg-switch ${notificationsEnabled ? 'on' : ''}`}
                      role="switch"
                      aria-checked={notificationsEnabled}
                      tabIndex={0}
                      onClick={handleToggleNotifications}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleToggleNotifications();
                      }}
                      title={notificationsEnabled ? 'Desativar' : 'Ativar'}
                    >
                      <div className="cfg-switch-dot" />
                    </div>
                  </div>

                  <div className="cfg-grid-2" style={{ marginTop: 12 }}>
                    <div className="cfg-kv">
                      <strong>Limiar</strong>
                      <span>
                        <select
                          value={notifySeverity}
                          onChange={(e) => setNotifySeverity(e.target.value)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(225,235,255,0.98)',
                            borderRadius: 12,
                            padding: '8px 10px',
                            outline: 'none',
                          }}
                          aria-label="Limiar de severidade das notificações"
                        >
                          <option value="critical">Critical</option>
                          <option value="warning">Warning+</option>
                          <option value="info">Info+</option>
                        </select>
                      </span>
                    </div>

                    <div className="cfg-kv">
                      <strong>Som</strong>
                      <span>
                        <div
                          className={`cfg-switch ${soundEnabled ? 'on' : ''}`}
                          role="switch"
                          aria-checked={soundEnabled}
                          tabIndex={0}
                          onClick={() => setSoundEnabled((v) => !v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSoundEnabled((v) => !v);
                          }}
                          title={soundEnabled ? 'Desativar som' : 'Ativar som'}
                          style={{ marginLeft: 'auto' }}
                        >
                          <div className="cfg-switch-dot" />
                        </div>
                      </span>
                    </div>

                    <div className="cfg-kv" style={{ gridColumn: '1 / -1' }}>
                      <strong>Anti-spam (burst)</strong>
                      <span>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={maxBurstPerMinute}
                          onChange={(e) => setMaxBurstPerMinute(Number(e.target.value))}
                          aria-label="Máximo de notificações por minuto"
                        />
                        <span style={{ marginLeft: 10, minWidth: 110, display: 'inline-block' }}>
                          {maxBurstPerMinute}/min
                        </span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="cfg-btn"
                      onClick={handleTestNotification}
                      disabled={testing || !notificationsEnabled}
                    >
                      {testing ? 'Enviando...' : 'Enviar notificação de teste'}
                    </button>

                    <button
                      type="button"
                      className="cfg-btn"
                      onClick={() => {
                        lastShownRef.current = [];
                        try {
                          sessionStorage.removeItem('dsm_notifications_initial_shown');
                        } catch {
                          // ignore
                        }
                        sendTauriNotification({
                          title: 'Estado de notificações',
                          body: notificationsEnabled
                            ? 'Notificações ativas. Limiar e anti-spam aplicados.'
                            : 'Notificações desativadas. Ative para receber alertas.',
                          severity: notificationsEnabled ? 'info' : 'warning',
                        });
                      }}
                    >
                      Atualizar status
                    </button>
                  </div>

                  <p style={{ marginTop: 12, color: 'rgba(136,153,170,0.95)', lineHeight: 1.45, fontSize: 12 }}>
                    O Windows exibirá notificações em 2º plano. O ícone do app ficará sinalizado na área oculta
                    do sistema enquanto alertas estiverem pendentes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="config-section">
            <div className="config-section-title">
              <h3>Preferências Operacionais</h3>
            </div>

            <div className="config-row">
              <div className="config-card">
                <h4>Política de alertas</h4>
                <p>Define como o SOC classifica eventos para alertar com menor ruído e maior precisão.</p>

                <div className="config-controls">
                  <div className="cfg-kv">
                    <strong>Auto-rotulagem</strong>
                    <span>Ativa (padrão)</span>
                  </div>
                  <div className="cfg-kv">
                    <strong>Confirmação manual</strong>
                    <span>Opcional</span>
                  </div>
                  <div className="cfg-kv">
                    <strong>Retenção visual</strong>
                    <span>10 min</span>
                  </div>
                </div>
              </div>

              <div className="config-card">
                <h4>Auditoria e conformidade</h4>
                <p>Controle corporativo para rastrear mudanças de configuração e evitar ações não autorizadas.</p>

                <div className="config-controls">
                  <div className="cfg-toggle" style={{ marginTop: 6 }}>
                    <div className="cfg-toggle-left">
                      <strong>Registrar eventos</strong>
                      <span>Logs locais para investigação.</span>
                    </div>
                    <div
                      className={`cfg-switch on`}
                      role="switch"
                      aria-checked={true}
                      tabIndex={0}
                      title="Ativo"
                      onClick={() => {}}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {}
                      }}
                    >
                      <div className="cfg-switch-dot" />
                    </div>
                  </div>

                  <div className="cfg-toggle" style={{ marginTop: 10 }}>
                    <div className="cfg-toggle-left">
                      <strong>Modo reforçado</strong>
                      <span>Reduz dependências de UI.</span>
                    </div>
                    <div
                      className={`cfg-switch on`}
                      role="switch"
                      aria-checked={true}
                      tabIndex={0}
                      title="Ativo"
                      onClick={() => {}}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {}
                      }}
                    >
                      <div className="cfg-switch-dot" />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cfg-btn"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      try {
                        const payload = {
                          notificationsEnabled,
                          notifySeverity,
                          soundEnabled,
                          maxBurstPerMinute,
                          ts: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(payload, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `deadsecmind-config-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Exportar configuração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-sidebar">
          <div className="config-section">
            <div className="config-section-title">
              <h3>Resumo SOC</h3>
            </div>

            <div className="config-card">
              <h4>Saúde do monitoramento</h4>
              <p>Visão geral do estado operacional do app — útil para auditorias e troubleshooting.</p>

              <div className="config-controls">
                <div className="cfg-kv">
                  <strong>Notificações</strong>
                  <span>{notificationsEnabled ? 'Ativas' : 'Desativadas'}</span>
                </div>
                <div className="cfg-kv">
                  <strong>Limiar</strong>
                  <span>{notifySeverity}</span>
                </div>
                <div className="cfg-kv">
                  <strong>Anti-spam</strong>
                  <span>{maxBurstPerMinute}/min</span>
                </div>
                <div className="cfg-kv">
                  <strong>Som</strong>
                  <span>{soundEnabled ? 'Ativo' : 'Inativo'}</span>
                </div>

                <button
                  type="button"
                  className="cfg-btn"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    sendTauriNotification({
                      title: 'Resumo do SOC',
                      body: `Status: ${notificationsEnabled ? 'Notificações ativas' : 'Notificações desativadas'} • Limiar ${notifySeverity}.`,
                      severity: notificationsEnabled ? 'info' : 'warning',
                    });
                  }}
                  disabled={!notificationsEnabled}
                >
                  Notificar resumo
                </button>
              </div>
            </div>

            <div className="config-section" style={{ marginTop: 16 }}>
              <div className="config-section-title">
                <h3>Atalhos</h3>
              </div>

              <div className="config-card">
                <h4>Rotinas corporativas</h4>
                <p>Actions rápidas que normalmente empresas incluem na tela de configuração.</p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  <button
                    type="button"
                    className="cfg-btn"
                    onClick={() => {
                      setNotifySeverity('critical');
                      setSoundEnabled(true);
                      setMaxBurstPerMinute(5);
                    }}
                  >
                    Perfil: SOC Critical
                  </button>

                  <button
                    type="button"
                    className="cfg-btn"
                    onClick={() => {
                      setNotifySeverity('info');
                      setSoundEnabled(false);
                      setMaxBurstPerMinute(10);
                    }}
                  >
                    Perfil: Monitor total
                  </button>
                </div>

                <div style={{ marginTop: 12, color: 'rgba(136,153,170,0.95)', fontSize: 12, lineHeight: 1.45 }}>
                  Dica: ajuste o anti-spam para evitar excesso de notificações quando houver picos no sistema.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Configuracao;

