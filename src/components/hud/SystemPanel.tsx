import type { GalaxyStar, SavedLocation, StarSystem } from '../../engine/types';

type SystemPanelProps = {
  seedInput: string;
  system: StarSystem;
  savedSystems: StarSystem[];
  savedLocations: SavedLocation[];
  lastWarp?: GalaxyStar;
  onSeedInput: (value: string) => void;
  onGenerate: () => void;
  onSaveSystem: () => void;
  onSaveLocation: () => void;
  onLoadSeed: (seed: string, name?: string) => void;
};

export const SystemPanel = ({ seedInput, system, savedSystems, savedLocations, lastWarp, onSeedInput, onGenerate, onSaveSystem, onSaveLocation, onLoadSeed }: SystemPanelProps) => (
  <aside className="hud-panel system-panel">
    <div className="panel-kicker">WebSpace Engine</div>
    <h1>{system.name}</h1>
    <dl className="compact-data">
      <div>
        <dt>Seed</dt>
        <dd>{system.seed}</dd>
      </div>
      <div>
        <dt>Active bodies</dt>
        <dd>{system.bodies.length}</dd>
      </div>
      <div>
        <dt>Last warp</dt>
        <dd>{lastWarp?.name ?? 'Manual seed'}</dd>
      </div>
    </dl>
    <label className="field-label" htmlFor="seed-input">Seed / coordinate</label>
    <div className="seed-row">
      <input id="seed-input" value={seedInput} onChange={(event) => onSeedInput(event.target.value)} />
      <button type="button" onClick={onGenerate}>Generate</button>
    </div>
    <div className="button-row">
      <button type="button" onClick={onSaveSystem}>Save system</button>
      <button type="button" onClick={onSaveLocation}>Save location</button>
    </div>
    <details>
      <summary>Saved systems</summary>
      <div className="saved-list">
        {savedSystems.length === 0 ? <span>No saved systems yet.</span> : savedSystems.map((entry) => (
          <button type="button" key={entry.seed} onClick={() => onLoadSeed(entry.seed, entry.name)}>
            {entry.name}
            <small>{entry.seed}</small>
          </button>
        ))}
      </div>
    </details>
    <details>
      <summary>Saved locations</summary>
      <div className="saved-list">
        {savedLocations.length === 0 ? <span>No saved camera fixes.</span> : savedLocations.map((entry) => (
          <button type="button" key={entry.id} onClick={() => onLoadSeed(entry.seed, entry.name)}>
            {entry.name}
            <small>{new Date(entry.savedAt).toLocaleString()}</small>
          </button>
        ))}
      </div>
    </details>
  </aside>
);
