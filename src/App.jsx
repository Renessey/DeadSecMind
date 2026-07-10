import React, { useState } from 'react';
import BarraLateral from './components/BarraLateral';
import Cabecalho from './components/Cabecalho';
import Dashboard from './components/Dashboard';
import Verificacao from './components/Verificacao';
import Protecao from './components/Protecao';
import Privacidade from './components/Privacidade';
import Configuracao from './components/Configuracao';
import './styles/global.css';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const pageComponents = {
    dashboard: <Dashboard />,
    scan: <Verificacao />,
    protection: <Protecao />,
    privacy: <Privacidade />,
    performance: <Configuracao />,
  };

  return (
    <>
      <Cabecalho />

      <div className={`dashboard-container ${collapsed ? 'sidebar-closed' : ''}`}>
        <BarraLateral
          selectedPage={currentPage}
          onSelect={setCurrentPage}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />

        <main className="main-content">{pageComponents[currentPage]}</main>
      </div>
    </>
  );
}

export default App;

