import type { CelestialBody, PhysicsConfig, Vector3 } from '../engine/types';
import { add, lengthSq, scale, subtract, vec3 } from '../math/vector';

const computeAccelerations = (bodies: CelestialBody[], config: PhysicsConfig): Vector3[] => {
  const accelerations = bodies.map(() => vec3());

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const delta = subtract(bodies[j].position, bodies[i].position);
      const distSq = lengthSq(delta) + config.softening * config.softening;
      const invDist = 1 / Math.sqrt(distSq);
      const invDist3 = invDist * invDist * invDist;
      const force = scale(delta, config.gravitationalConstant * invDist3);
      accelerations[i] = add(accelerations[i], scale(force, bodies[j].mass));
      accelerations[j] = add(accelerations[j], scale(force, -bodies[i].mass));
    }
  }

  return accelerations;
};

const mergeCollisions = (bodies: CelestialBody[]): CelestialBody[] => {
  const consumed = new Set<string>();
  const output: CelestialBody[] = [];

  for (let i = 0; i < bodies.length; i += 1) {
    if (consumed.has(bodies[i].id)) continue;
    let survivor = bodies[i];

    for (let j = i + 1; j < bodies.length; j += 1) {
      if (consumed.has(bodies[j].id)) continue;
      const dx = survivor.position.x - bodies[j].position.x;
      const dy = survivor.position.y - bodies[j].position.y;
      const dz = survivor.position.z - bodies[j].position.z;
      const minDistance = Math.max(0.8, (survivor.radius + bodies[j].radius) * 0.72);
      if (dx * dx + dy * dy + dz * dz <= minDistance * minDistance) {
        const a = survivor;
        const b = bodies[j];
        const mass = a.mass + b.mass;
        survivor = {
          ...a,
          id: a.mass >= b.mass ? a.id : b.id,
          name: a.mass >= b.mass ? a.name : b.name,
          type: a.type === 'black-hole' || b.type === 'black-hole' ? 'black-hole' : a.type,
          mass,
          radius: Math.cbrt(Math.pow(a.radius, 3) + Math.pow(b.radius, 3)),
          position: {
            x: (a.position.x * a.mass + b.position.x * b.mass) / mass,
            y: (a.position.y * a.mass + b.position.y * b.mass) / mass,
            z: (a.position.z * a.mass + b.position.z * b.mass) / mass
          },
          velocity: {
            x: (a.velocity.x * a.mass + b.velocity.x * b.mass) / mass,
            y: (a.velocity.y * a.mass + b.velocity.y * b.mass) / mass,
            z: (a.velocity.z * a.mass + b.velocity.z * b.mass) / mass
          },
          mergedFrom: [...(a.mergedFrom ?? []), ...(b.mergedFrom ?? []), b.id]
        };
        consumed.add(bodies[j].id);
      }
    }

    output.push(survivor);
  }

  return output;
};

const stepNBodyOnce = (bodies: CelestialBody[], deltaSeconds: number, config: PhysicsConfig, trailsEnabled: boolean): CelestialBody[] => {
  const dt = deltaSeconds;
  const initialAcceleration = computeAccelerations(bodies, config);
  const predicted = bodies.map((body, index) => {
    const halfAccel = scale(initialAcceleration[index], 0.5 * dt * dt);
    return {
      ...body,
      position: add(add(body.position, scale(body.velocity, dt)), halfAccel),
      acceleration: initialAcceleration[index]
    };
  });
  const nextAcceleration = computeAccelerations(predicted, config);
  const integrated = predicted.map((body, index) => ({
    ...body,
    velocity: add(body.velocity, scale(add(initialAcceleration[index], nextAcceleration[index]), 0.5 * dt)),
    acceleration: nextAcceleration[index],
    trail: trailsEnabled ? [...(body.trail ?? []), body.position].slice(-config.maxTrailPoints) : []
  }));

  return config.collisionMerge ? mergeCollisions(integrated) : integrated;
};

export const stepNBody = (bodies: CelestialBody[], deltaSeconds: number, config: PhysicsConfig, trailsEnabled: boolean): CelestialBody[] => {
  // N-body mode is intentionally conservative: small substeps prevent planets
  // from gaining energy and slingshotting when the UI time scale is high.
  const maxSubstepDays = 0.05;
  const total = Math.min(deltaSeconds, 0.35);
  const steps = Math.max(1, Math.ceil(total / maxSubstepDays));
  const dt = total / steps;
  let next = bodies;

  for (let i = 0; i < steps; i += 1) {
    next = stepNBodyOnce(next, dt, config, trailsEnabled && i === steps - 1);
  }

  return next;
};

export type BarnesHutNode = {
  center: Vector3;
  size: number;
  mass: number;
  centerOfMass: Vector3;
  children?: BarnesHutNode[];
};

export interface SpatialPartition {
  build(bodies: CelestialBody[]): void;
  approximateAcceleration(body: CelestialBody, theta: number): Vector3;
}

// TODO: replace the direct O(n^2) accumulator with an octree-backed Barnes-Hut
// implementation behind this interface when the engine moves beyond MVP scale.
