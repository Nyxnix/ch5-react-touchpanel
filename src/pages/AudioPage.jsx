import { renderConfiguredIcon } from '../utils/iconUtils';

function VolumeGauge({ value, min, max, unityGainPoint }) {
  const safeRange = max - min;
  const percent = safeRange > 0 ? ((value - min) / safeRange) * 100 : 0;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const unityPercent = safeRange > 0 ? ((unityGainPoint - min) / safeRange) * 100 : null;
  const showUnityMarker = Number.isFinite(unityPercent) && unityPercent >= 0 && unityPercent <= 100;

  return (
    <div className="volume-block control-meter">
      <div className="gauge-track vertical" aria-hidden="true">
        <div className="gauge-fill vertical" style={{ height: `${clampedPercent}%` }} />
        {showUnityMarker ? (
          <div className="gauge-unity-marker" style={{ bottom: `${unityPercent}%` }}>
            <span className="gauge-unity-line" />
            <span className="gauge-unity-label">0</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VolumeControlColumn({
  title,
  value,
  min,
  max,
  onVolDown,
  onVolUp,
  isMuted,
  isVolUpActive = false,
  isVolDownActive = false,
  onToggleMute,
  unityGainPoint,
}) {
  const volUpClass = isVolUpActive ? 'btn control-btn active-press' : 'btn control-btn';
  const volDownClass = isVolDownActive ? 'btn control-btn active-press' : 'btn control-btn';

  return (
    <section className="control-column">
      <h3>{title}</h3>
      <button type="button" className={volUpClass} onClick={onVolUp}>
        Volume Up
      </button>
      <VolumeGauge value={value} min={min} max={max} unityGainPoint={unityGainPoint} />
      <button type="button" className={volDownClass} onClick={onVolDown}>
        Volume Down
      </button>
      <button
        type="button"
        className={isMuted ? 'btn btn-muted active control-btn' : 'btn btn-muted control-btn'}
        onClick={onToggleMute}
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </section>
  );
}

export default function AudioPage({
  microphones,
  selectedMicId,
  onSelectMic,
  micVolume,
  masterVolume,
  min,
  max,
  onMicVolDown,
  onMicVolUp,
  micIsMuted,
  onToggleMicMute,
  onMasterVolDown,
  onMasterVolUp,
  masterIsMuted,
  masterVolUpActive,
  masterVolDownActive,
  onToggleMasterMute,
  unityGainPoint,
}) {
  const selectedMic = microphones.find((mic) => mic.id === selectedMicId);

  return (
    <section className="page audio-page">
      <div className="section-head">
        <h1>Audio Control</h1>
      </div>
      <div className="panel-grid audio-grid">
        <article className="card mic-list-card">
          <h2>Device Selector</h2>
          <p className="selected-source-readout">
            Selected device: {selectedMic ? selectedMic.name : 'None'}
          </p>
          <div className="list-wrap">
            {microphones.map((mic) => {
              const selected = selectedMicId === mic.id;
              return (
                <button
                  key={mic.id}
                  type="button"
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

        <article className="card volume-card">
          <h2>Volume Controls</h2>
          <div className="volume-columns">
            <VolumeControlColumn
              title="Microphone"
              value={micVolume}
              min={min}
              max={max}
              onVolDown={onMicVolDown}
              onVolUp={onMicVolUp}
              isMuted={micIsMuted}
              onToggleMute={onToggleMicMute}
              unityGainPoint={unityGainPoint}
            />
            <VolumeControlColumn
              title="Master"
              value={masterVolume}
              min={min}
              max={max}
              onVolDown={onMasterVolDown}
              onVolUp={onMasterVolUp}
              isMuted={masterIsMuted}
              isVolUpActive={masterVolUpActive}
              isVolDownActive={masterVolDownActive}
              onToggleMute={onToggleMasterMute}
              unityGainPoint={unityGainPoint}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
