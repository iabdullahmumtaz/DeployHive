declare module 'dockerode' {
  import { EventEmitter } from 'events';

  interface DockerOptions {
    socketPath?: string;
  }

  interface ContainerCreateOptions {
    name?: string;
    Image?: string;
    Env?: string[];
    ExposedPorts?: Record<string, object>;
    HostConfig?: {
      PortBindings?: Record<string, Array<{ HostPort: string }>>;
      RestartPolicy?: { Name: string };
    };
  }

  interface Container {
    id: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    remove(): Promise<void>;
  }

  export default class Dockerode extends EventEmitter {
    constructor(options?: DockerOptions);
    ping(): Promise<void>;
    getContainer(name: string): Container;
    createContainer(options: ContainerCreateOptions): Promise<Container>;
  }
}
