import type { BenchmarkScenario, CelestialBody } from '../engine/types';
import { vec3 } from '../math/vector';
import { SeededRandom, childSeed } from '../utils/seededRandom';

export const benchmarkScenarios: BenchmarkScenario[] = [
  { id: 'bodies-100', label: '100 body swarm', bodyCount: 100, seed: 'benchmark-100', includeCollisions: true },
  { id: 'bodies-1000', label: '1,000 body belt', bodyCount: 1000, seed: 'benchmark-1000', includeCollisions: false },
  { id: 'bodies-2500', label: '2,500 body stress', bodyCount: 2500, seed: 'benchmark-2500', includeCollisions: false }
];

export const generateBenchmarkBodies = (scenario: BenchmarkScenario): CelestialBody[] => {
  const random = new SeededRandom(scenario.seed);
  const bodies: CelestialBody[] = [
    {
      id: `${scenario.id}-primary`,
      name: 'Benchmark primary',
      type: 'star',
      seed: childSeed(scenario.seed, 'primary'),
      mass: 180000,
      radius: 24,
      color: '#fef3c7',
      position: vec3(),
      velocity: vec3(),
      acceleration: vec3(),
      rotationRate: 0.1,
      trail: []
    }
  ];

  for (let i = 1; i < scenario.bodyCount; i += 1) {
    const radius = random.range(120, 1300);
    const angle = random.range(0, Math.PI * 2);
    const speed = Math.sqrt((180000 * 0.00042) / radius);
    bodies.push({
      id: `${scenario.id}-${i}`,
      name: `Benchmark body ${i}`,
      type: i % 21 === 0 ? 'planet' : 'asteroid',
      seed: childSeed(scenario.seed, 'body', i),
      mass: random.range(0.02, i % 21 === 0 ? 80 : 0.8),
      radius: random.range(0.4, i % 21 === 0 ? 4.8 : 1.2),
      color: i % 21 === 0 ? '#9ca3af' : '#78716c',
      position: {
        x: Math.cos(angle) * radius,
        y: random.range(-18, 18),
        z: Math.sin(angle) * radius
      },
      velocity: {
        x: -Math.sin(angle) * speed,
        y: 0,
        z: Math.cos(angle) * speed
      },
      acceleration: vec3(),
      rotationRate: random.range(0.1, 1.2),
      trail: []
    });
  }

  return bodies;
};
