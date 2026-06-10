import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CelestialBody, GalaxyStar, PerformanceStats, SimulationMode, SimulationState, StarSystem, Vector3, WorkerResponse } from './engine/types';
import { generateRealStarField, generateRealStarSystem } from './generation/realStars';
import { generateSolarSystem } from './generation/solarSystem';
import { generateStarSystem, spawnBody } from './generation/system';
import { defaultPhysicsConfig, defaultRenderConfig } from './physics/config';
import { stepKepler } from './physics/kepler';
import { SpaceViewport } from './rendering/SpaceViewport';
import { loadSavedLocations, loadSavedSystems, saveLocation, saveSystem } from './state/storage';
import { childSeed } from './utils/seededRandom';
import { SystemPanel } from './components/hud/SystemPanel';
import { TimeControls } from './components/controls/TimeControls';

const INITIAL_SYSTEM_SEED = 'real-solar-system';

const initialStats: PerformanceStats = {
  fps: 0,
  bodyCount: 0,
  simulationMs: 0,
  renderMs: 0
};

export const App = () => {
  const galaxy = useMemo(() => generateRealStarField(), []);
  const [seedInput, setSeedInput] = useState(INITIAL_SYSTEM_SEED);
  const [simulation, setSimulation] = useState<SimulationState>(() => ({
    system: generateSolarSystem(),
    mode: 'kepler',
    paused: false,
    timeScale: 4,
    elapsed: 0,
    trailsEnabled: true
  }));
  const [selectedBody, setSelectedBody] = useState<CelestialBody | undefined>();
  const [stats, setStats] = useState<PerformanceStats>(initialStats);
  const [savedSystems, setSavedSystems] = useState<StarSystem[]>(() => loadSavedSystems());
  const [savedLocations, setSavedLocations] = useState(() => loadSavedLocations());
  const [lastWarp, setLastWarp] = useState<GalaxyStar | undefined>();
  const [workerBusy, setWorkerBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const simulationRef = useRef(simulation);
  const cameraRef = useRef<Vector3>({ x: 0, y: 140, z: 520 });

  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/physicsWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.type === 'stepped') {
        setWorkerBusy(false);
        setStats((previous) => ({
          ...previous,
          bodyCount: response.bodies.length,
          simulationMs: response.simulationMs
        }));
        setSimulation((previous) => ({
          ...previous,
          system: {
            ...previous.system,
            bodies: response.bodies
          },
          elapsed: previous.elapsed + 1
        }));
        setSelectedBody((selected) => response.bodies.find((body) => body.id === selected?.id));
        return;
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = simulationRef.current;
      if (current.paused) return;

      const deltaSeconds = 0.025 * current.timeScale;
      if (current.mode === 'kepler') {
        const started = performance.now();
        const bodies = stepKepler(current.system.bodies, deltaSeconds, current.trailsEnabled, defaultPhysicsConfig.maxTrailPoints);
        setStats((previous) => ({
          ...previous,
          bodyCount: bodies.length,
          simulationMs: performance.now() - started
        }));
        setSimulation((previous) => ({
          ...previous,
          system: {
            ...previous.system,
            bodies
          },
          elapsed: previous.elapsed + deltaSeconds
        }));
        setSelectedBody((selected) => bodies.find((body) => body.id === selected?.id));
        return;
      }

      if (workerBusy || !workerRef.current) return;
      setWorkerBusy(true);
      workerRef.current.postMessage({
        type: 'step',
        bodies: current.system.bodies,
        deltaSeconds,
        config: {
          ...defaultPhysicsConfig,
          collisionMerge: current.system.seed !== INITIAL_SYSTEM_SEED
        },
        trailsEnabled: current.trailsEnabled
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [workerBusy]);

  const loadSeed = useCallback((seed: string, name?: string) => {
    const next = seed === INITIAL_SYSTEM_SEED ? generateSolarSystem() : generateStarSystem(seed, name);
    setSeedInput(seed);
    setSimulation((previous) => ({
      ...previous,
      system: next,
      mode: 'kepler',
      elapsed: 0
    }));
    setSelectedBody(next.bodies[0]);
  }, []);

  const generateFromInput = useCallback(() => {
    const seed = seedInput.trim() || INITIAL_SYSTEM_SEED;
    loadSeed(seed);
  }, [loadSeed, seedInput]);

  const handleStarSelect = useCallback((star: GalaxyStar) => {
    setLastWarp(star);
    const next = generateRealStarSystem(star);
    setSeedInput(star.seed);
    setSimulation((previous) => ({
      ...previous,
      system: next,
      mode: 'kepler',
      elapsed: 0
    }));
    setSelectedBody(next.bodies[0]);
  }, []);

  const handleSaveSystem = useCallback(() => {
    setSavedSystems(saveSystem(simulationRef.current.system));
  }, []);

  const handleSaveLocation = useCallback(() => {
    setSavedLocations(saveLocation(simulationRef.current.system.name, simulationRef.current.system.seed, cameraRef.current));
  }, []);

  const handleSpawn = useCallback((type: 'asteroid' | 'planet' | 'black-hole') => {
    setSimulation((previous) => {
      const spawned = spawnBody(previous.system, type, childSeed(previous.system.seed, type, previous.system.bodies.length + Date.now()));
      return {
        ...previous,
        system: {
          ...previous.system,
          bodies: [...previous.system.bodies, spawned]
        },
        mode: type === 'black-hole' ? 'n-body' : previous.mode
      };
    });
  }, []);

  const handleMode = useCallback((mode: SimulationMode) => {
    setSimulation((previous) => ({
      ...previous,
      mode
    }));
  }, []);

  const selectedId = selectedBody?.id;

  return (
    <main className="app-shell">
      <SpaceViewport
        galaxy={galaxy}
        simulation={simulation}
        selectedId={selectedId}
        onSelect={setSelectedBody}
        onStarSelect={handleStarSelect}
        onStats={(next) => setStats((previous) => ({
          ...previous,
          fps: next.fps,
          bodyCount: simulationRef.current.system.bodies.length,
          renderMs: next.renderMs
        }))}
        onCamera={(position) => {
          cameraRef.current = position;
        }}
      />
      <SystemPanel
        seedInput={seedInput}
        system={simulation.system}
        savedSystems={savedSystems}
        savedLocations={savedLocations}
        lastWarp={lastWarp}
        onSeedInput={setSeedInput}
        onGenerate={generateFromInput}
        onSaveSystem={handleSaveSystem}
        onSaveLocation={handleSaveLocation}
        onLoadSeed={loadSeed}
      />
      <TimeControls
        paused={simulation.paused}
        timeScale={simulation.timeScale}
        mode={simulation.mode}
        trailsEnabled={simulation.trailsEnabled}
        onPaused={(paused) => setSimulation((previous) => ({ ...previous, paused }))}
        onTimeScale={(timeScale) => setSimulation((previous) => ({ ...previous, timeScale }))}
        onMode={handleMode}
        onTrails={(trailsEnabled) => setSimulation((previous) => ({ ...previous, trailsEnabled }))}
        onSpawn={handleSpawn}
      />
      <div className="flight-help">
        <span>Click canvas to capture mouse</span>
        <span>WASD flight</span>
        <span>Q/E vertical</span>
        <span>Shift boost</span>
      </div>
    </main>
  );
};
