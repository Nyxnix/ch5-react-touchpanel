export default function HomePage({ isSystemRunning, onStartSystem, onStopSystem, labels }) {
  return (
    <section className="page home-page">
      <div className="section-head">
        <h1>System Control</h1>
      </div>
      <div className="panel-grid home-grid">
        <article className="card status-card">
          <h2>Runtime Status</h2>
          <p className="status-line">Current room state</p>
          <p className={isSystemRunning ? 'state-badge running' : 'state-badge stopped'}>
            {isSystemRunning ? 'Running' : 'Stopped'}
          </p>
        </article>

        <article className="card actions-card">
          <h2>Power Actions</h2>
          <div className="actions-row">
            <button type="button" className="btn btn-primary" onClick={onStartSystem}>
              {labels.startButtonLabel}
            </button>
            <button type="button" className="btn btn-danger" onClick={onStopSystem}>
              {labels.stopButtonLabel}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
