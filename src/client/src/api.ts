import type { CreateProjectPayload, Deployment, DockerStatus, Project } from './types';

const API = '/api';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json() as Promise<Project[]>;
}

export async function createProject(data: CreateProjectPayload): Promise<Project> {
  const res = await fetch(`${API}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as Project & { error?: string };
  if (!res.ok) throw new Error(json.error || 'Failed to create project');
  return json;
}

export async function updateProject(id: string, data: Partial<CreateProjectPayload>): Promise<Project> {
  const res = await fetch(`${API}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json() as Promise<Project>;
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
}

export async function fetchDeployments(projectId?: string): Promise<Deployment[]> {
  const url = projectId ? `${API}/deployments?projectId=${projectId}` : `${API}/deployments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch deployments');
  return res.json() as Promise<Deployment[]>;
}

export async function triggerDeploy(projectId: string): Promise<Deployment> {
  const res = await fetch(`${API}/deployments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  const json = (await res.json()) as Deployment & { error?: string };
  if (!res.ok) throw new Error(json.error || 'Deploy failed');
  return json;
}

export async function fetchDeployment(id: string): Promise<Deployment> {
  const res = await fetch(`${API}/deployments/${id}`);
  if (!res.ok) throw new Error('Failed to fetch deployment');
  return res.json() as Promise<Deployment>;
}

export async function fetchDockerStatus(): Promise<DockerStatus> {
  const res = await fetch(`${API}/deployments/docker-status`);
  return res.json() as Promise<DockerStatus>;
}
