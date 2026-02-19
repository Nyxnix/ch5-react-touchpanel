import { useEffect, useRef, useState } from 'react';
import { renderConfiguredIcon } from '../utils/iconUtils';

const SOURCE_HOLD_MS = 550;

function buildDisplayGridStyle(displayCount) {
  const clampedCount = Math.max(1, Math.min(displayCount, 10));

  let columns = 1;
  if (clampedCount <= 2) {
    columns = clampedCount;
  } else if (clampedCount <= 4) {
    columns = 2;
  } else if (clampedCount <= 6) {
    columns = 3;
  } else if (clampedCount <= 8) {
    columns = 4;
  } else {
    columns = 5;
  }

  const minHeight =
    clampedCount >= 9 ? 112 : clampedCount >= 7 ? 126 : clampedCount >= 5 ? 150 : 176;

  return {
    '--display-cols': `${columns}`,
    '--display-min-height': `${minHeight}px`,
  };
}

export default function VideoRoutingPage({ displays, sources, routes, onRoute, onRouteAll }) {
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const holdTimerRef = useRef(null);
  const suppressNextTapSourceIdRef = useRef(null);
  const displayGridStyle = buildDisplayGridStyle(displays.length);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    },
    []
  );

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
    if (suppressNextTapSourceIdRef.current === sourceId) {
      suppressNextTapSourceIdRef.current = null;
      return;
    }
    setSelectedSourceId(sourceId);
  };

  const clearSourceHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onSourcePointerDown = (sourceId) => {
    clearSourceHold();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      suppressNextTapSourceIdRef.current = sourceId;
      setSelectedSourceId(sourceId);
      onRouteAll?.(sourceId);
    }, SOURCE_HOLD_MS);
  };

  const onSourcePointerEnd = () => {
    clearSourceHold();
  };

  const onDisplayTap = (displayId) => {
    if (!selectedSourceId) return;
    onRoute(selectedSourceId, displayId);
  };

  const onDisplayKeyDown = (event, displayId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onDisplayTap(displayId);
  };

  const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));
  const selectedSource = selectedSourceId ? sourceById[selectedSourceId] : null;

  return (
    <section className="page video-page">
      <div className="section-head">
        <h1>Video Routing</h1>
      </div>
      <article className="card toolbar-card">
        <h2>Source Matrix</h2>
        <p className="touch-hint">
          Touch routing: tap a source, then tap a display. Press and hold to set all displays to a
          source
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
                onDragStart={(event) => {
                  onSourcePointerEnd();
                  onDragStart(event, source.id);
                }}
                onPointerDown={() => onSourcePointerDown(source.id)}
                onPointerUp={onSourcePointerEnd}
                onPointerCancel={onSourcePointerEnd}
                onPointerLeave={onSourcePointerEnd}
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

      <div className="panel-grid displays-grid" style={displayGridStyle}>
        {displays.map((display) => {
          const activeSource = sourceById[routes[display.id]];
          const dropzoneClass = activeSource ? 'display-dropzone routed' : 'display-dropzone';

          return (
            <article
              key={display.id}
              className={dropzoneClass}
              role="button"
              tabIndex={0}
              aria-label={`Route selected source to ${display.name}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, display.id)}
              onClick={() => onDisplayTap(display.id)}
              onKeyDown={(event) => onDisplayKeyDown(event, display.id)}
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
                  <div className="route-empty">No source assigned. Tap to route selected source.</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
