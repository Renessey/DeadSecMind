import React from 'react';
import MapaDeRede from '../DashboardComponent/MapaDeRede';
import PainelDeAlertas from '../DashboardComponent/PainelDeAlertas';
import GraficoDeTráfego from '../DashboardComponent/GraficoDeTráfego';
import StatusDeSeguranca from '../DashboardComponent/StatusDeSeguranca';
import './Dashboard.css';

import {
  useCpuMetrics,
  useMemoryMetrics,
  useSystemInfo
} from '../hooks/useSystemMonitoring';

function Dashboard() {
  const { cpuMetrics } = useCpuMetrics(1000);
  const { memoryMetrics } = useMemoryMetrics(1000);
  const { systemInfo } = useSystemInfo();

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = () => {
    if (!cpuMetrics || !memoryMetrics) return 'protected';

    const avgUsage = (cpuMetrics.usage_percent + memoryMetrics.percent) / 2;

    if (avgUsage > 85) return 'critical';
    if (avgUsage > 65) return 'warning';
    return 'protected';
  };

  return (
    <section className="page-content cyber-dashboard">
      <div className="page-header cyber-header">
        <div className="header-left">
          <div className="glitch-wrapper">
            <h2 className="glitch" data-text="SOC Dashboard">
              SOC Dashboard
            </h2>
          </div>

          <p className="header-subtitle">
            {systemInfo ? (
              <>
                {systemInfo.hostname} {' • '} {systemInfo.os_name} {' • '} {systemInfo.cpu_brand}
              </>
            ) : (
              'Security Operations Center - Monitoring Suite'
            )}
          </p>
        </div>

        <div className="header-right">

          <div className="datetime-display">
            <span className="time">{currentTime.toLocaleTimeString('pt-BR')}</span>
            <span className="date">{currentTime.toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid cyber-grid">
        <div className="grid-main">
          <MapaDeRede />
        </div>
        <div className="grid-sidebar">
          <PainelDeAlertas />
        </div>
        <div className="grid-traffic">
          <GraficoDeTráfego />
        </div>
        <div className="grid-security">
          <StatusDeSeguranca />
        </div>
      </div>
    </section>
  );
}

export default Dashboard;

