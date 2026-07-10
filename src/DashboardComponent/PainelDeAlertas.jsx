import React, { useState, useEffect } from 'react';
import { useSystemAlerts } from '../hooks/useSystemMonitoring';
import './PainelDeAlertas.css';

const AlertsPanel = () => {
  const { alerts: systemAlerts } = useSystemAlerts(4000);
  const [filter, setFilter] = useState('all');
  const [displayAlerts, setDisplayAlerts] = useState([]);

  useEffect(() => {
    if (systemAlerts && systemAlerts.length > 0) {
      const formattedAlerts = systemAlerts.map(alert => ({
        ...alert,
        type: alert.alert_type,
        severity: alert.severity || 'low',
        source: 'System Monitor',
        target: 'localhost'
      }));
      setDisplayAlerts(formattedAlerts);
    }
  }, [systemAlerts]);

  const filteredAlerts = filter === 'all'
    ? displayAlerts
    : displayAlerts.filter(alert => alert.severity === filter);

  const criticalCount = displayAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="alerts-panel">
      <div className="panel-header">
        <h3>Alertas do sistema</h3>
        <div className={`alert-count ${criticalCount > 0 ? 'critical' : 'safe'}`}>
          {criticalCount > 0 ? `${criticalCount} Críticos` : 'Sistema OK'}
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({displayAlerts.length})
        </button>
        <button
          className={`filter-tab ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Crítico
        </button>
        <button
          className={`filter-tab ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          Alto
        </button>
        <button
          className={`filter-tab ${filter === 'medium' ? 'active' : ''}`}
          onClick={() => setFilter('medium')}
        >
          Médio
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity} ${alert.type}`}>
              <div className="alert-icon">
                <span className="icon">{getAlertIcon(alert.type)}</span>
              </div>
              <div className="alert-content">
                <div className="alert-header-row">
                  <span className="alert-title">{alert.title}</span>
                  <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                </div>
                <p className="alert-description">{alert.description}</p>
                <span className="alert-timestamp">{alert.timestamp}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-alerts">
            <span className="icon">✓</span>
            <p>Sistema operacional normalmente</p>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <span className="total-alerts">{displayAlerts.length} alertas total</span>
        <button className="view-all-btn">Ver Todos</button>
      </div>
    </div>
  );
};

const getAlertIcon = (type) => {
  const icons = {
    cpu_high: '⚡',
    memory_high: '💾',
    disk_full: '💿',
    process_high_cpu: '📊',
    network_issue: '🌐',
    temperature_high: '🔥'
  };
  return icons[type] || '❗';
};

export default AlertsPanel;