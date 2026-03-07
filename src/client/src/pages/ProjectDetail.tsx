import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Terminal, ExternalLink, Trash2 } from 'lucide-react';
import { fetchProjects, fetchDeployments, fetchDeployment, triggerDeploy, updateProject, deleteProject } from '../api';
import type { Deployment, DeploymentLog, Project } from '../types';

const ACTIVE = ['queued', 'building', 'deploying'];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [selectedDepId, setSelectedDepId] = useState<string | null>(null);
  const [envEdit, setEnvEdit] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!selectedDepId) return;
    let cancelled = false;

    async function pollLogs() {
      try {
        const dep = await fetchDeployment(selectedDepId!);
        if (!cancelled) setActiveDeployment(dep);
      } catch {
        /* ignore */
      }
    }

    pollLogs();
    const dep = deployments.find((d) => d.id === selectedDepId);
    const needsFastPoll = dep && ACTIVE.includes(dep.status);
    const ms = needsFastPoll ? 1500 : 5000;
    const interval = setInterval(pollLogs, ms);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedDepId, deployments]);

  async function load() {
    const projects = await fetchProjects();
    const p = projects.find((x) => x.id === id);
    setProject(p ?? null);
    if (p) setEnvVars(p.envVars || {});
    const deps = await fetchDeployments(id!);
    setDeployments(deps);
    if (deps.length && !selectedDepId) setSelectedDepId(deps[0].id);
  }

  async function handleDeploy() {
    await triggerDeploy(id!);
    await load();
  }

  async function saveEnvVars() {
    await updateProject(id!, { envVars });
    setEnvEdit(false);
    await load();
  }

  async function handleDelete() {
    if (!confirm(`Delete project "${project?.name}" and all deployments?`)) return;
    setDeleting(true);
    try {
      await deleteProject(id!);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  }

  if (!project) return <p className="p-8 text-hive-muted">Loading...</p>;

  const displayDep = activeDeployment?.id === selectedDepId
    ? activeDeployment
    : deployments.find((d) => d.id === selectedDepId) || deployments[0];

  return (
    <div className="p-8">
      <Link to="/" className="inline-flex items-center gap-1 text-hive-muted hover:text-white text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-hive-muted text-sm mt-1">{project.repoUrl}</p>
          <p className="text-xs text-hive-muted mt-1">
            Branch: {project.branch} · Container port: {project.port} · Host: {project.hostPort}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button onClick={handleDeploy} className="flex items-center gap-2 bg-hive-accent hover:bg-hive-accentHover px-4 py-2 rounded-lg font-medium transition">
            <Rocket className="w-4 h-4" /> Deploy Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-hive-panel border border-hive-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Environment Variables</h3>
            {envEdit ? (
              <>
                {Object.entries(envVars).map(([k, v]) => (
                  <div key={k} className="text-sm mb-2">
                    <input className="input text-xs mb-1" value={k} readOnly />
                    <input className="input text-xs" value={v} onChange={(e) => setEnvVars({ ...envVars, [k]: e.target.value })} />
                  </div>
                ))}
                <button onClick={() => setEnvVars({ ...envVars, [`KEY_${Object.keys(envVars).length + 1}`]: '' })} className="text-xs text-hive-accent mb-2">+ Add variable</button>
                <div className="flex gap-2">
                  <button onClick={saveEnvVars} className="text-sm bg-hive-accent px-3 py-1 rounded">Save</button>
                  <button onClick={() => setEnvEdit(false)} className="text-sm text-hive-muted">Cancel</button>
                </div>
              </>
            ) : (
              <>
                {Object.entries(project.envVars || {}).length === 0 && (
                  <p className="text-sm text-hive-muted">No env vars configured</p>
                )}
                {Object.entries(project.envVars || {}).map(([k, v]) => (
                  <div key={k} className="text-sm mb-1">
                    <span className="text-hive-accent">{k}</span>
                    <span className="text-hive-muted"> = {v}</span>
                  </div>
                ))}
                <button onClick={() => setEnvEdit(true)} className="text-sm text-hive-accent mt-2">Edit</button>
              </>
            )}
          </div>

          <div className="bg-hive-panel border border-hive-border rounded-xl p-5">
            <h3 className="font-semibold mb-3">Deployment History</h3>
            {deployments.length === 0 && <p className="text-sm text-hive-muted">No deployments yet</p>}
            {deployments.map((dep) => (
              <button
                key={dep.id}
                onClick={() => setSelectedDepId(dep.id)}
                className={`w-full text-left p-2 rounded-lg mb-1 text-sm transition ${
                  selectedDepId === dep.id ? 'bg-hive-accent/15' : 'hover:bg-hive-border/30'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 status-${dep.status}`} />
                {new Date(dep.createdAt).toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-hive-panel border border-hive-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Deployment Logs
            </h3>
            {displayDep?.url && displayDep.status === 'ready' && (
              <a href={displayDep.url} target="_blank" rel="noreferrer" className="text-sm text-hive-accent flex items-center gap-1">
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-xs h-96 overflow-y-auto">
            {!displayDep && <p className="text-hive-muted">Select a deployment to view logs</p>}
            {displayDep?.logs?.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="text-hive-muted">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className={log.message.startsWith('ERROR') ? 'text-red-400' : 'text-green-300'}>{log.message}</span>
              </div>
            ))}
            {displayDep && ACTIVE.includes(displayDep.status) && (
              <span className="text-yellow-400 animate-pulse">Deploying...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
