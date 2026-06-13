import type { GalaxyStar } from '../engine/types';
import { defaultRenderConfig } from '../physics/config';
import { childSeed, SeededRandom } from '../utils/seededRandom';

const STAR_COLORS = [
  { color: '#a9c7ff', mass: 7.5, radius: 11 },
  { color: '#d8e7ff', mass: 2.2, radius: 8.5 },
  { color: '#fff7da', mass: 1.15, radius: 7 },
  { color: '#ffd99b', mass: 0.78, radius: 6.2 },
  { color: '#ff8f6b', mass: 0.38, radius: 5.4 }
];

export const generateProceduralStarField = (seed = 'procedural-milky-way'): GalaxyStar[] => {
  const random = new SeededRandom(seed);
  const armCount = 4;
  const stars: GalaxyStar[] = [];

  for (let i = 0; i < defaultRenderConfig.starCount; i += 1) {
    const arm = i % armCount;
    const armOffset = (arm / armCount) * Math.PI * 2;
    const galacticRadius = Math.pow(random.next(), 0.58) * 88000 + random.range(600, 2200);
    const spin = galacticRadius * 0.000095;
    const angle = armOffset + spin + random.range(-0.42, 0.42);
    const verticalScatter = random.range(-1, 1) * Math.pow(random.next(), 2.2) * 1600;
    const bulgeLift = random.range(-1, 1) * Math.max(0, 1 - galacticRadius / 12000) * 3200;
    const spectral = random.pick(STAR_COLORS);
    const brightness = random.range(0.75, 1.35) + Math.max(0, 1 - galacticRadius / 90000) * 0.8;

    stars.push({
      id: `procedural-star-${i}`,
      name: `Procedural ${i + 1}`,
      seed: childSeed(seed, 'star', i),
      position: {
        x: Math.cos(angle) * galacticRadius + random.range(-900, 900),
        y: verticalScatter + bulgeLift,
        z: Math.sin(angle) * galacticRadius + random.range(-900, 900)
      },
      color: spectral.color,
      mass: spectral.mass * random.range(70000, 145000),
      radius: spectral.radius * brightness,
      luminositySolar: Math.pow(spectral.mass, 3.5) * brightness,
      catalog: 'Procedural'
    });
  }

  return stars;
};
