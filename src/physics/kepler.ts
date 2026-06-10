import type { CelestialBody } from '../engine/types';

export const stepKepler = (bodies: CelestialBody[], deltaSeconds: number, trailsEnabled: boolean, maxTrailPoints: number): CelestialBody[] => {
  const byId = new Map(bodies.map((body) => [body.id, body]));
  return bodies.map((body) => {
    if (!body.orbit) {
      return {
        ...body,
        trail: trailsEnabled ? [...(body.trail ?? []), body.position].slice(-maxTrailPoints) : []
      };
    }

    const parent = body.orbit.parentId ? byId.get(body.orbit.parentId) : undefined;
    const parentPosition = parent?.position ?? { x: 0, y: 0, z: 0 };
    const phase = body.orbit.phase + (deltaSeconds / Math.max(body.orbit.period, 1)) * Math.PI * 2;
    // Kepler ellipse in polar form: parent body sits at a focus.
    const distance = body.orbit.semiMajorAxis * (1 - body.orbit.eccentricity * body.orbit.eccentricity) / (1 + body.orbit.eccentricity * Math.cos(phase));
    const x = Math.cos(phase) * distance;
    const z = Math.sin(phase) * distance;
    const y = Math.sin(body.orbit.inclination) * distance * 0.12;
    const speed = (Math.PI * 2 * distance) / Math.max(body.orbit.period, 1);

    const next: CelestialBody = {
      ...body,
      position: {
        x: parentPosition.x + x,
        y: parentPosition.y + y,
        z: parentPosition.z + z
      },
      velocity: {
        x: -Math.sin(phase) * speed,
        y: 0,
        z: Math.cos(phase) * speed
      },
      orbit: {
        ...body.orbit,
        phase
      }
    };

    return {
      ...next,
      trail: trailsEnabled ? [...(body.trail ?? []), next.position].slice(-maxTrailPoints) : []
    };
  });
};
