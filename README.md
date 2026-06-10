# WebSpace Engine

WebSpace Engine is a browser-based procedural universe simulator built with React, TypeScript, and Three.js. It opens directly into a full-screen 3D exploration scene where users can fly through a deterministic galaxy, select stars, warp into generated solar systems, inspect bodies, and switch between simplified orbital motion and real N-body simulation.

The project is intentionally shaped like a scientific exploration tool and game-engine demo: sparse HUD, precise readouts, deterministic seeds, worker-backed physics, and no marketing homepage.

## Architecture

```text
src/
  engine/       Shared domain types for bodies, systems, configs, worker messages.
  generation/   Deterministic galaxy and solar-system generators.
  physics/      Kepler stepping, N-body gravity, collision merging, Barnes-Hut interface.
  rendering/    Three.js viewport, instancing, selection, trails, orbit visualization.
  workers/      Web Worker entrypoint for expensive physics and benchmark runs.
  math/         Lightweight vector math used by generation and physics.
  components/   HUD, inspector, controls, and benchmark panels.
  state/        Local save/reload helpers.
  scenarios/    Benchmark body generators.
  utils/        Formatting and seeded random helpers.
```

Rendering and simulation are decoupled. React owns high-level state and controls. Three.js renders the current system and procedural galaxy. The physics worker receives serializable body snapshots, advances them, and posts results back to the UI thread.

## Algorithms Used

- Deterministic generation: a stable Mulberry32-style PRNG is seeded from strings, then child seeds are derived for galaxies, stars, planets, moons, rings, atmospheres, and asteroid belts.
- Procedural galaxy: star instances are distributed across spiral arms with radial falloff, vertical scatter, and seeded spectral color variation.
- Solar-system generation: each selected star seed produces stable orbital parameters including semi-major axis, eccentricity, inclination, phase, radius, mass, rings, atmospheres, and moons.
- Simplified orbit mode: a Kepler-like updater advances bodies along deterministic elliptical paths for low-cost exploration.
- N-body physics mode: a Web Worker computes direct pairwise gravity with velocity-Verlet integration.
- Collision handling: overlapping bodies merge with mass-weighted velocity and position conservation.
- Trails: recent body positions are retained and rendered as technical orbit traces.
- Instancing: galaxy stars and asteroid belts use instanced meshes where practical.
- Culling/LOD path: render config includes distance thresholds and the renderer separates cheap instanced asteroids from higher-detail bodies.

## Performance Goals

- Keep camera flight and HUD responsive while active physics runs in a worker.
- Sustain smooth exploration for normal generated systems with hundreds of bodies.
- Provide benchmark instrumentation for 100, 1,000, and 10,000 body scenarios.
- Track FPS, body count, simulation step time, render time, and worker busy state.
- Use instancing for starfields and asteroid belts to reduce draw overhead.

## Controls

- Click the canvas to capture mouse look.
- Use `WASD` to fly.
- Use `Q` and `E` for vertical motion.
- Hold `Shift` to boost.
- Click rendered solar-system bodies to inspect them.
- Click galaxy stars to warp to a deterministic system for that star seed.

## Resume Bullets

- Built a browser-based procedural universe engine using React, TypeScript, and Three.js with deterministic generation of stars, planets, moons, rings, and asteroid belts.
- Implemented real-time orbital mechanics with N-body gravity, numerical integration, collision handling, time acceleration, and orbital trails.
- Decoupled rendering and simulation using Web Workers to keep the UI responsive under high body counts.
- Engineered performance optimizations including instanced rendering, culling, LOD, and benchmark instrumentation.
- Designed the physics engine with a clean upgrade path to Rust/WASM and Barnes-Hut spatial partitioning.

## Future Rust/WASM Upgrade Path

The physics worker boundary is intentionally serializable and isolated. A Rust/WASM physics module can replace `src/physics/nbody.ts` behind the same worker request/response contract:

1. Keep `WorkerRequest` and `WorkerResponse` stable.
2. Convert body arrays into typed arrays for position, velocity, mass, and radius.
3. Move integration and collision merging into Rust.
4. Return compact typed-array snapshots to the worker, then hydrate UI-friendly bodies only when needed.
5. Preserve TypeScript generation and rendering while moving hot loops into WASM.

## Future Barnes-Hut Spatial Partitioning Path

`src/physics/nbody.ts` defines a `SpatialPartition` interface and `BarnesHutNode` type as the upgrade seam. The next version should:

1. Build an octree around active bodies each worker step.
2. Store mass and center-of-mass per node.
3. Approximate far clusters using a configurable theta threshold.
4. Fall back to direct pairwise forces for nearby bodies.
5. Reuse the benchmark panel to compare direct N-body vs Barnes-Hut performance at 1,000 and 10,000 bodies.

## Development

```bash
npm install
npm run dev
npm run build
```
