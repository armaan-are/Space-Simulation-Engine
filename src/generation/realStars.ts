import type { GalaxyStar, Vector3 } from '../engine/types';
import { HYG_REAL_STARS } from './hygRealStars';
import { generateStarSystem } from './system';

const LIGHT_YEAR_UNITS = 1000;
const PARSEC_TO_LIGHT_YEARS = 3.262;

export type RealStarRecord = {
  name: string;
  seed: string;
  distanceLy: number;
  xPc: number;
  yPc: number;
  zPc: number;
  color: string;
  massSolar: number;
  radiusSolar: number;
  magnitude: number;
  absoluteMagnitude: number;
  spectralType?: string;
  luminositySolar: number;
};

const toPosition = (star: RealStarRecord): Vector3 => ({
  x: star.xPc * PARSEC_TO_LIGHT_YEARS * LIGHT_YEAR_UNITS,
  y: star.zPc * PARSEC_TO_LIGHT_YEARS * LIGHT_YEAR_UNITS,
  z: star.yPc * PARSEC_TO_LIGHT_YEARS * LIGHT_YEAR_UNITS
});

const displayRadius = (star: RealStarRecord): number => {
  const luminositySize = Math.log10(Math.max(star.luminositySolar, 0.001) + 1) * 5.8;
  const apparentSize = Math.max(0, 7.2 - star.magnitude) * 1.15;
  const physicalSize = Math.sqrt(Math.max(star.radiusSolar, 0.08)) * 1.6;
  return Math.max(4.8, Math.min(24, 4 + luminositySize + apparentSize + physicalSize));
};

export const generateRealStarField = (): GalaxyStar[] => HYG_REAL_STARS.map((star, index) => ({
  id: `hyg-real-star-${index}`,
  name: star.name,
  seed: star.seed,
  position: toPosition(star),
  color: star.color,
  mass: star.massSolar * 110000,
  radius: displayRadius(star),
  distanceLy: star.distanceLy,
  apparentMagnitude: star.magnitude,
  absoluteMagnitude: star.absoluteMagnitude,
  spectralType: star.spectralType,
  luminositySolar: star.luminositySolar,
  radiusSolar: star.radiusSolar,
  catalog: 'HYG v4.1'
}));

export const generateRealStarSystem = (star: GalaxyStar) => {
  const system = generateStarSystem(star.seed, star.name);
  const primary = system.bodies[0];
  const systemRadius = Math.max(18, Math.min(96, Math.sqrt(star.radiusSolar ?? 1) * 34));
  return {
    ...system,
    name: star.name,
    seed: star.seed,
    bodies: [
      {
        ...primary,
        id: `${star.seed}-primary`,
        name: star.name,
        seed: star.seed,
        mass: star.mass,
        radius: systemRadius,
        color: star.color
      },
      ...system.bodies.slice(1).map((body) => ({
        ...body,
        orbit: body.orbit?.parentId === primary.id ? { ...body.orbit, parentId: `${star.seed}-primary` } : body.orbit
      }))
    ]
  };
};
