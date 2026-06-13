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
  const acceleration = config.gravitySolver === 'barnes-hut' ? computeBarnesHutAccelerations : computeAccelerations;
  const initialAcceleration = acceleration(bodies, config);
  const predicted = bodies.map((body, index) => {
    const halfAccel = scale(initialAcceleration[index], 0.5 * dt * dt);
    return {
      ...body,
      position: add(add(body.position, scale(body.velocity, dt)), halfAccel),
      acceleration: initialAcceleration[index]
    };
  });
  const nextAcceleration = acceleration(predicted, config);
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
  body?: CelestialBody;
  bodyIds: Set<string>;
  children?: BarnesHutNode[];
};

export interface SpatialPartition {
  build(bodies: CelestialBody[]): void;
  approximateAcceleration(body: CelestialBody, theta: number): Vector3;
}

const emptyNode = (center: Vector3, size: number): BarnesHutNode => ({
  center,
  size,
  mass: 0,
  centerOfMass: vec3(),
  bodyIds: new Set()
});

const childIndex = (node: BarnesHutNode, position: Vector3): number => (
  (position.x >= node.center.x ? 1 : 0) |
  (position.y >= node.center.y ? 2 : 0) |
  (position.z >= node.center.z ? 4 : 0)
);

const makeChildren = (node: BarnesHutNode): BarnesHutNode[] => {
  const quarter = node.size / 4;
  const childSize = node.size / 2;
  const children: BarnesHutNode[] = [];
  for (let i = 0; i < 8; i += 1) {
    children.push(emptyNode({
      x: node.center.x + ((i & 1) ? quarter : -quarter),
      y: node.center.y + ((i & 2) ? quarter : -quarter),
      z: node.center.z + ((i & 4) ? quarter : -quarter)
    }, childSize));
  }
  return children;
};

const updateMass = (node: BarnesHutNode, body: CelestialBody) => {
  const nextMass = node.mass + body.mass;
  if (nextMass <= 0) return;
  node.bodyIds.add(body.id);
  node.centerOfMass = {
    x: (node.centerOfMass.x * node.mass + body.position.x * body.mass) / nextMass,
    y: (node.centerOfMass.y * node.mass + body.position.y * body.mass) / nextMass,
    z: (node.centerOfMass.z * node.mass + body.position.z * body.mass) / nextMass
  };
  node.mass = nextMass;
};

const insertBody = (node: BarnesHutNode, body: CelestialBody, depth = 0) => {
  updateMass(node, body);

  if (!node.children && !node.body) {
    node.body = body;
    return;
  }

  if (!node.children) {
    node.children = makeChildren(node);
    const existing = node.body;
    node.body = undefined;
    if (existing && depth < 24) {
      insertBody(node.children[childIndex(node, existing.position)], existing, depth + 1);
    }
  }

  if (depth >= 24) return;
  insertBody(node.children[childIndex(node, body.position)], body, depth + 1);
};

export class BarnesHutTree implements SpatialPartition {
  private root: BarnesHutNode = emptyNode(vec3(), 1);

  build(bodies: CelestialBody[]): void {
    if (bodies.length === 0) {
      this.root = emptyNode(vec3(), 1);
      return;
    }

    let minX = bodies[0].position.x;
    let minY = bodies[0].position.y;
    let minZ = bodies[0].position.z;
    let maxX = minX;
    let maxY = minY;
    let maxZ = minZ;

    bodies.forEach((body) => {
      minX = Math.min(minX, body.position.x);
      minY = Math.min(minY, body.position.y);
      minZ = Math.min(minZ, body.position.z);
      maxX = Math.max(maxX, body.position.x);
      maxY = Math.max(maxY, body.position.y);
      maxZ = Math.max(maxZ, body.position.z);
    });

    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1);
    this.root = emptyNode(center, span * 1.12);
    bodies.forEach((body) => insertBody(this.root, body));
  }

  approximateAcceleration(body: CelestialBody, theta: number, node = this.root): Vector3 {
    if (node.mass === 0) return vec3();
    if (node.body?.id === body.id && !node.children) return vec3();

    const delta = subtract(node.centerOfMass, body.position);
    const distSq = lengthSq(delta);
    const distance = Math.sqrt(distSq);
    const containsBody = node.children ? node.bodyIds.has(body.id) : false;
    const isFarEnough = !node.children || (!containsBody && node.size / Math.max(distance, 1e-6) < theta);

    if (isFarEnough) {
      const softened = distSq + defaultSofteningSq;
      const invDist = 1 / Math.sqrt(softened);
      const invDist3 = invDist * invDist * invDist;
      return scale(delta, defaultGravity * node.mass * invDist3);
    }

    return (node.children ?? []).reduce((acceleration, child) => add(acceleration, this.approximateAcceleration(body, theta, child)), vec3());
  }
}

let defaultGravity = 1;
let defaultSofteningSq = 1;

const computeBarnesHutAccelerations = (bodies: CelestialBody[], config: PhysicsConfig): Vector3[] => {
  defaultGravity = config.gravitationalConstant;
  defaultSofteningSq = config.softening * config.softening;
  const theta = config.barnesHutTheta ?? 0.7;
  const tree = new BarnesHutTree();
  tree.build(bodies);
  return bodies.map((body) => tree.approximateAcceleration(body, theta));
};
