import React, { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';

cytoscape.use(fcose);

import { useNetworkMetrics, useSystemInfo } from '../hooks/useSystemMonitoring';
import './MapaDeRede.css';

const NetworkMap = () => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodeActivities, setNodeActivities] = useState({});
  const { networkMetrics } = useNetworkMetrics(3000);
  const { systemInfo } = useSystemInfo();

  const nodeData = [
    {
      id: 'gateway',
      label: 'GATEWAY',
      ip: 'GATEWAY',
      type: 'router',
      icon: '🛜',
      status: 'online',
      activity: 87,
    },
    {
      id: 'thispc',
      label: 'THIS PC',
      ip: networkMetrics?.[0]?.local_ip || 'localhost',
      type: 'client',
      icon: '💻',
      status: 'online',
      activity: 92,
    },
    {
      id: 'dns',
      label: 'DNS SERVER',
      ip: 'INTERNET',
      type: 'server',
      icon: '🌐',
      status: 'online',
      activity: 34,
    },
    {
      id: 'dhcp',
      label: 'DHCP',
      ip: 'GATEWAY',
      type: 'server',
      icon: '📡',
      status: 'online',
      activity: 12,
    },
  ];

  const edgeData = [
    { id: 'e1', source: 'gateway', target: 'thispc' },
    { id: 'e2', source: 'gateway', target: 'dns' },
    { id: 'e3', source: 'gateway', target: 'dhcp' },
    { id: 'e4', source: 'thispc', target: 'dns' },
  ];

  const getNodeIcon = (type) => {
    switch (type) {
      case 'router':
        return '◉';
      case 'server':
        return '◆';
      case 'client':
        return '○';
      case 'threat':
        return '⊗';
      default:
        return '●';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#00ff99';
      case 'warning':
        return '#ffcc00';
      case 'offline':
        return '#666666';
      case 'attack':
        return '#ff0033';
      default:
        return '#00ff99';
    }
  };

  // Mantido caso você queira usar no future (atualmente não é usado no Cytoscape)
  const getBgGradient = (type, status) => {
    if (type === 'threat') return 'radial-gradient(circle, #2a0510 0%, #150308 100%)';
    if (status === 'offline') return 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 100%)';
    if (status === 'warning') return 'radial-gradient(circle, #1a1505 0%, #0d0a03 100%)';
    if (type === 'router') return 'radial-gradient(circle, #001533 0%, #000a1a 100%)';
    if (type === 'client') return 'radial-gradient(circle, #1a1500 0%, #0d0a00 100%)';
    return 'radial-gradient(circle, #001a15 0%, #000d0a 100%)';
  };

  const initCytoscape = useCallback(() => {
    if (!containerRef.current || cyRef.current) return;

    const elements = [
      ...nodeData.map((node) => ({
        data: {
          id: node.id,
          icon: node.icon,
          label: node.label,
          ip: node.ip,
          type: node.type,
          status: node.status,
          activity: node.activity,
        },
      })),
      ...edgeData.map((edge) => ({ data: { ...edge } })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            // Ícone (1ª linha) + rótulo correto do servidor (2ª linha)
            'label': 'data(icon)\n\ndata(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': -6,

            // Maior e mais legível
            'font-size': '9px',
            'line-height': 1.15,
            'font-family': '"SF Mono", "Fira Code", "Courier New", monospace',
            'color': '#ffffff',
            'text-outline-color': '#050b0f',
            'text-outline-width': 2,

            // Espaço suficiente para o texto não “colar”
            'width': 62,
            'height': 62,

            'background-color': '#0a1a25',
            'background-image':
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="%2300ff99" stroke-width="2" opacity="0.3"/></svg>',
            'background-fit': 'contain',
            'background-opacity': 0.2,

            'border-width': 2,
            'border-color': '#00ff99',
            'shape': 'ellipse',
            'transition-property': 'background-color, border-color, width, height, opacity, border-width',
            'transition-duration': 0.3,
          },
        },

        {
          selector: 'node:selected',
          style: {
            'background-color': '#0a2a3a',
            'border-color': '#ffffff',
            'border-width': 4,
            'width': 72,
            'height': 72,
          },
        },
        {
          selector: 'node[?online]',
          style: { opacity: 1 },
        },
        {
          selector: 'node[!online]',
          style: {
            opacity: 0.35,
            'background-color': '#1a1a1a',
            'border-color': '#444444',
          },
        },
        {
          selector: 'node[type="router"]',
          style: {
            shape: 'hexagon',
            width: 98,
            height: 98,
          },
        },
        {
          selector: 'node[type="server"]',
          style: {
            shape: 'round-rectangle',
            width: 76,
            height: 76,
          },
        },
        {
          selector: 'node[type="client"]',
          style: {
            shape: 'ellipse',
            width: 70,
            height: 70,
          },
        },
        {
          selector: 'node[type="threat"]',
          style: {
            shape: 'diamond',
            width: 80,
            height: 80,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#00ff99',
            'target-arrow-color': '#00ff99',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': 'solid',
            opacity: 0.7,
          },
        },
        {
          selector: 'edge[isThreat]',
          style: {
            'line-color': '#ff0033',
            'target-arrow-color': '#ff0033',
            width: 2.5,
            opacity: 0.8,
            'line-style': 'solid',
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#ffffff',
            'target-arrow-color': '#ffffff',
            width: 3,
            opacity: 1,
          },
        },
      ],
      layout: {
        name: 'fcose',
        quality: 'proof',
        randomize: false,
        animate: true,
        animationDuration: 1000,
        fit: true,

        // Abre mais o layout (evita nós “juntos/colados”)
        padding: 90,
        nodeRepulsion: 8000,
        idealEdgeLength: 220,
        edgeElasticity: 0.5,
        gravity: 0.12,
      },
      wheelInput: true,
      boxSelectionEnabled: true,
      autounselectify: false,
      autoungrabify: false,
      userPanningEnabled: true,
      userZoomingEnabled: true,
    });

    const edgePulseIntervalRef = { current: null };

    cy.on('tap', 'node', (evt) => {
      const data = evt.target.data();
      setSelectedNode(data);
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      node.animate({
        style: {
          'border-width': 4,
          width: node.data('type') === 'router' ? 110 : node.data('type') === 'server' ? 90 : 80,
          height: node.data('type') === 'router' ? 110 : node.data('type') === 'server' ? 90 : 80,
        },
        duration: 150,
      });
      setHoveredNode(node.data());
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      node.animate({
        style: {
          'border-width': 2,
          width:
            node.data('type') === 'router'
              ? 98
              : node.data('type') === 'server'
                ? 76
                : node.data('type') === 'threat'
                  ? 80
                  : 62,
          height:
            node.data('type') === 'router'
              ? 98
              : node.data('type') === 'server'
                ? 76
                : node.data('type') === 'threat'
                  ? 80
                  : 62,
        },
        duration: 150,
      });
      setHoveredNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    // Pulse animation nas arestas
    edgePulseIntervalRef.current = setInterval(() => {
      cy.edges().forEach((edge) => {
        edge.animate({ style: { opacity: 1 } }, { duration: 400 });
        edge.animate({ style: { opacity: 0.3 } }, { duration: 400 });
      });
    }, 1000);

    cyRef.current = cy;
  }, []);

  useEffect(() => {
    initCytoscape();

    const activityInterval = setInterval(() => {
      setNodeActivities((prev) => {
        const newActivities = {};
        nodeData.forEach((node) => {
          if (node.type !== 'threat' && node.status !== 'offline') {
            const currentActivity = prev[node.id] ?? node.activity;
            newActivities[node.id] = Math.max(5, Math.min(98, currentActivity + (Math.random() - 0.5) * 12));
          } else if (node.type === 'threat') {
            newActivities[node.id] = 100;
          } else {
            newActivities[node.id] = 0;
          }
        });
        return newActivities;
      });
    }, 1800);

    return () => {
      clearInterval(activityInterval);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [initCytoscape]);

  const handleZoomIn = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const current = cy.zoom();
    const next = Math.min(4, current * 1.25);
    cy.zoom(next);
    cy.animate({ duration: 200 });
  };

  const handleZoomOut = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const current = cy.zoom();
    const next = Math.max(0.1, current / 1.25);
    cy.zoom(next);
    cy.animate({ duration: 200 });
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { eles: cyRef.current.nodes(), padding: 70 },
        duration: 350,
        easing: 'ease-out-cubic',
      });
    }
  };

  const handleLayoutChange = () => {
    if (cyRef.current) {
      cyRef.current
        .layout({
          name: 'fcose',
          quality: 'proof',
          randomize: false,
          animate: true,
          animationDuration: 1000,
          fit: true,
          padding: 90,
          nodeRepulsion: 8000,
          idealEdgeLength: 220,
          edgeElasticity: 0.5,
          gravity: 0.12,
        })
        .run();
    }
  };

  const getDisplayActivity = (nodeId, defaultActivity) => {
    return nodeActivities[nodeId] ?? defaultActivity;
  };

  return (
    <div className="network-map-container">
      <div className="map-header">
        <div className="map-title">
          <h3>Mapa de rede</h3>
          <span className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </span>
        </div>
        <div className="map-controls">
          <button onClick={handleZoomIn} className="control-btn" title="Zoom In">
            +
          </button>
          <button onClick={handleZoomOut} className="control-btn" title="Zoom Out">
            −
          </button>
          <button onClick={handleFit} className="control-btn" title="Fit View">
            FIT
          </button>
          <button onClick={handleLayoutChange} className="control-btn" title="Refresh Layout">
            ↻
          </button>
        </div>
      </div>

      <div className="map-viewport">
        <div ref={containerRef} className="cytoscape-container" />

        {hoveredNode && !selectedNode && (
          <div className="node-tooltip" style={{ '--status-color': getStatusColor(hoveredNode.status) }}>
            <span className="tooltip-icon">{getNodeIcon(hoveredNode.type)}</span>
            <div className="tooltip-content">
              <span className="tooltip-label">{hoveredNode.label}</span>
              <span className="tooltip-ip">{hoveredNode.ip}</span>
            </div>
            <div className="tooltip-activity">
              <div className="mini-bar">
                <div
                  className="mini-fill"
                  style={{ width: `${getDisplayActivity(hoveredNode.id, hoveredNode.activity)}%` }}
                />
              </div>
              <span>{Math.round(getDisplayActivity(hoveredNode.id, hoveredNode.activity))}%</span>
            </div>
          </div>
        )}

        {selectedNode && (
          <div className="node-detail-panel" style={{ '--status-color': getStatusColor(selectedNode.status) }}>
            <div className="detail-header">
              <span className="detail-icon">{getNodeIcon(selectedNode.type)}</span>
              <div className="detail-title">
                <h4>{selectedNode.label}</h4>
                <span className="detail-type">{selectedNode.type.toUpperCase()}</span>
              </div>
              <span className={`detail-status ${selectedNode.status}`}>{selectedNode.status}</span>
            </div>
            <div className="detail-body">
              <div className="detail-row">
                <span className="detail-key">IP Address</span>
                <span className="detail-value mono">{selectedNode.ip}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Activity</span>
                <div className="detail-activity">
                  <div className="activity-track">
                    <div
                      className="activity-fill"
                      style={{ width: `${getDisplayActivity(selectedNode.id, selectedNode.activity)}%` }}
                    />
                  </div>
                  <span className="mono">{Math.round(getDisplayActivity(selectedNode.id, selectedNode.activity))}%</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-key">Latency</span>
                <span className="detail-value mono">
                  {selectedNode.type === 'threat' ? 'N/A' : `${Math.floor(Math.random() * 40 + 2)}ms`}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Packets/s</span>
                <span className="detail-value mono">
                  {selectedNode.type === 'threat' ? 'ATTACK' : `${Math.floor(Math.random() * 8000 + 200)}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot router"></span>
          <span>Gateway</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot server"></span>
          <span>Server</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot client"></span>
          <span>This Computer</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkMap;

