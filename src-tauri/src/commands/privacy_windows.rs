use serde::{Deserialize, Serialize};
use std::process::Command;

// ============================================================================
// Estruturas de Dados - Defender
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefenderStatus {
    pub real_time_protection: bool,
    pub cloud_protection: bool,
    pub auto_sample_submission: bool,
    pub tamper_protection: bool,
    pub last_scan: Option<String>,
    pub threat_history_count: u32,
    pub service_status: String,
    pub definitions_version: Option<String>,
    pub definitions_updated: Option<String>,
}

// ============================================================================
// Estruturas de Dados - Firewall
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallStatus {
    pub domain_profile: ProfileStatus,
    pub private_profile: ProfileStatus,
    pub public_profile: ProfileStatus,
    pub all_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileStatus {
    pub enabled: bool,
    pub default_inbound_action: String,
    pub default_outbound_action: String,
}

// ============================================================================
// Estruturas de Dados - Windows Update
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub updates_available: bool,
    pub important_count: u32,
    pub optional_count: u32,
    pub last_checked: Option<String>,
    pub automatic_updates_enabled: bool,
    pub pending_reboot: bool,
    pub update_history: Vec<UpdateHistory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateHistory {
    pub title: String,
    pub date: String,
    pub result: String,
    pub operation: String,
}

// ============================================================================
// Estruturas de Dados - BitLocker
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitLockerStatus {
    pub encryption_enabled: bool,
    pub encryption_percentage: u8,
    pub lock_status: String,
    pub protection_status: String,
    pub volume_type: String,
    pub recovery_key_present: bool,
}

// ============================================================================
// Estruturas de Dados - Configurações de Privacidade
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
    // Navegação
    pub block_trackers: bool,
    pub block_ads: bool,
    pub https_only: bool,
    pub do_not_track: bool,
    pub block_popups: bool,
    pub safe_browsing: bool,
    
    // Dados pessoais
    pub clear_on_exit: bool,
    pub auto_fill: bool,
    pub password_save: bool,
    pub form_history: bool,
    pub location_access: bool,
    
    // Rastreadores
    pub fingerprint_protection: bool,
    pub cookie_control: bool,
    pub cross_site_tracking: bool,
    pub referrer_privacy: bool,
    pub webrtc_protection: bool,
    
    // VPN
    pub dns_encryption: bool,
    pub leak_protection: bool,
    pub kill_switch: bool,
    pub split_tunnel: bool,
}

// ============================================================================
// Implementações - Windows Defender
// ============================================================================

#[cfg(windows)]
pub fn get_defender_status() -> Result<DefenderStatus, String> {
    // Usar PowerShell para obter status do Defender
    let ps_script = r#"
        try {
            $mp = Get-MpComputerStatus
            $threats = Get-MpThreatDetection -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
            $defVersion = (Get-MpComputerStatus).AntivirusSignatureLastUpdated
            
            @{
                RealTimeProtection = $mp.RealTimeProtectionEnabled
                CloudProtection = $mp.OnAccessProtectionEnabled
                AutoSampleSubmission = $mp.BehaviorMonitorEnabled
                TamperProtection = $mp.TamperProtectionEnabled
                LastQuickScan = $mp.QuickScanEndTime
                ThreatHistoryCount = $threats
                ServiceStatus = $mp.AntivirusEnabled
                DefinitionsVersion = $defVersion
                DefinitionsUpdated = $mp.AntivirusSignatureLastUpdated
            } | ConvertTo-Json
        } catch {
            @{ Error = $_.Exception.Message } | ConvertTo-Json
        }
    "#;

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-Command", ps_script])
        .output()
        .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!("PowerShell retornou erro: {:?}", output.stderr));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    // Parse do JSON retornado pelo PowerShell
    match serde_json::from_str::<serde_json::Value>(&json_str) {
        Ok(json) => {
            if json.get("Error").is_some() {
                return Err(format!("Erro no PowerShell: {}", json["Error"]));
            }
            
            Ok(DefenderStatus {
                real_time_protection: json["RealTimeProtection"].as_bool().unwrap_or(false),
                cloud_protection: json["CloudProtection"].as_bool().unwrap_or(false),
                auto_sample_submission: json["AutoSampleSubmission"].as_bool().unwrap_or(false),
                tamper_protection: json["TamperProtection"].as_bool().unwrap_or(false),
                last_scan: json["LastQuickScan"].as_str().map(|s| s.to_string()),
                threat_history_count: json["ThreatHistoryCount"].as_u64().unwrap_or(0) as u32,
                service_status: json["ServiceStatus"].as_bool().unwrap_or(false).to_string(),
                definitions_version: json["DefinitionsVersion"].as_str().map(|s| s.to_string()),
                definitions_updated: json["DefinitionsUpdated"].as_str().map(|s| s.to_string()),
            })
        }
        Err(e) => Err(format!("Erro ao parse JSON: {}", e))
    }
}

#[cfg(not(windows))]
pub fn get_defender_status() -> Result<DefenderStatus, String> {
    Err("Windows Defender só está disponível no Windows".to_string())
}

// ============================================================================
// Implementações - Firewall
// ============================================================================

#[cfg(windows)]
pub fn get_firewall_status() -> Result<FirewallStatus, String> {
    let ps_script = r#"
        try {
            $profiles = Get-NetFirewallProfile
            $domain = $profiles | Where-Object { $_.Name -eq 'Domain' }
            $private = $profiles | Where-Object { $_.Name -eq 'Private' }
            $public = $profiles | Where-Object { $_.Name -eq 'Public' }
            
            @{
                DomainEnabled = $domain.Enabled
                DomainInbound = $domain.DefaultInboundAction.ToString()
                DomainOutbound = $domain.DefaultOutboundAction.ToString()
                PrivateEnabled = $private.Enabled
                PrivateInbound = $private.DefaultInboundAction.ToString()
                PrivateOutbound = $private.DefaultOutboundAction.ToString()
                PublicEnabled = $public.Enabled
                PublicInbound = $public.DefaultInboundAction.ToString()
                PublicOutbound = $public.DefaultOutboundAction.ToString()
                AllEnabled = ($domain.Enabled -and $private.Enabled -and $public.Enabled)
            } | ConvertTo-Json
        } catch {
            @{ Error = $_.Exception.Message } | ConvertTo-Json
        }
    "#;

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-Command", ps_script])
        .output()
        .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!("PowerShell retornou erro"));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    match serde_json::from_str::<serde_json::Value>(&json_str) {
        Ok(json) => {
            if json.get("Error").is_some() {
                return Err(format!("Erro no PowerShell: {}", json["Error"]));
            }
            
            Ok(FirewallStatus {
                domain_profile: ProfileStatus {
                    enabled: json["DomainEnabled"].as_bool().unwrap_or(false),
                    default_inbound_action: json["DomainInbound"].as_str().unwrap_or("Block").to_string(),
                    default_outbound_action: json["DomainOutbound"].as_str().unwrap_or("Allow").to_string(),
                },
                private_profile: ProfileStatus {
                    enabled: json["PrivateEnabled"].as_bool().unwrap_or(false),
                    default_inbound_action: json["PrivateInbound"].as_str().unwrap_or("Block").to_string(),
                    default_outbound_action: json["PrivateOutbound"].as_str().unwrap_or("Allow").to_string(),
                },
                public_profile: ProfileStatus {
                    enabled: json["PublicEnabled"].as_bool().unwrap_or(false),
                    default_inbound_action: json["PublicInbound"].as_str().unwrap_or("Block").to_string(),
                    default_outbound_action: json["PublicOutbound"].as_str().unwrap_or("Allow").to_string(),
                },
                all_enabled: json["AllEnabled"].as_bool().unwrap_or(false),
            })
        }
        Err(e) => Err(format!("Erro ao parse JSON: {}", e))
    }
}

#[cfg(not(windows))]
pub fn get_firewall_status() -> Result<FirewallStatus, String> {
    Err("Firewall do Windows só está disponível no Windows".to_string())
}

// ============================================================================
// Implementações - Windows Update
// ============================================================================

#[cfg(windows)]
pub fn get_update_status() -> Result<UpdateStatus, String> {
    let ps_script = r#"
        try {
            # Verificar se o módulo PSWindowsUpdate está instalado
            if (!(Get-Module -ListAvailable -Name PSWindowsUpdate)) {
                @{ 
                    UpdatesAvailable = $false
                    ImportantCount = 0
                    OptionalCount = 0
                    LastChecked = $null
                    AutomaticUpdatesEnabled = $false
                    PendingReboot = $false
                    UpdateHistory = @()
                    Error = "Módulo PSWindowsUpdate não instalado"
                } | ConvertTo-Json
                exit
            }
            
            Import-Module PSWindowsUpdate -Force
            
            $updates = Get-WUList -ErrorAction SilentlyContinue
            $important = ($updates | Where-Object { $_.IsImportant -eq $true } | Measure-Object).Count
            $optional = ($updates | Where-Object { $_.IsOptional -eq $true } | Measure-Object).Count
            
            $history = Get-WUHistory -Last 5 | Select-Object Title, Date, Result, Operation
            
            $au = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -ErrorAction SilentlyContinue
            $autoUpdates = if ($au) { $au.NoAutoUpdate -ne 1 } else { $true }
            
            $pending = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending"
            
            @{ 
                UpdatesAvailable = ($updates | Measure-Object).Count -gt 0
                ImportantCount = $important
                OptionalCount = $optional
                LastChecked = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                AutomaticUpdatesEnabled = $autoUpdates
                PendingReboot = $pending
                UpdateHistory = $history
            } | ConvertTo-Json -Depth 3
        } catch {
            @{ 
                UpdatesAvailable = $false
                ImportantCount = 0
                OptionalCount = 0
                LastChecked = $null
                AutomaticUpdatesEnabled = $false
                PendingReboot = $false
                UpdateHistory = @()
                Error = $_.Exception.Message
            } | ConvertTo-Json
        }
    "#;

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script])
        .output()
        .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!("PowerShell retornou erro: {:?}", String::from_utf8_lossy(&output.stderr)));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    match serde_json::from_str::<serde_json::Value>(&json_str) {
        Ok(json) => {
            if let Some(error) = json.get("Error") {
                eprintln!("Aviso: {}", error.as_str().unwrap_or("Erro desconhecido"));
            }
            
            let history: Vec<UpdateHistory> = json["UpdateHistory"]
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .map(|h| UpdateHistory {
                    title: h["Title"].as_str().unwrap_or("").to_string(),
                    date: h["Date"].as_str().unwrap_or("").to_string(),
                    result: h["Result"].as_str().unwrap_or("").to_string(),
                    operation: h["Operation"].as_str().unwrap_or("").to_string(),
                })
                .collect();
            
            Ok(UpdateStatus {
                updates_available: json["UpdatesAvailable"].as_bool().unwrap_or(false),
                important_count: json["ImportantCount"].as_u64().unwrap_or(0) as u32,
                optional_count: json["OptionalCount"].as_u64().unwrap_or(0) as u32,
                last_checked: json["LastChecked"].as_str().map(|s| s.to_string()),
                automatic_updates_enabled: json["AutomaticUpdatesEnabled"].as_bool().unwrap_or(false),
                pending_reboot: json["PendingReboot"].as_bool().unwrap_or(false),
                update_history: history,
            })
        }
        Err(e) => Err(format!("Erro ao parse JSON: {}", e))
    }
}

#[cfg(not(windows))]
pub fn get_update_status() -> Result<UpdateStatus, String> {
    Err("Windows Update só está disponível no Windows".to_string())
}

// ============================================================================
// Implementações - BitLocker
// ============================================================================

#[cfg(windows)]
pub fn get_bitlocker_status() -> Result<BitLockerStatus, String> {
    let ps_script = r#"
        try {
            $volumes = Get-BitLockerVolume | Where-Object { $_.VolumeType -eq 'OperatingSystem' } | Select-Object -First 1
            
            if (!$volumes) {
                @{ 
                    EncryptionEnabled = $false
                    EncryptionPercentage = 0
                    LockStatus = "Unknown"
                    ProtectionStatus = "Unknown"
                    VolumeType = "Not Found"
                    RecoveryKeyPresent = $false
                } | ConvertTo-Json
                exit
            }
            
            $vol = $volumes
            
            @{ 
                EncryptionEnabled = $vol.ProtectionStatus -eq 'On'
                EncryptionPercentage = if ($vol.EncryptionPercentage) { $vol.EncryptionPercentage } else { 0 }
                LockStatus = $vol.LockStatus.ToString()
                ProtectionStatus = $vol.ProtectionStatus.ToString()
                VolumeType = $vol.VolumeType.ToString()
                RecoveryKeyPresent = ($vol.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' } | Measure-Object).Count -gt 0
            } | ConvertTo-Json
        } catch {
            @{ 
                EncryptionEnabled = $false
                EncryptionPercentage = 0
                LockStatus = "Error"
                ProtectionStatus = "Error"
                VolumeType = "Error"
                RecoveryKeyPresent = $false
                Error = $_.Exception.Message
            } | ConvertTo-Json
        }
    "#;

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-Command", ps_script])
        .output()
        .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!("PowerShell retornou erro"));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    match serde_json::from_str::<serde_json::Value>(&json_str) {
        Ok(json) => {
            Ok(BitLockerStatus {
                encryption_enabled: json["EncryptionEnabled"].as_bool().unwrap_or(false),
                encryption_percentage: json["EncryptionPercentage"].as_u64().unwrap_or(0) as u8,
                lock_status: json["LockStatus"].as_str().unwrap_or("Unknown").to_string(),
                protection_status: json["ProtectionStatus"].as_str().unwrap_or("Unknown").to_string(),
                volume_type: json["VolumeType"].as_str().unwrap_or("Unknown").to_string(),
                recovery_key_present: json["RecoveryKeyPresent"].as_bool().unwrap_or(false),
            })
        }
        Err(e) => Err(format!("Erro ao parse JSON: {}", e))
    }
}

#[cfg(not(windows))]
pub fn get_bitlocker_status() -> Result<BitLockerStatus, String> {
    Err("BitLocker só está disponível no Windows".to_string())
}

// ============================================================================
// Comando para obter resumo completo de privacidade
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySummary {
    pub defender: DefenderStatus,
    pub firewall: FirewallStatus,
    pub updates: UpdateStatus,
    pub bitlocker: BitLockerStatus,
    pub overall_score: u32,
}

#[cfg(windows)]
#[tauri::command]
pub async fn get_privacy_summary() -> Result<PrivacySummary, String> {
    let defender = get_defender_status()?;
    let firewall = get_firewall_status()?;
    let updates = get_update_status()?;
    let bitlocker = get_bitlocker_status()?;
    
    // Calcular score baseado na proteção
    let mut score = 0u32;
    let mut total = 0u32;
    
    // Defender (30%)
    if defender.real_time_protection { score += 10; }
    if defender.cloud_protection { score += 10; }
    if defender.tamper_protection { score += 10; }
    total += 30;
    
    // Firewall (25%)
    if firewall.all_enabled { score += 25; }
    total += 25;
    
    // Updates (25%)
    if !updates.updates_available { score += 15; }
    if updates.automatic_updates_enabled { score += 10; }
    total += 25;
    
    // BitLocker (20%)
    if bitlocker.encryption_enabled { score += 20; }
    total += 20;
    
    let overall_score = if total > 0 { (score * 100) / total } else { 0 };
    
    Ok(PrivacySummary {
        defender,
        firewall,
        updates,
        bitlocker,
        overall_score,
    })
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn get_privacy_summary() -> Result<PrivacySummary, String> {
    Err("Resumo de privacidade só está disponível no Windows".to_string())
}

// ============================================================================
// Comandos auxiliares para privacidade
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyRecommendation {
    pub category: String,
    pub title: String,
    pub description: String,
    pub severity: String, // "critical", "warning", "info"
    pub action: Option<String>,
}

#[cfg(windows)]
#[tauri::command]
pub async fn get_privacy_recommendations() -> Result<Vec<PrivacyRecommendation>, String> {
    let summary = get_privacy_summary().await?;
    let mut recommendations = Vec::new();
    
    // Defender
    if !summary.defender.real_time_protection {
        recommendations.push(PrivacyRecommendation {
            category: "defender".to_string(),
            title: "Proteção em tempo real desativada".to_string(),
            description: "A proteção em tempo real do Windows Defender está desativada. Seu sistema está vulnerável a malwares.".to_string(),
            severity: "critical".to_string(),
            action: Some("Abrir Windows Security".to_string()),
        });
    }
    
    if !summary.defender.cloud_protection {
        recommendations.push(PrivacyRecommendation {
            category: "defender".to_string(),
            title: "Proteção na nuvem desativada".to_string(),
            description: "A proteção baseada em nuvem permite ao Defender detectar ameaças mais rapidamente.".to_string(),
            severity: "warning".to_string(),
            action: Some("Ativar proteção na nuvem".to_string()),
        });
    }
    
    // Firewall
    if !summary.firewall.all_enabled {
        recommendations.push(PrivacyRecommendation {
            category: "firewall".to_string(),
            title: "Firewall desativado em alguns perfis".to_string(),
            description: "O Windows Firewall não está ativo em todos os perfis de rede. Isso pode deixar seu sistema exposto.".to_string(),
            severity: "critical".to_string(),
            action: Some("Ativar Firewall em todos os perfis".to_string()),
        });
    }
    
    // Updates
    if summary.updates.important_count > 0 {
        recommendations.push(PrivacyRecommendation {
            category: "updates".to_string(),
            title: format!("{} atualizações importantes pendentes", summary.updates.important_count),
            description: "Existem atualizações importantes de segurança pendentes. Mantenha seu sistema atualizado.".to_string(),
            severity: "warning".to_string(),
            action: Some("Abrir Windows Update".to_string()),
        });
    }
    
    if !summary.updates.automatic_updates_enabled {
        recommendations.push(PrivacyRecommendation {
            category: "updates".to_string(),
            title: "Atualizações automáticas desativadas".to_string(),
            description: "As atualizações automáticas estão desativadas. Você pode perder atualizações críticas de segurança.".to_string(),
            severity: "warning".to_string(),
            action: Some("Ativar atualizações automáticas".to_string()),
        });
    }
    
    // BitLocker
    if !summary.bitlocker.encryption_enabled {
        recommendations.push(PrivacyRecommendation {
            category: "bitlocker".to_string(),
            title: "Disco não criptografado".to_string(),
            description: "O BitLocker não está ativo neste dispositivo. Em caso de roubo ou perda, seus dados podem ser acessados.".to_string(),
            severity: "warning".to_string(),
            action: Some("Ativar BitLocker".to_string()),
        });
    }
    
    Ok(recommendations)
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn get_privacy_recommendations() -> Result<Vec<PrivacyRecommendation>, String> {
    Err("Recomendações de privacidade só estão disponíveis no Windows".to_string())
}

// ============================================================================
// Comandos para controle de privacidade
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyControlResult {
    pub success: bool,
    pub message: String,
    pub requires_restart: bool,
}

#[cfg(windows)]
#[tauri::command]
pub async fn set_defender_realtime_protection(enabled: bool) -> Result<PrivacyControlResult, String> {
    let action = if enabled { "Enable" } else { "Disable" };
    let ps_script = format!(
        r#"
        try {{
            Set-MpPreference -DisableRealtimeMonitoring ${}
            @{{ Success = $true; Message = "Proteção em tempo real {} com sucesso" }}
        }} catch {{
            @{{ Success = $false; Message = $_.Exception.Message }}
        }} | ConvertTo-Json
        "#,
        !enabled,
        if enabled { "ativada" } else { "desativada" }
    );

    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-RunAsAdministrator", "-Command", &ps_script])
        .output()
        .map_err(|e| format!("Erro ao executar PowerShell: {}", e))?;

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    match serde_json::from_str::<serde_json::Value>(&json_str) {
        Ok(json) => {
            Ok(PrivacyControlResult {
                success: json["Success"].as_bool().unwrap_or(false),
                message: json["Message"].as_str().unwrap_or("Operação concluída").to_string(),
                requires_restart: false,
            })
        }
        Err(_) => Err("Erro ao interpretar resposta do PowerShell".to_string())
    }
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn set_defender_realtime_protection(_enabled: bool) -> Result<PrivacyControlResult, String> {
    Err("Windows Defender só está disponível no Windows".to_string())
}

#[cfg(windows)]
#[tauri::command]
pub async fn open_windows_security() -> Result<(), String> {
    Command::new("explorer.exe")
        .arg("windowsdefender:")
        .spawn()
        .map_err(|e| format!("Erro ao abrir Windows Security: {}", e))?;
    
    Ok(())
}

#[cfg(not(windows))]
#[tauri::command]
pub async fn open_windows_security() -> Result<(), String> {
    Err("Windows Security só está disponível no Windows".to_string())
}
