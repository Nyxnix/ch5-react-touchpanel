import { renderConfiguredIcon } from '../utils/iconUtils';

function VolumeGauge({ value, min, max }) {
  const safeRange = max - min;
  const percent = safeRange > 0 ? ((value - min) / safeRange) * 100 : 0;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className="volume-block">
      <div className="volume-label">Master Volume</div>
      <div className="volume-gauge-layout">
        <div className="gauge-track vertical" aria-hidden="true">
          <div className="gauge-fill vertical" style={{ height: `${clampedPercent}%` }} />
        </div>
        <div className="volume-readout">{value}</div>
      </div>
    </div>
  );
}

export default function AudioPage({
  microphones,
  selectedMicId,
  onSelectMic,
  volume,
  min,
  max,
  onVolDown,
  onVolUp,
  isMuted,
  onToggleMute,
}) {
  return (
    <section className="page">
      <h1>Audio Control</h1>
      <div className="panel-grid audio-grid">
        <article className="card">
          <h2>Microphone Selector</h2>
          <div className="list-wrap">
            {microphones.map((mic) => {
              const selected = selectedMicId === mic.id;
              return (
                <button
                  key={mic.id}
                  className={selected ? 'list-item selected' : 'list-item'}
                  onClick={() => onSelectMic(mic.id)}
                >
                  {renderConfiguredIcon(mic.icon, '•')}
                  <span>{mic.name}</span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="card">
          <h2>Universal Volume</h2>
          <VolumeGauge value={volume} min={min} max={max} />
          <div className="actions-row">
            <button className="btn" onClick={onVolDown}>
              Volume Down
            </button>
            <button className="btn" onClick={onVolUp}>
              Volume Up
            </button>
            <button className={isMuted ? 'btn btn-muted active' : 'btn btn-muted'} onClick={onToggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
