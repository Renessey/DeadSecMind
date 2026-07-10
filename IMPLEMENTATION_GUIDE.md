# DeadSecMind - Real System Monitoring Dashboard

Dashboard cyberpunk para monitoramento em tempo real de hardware e sistema do PC.

## 📋 Estrutura do Projeto

```
DeadSecMind/
├── src/
│   ├── components/
│   │   ├── AlertsPanel.jsx          # Alertas reais do sistema
│   │   ├── Dashboard.jsx             # Dashboard principal
│   │   ├── NetworkMap.jsx            # Mapa de rede
│   │   ├── SecurityStatus.jsx        # Status de segurança com dados reais
│   │   ├── TrafficChart.jsx          # Gráfico de tráfego de rede real
│   │   ├── *.css                     # Estilos cyberpunk
│   ├── hooks/
│   │   └── useSystemMonitoring.js    # Hooks React para chamar comandos Tauri
│   ├── App.jsx
│   └── main.jsx
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                    # Ponto de entrada da biblioteca
│   │   ├── commands.rs               # Comandos Tauri para monitoramento
│   │   └── main.rs                   # Ponto de entrada da aplicação
│   ├── Cargo.toml                    # Dependências Rust
│   └── tauri.conf.json
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Funcionalidades Implementadas

### Backend Rust (src-tauri/src/commands.rs)
- ✅ `get_system_info()` - Informações do PC
- ✅ `get_cpu_metrics()` - Uso de CPU em tempo real
- ✅ `get_memory_metrics()` - Uso de RAM em tempo real
- ✅ `get_disk_metrics()` - Espaço de disco de todos os drives
- ✅ `get_network_metrics()` - Tráfego de rede em tempo real (download/upload)
- ✅ `get_top_processes()` - Top 10 processos por CPU
- ✅ `generate_system_alerts()` - Alertas baseados em dados reais
- ✅ `get_uptime()` - Tempo ligado do sistema

### Frontend React
- ✅ Dashboard com informações reais do PC
- ✅ Alertas dinâmicos baseados em CPU/RAM/Disco
- ✅ Gráfico de tráfego de rede em tempo real
- ✅ Status de segurança com métricas reais
- ✅ Mapa de rede mostrando conexões ativas
- ✅ Processos com mais CPU em tempo real

## 📦 Dependências

### Frontend (package.json)
```json
{
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-opener": "^2",
  "cytoscape": "^3.33.4",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "recharts": "^2.10.3"
}
```

### Backend (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sysinfo = "0.30"
tokio = { version = "1", features = ["full"] }
local-ip-address = "0.14"
std-dev = "0.2"
chrono = "0.4"
```

## 🚀 Instalação e Setup

### 1. Clonar ou abrir o projeto
```bash
cd "c:\Users\renan\OneDrive\Área de Trabalho\Códigos\Apps para Pc\DeadSecMind"
```

### 2. Instalar dependências Node.js
```bash
npm install
```

### 3. Instalar dependências Rust (primeira vez)
As dependências Rust vão ser baixadas automaticamente durante o primeiro build.

## 💻 Executar em Modo Desenvolvimento

### No mesmo terminal, execute:
```bash
npm run tauri dev
```

Este comando vai:
1. Iniciar o Vite dev server (frontend)
2. Compilar o backend Rust
3. Abrir a janela do Tauri com hot-reload

## 🔨 Build para Produção (.exe)

### Para criar o executável Windows:
```bash
npm run tauri build
```

O arquivo `.exe` será criado em:
```
src-tauri/target/release/deadsecmind.exe
```

### Instalador (.msi)
Também será criado um instalador em:
```
src-tauri/target/release/bundle/msi/
```

## 📊 Como os Dados Reais Funcionam

### Fluxo de Dados:
1. **React Component** chama `useSystemMonitoring.js` hook
2. **Hook** invoca comando Tauri via `invoke()`
3. **Backend Rust** executa o comando e coleta dados do sistema
4. **Rust** retorna dados como JSON
5. **React** atualiza a UI com os dados reais

### Exemplo - Hooks em React:

```javascript
import { useCpuMetrics, useMemoryMetrics } from '../hooks/useSystemMonitoring';

function Dashboard() {
  const { cpuMetrics } = useCpuMetrics(2000);  // Atualiza a cada 2s
  const { memoryMetrics } = useMemoryMetrics(2000);
  
  return (
    <div>
      CPU: {cpuMetrics?.usage_percent.toFixed(1)}%
      RAM: {memoryMetrics?.percent.toFixed(1)}%
    </div>
  );
}
```

### Exemplo - Comando Rust:

```rust
#[tauri::command]
pub fn get_cpu_metrics() -> CpuMetrics {
    let sys = get_system();
    sys.refresh_cpu_all();
    
    let usage_percent = sys.cpus()
        .iter()
        .map(|cpu| cpu.cpu_usage())
        .sum::<f32>() / cpu_count as f32;
    
    CpuMetrics { usage_percent, ... }
}
```

## 🔄 Intervalos de Atualização

- **CPU**: 2 segundos (2000ms)
- **Memória**: 2 segundos (2000ms)
- **Disco**: 5 segundos (5000ms)
- **Rede**: 2 segundos (2000ms)
- **Processos**: 3 segundos (3000ms)
- **Alertas**: 4 segundos (4000ms)
- **Uptime**: 5 segundos (5000ms)

Pode ser ajustado em cada hook em `useSystemMonitoring.js`

## 📱 Componentes React Atualizados

### Dashboard.jsx
- Mostra hostname e SO do PC
- Exibe CPU% e RAM% em tempo real
- Status dinâmico (protegido/aviso/crítico)

### AlertsPanel.jsx
- Alertas gerados automaticamente quando:
  - CPU > 90%
  - RAM > 90%
  - Disco > 90%
  - Processo com CPU muito alta
- Filtros por severidade

### TrafficChart.jsx
- Gráfico de download/upload em tempo real
- Lista de interfaces de rede ativas
- IP local do PC
- Bytes total enviados/recebidos

### SecurityStatus.jsx
- Saúde do sistema (CPU, RAM, Uptime)
- Status de cada disco
- Top 3 processos por CPU
- Indicador de proteção

### NetworkMap.jsx
- Gateway/PC/Servidores DNS/DHCP
- IP local do PC
- Conexões ativas

## 🔧 Troubleshooting

### Erro: "Command not found"
- Certifique-se de estar no diretório correto
- Execute `npm install` novamente

### Erro ao compilar Rust
- Certifique-se de ter Rust instalado: `rustc --version`
- Se necessário, reinstale: `rustup update`

### Port já em uso
- O Vite pode usar outra porta automaticamente
- Verifique em http://localhost:5173

### Dados não atualizam
- Verifique o DevTools (F12) por erros
- Confirme que os hooks estão sendo chamados
- Verifique permissões do sistema para ler CPU/RAM/Disco

## 📝 Documentação das APIs Tauri

Cada comando Rust está documentado em `src-tauri/src/commands.rs`:

```rust
/// Retorna informações do sistema operacional
#[tauri::command]
pub fn get_system_info() -> SystemInfo

/// Retorna métricas de CPU em tempo real
#[tauri::command]
pub fn get_cpu_metrics() -> CpuMetrics

/// Retorna métricas de memória
#[tauri::command]
pub fn get_memory_metrics() -> MemoryMetrics

/// Retorna lista de discos e uso
#[tauri::command]
pub fn get_disk_metrics() -> Vec<DiskMetrics>

/// Retorna interfaces de rede e tráfego
#[tauri::command]
pub fn get_network_metrics() -> Vec<NetworkMetrics>

/// Retorna top N processos por CPU
#[tauri::command]
pub fn get_top_processes(limit: usize) -> Vec<ProcessMetrics>

/// Gera alertas baseado em limiares do sistema
#[tauri::command]
pub fn generate_system_alerts() -> Vec<SystemAlert>

/// Retorna uptime em segundos
#[tauri::command]
pub fn get_uptime() -> u64
```

## 🎨 Visual Cyberpunk Mantido

- ✅ Gradientes neon
- ✅ Linhas de scan animadas
- ✅ Glitch effects
- ✅ Cores cyberpunk (#00ff99, #00ccff, #ff0033)
- ✅ Tema escuro futurista

## 📈 Performance

- CPU: Otimizado com static mut System
- Memoria: Sem memory leaks com cleanup correto
- Threads: Usa tokio para operações async se necessário
- UI: Usa React.memo onde aplicável

## 🔐 Segurança

- ✅ Sem acesso a arquivos sensíveis
- ✅ Apenas leitura de informações públicas do sistema
- ✅ Sem execução de comandos arbitrários
- ✅ Validação de inputs nos hooks

## 📞 Suporte

Para mais informações sobre Tauri: https://tauri.app/
Para mais sobre sysinfo: https://github.com/GuillaumeGomez/sysinfo
