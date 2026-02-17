export default function HomePage({ isSystemRunning, onStartSystem, onStopSystem, labels }) {
  return (
    <section className="page">
      <h1>System Control</h1>
      <p className="page-subtitle">
        Current system state: <strong>{isSystemRunning ? 'Running' : 'Stopped'}</strong>
      </p>
      <div className="actions-row">
        <button className="btn btn-primary" onClick={onStartSystem}>
          {labels.startButtonLabel}
        </button>
        <button className="btn btn-danger" onClick={onStopSystem}>
          {labels.stopButtonLabel}
        </button>
      </div>
    </section>
  );
}
