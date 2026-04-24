export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  envVars: Record<string, string>;
  port: number;
  hostPort: number;
  status: string;
  createdAt: string;
  lastDeployedAt: string | null;
}

export interface DeploymentLog {
  timestamp: string;
  message: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: string;
  logs: DeploymentLog[];
  createdAt: string;
  completedAt: string | null;
  containerId: string | null;
  url: string | null;
}

export interface StoreData {
  projects: Project[];
  deployments: Deployment[];
}
