import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BenchmarkResult, CelestialBody, GalaxyStar, PerformanceStats, SimulationMode, SimulationState, StarSystem, Vector3, WorkerResponse } from './engine/types';
import { generateRealStarField, generateRealStarSystem } from './generation/realStars';
import { generateProceduralStarField } from './generation/proceduralGalaxy';
import { generateSolarSystem } from './generation/solarSystem';
import { generateStarSystem, spawnBody } from './generation/system';
import { defaultPhysicsConfig, defaultRenderConfig } from './physics/config';
import { stepKepler } from './physics/kepler';
import { SpaceViewport } from './rendering/SpaceViewport';
import { benchmarkScenarios } from './scenarios/benchmarks';
import { loadSavedLocations, loadSavedSystems, saveLocation, saveSystem } from './state/storage';
import { childSeed } from './utils/seededRandom';
import { SystemPanel } from './components/hud/SystemPanel';
import { TimeControls } from './components/controls/TimeControls';

const INITIAL_SYSTEM_SEED = 'real-solar-system';
type GalaxyMode = 'real' | 'procedural';

const initialStats: PerformanceStats = {
  fps: 0,
  bodyCount: 0,
  simulationMs: 0,
  renderMs: 0
};

const modeLabel = (mode: SimulationMode): string => {
  if (mode === 'kepler') return 'Kepler';
  if (mode === 'barnes-hut') return 'Barnes-Hut';
  return 'Direct N-body';
};

const formatNumber = (value: number, digits = 1): string => value.toLocaleString(undefined, {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits
});

export const App = () => {
  const [galaxyMode, setGalaxyMode] = useState<GalaxyMode>('real');
  const realGalaxy = useMemo(() => generateRealStarField(), []);
  const proceduralGalaxy = useMemo(() => generateProceduralStarField(), []);
  const galaxy = galaxyMode === 'real' ? realGalaxy : proceduralGalaxy;
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
  const [benchmarkBusy, setBenchmarkBusy] = useState<string | undefined>();
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, BenchmarkResult>>({});
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
      if (response.type === 'benchmarkResult') {
        setBenchmarkBusy(undefined);
        setBenchmarkResults((previous) => ({
          ...previous,
          [response.result.scenarioId]: response.result
        }));
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
          collisionMerge: current.system.seed !== INITIAL_SYSTEM_SEED,
          gravitySolver: current.mode === 'barnes-hut' ? 'barnes-hut' : 'direct'
        },
        trailsEnabled: current.trailsEnabled
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [workerBusy]);

  const loadSeed = useCallback((seed: string, name?: string, mode = galaxyMode) => {
    const next = mode === 'real' && seed === INITIAL_SYSTEM_SEED ? generateSolarSystem() : generateStarSystem(seed, name);
    setSeedInput(seed);
    setSimulation((previous) => ({
      ...previous,
      system: next,
      mode: 'kepler',
      elapsed: 0
    }));
    setSelectedBody(next.bodies[0]);
  }, [galaxyMode]);

  const generateFromInput = useCallback(() => {
    const seed = seedInput.trim() || INITIAL_SYSTEM_SEED;
    loadSeed(seed);
  }, [loadSeed, seedInput]);

  const handleStarSelect = useCallback((star: GalaxyStar) => {
    setLastWarp(star);
    const next = galaxyMode === 'real' ? generateRealStarSystem(star) : generateStarSystem(star.seed, star.name);
    setSeedInput(star.seed);
    setSimulation((previous) => ({
      ...previous,
      system: next,
      mode: 'kepler',
      elapsed: 0
    }));
    setSelectedBody(next.bodies[0]);
  }, [galaxyMode]);

  const handleGalaxyMode = useCallback((mode: GalaxyMode) => {
    setGalaxyMode(mode);
    setLastWarp(undefined);
    if (mode === 'real') {
      const next = generateSolarSystem();
      setSeedInput(INITIAL_SYSTEM_SEED);
      setSimulation((previous) => ({
        ...previous,
        system: next,
        mode: 'kepler',
        elapsed: 0
      }));
      setSelectedBody(next.bodies[0]);
      return;
    }

    const next = generateStarSystem('procedural-origin', 'Procedural Origin');
    setSeedInput('procedural-origin');
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

  const handleBenchmark = useCallback((scenarioId: string) => {
    const scenario = benchmarkScenarios.find((entry) => entry.id === scenarioId);
    if (!scenario || !workerRef.current || benchmarkBusy) return;
    setBenchmarkBusy(scenario.id);
    workerRef.current.postMessage({
      type: 'benchmark',
      scenario,
      config: defaultPhysicsConfig
    });
  }, [benchmarkBusy]);

  const selectedId = selectedBody?.id;
  const totalMass = useMemo(() => simulation.system.bodies.reduce((sum, body) => sum + body.mass, 0), [simulation.system.bodies]);
  const starCount = useMemo(() => galaxy.filter((star) => star.catalog).length, [galaxy]);
  const selectedBodyMass = selectedBody ? formatNumber(selectedBody.mass, 2) : 'none';

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <span className="app-mark">WebSpace Engine</span>
          <strong>Algorithms Workbench</strong>
        </div>
        <nav aria-label="Project stack">
          <span>TypeScript</span>
          <span>Three.js</span>
          <span>Web Worker</span>
          <span>Octree</span>
        </nav>
      </header>
      <div className="dashboard-layout">
        <section className="dashboard-column setup-column">
          <SystemPanel
            galaxyMode={galaxyMode}
            seedInput={seedInput}
            system={simulation.system}
            savedSystems={savedSystems}
            savedLocations={savedLocations}
            lastWarp={lastWarp}
            onSeedInput={setSeedInput}
            onGalaxyMode={handleGalaxyMode}
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
        </section>

        <section className="dashboard-column analysis-column">
          <section className="perf-panel" aria-label="Runtime performance">
            <div>
              <span>FPS</span>
              <strong>{formatNumber(stats.fps, 0)}</strong>
            </div>
            <div>
              <span>Bodies</span>
              <strong>{stats.bodyCount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Solver</span>
              <strong>{modeLabel(simulation.mode)}</strong>
            </div>
            <div className={workerBusy ? 'worker-busy' : ''}>
              <span>Kernel</span>
              <strong>{formatNumber(stats.simulationMs, 2)} ms</strong>
            </div>
            <div>
              <span>Frame</span>
              <strong>{formatNumber(stats.renderMs, 2)} ms</strong>
            </div>
          </section>

          <aside className="hud-panel benchmark-panel">
            <div className="panel-kicker">Algorithm benchmark</div>
            <h2>Gravity solver comparison</h2>
            <div className="benchmark-list">
              {benchmarkScenarios.map((scenario) => {
                const result = benchmarkResults[scenario.id];
                const running = benchmarkBusy === scenario.id;
                return (
                  <button type="button" key={scenario.id} onClick={() => handleBenchmark(scenario.id)} disabled={Boolean(benchmarkBusy)}>
                    {running ? 'Running...' : scenario.label}
                    <small>
                      {result
                        ? `${formatNumber(result.directMs, 1)} ms direct / ${formatNumber(result.barnesHutMs, 1)} ms Barnes-Hut / ${formatNumber(result.speedup, 1)}x`
                        : `${scenario.bodyCount.toLocaleString()} bodies, one worker step`}
                    </small>
                  </button>
                );
              })}
            </div>
          </aside>

          <aside className="hud-panel engineering-panel">
            <div className="panel-kicker">Architecture</div>
            <h2>Pipeline</h2>
            <dl className="compact-data">
              <div>
                <dt>source</dt>
                <dd>{galaxyMode === 'real' ? `${starCount.toLocaleString()} HYG records` : `${galaxy.length.toLocaleString()} generated records`}</dd>
              </div>
              <div>
                <dt>worker</dt>
                <dd>{simulation.mode === 'kepler' ? 'UI thread analytic update' : 'off-main-thread velocity-Verlet'}</dd>
              </div>
              <div>
                <dt>complexity</dt>
                <dd>{simulation.mode === 'barnes-hut' ? 'octree approximation' : simulation.mode === 'n-body' ? 'pairwise accumulator' : 'closed-form orbit step'}</dd>
              </div>
              <div>
                <dt>total mass</dt>
                <dd>{formatNumber(totalMass, 0)} simulation units</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="dashboard-column output-column">
          <section className="simulation-card">
            <div className="simulation-card-header">
              <span>3D output viewport</span>
              <strong>{simulation.system.name}</strong>
            </div>
            <div className="simulation-window">
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
            </div>
          </section>

          <aside className="hud-panel inspector-panel">
            <div className="panel-kicker">State vector</div>
            {selectedBody ? (
              <>
                <h2>{selectedBody.name}</h2>
                <span className="type-pill">{selectedBody.type}</span>
                <dl className="data-grid">
                  <dt>mass</dt>
                  <dd>{selectedBodyMass}</dd>
                  <dt>radius</dt>
                  <dd>{formatNumber(selectedBody.radius, 2)}</dd>
                  <dt>|velocity|</dt>
                  <dd>{formatNumber(Math.hypot(selectedBody.velocity.x, selectedBody.velocity.y, selectedBody.velocity.z), 3)}</dd>
                  <dt>orbit</dt>
                  <dd>{selectedBody.orbit ? `${formatNumber(selectedBody.orbit.semiMajorAxis, 0)} axis / e ${formatNumber(selectedBody.orbit.eccentricity, 2)}` : 'free body'}</dd>
                </dl>
              </>
            ) : (
              <p className="empty-state">No node selected.</p>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
};
