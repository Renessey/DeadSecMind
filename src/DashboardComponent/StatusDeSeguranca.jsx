import React, { useState, useEffect } from 'react';
import { 
  useCpuMetrics, 
  useMemoryMetrics, 
  useDiskMetrics, 
  useUptime, 
  useTopProcesses,
  formatBytes,
  formatUptime 
} from '../hooks/useSystemMonitoring';
import './StatusDeSeguranca.css';

const SecurityStatus = () => {
  const { cpuMetrics } = useCpuMetrics(2000);
  const { memoryMetrics } = useMemoryMetrics(2000);
  const { diskMetrics } = useDiskMetrics(5000);
  const { uptime } = useUptime(5000);
  const { processes } = useTopProcesses(3, 3000);

  const [securityMetrics, setSecurityMetrics] = useState({
    firewall: { status: 'active', value: 100 },
    network: { status: 'active', value: 95 },
    processes: { status: 'active', value: 98 },
    drives: { status: 'active', value: 85 },
    system: { status: 'active', value: 99 }
  });

  useEffect(() => {
    if (cpuMetrics && memoryMetrics && diskMetrics && processes) {
      const getPrimaryDiskHealth = () => {
        if (diskMetrics.length === 0) return 100;
        const primaryDisk = diskMetrics[0];
        return Math.max(0, 100 - primaryDisk.percent);
      };

      const getProcessHealth = () => {
        if (processes.length === 0) return 100;
        const topCpuUsage = processes[0]?.cpu_usage || 0;
        return Math.max(0, 100 - (topCpuUsage * 0.5));
      };

      setSecurityMetrics({
        firewall: { status: 'active', value: 100 },
        network: { status: 'active', value: Math.min(100, (100 - cpuMetrics.usage_percent) * 1.2) },
        processes: { status: 'active', value: getProcessHealth() },
        drives: { status: getPrimaryDiskHealth() > 80 ? 'active' : 'warning', value: getPrimaryDiskHealth() },
        system: { status: 'active', value: Math.min(100, (100 - memoryMetrics.percent) * 1.1) }
      });
    }
  }, [cpuMetrics, memoryMetrics, diskMetrics, processes]);

  const [systemHealth, setSystemHealth] = useState({
    uptime: '0d 0h 0m',
    cpuUsage: '0%',
    cpuTemp: 'N/A',
    memoryUsage: '0%'
  });

  useEffect(() => {
    if (cpuMetrics && memoryMetrics && uptime) {
      setSystemHealth({
        uptime: formatUptime(uptime),
        cpuUsage: cpuMetrics.usage_percent.toFixed(1) + '%',
        cpuTemp: 'N/A',
        memoryUsage: memoryMetrics.percent.toFixed(1) + '%'
      });
    }
  }, [cpuMetrics, memoryMetrics, uptime]);

  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    if (processes && processes.length > 0) {
      const logs = processes.slice(0, 3).map((proc, idx) => ({
        id: proc.pid,
        time: new Date().toLocaleTimeString('pt-BR'),
        event: `${proc.name}`,
        cpu: proc.cpu_usage.toFixed(1) + '%',
        memory: formatBytes(proc.memory_usage),
        status: proc.cpu_usage > 30 ? 'warning' : 'success'
      }));
      setRecentLogs(logs);
    }
  }, [processes]);

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'warning') return 'warning';
    return 'inactive';
  };

  return (
    <div className="security-status-container">
      <div className="security-section">
        <h3> Status do Sistema</h3>
        <div className="security-modules">
          {Object.entries(securityMetrics).map(([key, module]) => (
            <div key={key} className={`security-module ${getStatusClass(module.status)}`}>
              <div className="module-header">
                <span className="module-name">{key.toUpperCase()}</span>
                <span className={`module-status ${getStatusClass(module.status)}`}>
                  {module.status === 'active' ? '✓' : '!'}
                </span>
              </div>
              <div className="module-bar">
                <div className="module-fill" style={{ width: `${module.value}%` }}></div>
              </div>
              <span className="module-value">{module.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="system-health">
        <h3> Saúde do Sistema</h3>
        <div className="health-grid">
          <div className="health-item">
            <span className="health-label">Uptime</span>
            <span className="health-value green">{systemHealth.uptime}</span>
          </div>
          <div className="health-item">
            <span className="health-label">CPU</span>
            <span className={`health-value ${cpuMetrics && cpuMetrics.usage_percent > 80 ? 'red' : 'green'}`}>
              {systemHealth.cpuUsage}
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">Memória</span>
            <span className={`health-value ${memoryMetrics && memoryMetrics.percent > 80 ? 'red' : 'green'}`}>
              {systemHealth.memoryUsage}
            </span>
          </div>
          <div className="health-item">
            <span className="health-label">RAM Total</span>
            <span className="health-value cyan">{formatBytes(memoryMetrics?.total || 0)}</span>
          </div>
        </div>
      </div>

      <div className="drives-section">
        <h3> Discos</h3>
        <div className="drives-list">
          {diskMetrics && diskMetrics.length > 0 ? (
            diskMetrics.map((disk, idx) => (
              <div key={idx} className={`drive-item ${disk.percent > 80 ? 'warning' : 'safe'}`}>
                <div className="drive-header">
                  <span className="drive-name">{disk.name}</span>
                  <span className="drive-usage">{disk.percent.toFixed(1)}%</span>
                </div>
                <div className="drive-bar">
                  <div 
                    className="drive-fill" 
                    style={{ 
                      width: `${disk.percent}%`,
                      backgroundColor: disk.percent > 90 ? '#ff3333' : disk.percent > 70 ? '#ffaa33' : '#00ff88'
                    }}
                  ></div>
                </div>
                <div className="drive-details">
                  <span className="drive-used">{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                  <span className="drive-free">Livre: {formatBytes(disk.available)}</span>
                </div>
              </div>
            ))
          ) : (
            <p>Carregando informações de disco...</p>
          )}
        </div>
      </div>

      <div className="processes-section">
        <h3> Top Processos (CPU)</h3>
        <div className="processes-list">
          {recentLogs.length > 0 ? (
            recentLogs.map(log => (
              <div key={log.id} className={`process-item ${log.status}`}>
                <div className="process-header">
                  <span className="process-name">{log.event}</span>
                  <span className="process-status">{log.status === 'warning' ? '⚠' : '✓'}</span>
                </div>
                <div className="process-details">
                  <span className="process-cpu">CPU: {log.cpu}</span>
                  <span className="process-memory">MEM: {log.memory}</span>
                </div>
              </div>
            ))
          ) : (
            <p>Carregando processos...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityStatus;