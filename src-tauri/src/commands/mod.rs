use serde::{Deserialize, Serialize};
use sysinfo::System;
use once_cell::sync::Lazy;
use std::sync::{Mutex, MutexGuard};

pub mod notification_commands;
pub mod network_windows;
pub mod security_windows;
pub mod privacy_windows;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub cpu_count: usize,
    pub cpu_brand: String,
    pub ram_total: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CpuMetrics {
    pub usage_percent: f32,
    pub brand: String,
    pub count: usize,
    pub frequency: u64,
    pub per_core_usage: Vec<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryMetrics {
    pub used: u64,
    pub total: u64,
    pub percent: f32,
    pub available: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskMetrics {
    pub name: String,
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub percent: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkMetrics {
    pub interface_name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub received_packets: u64,
    pub transmitted_packets: u64,
    pub local_ip: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessMetrics {
    pub name: String,
    pub pid: u32,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemAlert {
    pub id: String,
    pub alert_type: String,
    pub severity: String,
    pub title: String,
    pub description: String,
    pub timestamp: String,
}

static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new_all();
    sys.refresh_all();
    Mutex::new(sys)
});

fn get_system() -> MutexGuard<'static, System> {
    SYSTEM.lock().unwrap()
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let mut sys = get_system();

    sys.refresh_cpu();
    sys.refresh_memory();

    SystemInfo {
        os_name: std::env::consts::OS.to_string(),
        os_version: System::os_version().unwrap_or("Unknown".to_string()),
        hostname: System::host_name().unwrap_or("Unknown".to_string()),
        cpu_count: sys.cpus().len(),
        cpu_brand: sys
            .cpus()
            .first()
            .map(|cpu| cpu.brand().to_string())
            .unwrap_or("Unknown".to_string()),
        ram_total: sys.total_memory(),
    }
}

#[tauri::command]
pub fn get_cpu_metrics() -> CpuMetrics {
    let mut sys = get_system();

    sys.refresh_cpu();

    let cpu_count = sys.cpus().len();

    let cpu_brand = sys
        .cpus()
        .first()
        .map(|cpu| cpu.brand().to_string())
        .unwrap_or("Unknown".to_string());

    let frequency = sys
        .cpus()
        .first()
        .map(|cpu| cpu.frequency())
        .unwrap_or(0);

    let usage_percent = sys.global_cpu_info().cpu_usage();

    let per_core_usage: Vec<f32> =
        sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect();

    CpuMetrics {
        usage_percent: usage_percent.clamp(0.0, 100.0),
        brand: cpu_brand,
        count: cpu_count,
        frequency,
        per_core_usage,
    }
}

#[tauri::command]
pub fn get_memory_metrics() -> MemoryMetrics {
    let mut sys = get_system();

    sys.refresh_memory();

    let total = sys.total_memory();
    let used = sys.used_memory();
    let available = sys.available_memory();

    let percent = if total > 0 {
        ((used as f32 / total as f32) * 100.0).clamp(0.0, 100.0)
    } else {
        0.0
    };

    MemoryMetrics {
        used,
        total,
        percent,
        available,
    }
}

#[tauri::command]
pub fn get_disk_metrics() -> Vec<DiskMetrics> {
    Vec::new()
}

#[tauri::command]
pub fn get_network_metrics() -> Vec<NetworkMetrics> {
    #[cfg(windows)]
    {
        let rows = network_windows::get_network_metrics_impl();

        rows.into_iter()
            .map(|r| NetworkMetrics {
                interface_name: r.interface_name,
                received_bytes: r.received_bytes,
                transmitted_bytes: r.transmitted_bytes,
                received_packets: r.received_packets,
                transmitted_packets: r.transmitted_packets,
                local_ip: r.local_ip,
            })
            .collect()
    }

    #[cfg(not(windows))]
    {
        Vec::new()
    }
}

#[tauri::command]
pub fn get_top_processes(limit: usize) -> Vec<ProcessMetrics> {
    let mut sys = get_system();

    sys.refresh_processes();

    let mut processes: Vec<ProcessMetrics> = sys
        .processes()
        .iter()
        .map(|(pid, process)| ProcessMetrics {
            name: process.name().to_string(),
            pid: pid.as_u32(),
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory(),
            status: format!("{:?}", process.status()),
        })
        .collect();

    processes.sort_by(|a, b| {
        b.cpu_usage
            .partial_cmp(&a.cpu_usage)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    processes.truncate(limit);

    processes
}

#[tauri::command]
pub fn generate_system_alerts() -> Vec<SystemAlert> {
    let mut alerts = Vec::new();

    let cpu = get_cpu_metrics();

    if cpu.usage_percent > 90.0 {
        alerts.push(SystemAlert {
            id: format!("cpu_{}", chrono::Local::now().timestamp()),
            alert_type: "cpu_high".to_string(),
            severity: "critical".to_string(),
            title: "CPU Usage Critical".to_string(),
            description: format!("CPU usage at {:.1}%", cpu.usage_percent),
            timestamp: chrono::Local::now().to_string(),
        });
    }

    let memory = get_memory_metrics();

    if memory.percent > 90.0 {
        alerts.push(SystemAlert {
            id: format!("mem_{}", chrono::Local::now().timestamp()),
            alert_type: "memory_high".to_string(),
            severity: "critical".to_string(),
            title: "Memory Usage Critical".to_string(),
            description: format!("Memory usage at {:.1}%", memory.percent),
            timestamp: chrono::Local::now().to_string(),
        });
    }

    alerts
}

#[tauri::command]
pub fn get_uptime() -> u64 {
    System::uptime()
}

#[tauri::command]
pub fn run_verification(
    mode: String
) -> Result<crate::verification::VerificationResult, String> {
    crate::verification::run_verification_impl(&mode)
}

#[tauri::command]
pub fn get_security_protections_status(
) -> Result<crate::commands::security_windows::ProtectionStatus, String> {
    crate::commands::security_windows::get_security_protections_status_impl()
}

pub use notification_commands::notify_app;
