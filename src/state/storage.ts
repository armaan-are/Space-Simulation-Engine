import type { SavedLocation, StarSystem, Vector3 } from '../engine/types';

const SYSTEM_KEY = 'webspace-engine.saved-systems';
const LOCATION_KEY = 'webspace-engine.saved-locations';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const loadSavedSystems = (): StarSystem[] => safeParse<StarSystem[]>(localStorage.getItem(SYSTEM_KEY), []);

export const saveSystem = (system: StarSystem): StarSystem[] => {
  const existing = loadSavedSystems().filter((entry) => entry.seed !== system.seed);
  const next = [{ ...system, createdAt: Date.now() }, ...existing].slice(0, 12);
  localStorage.setItem(SYSTEM_KEY, JSON.stringify(next));
  return next;
};

export const loadSavedLocations = (): SavedLocation[] => safeParse<SavedLocation[]>(localStorage.getItem(LOCATION_KEY), []);

export const saveLocation = (name: string, seed: string, cameraPosition: Vector3): SavedLocation[] => {
  const next = [
    {
      id: `${seed}-${Date.now()}`,
      name,
      seed,
      savedAt: Date.now(),
      cameraPosition
    },
    ...loadSavedLocations()
  ].slice(0, 16);
  localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
  return next;
};
