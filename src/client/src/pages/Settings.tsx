import { useState, useEffect } from 'react';
import { Container, Server, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { fetchDockerStatus } from '../api';
import type { DockerStatus } from '../types';
import type { LucideIcon } from 'lucide-react';

interface HealthInfo {
  status: string;
  service: string;
}

export default function Settings() {
  const [docker, setDocker] = useState<DockerStatus>({ available: false });
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [d, h] = await Promise.all([
        fetchDockerStatus(),
        fetch('/api/health').then((r) => (r.ok ? r.json() : null)),
      ]);
      setDocker(d);
      setHealth(h);
      setError('');
    } catch {
      setError('Cannot reach API — start the backend on port 6012');
      setHealth(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Settings</h2>
      <p className="text-hive-muted mb-8">System status and runtime configuration</p>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Card
          icon={Server}
          title="API Server"
          status={health ? 'ok' : 'error'}
          detail={health ? `${health.service} — healthy` : 'Unreachable'}
        />
        <Card
          icon={Container}
          title="Docker Engine"
          status={docker.available ? 'ok' : 'warn'}
          detail={docker.available ? 'Connected — Dockerfile deployments enabled' : 'Unavailable — Git clone & Node.js deploy only'}
        />
        <div className="bg-hive-panel border border-hive-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-hive-accent" />
            <h3 className="font-semibold">Environment</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Frontend" value="http://localhost:5012" />
            <Row label="API" value="http://localhost:6012" />
            <Row label="Proxy" value="/api → VITE_API_URL or localhost:6012" />
            <Row label="Data" value="deployments/ (JSON store)" />
            <Row label="Repos" value="repos/ (cloned Git)" />
          </dl>
        </div>
        <div className="bg-hive-panel border border-hive-border rounded-xl p-5 text-sm text-hive-muted">
          <p className="font-medium text-white mb-2">Deploy pipeline</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Clone or pull the Git repository</li>
            <li>Build Docker image when Dockerfile is present</li>
            <li>Otherwise install Node.js dependencies from package.json</li>
            <li>Stream logs to the deployment history viewer</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  status,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  detail: string;
}) {
  const ok = status === 'ok';
  const warn = status === 'warn';
  return (
    <div className="bg-hive-panel border border-hive-border rounded-xl p-5 flex items-start gap-4">
      <div className="p-2 rounded-lg bg-hive-bg border border-hive-border">
        <Icon className="w-5 h-5 text-hive-accent" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {ok && <CheckCircle2 className="w-5 h-5 text-green-400" />}
          {warn && <Container className="w-5 h-5 text-yellow-400" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
        </div>
        <p className="text-sm text-hive-muted mt-1">{detail}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-hive-muted">{label}</dt>
      <dd className="font-mono text-xs text-right">{value}</dd>
    </div>
  );
}
