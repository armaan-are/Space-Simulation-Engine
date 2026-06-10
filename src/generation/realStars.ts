import type { GalaxyStar, Vector3 } from '../engine/types';
import { generateStarSystem } from './system';

const LIGHT_YEAR_UNITS = 1000;

type RealStarRecord = {
  name: string;
  seed: string;
  distanceLy: number;
  raHours: number;
  decDeg: number;
  color: string;
  massSolar: number;
  radiusSolar: number;
};

const toPosition = (distanceLy: number, raHours: number, decDeg: number): Vector3 => {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = decDeg * Math.PI / 180;
  const distance = distanceLy * LIGHT_YEAR_UNITS;
  return {
    x: Math.cos(dec) * Math.cos(ra) * distance,
    y: Math.sin(dec) * distance,
    z: Math.cos(dec) * Math.sin(ra) * distance
  };
};

// Nearby real stars. Distances and sky positions are intentionally coarse J2000
// values: accurate enough for an explorable local-neighborhood map without
// pretending this is an astrometry package.
const nearbyStars: RealStarRecord[] = [
  { name: 'Proxima Centauri', seed: 'real-star-proxima-centauri', distanceLy: 4.2465, raHours: 14.495, decDeg: -62.68, color: '#ff8b6b', massSolar: 0.122, radiusSolar: 0.154 },
  { name: 'Alpha Centauri A', seed: 'real-star-alpha-centauri-a', distanceLy: 4.344, raHours: 14.660, decDeg: -60.83, color: '#fff4d4', massSolar: 1.079, radiusSolar: 1.22 },
  { name: 'Alpha Centauri B', seed: 'real-star-alpha-centauri-b', distanceLy: 4.344, raHours: 14.660, decDeg: -60.83, color: '#ffd9a3', massSolar: 0.909, radiusSolar: 0.86 },
  { name: "Barnard's Star", seed: 'real-star-barnards-star', distanceLy: 5.963, raHours: 17.963, decDeg: 4.69, color: '#ff765f', massSolar: 0.144, radiusSolar: 0.196 },
  { name: 'Wolf 359', seed: 'real-star-wolf-359', distanceLy: 7.856, raHours: 10.940, decDeg: 7.01, color: '#ff6a55', massSolar: 0.09, radiusSolar: 0.16 },
  { name: 'Lalande 21185', seed: 'real-star-lalande-21185', distanceLy: 8.307, raHours: 11.055, decDeg: 35.97, color: '#ff9d74', massSolar: 0.46, radiusSolar: 0.39 },
  { name: 'Sirius A', seed: 'real-star-sirius-a', distanceLy: 8.60, raHours: 6.752, decDeg: -16.72, color: '#dbeafe', massSolar: 2.06, radiusSolar: 1.71 },
  { name: 'Sirius B', seed: 'real-star-sirius-b', distanceLy: 8.60, raHours: 6.752, decDeg: -16.72, color: '#eef6ff', massSolar: 1.02, radiusSolar: 0.0084 },
  { name: 'Luyten 726-8 A', seed: 'real-star-luyten-726-8-a', distanceLy: 8.73, raHours: 1.650, decDeg: -17.95, color: '#ff6d58', massSolar: 0.10, radiusSolar: 0.14 },
  { name: 'Luyten 726-8 B', seed: 'real-star-luyten-726-8-b', distanceLy: 8.73, raHours: 1.650, decDeg: -17.95, color: '#ff6450', massSolar: 0.10, radiusSolar: 0.14 },
  { name: 'Ross 154', seed: 'real-star-ross-154', distanceLy: 9.69, raHours: 18.829, decDeg: -23.84, color: '#ff745c', massSolar: 0.17, radiusSolar: 0.24 },
  { name: 'Ross 248', seed: 'real-star-ross-248', distanceLy: 10.30, raHours: 23.688, decDeg: 44.18, color: '#ff7059', massSolar: 0.14, radiusSolar: 0.19 },
  { name: 'Epsilon Eridani', seed: 'real-star-epsilon-eridani', distanceLy: 10.47, raHours: 3.549, decDeg: -9.46, color: '#ffd19b', massSolar: 0.82, radiusSolar: 0.74 },
  { name: 'Lacaille 9352', seed: 'real-star-lacaille-9352', distanceLy: 10.74, raHours: 23.096, decDeg: -35.85, color: '#ff8d68', massSolar: 0.49, radiusSolar: 0.47 },
  { name: 'Ross 128', seed: 'real-star-ross-128', distanceLy: 11.01, raHours: 11.803, decDeg: 0.80, color: '#ff735b', massSolar: 0.17, radiusSolar: 0.20 },
  { name: 'EZ Aquarii', seed: 'real-star-ez-aquarii', distanceLy: 11.27, raHours: 22.633, decDeg: -15.30, color: '#ff725a', massSolar: 0.11, radiusSolar: 0.15 },
  { name: '61 Cygni A', seed: 'real-star-61-cygni-a', distanceLy: 11.40, raHours: 21.115, decDeg: 38.75, color: '#ffb178', massSolar: 0.70, radiusSolar: 0.67 },
  { name: '61 Cygni B', seed: 'real-star-61-cygni-b', distanceLy: 11.40, raHours: 21.115, decDeg: 38.75, color: '#ff9d70', massSolar: 0.63, radiusSolar: 0.60 },
  { name: 'Procyon A', seed: 'real-star-procyon-a', distanceLy: 11.46, raHours: 7.656, decDeg: 5.23, color: '#f8fbff', massSolar: 1.50, radiusSolar: 2.05 },
  { name: 'Procyon B', seed: 'real-star-procyon-b', distanceLy: 11.46, raHours: 7.656, decDeg: 5.23, color: '#e7f1ff', massSolar: 0.60, radiusSolar: 0.012 },
  { name: 'Struve 2398 A', seed: 'real-star-struve-2398-a', distanceLy: 11.52, raHours: 18.705, decDeg: 59.63, color: '#ff8262', massSolar: 0.33, radiusSolar: 0.36 },
  { name: 'Struve 2398 B', seed: 'real-star-struve-2398-b', distanceLy: 11.52, raHours: 18.705, decDeg: 59.63, color: '#ff7a60', massSolar: 0.25, radiusSolar: 0.30 },
  { name: 'Groombridge 34 A', seed: 'real-star-groombridge-34-a', distanceLy: 11.62, raHours: 0.306, decDeg: 44.02, color: '#ff8b67', massSolar: 0.38, radiusSolar: 0.38 },
  { name: 'Groombridge 34 B', seed: 'real-star-groombridge-34-b', distanceLy: 11.62, raHours: 0.306, decDeg: 44.02, color: '#ff735b', massSolar: 0.16, radiusSolar: 0.18 },
  { name: 'Tau Ceti', seed: 'real-star-tau-ceti', distanceLy: 11.91, raHours: 1.734, decDeg: -15.94, color: '#ffe0aa', massSolar: 0.78, radiusSolar: 0.79 },
  { name: 'Epsilon Indi A', seed: 'real-star-epsilon-indi-a', distanceLy: 11.87, raHours: 22.058, decDeg: -56.79, color: '#ffae7d', massSolar: 0.76, radiusSolar: 0.73 },
  { name: "Kapteyn's Star", seed: 'real-star-kapteyns-star', distanceLy: 12.76, raHours: 5.195, decDeg: -45.02, color: '#ff6f58', massSolar: 0.28, radiusSolar: 0.29 },
  { name: 'Lacaille 8760', seed: 'real-star-lacaille-8760', distanceLy: 12.88, raHours: 21.293, decDeg: -38.87, color: '#ff8b66', massSolar: 0.60, radiusSolar: 0.51 },
  { name: 'Kruger 60 A', seed: 'real-star-kruger-60-a', distanceLy: 13.15, raHours: 22.466, decDeg: 57.70, color: '#ff8061', massSolar: 0.27, radiusSolar: 0.35 },
  { name: 'Kruger 60 B', seed: 'real-star-kruger-60-b', distanceLy: 13.15, raHours: 22.466, decDeg: 57.70, color: '#ff725a', massSolar: 0.18, radiusSolar: 0.24 },
  { name: 'Wolf 1061', seed: 'real-star-wolf-1061', distanceLy: 14.05, raHours: 16.510, decDeg: -12.66, color: '#ff8062', massSolar: 0.31, radiusSolar: 0.31 },
  { name: 'Gliese 674', seed: 'real-star-gliese-674', distanceLy: 14.84, raHours: 17.476, decDeg: -46.90, color: '#ff7e60', massSolar: 0.35, radiusSolar: 0.36 },
  { name: 'Gliese 687', seed: 'real-star-gliese-687', distanceLy: 14.84, raHours: 17.610, decDeg: 68.34, color: '#ff8967', massSolar: 0.40, radiusSolar: 0.42 },
  { name: 'Altair', seed: 'real-star-altair', distanceLy: 16.73, raHours: 19.846, decDeg: 8.87, color: '#edf6ff', massSolar: 1.79, radiusSolar: 1.63 },
  { name: '40 Eridani A', seed: 'real-star-40-eridani-a', distanceLy: 16.26, raHours: 4.254, decDeg: -7.65, color: '#ffd5a0', massSolar: 0.84, radiusSolar: 0.81 },
  { name: '70 Ophiuchi A', seed: 'real-star-70-ophiuchi-a', distanceLy: 16.64, raHours: 18.090, decDeg: 2.50, color: '#ffc08a', massSolar: 0.90, radiusSolar: 0.86 },
  { name: '70 Ophiuchi B', seed: 'real-star-70-ophiuchi-b', distanceLy: 16.64, raHours: 18.090, decDeg: 2.50, color: '#ff9d70', massSolar: 0.70, radiusSolar: 0.67 },
  { name: 'Sigma Draconis', seed: 'real-star-sigma-draconis', distanceLy: 18.77, raHours: 19.540, decDeg: 69.66, color: '#ffe1ad', massSolar: 0.86, radiusSolar: 0.78 },
  { name: 'Eta Cassiopeiae A', seed: 'real-star-eta-cassiopeiae-a', distanceLy: 19.42, raHours: 0.819, decDeg: 57.82, color: '#fff2c9', massSolar: 0.97, radiusSolar: 1.01 },
  { name: 'Eta Cassiopeiae B', seed: 'real-star-eta-cassiopeiae-b', distanceLy: 19.42, raHours: 0.819, decDeg: 57.82, color: '#ff9b70', massSolar: 0.57, radiusSolar: 0.66 },
  { name: '36 Ophiuchi A', seed: 'real-star-36-ophiuchi-a', distanceLy: 19.50, raHours: 17.256, decDeg: -26.60, color: '#ffb783', massSolar: 0.85, radiusSolar: 0.81 },
  { name: '36 Ophiuchi B', seed: 'real-star-36-ophiuchi-b', distanceLy: 19.50, raHours: 17.256, decDeg: -26.60, color: '#ffb17f', massSolar: 0.85, radiusSolar: 0.81 },
  { name: '82 Eridani', seed: 'real-star-82-eridani', distanceLy: 19.71, raHours: 3.331, decDeg: -43.07, color: '#fff0c4', massSolar: 0.70, radiusSolar: 0.92 },
  { name: 'Delta Pavonis', seed: 'real-star-delta-pavonis', distanceLy: 19.92, raHours: 20.145, decDeg: -66.18, color: '#fff0c5', massSolar: 0.99, radiusSolar: 1.22 },
  { name: 'Gliese 832', seed: 'real-star-gliese-832', distanceLy: 16.20, raHours: 21.557, decDeg: -49.01, color: '#ff8764', massSolar: 0.45, radiusSolar: 0.48 }
];

export const generateRealStarField = (): GalaxyStar[] => nearbyStars.map((star, index) => ({
  id: `nearby-real-star-${index}`,
  name: star.name,
  seed: star.seed,
  position: toPosition(star.distanceLy, star.raHours, star.decDeg),
  color: star.color,
  mass: star.massSolar,
  radius: Math.max(4, Math.sqrt(star.radiusSolar) * 9)
}));

export const generateRealStarSystem = (star: GalaxyStar) => {
  const system = generateStarSystem(star.seed, star.name);
  const primary = system.bodies[0];
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
        radius: star.radius,
        color: star.color
      },
      ...system.bodies.slice(1).map((body) => ({
        ...body,
        orbit: body.orbit?.parentId === primary.id ? { ...body.orbit, parentId: `${star.seed}-primary` } : body.orbit
      }))
    ]
  };
};
