# DeadSecMind (Tauri + React)

App de **monitoramento/segurança** (dashboard) usando **React (Vite)** no frontend e **Tauri 2** + **Rust** no backend.

---

## Pré-requisitos

- Node.js (LTS recomendado)
- Rust (toolchain do Rust)
- Ferramentas do Tauri (via `tauri` CLI)
- Windows 11 (conforme ambiente do projeto)

---

## Rodar o projeto (passo a passo)

### 1) Instalar dependências do frontend
1. Abra o terminal na pasta do projeto:
   - `DeadSecMind/`
2. Instale as dependências:
   - `npm install`

### 2) Rodar no modo desenvolvimento com Tauri
1. Ainda na pasta `DeadSecMind/`, execute:
   - `npm run tauri dev`
2. O Tauri vai compilar o backend Rust e iniciar o app.

---

## Como o status da barra lateral funciona

- `src/components/BarraLateral.jsx` chama o comando Tauri Rust:
  - `get_security_protections_status`
- O texto exibido fica:
  - **PROTEGIDO** quando `firewall && cloud`
  - **OK** caso contrário

---

## Estrutura principal

- `src/` : frontend React
  - `src/components/` : componentes (inclui `BarraLateral.jsx`)
  - `src/hooks/` : hooks de métricas via `invoke`
- `src-tauri/` : backend Tauri + Rust
  - `src-tauri/src/commands/` : commands expostos ao frontend
  - `src-tauri/src/lib.rs` : registration dos commands no `invoke_handler`

---

## Troubleshooting

- Se o status não atualizar, verifique:
  - Se o command `get_security_protections_status` está registrado em `src-tauri/src/lib.rs`
  - Se o backend retorna valores esperados (no Windows ele retorna `firewall: true` e `cloud: true` no momento)

