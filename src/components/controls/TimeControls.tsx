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
    <div className="console-title">
      <span>Simulation kernel</span>
      <strong>{mode === 'kepler' ? 'Analytic' : mode === 'barnes-hut' ? 'Approximate gravity' : 'Pairwise gravity'}</strong>
    </div>
    <button type="button" onClick={() => onPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
    <label>
      Step scale
      <input type="range" min="0.1" max="250" step="0.1" value={timeScale} onChange={(event) => onTimeScale(Number(event.target.value))} />
      <span>{timeScale.toFixed(timeScale > 10 ? 0 : 1)}x</span>
    </label>
    <button type="button" className={mode === 'kepler' ? 'active' : ''} onClick={() => onMode('kepler')}>Kepler O(n)</button>
    <button type="button" className={mode === 'n-body' ? 'active' : ''} onClick={() => onMode('n-body')}>Direct O(n²)</button>
    <button type="button" className={mode === 'barnes-hut' ? 'active' : ''} onClick={() => onMode('barnes-hut')}>Barnes-Hut O(n log n)</button>
    <button type="button" className={trailsEnabled ? 'active' : ''} onClick={() => onTrails(!trailsEnabled)}>Trace buffer</button>
    <div className="spawn-row">
      <button type="button" onClick={() => onSpawn('asteroid')}>Insert particle</button>
      <button type="button" onClick={() => onSpawn('planet')}>Insert mass</button>
      <button type="button" onClick={() => onSpawn('black-hole')}>Stress solver</button>
    </div>
  </div>
);
