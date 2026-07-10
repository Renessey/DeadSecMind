import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldCheck, Eye, Globe, Lock, Cookie, Fingerprint, AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import './Privacidade.css';

const TABS = [
  { key: 'navegacao', label: 'Navegação', icon: Globe },
  { key: 'dados', label: 'Dados pessoais', icon: Fingerprint },
  { key: 'rastreadores', label: 'Rastreadores', icon: Eye },
  { key: 'vpn', label: 'VPN & Cripto', icon: Lock },
  { key: 'sistema', label: 'Proteção do Sistema', icon: ShieldCheck },
];

function StatusPill({ variant, children }) {
  return <span className={`status-pill ${variant}`}>{children}</span>;
}

function StatusIcon({ status, size = 20 }) {
  if (status === true || status === 'active') {
    return <CheckCircle size={size} className="status-icon active" />;
  } else if (status === false || status === 'inactive') {
    return <XCircle size={size} className="status-icon inactive" />;
  } else {
    return <AlertTriangle size={size} className="status-icon warning" />;
  }
}

/* ---------- toggle component ---------- */
function ToggleSwitch({ checked, onChange, label, description, disabled }) {
  return (
    <div className={`pv-toggle-row ${disabled ? 'pv-disabled' : ''}`}>
      <div className="pv-toggle-info">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <div
        className={`cfg-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        title={checked ? 'Desativar' : 'Ativar'}
      >
        <div className="cfg-switch-dot" />
      </div>
    </div>
  );
}

/* ---------- main component ---------- */
function Privacidade() {
  const [activeTab, setActiveTab] = useState('navegacao');
  const [loading, setLoading] = useState(false);
  const [systemData, setSystemData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // --- navegação state ---
  const [blockTrackers, setBlockTrackers] = useState(true);
  const [blockAds, setBlockAds] = useState(true);
  const [httpsOnly, setHttpsOnly] = useState(true);
  const [doNotTrack, setDoNotTrack] = useState(false);
  const [blockPopups, setBlockPopups] = useState(true);
  const [safeBrowsing, setSafeBrowsing] = useState(true);

  // --- dados state ---
  const [clearOnExit, setClearOnExit] = useState(false);
  const [autoFill, setAutoFill] = useState(true);
  const [passwordSave, setPasswordSave] = useState(false);
  const [formHistory, setFormHistory] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);

  // --- rastreadores state ---
  const [fingerprintProtection, setFingerprintProtection] = useState(true);
  const [cookieControl, setCookieControl] = useState(true);
  const [crossSiteTracking, setCrossSiteTracking] = useState(true);
  const [referrerPrivacy, setReferrerPrivacy] = useState(false);
  const [webRTCProtection, setWebRTCProtection] = useState(false);

  // --- vpn state ---
  const [dnsEncryption, setDnsEncryption] = useState(true);
  const [leakProtection, setLeakProtection] = useState(true);
  const [killSwitch, setKillSwitch] = useState(false);
  const [splitTunnel, setSplitTunnel] = useState(false);

  // Carregar dados do sistema ao montar
  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const summary = await invoke('get_privacy_summary');
      setSystemData(summary);
      
      const recs = await invoke('get_privacy_recommendations');
      setRecommendations(recs);
    } catch (error) {
      console.error('Erro ao carregar dados de privacidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrivacyScore = useMemo(() => {
    if (systemData) {
      return systemData.overall_score;
    }
    
    // Fallback para cálculo local se não houver dados do sistema
    const all = [
      blockTrackers, blockAds, httpsOnly, doNotTrack, blockPopups, safeBrowsing,
      clearOnExit, fingerprintProtection, cookieControl, crossSiteTracking,
      dnsEncryption, leakProtection, killSwitch, referrerPrivacy, webRTCProtection,
    ];
    const on = all.filter(Boolean).length;
    return Math.round((on / all.length) * 100);
  }, [
    systemData,
    blockTrackers, blockAds, httpsOnly, doNotTrack, blockPopups, safeBrowsing,
    clearOnExit, fingerprintProtection, cookieControl, crossSiteTracking,
    dnsEncryption, leakProtection, killSwitch, referrerPrivacy, webRTCProtection,
  ]);

  const scoreVariant = useMemo(() => {
    if (getPrivacyScore >= 75) return 'active';
    if (getPrivacyScore >= 45) return 'semi-active';
    return 'warning';
  }, [getPrivacyScore]);

  /* ---------- section renderers ---------- */

  const renderNavegacao = () => (
    <div className="pv-section-body">
      <div className="pv-summary-bar">
        <div className="pv-summary-left">
          <div className="pv-summary-icon"><Globe size={18} /></div>
          <div>
            <h3>Proteção de Navegação</h3>
            <p>Configure camadas de defesa durante a navegação na web.</p>
          </div>
        </div>
        <div className="pv-summary-right">
          <span className="pv-badge">5 de 6 ativos</span>
        </div>
      </div>

      <div className="pv-cards-grid">
        <div className="pv-card">
          <div className="pv-card-header">
            <ShieldCheck size={18} />
            <h4>Bloqueio de rastreadores</h4>
          </div>
          <p>Impedir sites de rastrear seu comportamento online.</p>
          <ToggleSwitch
            checked={blockTrackers}
            onChange={setBlockTrackers}
            label="Bloquear rastreadores"
            description="Detecta e bloqueia scripts de rastreamento conhecidos."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Eye size={18} />
            <h4>Bloqueio de anúncios</h4>
          </div>
          <p>Remover publicidade intrusiva e potencialmente maliciosa.</p>
          <ToggleSwitch
            checked={blockAds}
            onChange={setBlockAds}
            label="Ad blocker"
            description="Filtra anúncios de alto risco e phishing."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>HTTPS forçado</h4>
          </div>
          <p>Garantir conexões criptografadas em todas as navegações.</p>
          <ToggleSwitch
            checked={httpsOnly}
            onChange={setHttpsOnly}
            label="Modo HTTPS only"
            description="Redireciona automaticamente para versões seguras."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Globe size={18} />
            <h4>Solicitar Do Not Track</h4>
          </div>
          <p>Enviar sinal para sites solicitando que não rastreiem.</p>
          <ToggleSwitch
            checked={doNotTrack}
            onChange={setDoNotTrack}
            label="Do Not Track (DNT)"
            description="Cabeçalho HTTP que solicita não rastreamento."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <ShieldCheck size={18} />
            <h4>Bloqueio de pop-ups</h4>
          </div>
          <p>Evitar janelas indesejadas e redirecionamentos maliciosos.</p>
          <ToggleSwitch
            checked={blockPopups}
            onChange={setBlockPopups}
            label="Anti pop-up"
            description="Bloqueia janelas emergentes não solicitadas."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Navegação segura</h4>
          </div>
          <p>Verificar URLs contra bases de dados de ameaças conhecidas.</p>
          <ToggleSwitch
            checked={safeBrowsing}
            onChange={setSafeBrowsing}
            label="Safe Browsing"
            description="Alerta ao acessar sites perigosos ou fraudulentos."
          />
        </div>
      </div>
    </div>
  );

  const renderDados = () => (
    <div className="pv-section-body">
      <div className="pv-summary-bar">
        <div className="pv-summary-left">
          <div className="pv-summary-icon"><Fingerprint size={18} /></div>
          <div>
            <h3>Dados Pessoais</h3>
            <p>Controle como suas informações são armazenadas e usadas.</p>
          </div>
        </div>
        <div className="pv-summary-right">
          <span className="pv-badge">1 de 5 ativos</span>
        </div>
      </div>

      <div className="pv-cards-grid">
        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Limpeza automática</h4>
          </div>
          <p>Apagar dados de navegação ao fechar a sessão.</p>
          <ToggleSwitch
            checked={clearOnExit}
            onChange={setClearOnExit}
            label="Limpar ao sair"
            description="Remove histórico, cookies e cache ao encerrar o app."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Fingerprint size={18} />
            <h4>Preenchimento automático</h4>
          </div>
          <p>Salvar dados para formulários de forma segura.</p>
          <ToggleSwitch
            checked={autoFill}
            onChange={setAutoFill}
            label="Auto-fill"
            description="Preenche formulários automaticamente com dados locais."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Senhas salvas</h4>
          </div>
          <p>Armazenar credenciais de forma criptografada localmente.</p>
          <ToggleSwitch
            checked={passwordSave}
            onChange={setPasswordSave}
            label="Salvar senhas"
            description="Vault local criptografado para suas credenciais."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Fingerprint size={18} />
            <h4>Histórico de formulários</h4>
          </div>
          <p>Manter registro das informações inseridas em formulários.</p>
          <ToggleSwitch
            checked={formHistory}
            onChange={setFormHistory}
            label="Histórico de formulários"
            description="Lembrar dados preenchidos anteriormente."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Globe size={18} />
            <h4>Acesso à localização</h4>
          </div>
          <p>Permitir que sites solicitem sua localização geográfica.</p>
          <ToggleSwitch
            checked={locationAccess}
            onChange={setLocationAccess}
            label="Permitir localização"
            description="Sites poderão acessar dados de geolocalização."
          />
        </div>
      </div>
    </div>
  );

  const renderRastreadores = () => (
    <div className="pv-section-body">
      <div className="pv-summary-bar">
        <div className="pv-summary-left">
          <div className="pv-summary-icon"><Eye size={18} /></div>
          <div>
            <h3>Anti-Rastreamento</h3>
            <p>Técnicas avançadas para dificultar o rastreamento online.</p>
          </div>
        </div>
        <div className="pv-summary-right">
          <span className="pv-badge">3 de 5 ativos</span>
        </div>
      </div>

      <div className="pv-cards-grid">
        <div className="pv-card">
          <div className="pv-card-header">
            <Fingerprint size={18} />
            <h4>Proteção contra fingerprint</h4>
          </div>
          <p>Dificultar a identificação do seu navegador por impressão digital.</p>
          <ToggleSwitch
            checked={fingerprintProtection}
            onChange={setFingerprintProtection}
            label="Anti-fingerprint"
            description="Randomiza dados expostos para dificultar identificação."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Cookie size={18} />
            <h4>Controle de cookies</h4>
          </div>
          <p>Gerenciar cookies de terceiros e sessão automaticamente.</p>
          <ToggleSwitch
            checked={cookieControl}
            onChange={setCookieControl}
            label="Cookies inteligentes"
            description="Bloqueia cookies de rastreamento mantendo essenciais."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Eye size={18} />
            <h4>Anti cross-site tracking</h4>
          </div>
          <p>Impedir rastreamento entre diferentes sites.</p>
          <ToggleSwitch
            checked={crossSiteTracking}
            onChange={setCrossSiteTracking}
            label="Cross-site tracking"
            description="Bloqueia cookies e scripts entre domínios distintos."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Globe size={18} />
            <h4>Privacidade do Referrer</h4>
          </div>
          <p>Ocultar a URL de origem ao navegar entre sites.</p>
          <ToggleSwitch
            checked={referrerPrivacy}
            onChange={setReferrerPrivacy}
            label="Referrer stripping"
            description="Remove informações do cabeçalho Referer."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Proteção WebRTC</h4>
          </div>
          <p>Evitar que seu IP real vaze durante chamadas WebRTC.</p>
          <ToggleSwitch
            checked={webRTCProtection}
            onChange={setWebRTCProtection}
            label="WebRTC leak guard"
            description="Impede exposição do IP local via WebRTC."
          />
        </div>
      </div>
    </div>
  );

  const renderVPN = () => (
    <div className="pv-section-body">
      <div className="pv-summary-bar">
        <div className="pv-summary-left">
          <div className="pv-summary-icon"><Lock size={18} /></div>
          <div>
            <h3>VPN & Criptografia</h3>
            <p>Camadas de proteção de rede e criptografia de tráfego.</p>
          </div>
        </div>
        <div className="pv-summary-right">
          <span className="pv-badge">2 de 4 ativos</span>
        </div>
      </div>

      <div className="pv-cards-grid">
        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Criptografia DNS</h4>
          </div>
          <p>Encriptar consultas DNS para evitar interceptação.</p>
          <ToggleSwitch
            checked={dnsEncryption}
            onChange={setDnsEncryption}
            label="DNS over HTTPS"
            description="Utiliza DoH para proteger consultas de domínio."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <ShieldCheck size={18} />
            <h4>Anti-leak</h4>
          </div>
          <p>Prevenir vazamento de dados em caso de falha de VPN.</p>
          <ToggleSwitch
            checked={leakProtection}
            onChange={setLeakProtection}
            label="IP leak protection"
            description="Bloqueia tráfego se a conexão VPN cair."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Lock size={18} />
            <h4>Kill Switch</h4>
          </div>
          <p>Cortar internet completamente se a VPN falhar.</p>
          <ToggleSwitch
            checked={killSwitch}
            onChange={setKillSwitch}
            label="Kill Switch"
            description="Desconecta da internet se a VPN cair inesperadamente."
          />
        </div>

        <div className="pv-card">
          <div className="pv-card-header">
            <Globe size={18} />
            <h4>Split Tunneling</h4>
          </div>
          <p>Direcionar tráfego selectivamente pela VPN.</p>
          <ToggleSwitch
            checked={splitTunnel}
            onChange={setSplitTunnel}
            label="Split tunnel"
            description="Escolhe quais apps usam VPN e quais não."
          />
        </div>
      </div>
    </div>
  );

  const renderSistema = () => {
    if (loading) {
      return (
        <div className="pv-section-body">
          <div className="pv-loading">
            <RefreshCw size={32} className="spin" />
            <p>Carregando dados do sistema...</p>
          </div>
        </div>
      );
    }

    if (!systemData) {
      return (
        <div className="pv-section-body">
          <div className="pv-error">
            <AlertTriangle size={32} />
            <p>Erro ao carregar dados do sistema</p>
            <button onClick={loadSystemData} className="pv-btn-primary">
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pv-section-body">
        <div className="pv-summary-bar">
          <div className="pv-summary-left">
            <div className="pv-summary-icon"><ShieldCheck size={18} /></div>
            <div>
              <h3>Proteção do Sistema Windows</h3>
              <p>Status das proteções de segurança integradas do Windows.</p>
            </div>
          </div>
          <div className="pv-summary-right">
            <button onClick={loadSystemData} className="pv-btn-refresh" title="Atualizar">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Score Geral */}
        <div className="pv-system-score">
          <div className={`pv-score-circle ${getPrivacyScore >= 75 ? 'good' : getPrivacyScore >= 45 ? 'medium' : 'bad'}`}>
            <span className="pv-score-value">{getPrivacyScore}</span>
            <span className="pv-score-label">Score</span>
          </div>
          <div className="pv-score-info">
            <h4>Status da Proteção</h4>
            <p>
              {getPrivacyScore >= 75 
                ? 'Seu sistema está bem protegido!' 
                : getPrivacyScore >= 45 
                  ? 'Algumas proteções precisam de atenção.' 
                  : 'Vulnerabilidades detectadas. Ação necessária!'}
            </p>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="pv-system-grid">
          {/* Windows Defender */}
          <div className="pv-system-card">
            <div className="pv-system-header">
              <ShieldCheck size={20} />
              <h4>Windows Defender</h4>
              <StatusIcon status={systemData.defender?.real_time_protection} />
            </div>
            <div className="pv-system-content">
              <div className="pv-status-row">
                <span>Proteção em tempo real</span>
                <StatusIcon status={systemData.defender?.real_time_protection} size={16} />
              </div>
              <div className="pv-status-row">
                <span>Proteção na nuvem</span>
                <StatusIcon status={systemData.defender?.cloud_protection} size={16} />
              </div>
              <div className="pv-status-row">
                <span>Proteção contra adulteração</span>
                <StatusIcon status={systemData.defender?.tamper_protection} size={16} />
              </div>
              {systemData.defender?.threat_history_count > 0 && (
                <div className="pv-alert">
                  <AlertTriangle size={16} />
                  <span>{systemData.defender.threat_history_count} ameaças detectadas no histórico</span>
                </div>
              )}
            </div>
            <button 
              className="pv-btn-action"
              onClick={() => invoke('open_windows_security')}
            >
              <ExternalLink size={14} /> Abrir Windows Security
            </button>
          </div>

          {/* Firewall */}
          <div className="pv-system-card">
            <div className="pv-system-header">
              <Lock size={20} />
              <h4>Windows Firewall</h4>
              <StatusIcon status={systemData.firewall?.all_enabled} />
            </div>
            <div className="pv-system-content">
              <div className="pv-status-row">
                <span>Perfil de domínio</span>
                <StatusIcon status={systemData.firewall?.domain_profile?.enabled} size={16} />
              </div>
              <div className="pv-status-row">
                <span>Perfil privado</span>
                <StatusIcon status={systemData.firewall?.private_profile?.enabled} size={16} />
              </div>
              <div className="pv-status-row">
                <span>Perfil público</span>
                <StatusIcon status={systemData.firewall?.public_profile?.enabled} size={16} />
              </div>
              {!systemData.firewall?.all_enabled && (
                <div className="pv-alert warning">
                  <AlertTriangle size={16} />
                  <span>Firewall desativado em alguns perfis de rede</span>
                </div>
              )}
            </div>
          </div>

          {/* Windows Update */}
          <div className="pv-system-card">
            <div className="pv-system-header">
              <ShieldCheck size={20} />
              <h4>Windows Update</h4>
              <StatusIcon status={!systemData.updates?.updates_available} />
            </div>
            <div className="pv-system-content">
              <div className="pv-status-row">
                <span>Atualizações automáticas</span>
                <StatusIcon status={systemData.updates?.automatic_updates_enabled} size={16} />
              </div>
              {systemData.updates?.updates_available ? (
                <>
                  <div className="pv-alert warning">
                    <AlertTriangle size={16} />
                    <span>
                      {systemData.updates.important_count} atualizações importantes pendentes
                      {systemData.updates.optional_count > 0 && (
                        <>, {systemData.updates.optional_count} opcionais</>
                      )}
                    </span>
                  </div>
                  {systemData.updates.pending_reboot && (
                    <div className="pv-alert critical">
                      <AlertTriangle size={16} />
                      <span>Reinicialização pendente para concluir atualizações</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="pv-alert success">
                  <CheckCircle size={16} />
                  <span>Sistema atualizado</span>
                </div>
              )}
            </div>
          </div>

          {/* BitLocker */}
          <div className="pv-system-card">
            <div className="pv-system-header">
              <Lock size={20} />
              <h4>BitLocker</h4>
              <StatusIcon status={systemData.bitlocker?.encryption_enabled} />
            </div>
            <div className="pv-system-content">
              <div className="pv-status-row">
                <span>Status</span>
                <span className={systemData.bitlocker?.encryption_enabled ? 'status-active' : 'status-inactive'}>
                  {systemData.bitlocker?.protection_status || 'Desconhecido'}
                </span>
              </div>
              {systemData.bitlocker?.encryption_enabled && (
                <>
                  <div className="pv-status-row">
                    <span>Progresso da criptografia</span>
                    <span>{systemData.bitlocker.encryption_percentage}%</span>
                  </div>
                  <div className="pv-progress-bar">
                    <div 
                      className="pv-progress-fill" 
                      style={{ width: `${systemData.bitlocker.encryption_percentage}%` }}
                    />
                  </div>
                </>
              )}
              <div className="pv-status-row">
                <span>Chave de recuperação</span>
                <StatusIcon status={systemData.bitlocker?.recovery_key_present} size={16} />
              </div>
              {!systemData.bitlocker?.encryption_enabled && (
                <div className="pv-alert warning">
                  <AlertTriangle size={16} />
                  <span>Disco não criptografado. Seus dados estão vulneráveis em caso de roubo.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {recommendations.length > 0 && (
          <div className="pv-recommendations">
            <h4>
              <AlertTriangle size={18} />
              Recomendações de Segurança ({recommendations.length})
            </h4>
            <div className="pv-rec-list">
              {recommendations.map((rec, index) => (
                <div key={index} className={`pv-rec-item ${rec.severity}`}>
                  <div className="pv-rec-header">
                    <span className={`pv-rec-severity ${rec.severity}`}>
                      {rec.severity === 'critical' ? 'Crítico' : rec.severity === 'warning' ? 'Atenção' : 'Info'}
                    </span>
                    <strong>{rec.title}</strong>
                  </div>
                  <p>{rec.description}</p>
                  {rec.action && (
                    <button className="pv-rec-action">
                      {rec.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'navegacao': return renderNavegacao();
      case 'dados': return renderDados();
      case 'rastreadores': return renderRastreadores();
      case 'vpn': return renderVPN();
      case 'sistema': return renderSistema();
      default: return renderNavegacao();
    }
  }, [
    activeTab,
    blockTrackers, blockAds, httpsOnly, doNotTrack, blockPopups, safeBrowsing,
    clearOnExit, autoFill, passwordSave, formHistory, locationAccess,
    fingerprintProtection, cookieControl, crossSiteTracking, referrerPrivacy, webRTCProtection,
    dnsEncryption, leakProtection, killSwitch, splitTunnel,
    systemData, loading, recommendations,
  ]);

  return (
    <section className="page-content privacy-page">
      {/* ── header ── */}
      <div className="page-header">
        <div>
          <h2>Privacidade</h2>
          <p>Gerencie dados sensíveis, rastreamento e proteção de navegação.</p>
        </div>
        <StatusPill variant={scoreVariant}>
          {getPrivacyScore}% protegido
        </StatusPill>
      </div>

      {/* ── tab navigation ── */}
      <nav className="pv-tabs" role="tablist" aria-label="Seções de privacidade">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={`pv-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── section content ── */}
      <div className="pv-section" role="tabpanel">
        {renderContent()}
      </div>
    </section>
  );
}

export default Privacidade;
