export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type BodyType = 'star' | 'planet' | 'moon' | 'asteroid' | 'black-hole' | 'debris';

export type OrbitParams = {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  period: number;
  phase: number;
  parentId?: string;
};

export type CelestialBody = {
  id: string;
  name: string;
  type: BodyType;
  seed: string;
  mass: number;
  radius: number;
  color: string;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  orbit?: OrbitParams;
  rotationRate: number;
  hasRings?: boolean;
  ringColor?: string;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  trail?: Vector3[];
  mergedFrom?: string[];
};

export type GalaxyStar = {
  id: string;
  name: string;
  seed: string;
  position: Vector3;
  color: string;
  mass: number;
  radius: number;
};

export type StarSystem = {
  id: string;
  name: string;
  seed: string;
  bodies: CelestialBody[];
  createdAt: number;
};

export type SimulationMode = 'kepler' | 'n-body';

export type SimulationState = {
  system: StarSystem;
  mode: SimulationMode;
  paused: boolean;
  timeScale: number;
  elapsed: number;
  trailsEnabled: boolean;
};

export type PhysicsConfig = {
  gravitationalConstant: number;
  softening: number;
  collisionMerge: boolean;
  maxTrailPoints: number;
  integration: 'velocity-verlet';
  barnesHutTheta?: number;
};

export type RenderConfig = {
  starCount: number;
  asteroidInstanceThreshold: number;
  lodDistance: number;
  cullingDistance: number;
  exposure: number;
};

export type BenchmarkScenario = {
  id: string;
  label: string;
  bodyCount: number;
  seed: string;
  includeCollisions: boolean;
};

export type PerformanceStats = {
  fps: number;
  bodyCount: number;
  simulationMs: number;
  renderMs: number;
};

export type SavedLocation = {
  id: string;
  name: string;
  seed: string;
  savedAt: number;
  cameraPosition: Vector3;
};

export type WorkerRequest =
  | {
      type: 'step';
      bodies: CelestialBody[];
      deltaSeconds: number;
      config: PhysicsConfig;
      trailsEnabled: boolean;
    }
  | {
      type: 'benchmark';
      scenario: BenchmarkScenario;
      config: PhysicsConfig;
    };

export type WorkerResponse =
  | {
      type: 'stepped';
      bodies: CelestialBody[];
      simulationMs: number;
    }
  | {
      type: 'benchmarkResult';
      scenarioId: string;
      bodyCount: number;
      simulationMs: number;
      mergedBodies: number;
    };
