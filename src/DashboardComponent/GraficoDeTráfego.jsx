import React, { useState, useEffect, useRef } from 'react';
import { useNetworkMetrics, formatBytes } from '../hooks/useSystemMonitoring';
import './GraficoDeTráfego.css';

const TrafficChart = () => {
  const { networkMetrics } = useNetworkMetrics(2000);
  const [trafficHistory, setTrafficHistory] = useState([]);
  const chartRef = useRef(null);

  // Armazena o snapshot anterior para calcular delta => throughput.
  const prevSnapshotRef = useRef(null);

  useEffect(() => {
    if (!networkMetrics || networkMetrics.length === 0) return;

    const now = Date.now();
    const currentTime = new Date(now).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Total agregado (todas interfaces)
    const totalInBytes = networkMetrics.reduce((sum, m) => sum + (m.received_bytes || 0), 0);
    const totalOutBytes = networkMetrics.reduce((sum, m) => sum + (m.transmitted_bytes || 0), 0);

    const prev = prevSnapshotRef.current;

    // Primeira amostra: não temos delta.
    if (!prev) {
      prevSnapshotRef.current = {
        t: now,
        inBytes: totalInBytes,
        outBytes: totalOutBytes
      };
      return;
    }

    const dtSeconds = Math.max((now - prev.t) / 1000, 0.001);
    const deltaIn = Math.max(totalInBytes - prev.inBytes, 0);
    const deltaOut = Math.max(totalOutBytes - prev.outBytes, 0);

    const inRateBps = deltaIn / dtSeconds;
    const outRateBps = deltaOut / dtSeconds;

    prevSnapshotRef.current = {
      t: now,
      inBytes: totalInBytes,
      outBytes: totalOutBytes
    };

    // UI: barras em MB/s (escala dinâmica ainda usa maxTraffic)
    setTrafficHistory(prevHistory => {
      const newHistory = [...prevHistory];
      newHistory.push({
        time: currentTime,
        // valores guardados apenas para debugging/estats futuras
        in: totalInBytes,
        out: totalOutBytes,
        inRateBytesPerSec: inRateBps,
        outRateBytesPerSec: outRateBps,
        display: Math.round(inRateBps / (1024 * 1024)),
        displayOut: Math.round(outRateBps / (1024 * 1024))
      });

      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
  }, [networkMetrics]);


  const getBarHeight = (value, maxValue) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  const maxTraffic = Math.max(
    ...trafficHistory.map(d => Math.max(d.display, d.displayOut)),
    1
  );

  // Totais acumulados (volume geral desde inicialização do backend)
  const totalReceived = networkMetrics?.reduce((sum, m) => sum + (m.received_bytes || 0), 0) || 0;
  const totalTransmitted = networkMetrics?.reduce((sum, m) => sum + (m.transmitted_bytes || 0), 0) || 0;

  const localIp = networkMetrics?.[0]?.local_ip || 'N/A';

  return (
    <div className="traffic-chart-container">
      <div className="chart-header">
        <h3> Tráfego de rede</h3>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>LIVE</span>
        </div>
      </div>

      <div className="chart-area" ref={chartRef}>
        <div className="bars-container">
          {trafficHistory.length > 0 ? (
            trafficHistory.map((data, index) => (
              <div key={index} className="bar-group">
                <div className="bar-wrapper">
                  <div
                    className="bar bar-in"
                    style={{ height: `${getBarHeight(data.display, maxTraffic)}%` }}
                    title={`Download: ${data.display} MB/s`}
                  >
                    <div className="bar-glow"></div>
                  </div>
                  <div
                    className="bar bar-out"
                    style={{ height: `${getBarHeight(data.displayOut, maxTraffic)}%` }}
                    title={`Upload: ${data.displayOut} MB/s`}
                  ></div>
                </div>
                <span className="bar-label">{data.time}</span>
              </div>
            ))
          ) : (

            <div className="loading-bars">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="bar-group">
                  <div className="bar-wrapper">
                    <div className="bar bar-in" style={{ height: '0%' }}></div>
                    <div className="bar bar-out" style={{ height: '0%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color in"></span>
            <span>Download</span>
          </div>
          <div className="legend-item">
            <span className="legend-color out"></span>
            <span>Upload</span>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Download (total)</span>
          <span className="stat-value green">{formatBytes(totalReceived)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Upload (total)</span>
          <span className="stat-value blue">{formatBytes(totalTransmitted)}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">IP Local</span>
          <span className="stat-value cyan">{localIp}</span>
        </div>
      </div>


      <div className="bandwidth-section">
        <div className="bandwidth-header">
          <span>Interfaces de Rede</span>
          <span className="interface-count">{networkMetrics?.length || 0} ativas</span>
        </div>
        {networkMetrics && networkMetrics.length > 0 && (
          <div className="interface-list">
            {networkMetrics.map((iface, idx) => (
              <div key={idx} className="interface-item">
                <span className="interface-name">{iface.interface_name}</span>
                <div className="interface-stats">
                  <span className="stat-in">↓ {formatBytes(iface.received_bytes)}</span>
                  <span className="stat-out">↑ {formatBytes(iface.transmitted_bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="packet-stats">
        <div className="packet-stat">
          <span className="packet-icon sent">↑</span>
          <span className="packet-value">
            {networkMetrics?.reduce((sum, m) => sum + m.transmitted_packets, 0) || 0}
          </span>
          <span className="packet-label">Pacotes Enviados</span>
        </div>
        <div className="packet-stat">
          <span className="packet-icon received">↓</span>
          <span className="packet-value">
            {networkMetrics?.reduce((sum, m) => sum + m.received_packets, 0) || 0}
          </span>
          <span className="packet-label">Pacotes Recebidos</span>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart;