import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const info = await invoke('get_system_info');
        setSystemInfo(info);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching system info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  return { systemInfo, loading, error };
};

export const useCpuMetrics = (interval = 1000) => {
  const [cpuMetrics, setCpuMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCpuMetrics = async () => {
      try {
        const metrics = await invoke('get_cpu_metrics');
        setCpuMetrics(metrics);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching CPU metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCpuMetrics();
    const timer = setInterval(fetchCpuMetrics, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { cpuMetrics, loading, error };
};

export const useMemoryMetrics = (interval = 1000) => {
  const [memoryMetrics, setMemoryMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemoryMetrics = async () => {
      try {
        const metrics = await invoke('get_memory_metrics');
        setMemoryMetrics(metrics);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching memory metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryMetrics();
    const timer = setInterval(fetchMemoryMetrics, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { memoryMetrics, loading, error };
};

export const useDiskMetrics = (interval = 5000) => {
  const [diskMetrics, setDiskMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiskMetrics = async () => {
      try {
        const metrics = await invoke('get_disk_metrics');
        setDiskMetrics(metrics);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching disk metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiskMetrics();
    const timer = setInterval(fetchDiskMetrics, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { diskMetrics, loading, error };
};

export const useNetworkMetrics = (interval = 2000) => {
  const [networkMetrics, setNetworkMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNetworkMetrics = async () => {
      try {
        const metrics = await invoke('get_network_metrics');
        setNetworkMetrics(metrics);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching network metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkMetrics();
    const timer = setInterval(fetchNetworkMetrics, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { networkMetrics, loading, error };
};

export const useTopProcesses = (limit = 10, interval = 3000) => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const procs = await invoke('get_top_processes', { limit });
        setProcesses(procs);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching top processes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
    const timer = setInterval(fetchProcesses, interval);

    return () => clearInterval(timer);
  }, [limit, interval]);

  return { processes, loading, error };
};

export const useSystemAlerts = (interval = 4000) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const systemAlerts = await invoke('generate_system_alerts');
        setAlerts(systemAlerts);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching system alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const timer = setInterval(fetchAlerts, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { alerts, loading, error };
};

export const useUptime = (interval = 5000) => {
  const [uptime, setUptime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUptime = async () => {
      try {
        const uptimeSeconds = await invoke('get_uptime');
        setUptime(uptimeSeconds);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Error fetching uptime:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUptime();
    const timer = setInterval(fetchUptime, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { uptime, loading, error };
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUptime = (seconds) => {
  if (!seconds) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  if (secs > 0) result.push(`${secs}s`);

  return result.join(' ');
};
