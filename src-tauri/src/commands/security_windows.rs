#[derive(Debug, Clone, serde::Serialize)]
pub struct ProtectionStatus {
    pub firewall: bool,
    pub cloud: bool,
}

#[cfg(windows)]
pub fn get_security_protections_status_impl() -> Result<ProtectionStatus, String> {
    Ok(ProtectionStatus {
        firewall: true,
        cloud: true,
    })
}

#[cfg(not(windows))]
pub fn get_security_protections_status_impl() -> Result<ProtectionStatus, String> {
    Err("Not supported on this OS".to_string())
}
