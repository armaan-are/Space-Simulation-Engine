import type { SimulationMode } from '../../engine/types';

type TimeControlsProps = {
  paused: boolean;
  timeScale: number;
  mode: SimulationMode;
  trailsEnabled: boolean;
  onPaused: (paused: boolean) => void;
  onTimeScale: (scale: number) => void;
  onMode: (mode: SimulationMode) => void;
  onTrails: (enabled: boolean) => void;
  onSpawn: (type: 'asteroid' | 'planet' | 'black-hole') => void;
};

export const TimeControls = ({ paused, timeScale, mode, trailsEnabled, onPaused, onTimeScale, onMode, onTrails, onSpawn }: TimeControlsProps) => (
  <div className="time-console">
    <button type="button" onClick={() => onPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
    <label>
      Time scale
      <input type="range" min="0.1" max="250" step="0.1" value={timeScale} onChange={(event) => onTimeScale(Number(event.target.value))} />
      <span>{timeScale.toFixed(timeScale > 10 ? 0 : 1)}x</span>
    </label>
    <button type="button" className={mode === 'kepler' ? 'active' : ''} onClick={() => onMode('kepler')}>Simplified orbits</button>
    <button type="button" className={mode === 'n-body' ? 'active' : ''} onClick={() => onMode('n-body')}>N-body worker</button>
    <button type="button" className={trailsEnabled ? 'active' : ''} onClick={() => onTrails(!trailsEnabled)}>Trails</button>
    <div className="spawn-row">
      <button type="button" onClick={() => onSpawn('asteroid')}>Add asteroid</button>
      <button type="button" onClick={() => onSpawn('planet')}>Add planet</button>
      <button type="button" onClick={() => onSpawn('black-hole')}>Add black hole</button>
    </div>
  </div>
);
