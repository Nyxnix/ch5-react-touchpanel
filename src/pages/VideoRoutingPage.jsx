import { useState } from 'react';
import { renderConfiguredIcon } from '../utils/iconUtils';

export default function VideoRoutingPage({ displays, sources, routes, onRoute, onSelectSource }) {
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  const onDragStart = (event, sourceId) => {
    event.dataTransfer.setData('text/source-id', sourceId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event, displayId) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/source-id');
    if (sourceId) {
      onRoute(sourceId, displayId);
    }
  };

  const onSourceTap = (sourceId) => {
    setSelectedSourceId(sourceId);
    onSelectSource?.(sourceId);
  };

  const onDisplayTap = (displayId) => {
    if (!selectedSourceId) return;
    onRoute(selectedSourceId, displayId);
  };

  const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));
  const selectedSource = selectedSourceId ? sourceById[selectedSourceId] : null;

  return (
    <section className="page">
      <h1>Video Routing</h1>
      <article className="card toolbar-card">
        <h2>Sources</h2>
        <p className="touch-hint">
          Touch routing: tap a source, then tap a display. Drag-and-drop also works on desktop.
        </p>
        <div className="selected-source-readout">
          {selectedSource
            ? `Selected source: ${selectedSource.name}`
            : 'Selected source: none'}
        </div>
        <div className="toolbar-sources">
          {sources.map((source) => {
            const isSelected = selectedSourceId === source.id;
            return (
              <button
                key={source.id}
                type="button"
                draggable
                onDragStart={(event) => onDragStart(event, source.id)}
                onClick={() => onSourceTap(source.id)}
                className={isSelected ? 'source-pill selected' : 'source-pill'}
                title="Tap to select source, then tap a display"
              >
                {renderConfiguredIcon(source.icon, '•')}
                <span>{source.name}</span>
              </button>
            );
          })}
        </div>
      </article>

      <div className="panel-grid displays-grid">
        {displays.map((display) => {
          const activeSource = sourceById[routes[display.id]];

          return (
            <article
              key={display.id}
              className="display-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, display.id)}
              onClick={() => onDisplayTap(display.id)}
            >
              <h2>
                {renderConfiguredIcon(display.icon, '•')} {display.name}
              </h2>
              <div className="display-content">
                {activeSource ? (
                  <div className="route-badge">
                    Routed: {renderConfiguredIcon(activeSource.icon, '•')} {activeSource.name}
                  </div>
                ) : (
                  <div className="route-empty">Drop a source here</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
