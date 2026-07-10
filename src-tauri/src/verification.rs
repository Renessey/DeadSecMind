use serde::{Deserialize, Serialize};
use sysinfo::{ProcessRefreshKind, System};



#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationSummary {
    pub cpu_usage_percent: f32,
    pub memory_usage_percent: f32,
    pub process_count: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationFinding {
    pub id: String,
    pub severity: String, // "Critical" | "High" | "Medium" | "Low"
    pub title: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationResult {
    pub mode: String, // "quick" | "full"
    pub mode_label: String,
    pub summary: VerificationSummary,
    pub findings: Vec<VerificationFinding>,
}

fn clamp_percent(v: f32) -> f32 {
    v.clamp(0.0, 100.0)
}

pub fn run_verification_impl(mode: &str) -> Result<VerificationResult, String> {
    let full = mode.eq_ignore_ascii_case("full");

    let mut sys = System::new_all();

    // Garantir que sysinfo preencha os dados necessários.
    // refresh_all pode ser custoso; aqui usamos refresh incremental para reduzir latência.
    sys.refresh_cpu();
    sys.refresh_memory();

    if full {
        // No sysinfo 0.30, refresh_processes_specifics aceita apenas ProcessRefreshKind.
        sys.refresh_processes_specifics(ProcessRefreshKind::everything());

    } else {
        // no modo rápido, ainda coletamos processos, mas sem forçar o refresh mais pesado.
        sys.refresh_processes();
    }


    let cpu_usage_percent = clamp_percent(sys.global_cpu_info().cpu_usage());

    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let memory_usage_percent = if total_mem > 0 {
        clamp_percent((used_mem as f32 / total_mem as f32) * 100.0)
    } else {
        0.0
    };

    let process_count = sys.processes().len() as u64;

    // Achados: somente monitoramento com base em métricas e top processos.
    let mut findings: Vec<VerificationFinding> = Vec::new();

    // Regras de severidade (monitoramento)
    if cpu_usage_percent > 90.0 {
        findings.push(VerificationFinding {
            id: format!("cpu_crit_{}", chrono::Local::now().timestamp()),
            severity: "Critical".to_string(),
            title: "CPU em nível crítico".to_string(),

            description: format!("Uso de CPU em {:.1}% (acima de 90%).", cpu_usage_percent),
        });
    } else if cpu_usage_percent > 75.0 {
        findings.push(VerificationFinding {
            id: format!("cpu_high_{}", chrono::Local::now().timestamp()),
            severity: "High".to_string(),
            title: "CPU em nível alto".to_string(),

            description: format!("Uso de CPU em {:.1}% (entre 75% e 90%).", cpu_usage_percent),
        });
    }

    if memory_usage_percent > 90.0 {
        findings.push(VerificationFinding {
            id: format!("mem_crit_{}", chrono::Local::now().timestamp()),
            severity: "Critical".to_string(),
            title: "Memória em nível crítico".to_string(),

            description: format!(
                "Uso de RAM em {:.1}% (acima de 90%).",
                memory_usage_percent
            ),
        });
    } else if memory_usage_percent > 75.0 {
        findings.push(VerificationFinding {
            id: format!("mem_high_{}", chrono::Local::now().timestamp()),
            severity: "High".to_string(),
            title: "Memória em nível alto".to_string(),

            description: format!(
                "Uso de RAM em {:.1}% (entre 75% e 90%).",
                memory_usage_percent
            ),
        });
    }

    // Top processos por CPU no modo rápido; mais detalhado no completo.
    let mut proc_rows: Vec<(String, u32, f32, u64)> = sys
        .processes()
        .iter()
        .map(|(pid, p)| {
            (
                p.name().to_string(),
                pid.as_u32(),
                p.cpu_usage(),
                p.memory(),
            )
        })
        .collect();

    proc_rows.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal));

    let limit = if full { 15 } else { 7 };
    for (idx, (name, pid, cpu, mem)) in proc_rows.into_iter().take(limit).enumerate() {
        if cpu < 0.1 && !full {
            continue;
        }

        let severity = if cpu >= 25.0 {
            "High"
        } else if cpu >= 10.0 {
            "Medium"
        } else {
            "Low"
        };

        findings.push(VerificationFinding {
            id: format!("proc_{}_{}_{}", idx, pid, chrono::Local::now().timestamp()),
            severity: severity.to_string(),
            title: format!("Processo com consumo relevante: {}", name),
            description: format!(
                "PID {} usando {:.1}% de CPU e {} MB de RAM.",
                pid,
                cpu,
                (mem / (1024 * 1024))
            ),
        });
    }

    // Modo rápido: no máximo reduz achados; no completo: mostra mais.
    if !full && findings.len() > 10 {
        findings.truncate(10);
    }

    Ok(VerificationResult {
        mode: if full { "full".to_string() } else { "quick".to_string() },
        mode_label: if full {
            "Completa".to_string()
        } else {
            "Rápida".to_string()
        },
        summary: VerificationSummary {
            cpu_usage_percent,
            memory_usage_percent,
            process_count,
        },
        findings,
    })
}

