# WebSpace Engine

WebSpace Engine is a browser-based procedural universe simulator built with React, TypeScript, and Three.js. It opens directly into a full-screen 3D exploration scene where users can fly through a deterministic galaxy, select stars, warp into generated solar systems, inspect bodies, and switch between simplified orbital motion and real N-body simulation.

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
