import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AudioPage from './pages/AudioPage';
import VideoRoutingPage from './pages/VideoRoutingPage';
import { touchpanelConfig } from './config/touchpanelConfig';
import { crestronConfig } from './config/crestron';
import { crestronApi } from './services/crestronApi';
import useWebXPanel from './hooks/useWebXPanel';

const THEME_STORAGE_KEY = 'touchpanel-theme';

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function App() {
  const { home, audio, video } = touchpanelConfig;
  const [theme, setTheme] = useState(getInitialTheme);

  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [selectedMicId, setSelectedMicId] = useState(audio.microphones[0]?.id ?? null);
  const [micAudioState, setMicAudioState] = useState(() =>
    Object.fromEntries(
      audio.microphones.map((mic) => [
        mic.id,
        {
          volume: clamp(audio.defaultVolume, audio.minVolume, audio.maxVolume),
          isMuted: false,
        },
      ])
    )
  );

  const [routes, setRoutes] = useState(() =>
    Object.fromEntries(video.displays.map((display) => [display.id, null]))
  );

  const volumeStep = Math.max(1, Number(audio.step) || 1);
  const { status: connectionStatus } = useWebXPanel(crestronConfig.webXPanel);

  useEffect(() => {
    const unsubscribe = crestronApi.subscribeSystemState((nextState) => {
      setIsSystemRunning(nextState);
    });

    crestronApi.requestSystemState();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribers = audio.microphones.map((mic) =>
      crestronApi.subscribeMicAudioState(mic.id, (nextState) => {
        setMicAudioState((current) => ({
          ...current,
          [mic.id]: nextState,
        }));
      })
    );

    audio.microphones.forEach((mic) => {
      crestronApi.requestMicAudioState(mic.id);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [audio.microphones]);

  useEffect(() => {
    const unsubscribe = crestronApi.subscribeVideoRoutes((nextRoutes) => {
      setRoutes((currentRoutes) => ({
        ...currentRoutes,
        ...nextRoutes,
      }));
    });

    crestronApi.requestVideoRoutes();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleStartSystem = () => {
    crestronApi.startSystem();
  };

  const handleStopSystem = () => {
    crestronApi.stopSystem();
  };

  const handleMicSelect = (micId) => {
    setSelectedMicId(micId);
    crestronApi.selectMicrophone(micId);
    crestronApi.requestMicAudioState(micId);
  };

  const handleVolumeUp = () => {
    if (!selectedMicId) return;
    crestronApi.adjustMicVolume({
      micId: selectedMicId,
      delta: volumeStep,
      min: audio.minVolume,
      max: audio.maxVolume,
    });
  };

  const handleVolumeDown = () => {
    if (!selectedMicId) return;
    crestronApi.adjustMicVolume({
      micId: selectedMicId,
      delta: -volumeStep,
      min: audio.minVolume,
      max: audio.maxVolume,
    });
  };

  const handleToggleMute = () => {
    if (!selectedMicId) return;
    const currentMicState = micAudioState[selectedMicId];
    const nextMuted = !(currentMicState?.isMuted ?? false);
    crestronApi.setMicMute({
      micId: selectedMicId,
      isMuted: nextMuted,
    });
  };

  const selectedMicAudioState = selectedMicId
    ? micAudioState[selectedMicId] ?? {
        volume: clamp(audio.defaultVolume, audio.minVolume, audio.maxVolume),
        isMuted: false,
      }
    : {
        volume: clamp(audio.defaultVolume, audio.minVolume, audio.maxVolume),
        isMuted: false,
      };

  const handleRoute = (sourceId, displayId) => {
    setRoutes((currentRoutes) => ({
      ...currentRoutes,
      [displayId]: sourceId,
    }));
    crestronApi.routeSourceToDisplay({ sourceId, displayId });
  };

  const normalizedConfig = useMemo(
    () => ({
      microphones: audio.microphones,
      displays: video.displays,
      sources: video.sources,
    }),
    [audio.microphones, video.displays, video.sources]
  );

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-shell">
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main className="main-content">
        {connectionStatus.showBanner ? (
          <aside className="connection-banner" role="status" aria-live="polite">
            <span className="banner-icon" aria-hidden="true">
              !
            </span>
            <div className="banner-copy">
              <strong>Processor connection unavailable.</strong>
              <span>{connectionStatus.message}</span>
            </div>
          </aside>
        ) : null}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                isSystemRunning={isSystemRunning}
                onStartSystem={handleStartSystem}
                onStopSystem={handleStopSystem}
                labels={home}
              />
            }
          />
          <Route
            path="/audio"
            element={
              <AudioPage
                microphones={normalizedConfig.microphones}
                selectedMicId={selectedMicId}
                onSelectMic={handleMicSelect}
                volume={selectedMicAudioState.volume}
                min={audio.minVolume}
                max={audio.maxVolume}
                onVolDown={handleVolumeDown}
                onVolUp={handleVolumeUp}
                isMuted={selectedMicAudioState.isMuted}
                onToggleMute={handleToggleMute}
              />
            }
          />
          <Route
            path="/video-routing"
            element={
              <VideoRoutingPage
                displays={normalizedConfig.displays}
                sources={normalizedConfig.sources}
                routes={routes}
                onRoute={handleRoute}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
