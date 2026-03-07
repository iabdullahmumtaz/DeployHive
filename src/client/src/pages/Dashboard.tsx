import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, GitBranch, Container, FolderKanban, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fetchProjects, fetchDockerStatus, fetchDeployments, triggerDeploy } from '../api';
import type { Deployment, DockerStatus, Project } from '../types';
import type { LucideIcon } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  deploying: 'Deploying',
  building: 'Building',
  queued: 'Queued',
  ready: 'Ready',
  failed: 'Failed',
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentDeps, setRecentDeps] = useState<Deployment[]>([]);
  const [docker, setDocker] = useState<DockerStatus>({ available: false });
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [p, d, deps] = await Promise.all([
        fetchProjects(),
        fetchDockerStatus(),
        fetchDeployments(),
      ]);
      setProjects(p);
      setDocker(d);
      setRecentDeps(deps.slice(0, 8));
    } catch {
      /* server may be starting */
    }
  }

  async function handleDeploy(id: string) {
    setDeploying(id);
    try {
      await triggerDeploy(id);
      await load();
    } finally {
      setDeploying(null);
    }
  }

  const readyCount = projects.filter((p) => p.status === 'ready').length;
  const activeCount = projects.filter((p) => ['deploying', 'building', 'queued'].includes(p.status)).length;

  return (
    <div className="p-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-hive-muted mt-1">Manage and deploy your Git repositories</p>
        </div>
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
          docker.available ? 'status-ready' : 'status-idle'
        }`}>
          <Container className="w-4 h-4" />
          Docker {docker.available ? 'Connected' : 'Unavailable'}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} />
        <StatCard icon={CheckCircle2} label="Ready" value={readyCount} accent="text-green-400" />
        <StatCard icon={Clock} label="Active deploys" value={activeCount} accent="text-yellow-400" />
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Projects</h3>
          <Link to="/new" className="text-sm bg-hive-accent hover:bg-hive-accentHover px-3 py-1.5 rounded-lg font-medium transition">
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-hive-panel rounded-xl border border-hive-border">
            <Rocket className="w-12 h-12 text-hive-muted mx-auto mb-4" />
            <p className="text-hive-muted mb-4">No projects yet</p>
            <Link to="/new" className="inline-block bg-hive-accent hover:bg-hive-accentHover px-4 py-2 rounded-lg font-medium transition">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-hive-panel border border-hive-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border status-${project.status}`}>
                      {STATUS_LABELS[project.status] || project.status}
                    </span>
                  </div>
                  <p className="text-sm text-hive-muted flex items-center gap-1 truncate">
                    <GitBranch className="w-3 h-3 shrink-0" /> {project.repoUrl} ({project.branch})
                  </p>
                  {project.lastDeployedAt && (
                    <p className="text-xs text-hive-muted mt-1">
                      Last deployed: {new Date(project.lastDeployedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/project/${project.id}`} className="px-3 py-2 text-sm border border-hive-border rounded-lg hover:bg-hive-border/30 transition">
                    Details
                  </Link>
                  <button
                    onClick={() => handleDeploy(project.id)}
                    disabled={deploying === project.id || project.status === 'deploying'}
                    className="px-4 py-2 text-sm bg-hive-accent hover:bg-hive-accentHover rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {deploying === project.id ? 'Deploying...' : 'Deploy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-hive-accent" /> Recent Deployments
        </h3>
        {recentDeps.length === 0 ? (
          <p className="text-sm text-hive-muted bg-hive-panel border border-hive-border rounded-xl p-6">
            No deployment history yet. Deploy a project to see logs here.
          </p>
        ) : (
          <div className="bg-hive-panel border border-hive-border rounded-xl divide-y divide-hive-border">
            {recentDeps.map((dep) => {
              const project = projects.find((p) => p.id === dep.projectId);
              return (
                <Link
                  key={dep.id}
                  to={project ? `/project/${project.id}` : '/'}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-hive-border/20 transition text-sm"
                >
                  {dep.status === 'ready' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  ) : dep.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />
                  )}
                  <span className="flex-1 truncate">
                    {project?.name || 'Unknown project'} — {new Date(dep.createdAt).toLocaleString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border status-${dep.status}`}>
                    {STATUS_LABELS[dep.status] || dep.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="bg-hive-panel border border-hive-border rounded-xl p-5">
      <Icon className={`w-5 h-5 mb-2 ${accent ?? 'text-hive-accent'}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-hive-muted">{label}</p>
    </div>
  );
}
