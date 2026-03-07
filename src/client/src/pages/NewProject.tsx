import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    repoUrl: '',
    branch: 'main',
    port: 3000,
    hostPort: 8080,
    envKey: '',
    envValue: '',
  });
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addEnvVar() {
    if (!form.envKey) return;
    setEnvVars({ ...envVars, [form.envKey]: form.envValue });
    setForm({ ...form, envKey: '', envValue: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const project = await createProject({
        name: form.name,
        repoUrl: form.repoUrl,
        branch: form.branch,
        port: Number(form.port),
        hostPort: Number(form.hostPort),
        envVars,
      });
      navigate(`/project/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">New Project</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Project Name">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="my-app" />
        </Field>
        <Field label="Git Repository URL">
          <input className="input" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} required placeholder="https://github.com/user/repo.git" />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Branch">
            <input className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          </Field>
          <Field label="Container Port">
            <input type="number" className="input" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
          </Field>
          <Field label="Host Port">
            <input type="number" className="input" value={form.hostPort} onChange={(e) => setForm({ ...form, hostPort: Number(e.target.value) })} />
          </Field>
        </div>

        <div>
          <label className="text-sm text-hive-muted mb-2 block">Environment Variables</label>
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="KEY" value={form.envKey} onChange={(e) => setForm({ ...form, envKey: e.target.value })} />
            <input className="input flex-1" placeholder="value" value={form.envValue} onChange={(e) => setForm({ ...form, envValue: e.target.value })} />
            <button type="button" onClick={addEnvVar} className="px-4 bg-hive-border rounded-lg text-sm hover:bg-zinc-600 transition">Add</button>
          </div>
          {Object.entries(envVars).map(([k, v]) => (
            <div key={k} className="text-sm bg-hive-panel border border-hive-border rounded px-3 py-1.5 mb-1 flex justify-between">
              <span><span className="text-hive-accent">{k}</span>=<span className="text-hive-muted">{v}</span></span>
              <button type="button" onClick={() => { const n = { ...envVars }; delete n[k]; setEnvVars(n); }} className="text-red-400 text-xs">Remove</button>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-hive-accent hover:bg-hive-accentHover py-3 rounded-lg font-medium transition disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-sm text-hive-muted mb-1 block">{label}</label>
      {children}
    </div>
  );
}
