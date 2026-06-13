import type { GalaxyStar, SavedLocation, StarSystem } from '../../engine/types';

type GalaxyMode = 'real' | 'procedural';

type SystemPanelProps = {
  galaxyMode: GalaxyMode;
  seedInput: string;
  system: StarSystem;
  savedSystems: StarSystem[];
  savedLocations: SavedLocation[];
  lastWarp?: GalaxyStar;
  onGalaxyMode: (mode: GalaxyMode) => void;
  onSeedInput: (value: string) => void;
  onGenerate: () => void;
  onSaveSystem: () => void;
  onSaveLocation: () => void;
  onLoadSeed: (seed: string, name?: string) => void;
};

const formatDistance = (star: GalaxyStar): string => {
  if (!star.distanceLy) return 'Procedural coordinate';
  return `${star.distanceLy.toLocaleString(undefined, { maximumFractionDigits: star.distanceLy < 100 ? 2 : 0 })} ly`;
};

export const SystemPanel = ({ galaxyMode, seedInput, system, savedSystems, savedLocations, lastWarp, onGalaxyMode, onSeedInput, onGenerate, onSaveSystem, onSaveLocation, onLoadSeed }: SystemPanelProps) => (
  <aside className="hud-panel system-panel">
    <div className="panel-kicker">Experiment setup</div>
    <h1>{system.name}</h1>
    <div className="mode-switch" aria-label="Galaxy source">
      <button type="button" className={galaxyMode === 'real' ? 'active' : ''} onClick={() => onGalaxyMode('real')}>HYG catalog</button>
      <button type="button" className={galaxyMode === 'procedural' ? 'active' : ''} onClick={() => onGalaxyMode('procedural')}>Seeded graph</button>
    </div>
    <dl className="compact-data">
      <div>
        <dt>Primary key</dt>
        <dd>{system.seed}</dd>
      </div>
      <div>
        <dt>Simulation nodes</dt>
        <dd>{system.bodies.length}</dd>
      </div>
      <div>
        <dt>Source record</dt>
        <dd>
          {lastWarp?.name ?? 'Local seed'}
          {lastWarp ? <small>{formatDistance(lastWarp)}{lastWarp.spectralType ? ` / ${lastWarp.spectralType}` : ''}</small> : null}
        </dd>
      </div>
    </dl>
    <label className="field-label" htmlFor="seed-input">Deterministic seed</label>
    <div className="seed-row">
      <input id="seed-input" value={seedInput} onChange={(event) => onSeedInput(event.target.value)} />
      <button type="button" onClick={onGenerate}>Run</button>
    </div>
    <div className="button-row">
      <button type="button" onClick={onSaveSystem}>Persist seed</button>
      <button type="button" onClick={onSaveLocation}>Snapshot camera</button>
    </div>
    <details>
      <summary>Saved seeds</summary>
      <div className="saved-list">
        {savedSystems.length === 0 ? <span>No persisted seeds.</span> : savedSystems.map((entry) => (
          <button type="button" key={entry.seed} onClick={() => onLoadSeed(entry.seed, entry.name)}>
            {entry.name}
            <small>{entry.seed}</small>
          </button>
        ))}
      </div>
    </details>
    <details>
      <summary>Camera snapshots</summary>
      <div className="saved-list">
        {savedLocations.length === 0 ? <span>No camera snapshots.</span> : savedLocations.map((entry) => (
          <button type="button" key={entry.id} onClick={() => onLoadSeed(entry.seed, entry.name)}>
            {entry.name}
            <small>{new Date(entry.savedAt).toLocaleString()}</small>
          </button>
        ))}
      </div>
    </details>
  </aside>
);
