# WebSpace Engine

WebSpace Engine is a browser-native astrophysics sandbox built with React, TypeScript, Three.js, and Web Workers. It is designed as a systems/graphics project: users can fly through real nearby-star data, warp into generated planetary systems, inspect state vectors, and switch between cheap Keplerian motion, direct N-body gravity, and a Barnes-Hut octree solver.

Rendering and simulation are decoupled. React owns high-level state and controls. Three.js renders the current system and procedural galaxy. The physics worker receives serializable body snapshots, advances them, and posts results back to the UI thread.

## Recruiting Signal

This project is meant to demonstrate software engineering depth, not just a visual demo:

- Algorithms: direct pairwise gravity and Barnes-Hut spatial approximation expose the classic `O(n^2)` versus approximate `O(n log n)` tradeoff.
- Systems: physics runs in a Web Worker so simulation load does not block the UI thread.
- Graphics: star fields, asteroid belts, trails, atmospheres, and selection markers are rendered with Three.js primitives and instancing where useful.
- Data: the real-star mode uses a compact HYG catalog subset with distance, spectral type, luminosity, magnitude, and radius metadata.
- Product polish: the app includes an in-scene benchmark lab, runtime performance console, selected-body inspector, deterministic seeds, and saved systems/locations.

## Benchmark Lab

The benchmark lab compares direct N-body integration with Barnes-Hut integration in the browser worker. Small systems can favor the direct solver because the octree has construction overhead. Larger systems show the intended scalability advantage as body count increases.

## Algorithms Used

- Deterministic generation: a stable Mulberry32-style PRNG is seeded from strings, then child seeds are derived for galaxies, stars, planets, moons, rings, atmospheres, and asteroid belts.
- Procedural galaxy: star instances are distributed across spiral arms with radial falloff, vertical scatter, and seeded spectral color variation.
- Solar-system generation: each selected star seed produces stable orbital parameters including semi-major axis, eccentricity, inclination, phase, radius, mass, rings, atmospheres, and moons.
- Simplified orbit mode: a Kepler-like updater advances bodies along deterministic elliptical paths for low-cost exploration.
- N-body physics mode: a Web Worker computes direct pairwise gravity with velocity-Verlet integration.
- Barnes-Hut mode: a worker-side octree approximates distant body clusters by center of mass for higher body-count simulations.
- Collision handling: overlapping bodies merge with mass-weighted velocity and position conservation.
- Trails: recent body positions are retained and rendered as technical orbit traces.
- Instancing: galaxy stars and asteroid belts use instanced meshes where practical.
- Culling/LOD path: render config includes distance thresholds and the renderer separates cheap instanced asteroids from higher-detail bodies.
