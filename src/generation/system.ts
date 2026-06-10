import type { CelestialBody, StarSystem, Vector3 } from '../engine/types';
import { rotateY, vec3 } from '../math/vector';
import { SeededRandom, childSeed } from '../utils/seededRandom';

const PLANET_COLORS = ['#7f8c8d', '#a3a3a3', '#c19a6b', '#708090', '#b3cde0', '#c7b198', '#8fa3ad', '#d6c5a8'];

const orbitalVelocity = (centralMass: number, radius: number): number => Math.sqrt((centralMass * 0.00042) / Math.max(radius, 1));

const bodyId = (seed: string, label: string, index: number): string => `${seed}-${label}-${index}`.replace(/[^a-zA-Z0-9_-]/g, '-');

const makeOrbitPosition = (distance: number, phase: number, inclination: number): Vector3 => {
  const base = { x: Math.cos(phase) * distance, y: Math.sin(inclination) * distance * 0.12, z: Math.sin(phase) * distance };
  return rotateY(base, inclination);
};

export const generateStarSystem = (seed: string, preferredName?: string): StarSystem => {
  const random = new SeededRandom(seed);
  const starMass = random.range(80000, 220000);
  const starRadius = random.range(24, 52);
  const starColor = random.pick(['#fff7d6', '#dbeafe', '#fde68a', '#fecaca', '#e0e7ff']);
  const bodies: CelestialBody[] = [
    {
      id: bodyId(seed, 'primary', 0),
      name: preferredName ? `${preferredName} Primary` : 'Primary Star',
      type: 'star',
      seed: childSeed(seed, 'primary'),
      mass: starMass,
      radius: starRadius,
      color: starColor,
      position: vec3(),
      velocity: vec3(),
      acceleration: vec3(),
      rotationRate: random.range(0.03, 0.11),
      trail: []
    }
  ];

  const planetCount = random.int(5, 10);
  for (let i = 0; i < planetCount; i += 1) {
    const planetSeed = childSeed(seed, 'planet', i);
    const planetRandom = new SeededRandom(planetSeed);
    const semiMajorAxis = 120 + i * random.range(72, 135) + random.range(0, 52);
    const eccentricity = planetRandom.range(0.01, 0.18);
    const inclination = planetRandom.range(-0.28, 0.28);
    const phase = planetRandom.range(0, Math.PI * 2);
    const radius = planetRandom.range(6, i > 4 ? 18 : 14);
    const mass = Math.pow(radius, 3) * planetRandom.range(0.8, 2.6);
    const position = makeOrbitPosition(semiMajorAxis * (1 - eccentricity * Math.cos(phase)), phase, inclination);
    const speed = orbitalVelocity(starMass, semiMajorAxis);

    const planet: CelestialBody = {
      id: bodyId(seed, 'planet', i),
      name: `Planet ${String.fromCharCode(66 + i)}`,
      type: 'planet',
      seed: planetSeed,
      mass,
      radius,
      color: planetRandom.pick(PLANET_COLORS),
      position,
      velocity: { x: -Math.sin(phase) * speed, y: 0, z: Math.cos(phase) * speed },
      acceleration: vec3(),
      orbit: {
        semiMajorAxis,
        eccentricity,
        inclination,
        period: Math.sqrt(Math.pow(semiMajorAxis, 3) / starMass) * 420,
        phase,
        parentId: bodies[0].id
      },
      rotationRate: planetRandom.range(0.12, 0.7),
      hasRings: planetRandom.bool(i > 4 ? 0.38 : 0.12),
      ringColor: '#a8a29e',
      hasAtmosphere: planetRandom.bool(0.52),
      atmosphereColor: '#93c5fd',
      trail: []
    };
    bodies.push(planet);

    const moonCount = planetRandom.int(0, i > 2 ? 3 : 1);
    for (let m = 0; m < moonCount; m += 1) {
      const moonSeed = childSeed(planetSeed, 'moon', m);
      const moonRandom = new SeededRandom(moonSeed);
      const moonDistance = radius * moonRandom.range(3.2, 7.5);
      const moonPhase = moonRandom.range(0, Math.PI * 2);
      const moonPosition = makeOrbitPosition(moonDistance, moonPhase, moonRandom.range(-0.18, 0.18));
      const moonSpeed = orbitalVelocity(mass, moonDistance) * 2.2;
      bodies.push({
        id: bodyId(seed, `planet-${i}-moon`, m),
        name: `${planet.name}.${m + 1}`,
        type: 'moon',
        seed: moonSeed,
        mass: moonRandom.range(3, 60),
        radius: moonRandom.range(1.4, 3.8),
        color: moonRandom.pick(['#bdbdbd', '#8d8a82', '#d6d3d1']),
        position: {
          x: position.x + moonPosition.x,
          y: position.y + moonPosition.y,
          z: position.z + moonPosition.z
        },
        velocity: {
          x: planet.velocity.x - Math.sin(moonPhase) * moonSpeed,
          y: 0,
          z: planet.velocity.z + Math.cos(moonPhase) * moonSpeed
        },
        acceleration: vec3(),
        orbit: {
          semiMajorAxis: moonDistance,
          eccentricity: moonRandom.range(0.01, 0.12),
          inclination: moonRandom.range(-0.18, 0.18),
          period: Math.sqrt(Math.pow(moonDistance, 3) / Math.max(mass, 1)) * 120,
          phase: moonPhase,
          parentId: planet.id
        },
        rotationRate: moonRandom.range(0.04, 0.22),
        trail: []
      });
    }
  }

  const beltDistance = 120 + planetCount * 112;
  for (let i = 0; i < 240; i += 1) {
    const asteroidSeed = childSeed(seed, 'asteroid', i);
    const asteroidRandom = new SeededRandom(asteroidSeed);
    const distance = asteroidRandom.range(beltDistance * 0.86, beltDistance * 1.18);
    const phase = asteroidRandom.range(0, Math.PI * 2);
    const position = makeOrbitPosition(distance, phase, asteroidRandom.range(-0.08, 0.08));
    bodies.push({
      id: bodyId(seed, 'asteroid', i),
      name: `Belt fragment ${i + 1}`,
      type: 'asteroid',
      seed: asteroidSeed,
      mass: asteroidRandom.range(0.02, 0.4),
      radius: asteroidRandom.range(0.45, 1.25),
      color: asteroidRandom.pick(['#77716b', '#57534e', '#a8a29e']),
      position,
      velocity: { x: -Math.sin(phase) * orbitalVelocity(starMass, distance), y: 0, z: Math.cos(phase) * orbitalVelocity(starMass, distance) },
      acceleration: vec3(),
      orbit: {
        semiMajorAxis: distance,
        eccentricity: asteroidRandom.range(0, 0.24),
        inclination: asteroidRandom.range(-0.12, 0.12),
        period: Math.sqrt(Math.pow(distance, 3) / starMass) * 420,
        phase,
        parentId: bodies[0].id
      },
      rotationRate: asteroidRandom.range(0.2, 1.4),
      trail: []
    });
  }

  return {
    id: `system-${seed}`,
    name: preferredName ?? `Seed ${seed.slice(0, 10)}`,
    seed,
    bodies,
    createdAt: Date.now()
  };
};

export const spawnBody = (system: StarSystem, type: CelestialBody['type'], seed: string): CelestialBody => {
  const random = new SeededRandom(seed);
  const distance = random.range(90, 560);
  const phase = random.range(0, Math.PI * 2);
  const primary = system.bodies[0];
  const radius = type === 'black-hole' ? random.range(5, 11) : type === 'planet' ? random.range(5, 16) : random.range(1, 3);
  const mass = type === 'black-hole' ? random.range(90000, 180000) : type === 'planet' ? Math.pow(radius, 3) * random.range(1.1, 2.2) : random.range(0.1, 6);
  const position = makeOrbitPosition(distance, phase, random.range(-0.18, 0.18));
  const speed = orbitalVelocity(primary.mass, distance);

  return {
    id: bodyId(seed, type, system.bodies.length),
    name: `${type.replace('-', ' ')} ${system.bodies.length}`,
    type,
    seed,
    mass,
    radius,
    color: type === 'black-hole' ? '#020617' : random.pick(PLANET_COLORS),
    position,
    velocity: { x: -Math.sin(phase) * speed, y: random.range(-0.01, 0.01), z: Math.cos(phase) * speed },
    acceleration: vec3(),
    orbit: type === 'black-hole' ? undefined : {
      semiMajorAxis: distance,
      eccentricity: random.range(0.01, 0.2),
      inclination: random.range(-0.18, 0.18),
      period: Math.sqrt(Math.pow(distance, 3) / primary.mass) * 420,
      phase,
      parentId: primary.id
    },
    rotationRate: random.range(0.05, 0.8),
    hasAtmosphere: type === 'planet' && random.bool(0.45),
    hasRings: type === 'planet' && random.bool(0.25),
    trail: []
  };
};
