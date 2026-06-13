import type { PhysicsConfig, RenderConfig } from '../engine/types';
import { REAL_GRAVITY_UNITS } from '../generation/solarSystem';

export const defaultPhysicsConfig: PhysicsConfig = {
  gravitationalConstant: REAL_GRAVITY_UNITS,
  softening: 1.8,
  collisionMerge: true,
  maxTrailPoints: 180,
  integration: 'velocity-verlet',
  gravitySolver: 'direct',
  barnesHutTheta: 0.7
};

export const defaultRenderConfig: RenderConfig = {
  starCount: 2600,
  asteroidInstanceThreshold: 80,
  lodDistance: 2400,
  cullingDistance: 9000,
  exposure: 1.2
};
