# Plano: Implementar Métricas Reais de Privacidade

## Resumo
Implementar funcionalidade real na tela de Privacidade, conectando métricas reais do sistema operacional Windows via comandos Tauri.

## Estado Atual
- **Frontend**: Interface completa em `Privacidade.jsx` com 25+ toggles, mas todos são estados locais (mock)
- **Backend**: Comandos existentes em `security_windows.rs` retornam dados fixos (`firewall: true, cloud: true`)

## Mudanças Propostas

### Fase 1: Backend - Comandos Reais de Segurança

#### 1.1 Novo arquivo: `src-tauri/src/commands/privacy_windows.rs`
Criar comandos para verificar status real do Windows:

```rust
// Estruturas de dados
struct WindowsDefenderStatus {
    real_time_protection: bool,
    cloud_protection: bool,
    auto_sample_submission: bool,
    tamper_protection: bool,
    last_scan: Option<String>,
    threat_history_count: u32,
}

struct FirewallStatus {
    domain_profile: bool,
    private_profile: bool,
    public_profile: bool,
    all_enabled: bool,
}

struct SystemUpdateStatus {
    updates_available: bool,
    important_count: u32,
    optional_count: u32,
    last_checked: Option<String>,
    automatic_updates_enabled: bool,
}

struct BitLockerStatus {
    encryption_enabled: bool,
    encryption_percentage: u8,
    lock_status: String, // "Locked", "Unlocked"
}
```

**Implementações via Windows API:**
- `Get-MpComputerStatus` via PowerShell ou WMI para Defender
- `Get-NetFirewallProfile` para Firewall
- `Get-WUHistory` / `Get-WUList` (PSWindowsUpdate) para Updates
- `Get-BitLockerVolume` para BitLocker

#### 1.2 Atualizar: `src-tauri/src/commands/security_windows.rs`
Modificar para retornar dados reais das novas funções.

#### 1.3 Atualizar: `src-tauri/src/commands/mod.rs`
Adicionar novos comandos ao módulo público.

### Fase 2: Frontend - Integração com Dados Reais

#### 2.1 Atualizar: `src/components/Privacidade.jsx`

**Adicionar hooks e comandos:**
```javascript
import { invoke } from '@tauri-apps/api/core';

// Novos estados para dados reais
const [realTimeProtection, setRealTimeProtection] = useState(false);
const [cloudProtection, setCloudProtection] = useState(false);
const [firewallStatus, setFirewallStatus] = useState({ all_enabled: false });
const [updatesAvailable, setUpdatesAvailable] = useState(false);
const [bitLockerStatus, setBitLockerStatus] = useState({ encryption_enabled: false });

// Carregar dados reais ao montar
useEffect(() => {
  loadRealPrivacyData();
}, []);

const loadRealPrivacyData = async () => {
  try {
    // Defender status
    const defender = await invoke('get_defender_status');
    setRealTimeProtection(defender.real_time_protection);
    setCloudProtection(defender.cloud_protection);
    
    // Firewall status
    const firewall = await invoke('get_firewall_status');
    setFirewallStatus(firewall);
    
    // Updates
    const updates = await invoke('get_update_status');
    setUpdatesAvailable(updates.updates_available);
    
    // BitLocker
    const bitlocker = await invoke('get_bitlocker_status');
    setBitLockerStatus(bitlocker);
  } catch (error) {
    console.error('Erro ao carregar dados de privacidade:', error);
  }
};
```

**Modificar UI para refletir dados reais:**
- Adicionar cards mostrando status real do sistema
- Indicadores visuais para proteções ativas/inativas
- Alertas para vulnerabilidades encontradas

### Fase 3: Persistência e Sincronização

#### 3.1 Criar: `src-tauri/src/services/privacy_service.rs`
Serviço para gerenciar configurações de privacidade persistidas.

**Funcionalidades:**
- Salvar/carregar configurações do usuário
- Sincronizar estado com o sistema operacional
- Validar permissões administrativas quando necessário

#### 3.2 Atualizar: Frontend com persistência
- Salvar preferências no localStorage/Tauri store
- Carregar configurações salvas ao iniciar
- Sincronizar alterações com o backend

### Fase 4: Features Específicas (Opcional/Avançado)

#### 4.1 Bloqueio Real de Rastreadores
- Integrar com lists como EasyList, uBlock filters
- Implementar filtragem no nível de WebView (Tauri v2)
- Criar proxy local para inspeção de requests

#### 4.2 Proteção WebRTC
- Implementar políticas de ICE candidate filtering
- Configurar mDNS para ocultar IP local
- Bloquear WebRTC quando não necessário

#### 4.3 Anti-Fingerprinting
- Randomizar canvas fingerprint
- Normalizar User-Agent
- Ofuscar resolução de tela e timezone
- Randomizar fontes disponíveis

#### 4.4 Controle de Cookies
- Implementar SameSite strict por padrão
- Bloquear cookies de terceiros
- Isolar storage por domínio (first-party isolation)

### Estrutura de Arquivos Final

```
src-tauri/src/
├── commands/
│   ├── mod.rs                    # Módulo principal (já existe)
│   ├── security_windows.rs       # Atualizado para dados reais
│   ├── privacy_windows.rs        # NOVO - Comandos de privacidade
│   └── network_windows.rs        # Já existe
├── services/
│   ├── mod.rs                    # Já existe
│   ├── privacy_service.rs        # NOVO - Serviço de privacidade
│   └── notification_service.rs   # Já existe
├── lib.rs                        # Atualizado
└── tray.rs                       # Atualizado (já ajustado)

src/components/
├── Privacidade.jsx               # Atualizado para dados reais
├── Privacidade.css               # Já existe
└── ...
```

## Critérios de Aceitação

1. ✅ Tela de Privacidade carrega status real do sistema Windows
2. ✅ Defender status é lido via Windows API (não mock)
3. ✅ Firewall status é lido via Windows API
4. ✅ Atualizações pendentes são detectadas
5. ✅ BitLocker status é verificado
6. ✅ UI reflete estado real com indicadores visuais
7. ✅ Persistência de preferências do usuário
8. ✅ Sem erros de compilação (cargo check limpo)

## Próximos Passos

1. **Aprovação do plano** - Revisar e ajustar escopo se necessário
2. **Implementação Fase 1** - Criar comandos de privacidade reais
3. **Implementação Fase 2** - Integrar frontend com dados reais
4. **Testes** - Verificar funcionamento em Windows real
5. **Refinamento** - Ajustar UI/UX baseado em feedback
