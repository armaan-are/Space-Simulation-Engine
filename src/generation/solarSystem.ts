import type { CelestialBody, StarSystem, Vector3 } from '../engine/types';
import { vec3 } from '../math/vector';

export const AU_UNITS = 120;
export const DAYS_PER_YEAR = 365.256;
export const REAL_GRAVITY_UNITS = (4 * Math.PI * Math.PI * AU_UNITS ** 3) / (DAYS_PER_YEAR ** 2);

const EARTH_MASS_IN_SOLAR_MASSES = 3.00348961491547e-6;
const EARTH_RADIUS_KM = 6371;

type RealPlanet = {
  name: string;
  seed: string;
  massEarth: number;
  radiusKm: number;
  semiMajorAxisAu: number;
  eccentricity: number;
  inclinationDeg: number;
  periodDays: number;
  color: string;
  atmosphere?: boolean;
  rings?: boolean;
  moons?: RealMoon[];
};

type RealMoon = {
  name: string;
  massMoon: number;
  radiusKm: number;
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  periodDays: number;
  color: string;
};

const planets: RealPlanet[] = [
  { name: 'Mercury', seed: 'mercury', massEarth: 0.0553, radiusKm: 2439.7, semiMajorAxisAu: 0.387098, eccentricity: 0.20563, inclinationDeg: 7.005, periodDays: 87.969, color: '#9f9b91' },
  { name: 'Venus', seed: 'venus', massEarth: 0.815, radiusKm: 6051.8, semiMajorAxisAu: 0.723332, eccentricity: 0.006772, inclinationDeg: 3.3947, periodDays: 224.701, color: '#d8c08a', atmosphere: true },
  { name: 'Earth', seed: 'earth', massEarth: 1, radiusKm: 6371, semiMajorAxisAu: 1, eccentricity: 0.0167086, inclinationDeg: 0.00005, periodDays: 365.256, color: '#5f8fbf', atmosphere: true, moons: [
    { name: 'Moon', massMoon: 1, radiusKm: 1737.4, semiMajorAxisKm: 384400, eccentricity: 0.0549, inclinationDeg: 5.145, periodDays: 27.322, color: '#b8b4aa' }
  ] },
  { name: 'Mars', seed: 'mars', massEarth: 0.107, radiusKm: 3389.5, semiMajorAxisAu: 1.523679, eccentricity: 0.0934, inclinationDeg: 1.850, periodDays: 686.98, color: '#b66a4a', atmosphere: true, moons: [
    { name: 'Phobos', massMoon: 1.48e-8, radiusKm: 11.1, semiMajorAxisKm: 9376, eccentricity: 0.0151, inclinationDeg: 1.093, periodDays: 0.319, color: '#8a8178' },
    { name: 'Deimos', massMoon: 2.01e-9, radiusKm: 6.2, semiMajorAxisKm: 23463, eccentricity: 0.0002, inclinationDeg: 0.93, periodDays: 1.263, color: '#8f877d' }
  ] },
  { name: 'Jupiter', seed: 'jupiter', massEarth: 317.8, radiusKm: 69911, semiMajorAxisAu: 5.2044, eccentricity: 0.0489, inclinationDeg: 1.303, periodDays: 4332.59, color: '#c6a37a', atmosphere: true, moons: [
    { name: 'Io', massMoon: 1.214, radiusKm: 1821.6, semiMajorAxisKm: 421700, eccentricity: 0.0041, inclinationDeg: 0.05, periodDays: 1.769, color: '#d7b765' },
    { name: 'Europa', massMoon: 0.653, radiusKm: 1560.8, semiMajorAxisKm: 671034, eccentricity: 0.009, inclinationDeg: 0.47, periodDays: 3.551, color: '#cfc7b1' },
    { name: 'Ganymede', massMoon: 2.018, radiusKm: 2634.1, semiMajorAxisKm: 1070412, eccentricity: 0.0013, inclinationDeg: 0.2, periodDays: 7.155, color: '#9f9586' },
    { name: 'Callisto', massMoon: 1.46, radiusKm: 2410.3, semiMajorAxisKm: 1882709, eccentricity: 0.0074, inclinationDeg: 0.28, periodDays: 16.689, color: '#6f6a62' }
  ] },
  { name: 'Saturn', seed: 'saturn', massEarth: 95.16, radiusKm: 58232, semiMajorAxisAu: 9.5826, eccentricity: 0.0565, inclinationDeg: 2.485, periodDays: 10759.22, color: '#d3bd8f', atmosphere: true, rings: true, moons: [
    { name: 'Titan', massMoon: 1.829, radiusKm: 2574.7, semiMajorAxisKm: 1221870, eccentricity: 0.0288, inclinationDeg: 0.35, periodDays: 15.945, color: '#c79f62' },
    { name: 'Rhea', massMoon: 0.0315, radiusKm: 763.8, semiMajorAxisKm: 527108, eccentricity: 0.001, inclinationDeg: 0.35, periodDays: 4.518, color: '#b8b4aa' },
    { name: 'Iapetus', massMoon: 0.0248, radiusKm: 734.5, semiMajorAxisKm: 3560820, eccentricity: 0.0283, inclinationDeg: 15.47, periodDays: 79.322, color: '#8d877f' }
  ] },
  { name: 'Uranus', seed: 'uranus', massEarth: 14.54, radiusKm: 25362, semiMajorAxisAu: 19.2184, eccentricity: 0.0463, inclinationDeg: 0.773, periodDays: 30688.5, color: '#9ccbd3', atmosphere: true, rings: true, moons: [
    { name: 'Titania', massMoon: 0.0475, radiusKm: 788.9, semiMajorAxisKm: 435910, eccentricity: 0.0011, inclinationDeg: 0.34, periodDays: 8.706, color: '#a8a29e' },
    { name: 'Oberon', massMoon: 0.041, radiusKm: 761.4, semiMajorAxisKm: 583520, eccentricity: 0.0014, inclinationDeg: 0.06, periodDays: 13.463, color: '#8f8a82' }
  ] },
  { name: 'Neptune', seed: 'neptune', massEarth: 17.15, radiusKm: 24622, semiMajorAxisAu: 30.11, eccentricity: 0.009, inclinationDeg: 1.770, periodDays: 60182, color: '#4e79c7', atmosphere: true, rings: true, moons: [
    { name: 'Triton', massMoon: 0.292, radiusKm: 1353.4, semiMajorAxisKm: 354759, eccentricity: 0.000016, inclinationDeg: 156.865, periodDays: -5.877, color: '#c7c2b8' }
  ] }
];

const phaseFor = (index: number): number => index * 0.91 + 0.35;

const orbitPosition = (semiMajorAxis: number, eccentricity: number, inclination: number, phase: number): Vector3 => {
  // Polar conic form with the parent body at one focus, not at the center.
  const distance = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(phase));
  return {
    x: Math.cos(phase) * distance,
    y: Math.sin(inclination) * distance * 0.08,
    z: Math.sin(phase) * distance
  };
};

const velocityForOrbit = (semiMajorAxis: number, eccentricity: number, periodDays: number, phase: number): Vector3 => {
  const mu = (4 * Math.PI * Math.PI * semiMajorAxis ** 3) / (periodDays * periodDays);
  const distance = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(phase));
  const speed = Math.sqrt(Math.max(0, mu * (2 / distance - 1 / semiMajorAxis)));
  const direction = periodDays < 0 ? -1 : 1;
  const tangentX = -Math.sin(phase);
  const tangentZ = eccentricity + Math.cos(phase);
  const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
  return {
    x: (tangentX / tangentLength) * speed * direction,
    y: 0,
    z: (tangentZ / tangentLength) * speed * direction
  };
};

const visualRadius = (radiusKm: number, minimum = 0.9): number => Math.max(minimum, Math.log10(radiusKm / EARTH_RADIUS_KM + 1) * 5.4);

export const generateSolarSystem = (): StarSystem => {
  const bodies: CelestialBody[] = [
    {
      id: 'sol',
      name: 'Sun',
      type: 'star',
      seed: 'real-solar-system:sun',
      mass: 1,
      radius: 13.5,
      color: '#fff4c2',
      position: vec3(),
      velocity: vec3(),
      acceleration: vec3(),
      rotationRate: 0.012,
      trail: []
    }
  ];

  planets.forEach((planet, index) => {
    const phase = phaseFor(index);
    const inclination = planet.inclinationDeg * Math.PI / 180;
    const semiMajorAxis = planet.semiMajorAxisAu * AU_UNITS;
    const position = orbitPosition(semiMajorAxis, planet.eccentricity, inclination, phase);
    const velocity = velocityForOrbit(semiMajorAxis, planet.eccentricity, planet.periodDays, phase);
    const planetBody: CelestialBody = {
      id: planet.seed,
      name: planet.name,
      type: 'planet',
      seed: `real-solar-system:${planet.seed}`,
      mass: planet.massEarth * EARTH_MASS_IN_SOLAR_MASSES,
      radius: visualRadius(planet.radiusKm, planet.name === 'Mercury' ? 1.4 : 1.8),
      color: planet.color,
      position,
      velocity,
      acceleration: vec3(),
      orbit: {
        semiMajorAxis,
        eccentricity: planet.eccentricity,
        inclination,
        period: planet.periodDays,
        phase,
        parentId: 'sol'
      },
      rotationRate: planet.name === 'Venus' ? -0.01 : 0.04,
      hasAtmosphere: planet.atmosphere,
      atmosphereColor: planet.name === 'Earth' ? '#7dd3fc' : '#e7dcc4',
      hasRings: planet.rings,
      ringColor: planet.name === 'Saturn' ? '#d6c7a2' : '#9ca3af',
      trail: []
    };
    bodies.push(planetBody);

    planet.moons?.forEach((moon, moonIndex) => {
      const moonPhase = phaseFor(index + moonIndex + 2);
      const moonInclination = moon.inclinationDeg * Math.PI / 180;
      const moonAxis = Math.max(2.6, (moon.semiMajorAxisKm / 149_597_870.7) * AU_UNITS * 18);
      const moonOffset = orbitPosition(moonAxis, moon.eccentricity, moonInclination, moonPhase);
      const moonVelocity = velocityForOrbit(moonAxis, moon.eccentricity, moon.periodDays, moonPhase);
      bodies.push({
        id: `${planet.seed}-${moon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: moon.name,
        type: 'moon',
        seed: `real-solar-system:${planet.seed}:${moon.name}`,
        mass: moon.massMoon * 7.342e22 / 1.98847e30,
        radius: visualRadius(moon.radiusKm, moon.radiusKm < 100 ? 0.55 : 0.85),
        color: moon.color,
        position: {
          x: position.x + moonOffset.x,
          y: position.y + moonOffset.y,
          z: position.z + moonOffset.z
        },
        velocity: {
          x: velocity.x + moonVelocity.x,
          y: velocity.y + moonVelocity.y,
          z: velocity.z + moonVelocity.z
        },
        acceleration: vec3(),
        orbit: {
          semiMajorAxis: moonAxis,
          eccentricity: moon.eccentricity,
          inclination: moonInclination,
          period: Math.abs(moon.periodDays),
          phase: moonPhase,
          parentId: planet.seed
        },
        rotationRate: 0.03,
        trail: []
      });
    });
  });

  return {
    id: 'real-solar-system',
    name: 'Solar System',
    seed: 'real-solar-system',
    bodies,
    createdAt: Date.now()
  };
};
