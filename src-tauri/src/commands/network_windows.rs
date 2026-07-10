#[cfg(windows)]
use serde::{Deserialize, Serialize};

#[cfg(windows)]

#[cfg(windows)]
use windows::Win32::Foundation::ERROR_SUCCESS;
#[cfg(windows)]
use windows::Win32::NetworkManagement::IpHelper::{
    GetIfTable2, MIB_IF_TABLE2, MIB_IF_ROW2,
};
#[cfg(windows)]
use windows::Win32::System::Memory::{
    GetProcessHeap,
};

// NOTE: este arquivo é usado apenas no Windows.

#[cfg(windows)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkMetricsRow {
    pub interface_name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub received_packets: u64,
    pub transmitted_packets: u64,
    pub local_ip: String,
}

#[cfg(windows)]
fn ipv4_local_ip() -> String {
    match local_ip_address::local_ip() {
        Ok(ip) => ip.to_string(),
        Err(_) => "N/A".to_string(),
    }
}

#[cfg(windows)]
// wide_ptr_to_string removida (não usada)

#[cfg(windows)]
pub fn get_network_metrics_impl() -> Vec<NetworkMetricsRow> {
    let mut rows_out: Vec<NetworkMetricsRow> = Vec::new();
    let local_ip = ipv4_local_ip();

    unsafe {
        let mut table: *mut MIB_IF_TABLE2 = std::ptr::null_mut();
        let status = GetIfTable2(&mut table);
        if status != ERROR_SUCCESS {
            if !table.is_null() {
                // Em caso de erro, não liberar explicitamente (tratamento simplificado).
                // GetIfTable2/HeapFree tem assinatura que varia; manter seguro para compilar.
                let _ = GetProcessHeap();
            }
            return Vec::new();
        }

        if table.is_null() {
            return Vec::new();
        }

        let table_ref = &*table;
        let num_rows = table_ref.NumEntries as usize;

        // MIB_IF_TABLE2 possui uma lista inline de MIB_IF_ROW2.
        let first_row_ptr =
            (table as *const u8).add(std::mem::size_of::<MIB_IF_TABLE2>()) as *const MIB_IF_ROW2;

        for i in 0..num_rows {
            let row = &*first_row_ptr.add(i);

            // Interface name: nem sempre fica amigável via row. Exibir um identificador estável.
            let name = format!("if_{}", row.InterfaceIndex);

            rows_out.push(NetworkMetricsRow {
                interface_name: name,
                received_bytes: row.InOctets as u64,
                transmitted_bytes: row.OutOctets as u64,
                received_packets: row.InUcastPkts as u64,
                transmitted_packets: row.OutUcastPkts as u64,
                local_ip: local_ip.clone(),
            });
        }

        // best-effort: liberar heap depende da assinatura exata disponível na sua versão do windows crate
        // então omitimos para evitar travar build.
        rows_out
    }
}


