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

function getSafeLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function'
    ) {
      return null;
    }
    return storage;
  } catch (error) {
    return null;
  }
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storage = getSafeLocalStorage();
  const storedTheme = storage ? storage.getItem(THEME_STORAGE_KEY) : null;
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function isNativeTouchpanelRuntime() {
  if (typeof window === 'undefined') return false;
  const protocol = window.location?.protocol ?? '';
  const pathname = window.location?.pathname ?? '';
  const userAgent = window.navigator?.userAgent?.toLowerCase?.() ?? '';
  return (
    protocol === 'file:' ||
    pathname.includes('/ROMDISK/romdisk/user/display') ||
    userAgent.includes('crestron')
  );
}

function hasSameMicAudioState(currentState, nextState) {
  return (
    currentState?.volume === nextState?.volume && currentState?.isMuted === nextState?.isMuted
  );
}

function hasSameMasterAudioState(currentState, nextState) {
  return (
    currentState?.volume === nextState?.volume &&
    currentState?.isMuted === nextState?.isMuted &&
    currentState?.isVolUpActive === nextState?.isVolUpActive &&
    currentState?.isVolDownActive === nextState?.isVolDownActive
  );
}

export default function App() {
  const { home, audio, video } = touchpanelConfig;
  const [theme, setTheme] = useState(getInitialTheme);
  const isTouchpanelRuntime = isNativeTouchpanelRuntime();

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
  const [masterAudioState, setMasterAudioState] = useState(() => ({
    volume: clamp(audio.defaultVolume, audio.minVolume, audio.maxVolume),
    isMuted: false,
    isVolUpActive: false,
    isVolDownActive: false,
  }));

  const [routes, setRoutes] = useState(() =>
    Object.fromEntries(video.displays.map((display) => [display.id, null]))
  );

  const volumeStep = Math.max(1, Number(audio.step) || 1);
  const { status: connectionStatus } = useWebXPanel(crestronConfig.webXPanel);

  useEffect(() => {
    const unsubscribe = crestronApi.subscribeSystemState((nextState) => {
      setIsSystemRunning((currentState) =>
        currentState === nextState ? currentState : nextState
      );
    });

    crestronApi.requestSystemState();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribers = audio.microphones.map((mic) =>
      crestronApi.subscribeMicAudioState(mic.id, (nextState) => {
        setMicAudioState((current) =>
          hasSameMicAudioState(current[mic.id], nextState)
            ? current
            : {
                ...current,
                [mic.id]: nextState,
              }
        );
      })
    );

    const initialMicId = selectedMicId ?? audio.microphones[0]?.id ?? null;
    if (initialMicId) {
      crestronApi.requestMicAudioState(initialMicId);
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [audio.microphones]);

  useEffect(() => {
    const unsubscribe = crestronApi.subscribeMasterAudioState((nextState) => {
      setMasterAudioState((currentState) =>
        hasSameMasterAudioState(currentState, nextState) ? currentState : nextState
      );
    });

    crestronApi.requestMasterAudioState();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = crestronApi.subscribeVideoRoutes((nextRoutes) => {
      setRoutes((currentRoutes) => {
        let changed = false;
        const mergedRoutes = { ...currentRoutes };

        Object.entries(nextRoutes).forEach(([displayId, sourceId]) => {
          if (mergedRoutes[displayId] !== sourceId) {
            mergedRoutes[displayId] = sourceId;
            changed = true;
          }
        });

        return changed ? mergedRoutes : currentRoutes;
      });
    });

    crestronApi.requestVideoRoutes();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    const storage = getSafeLocalStorage();
    if (storage) {
      storage.setItem(THEME_STORAGE_KEY, theme);
    }
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

  const handleMasterVolumeUp = () => {
    crestronApi.adjustMasterVolume({
      delta: volumeStep,
      min: audio.minVolume,
      max: audio.maxVolume,
    });
  };

  const handleMasterVolumeDown = () => {
    crestronApi.adjustMasterVolume({
      delta: -volumeStep,
      min: audio.minVolume,
      max: audio.maxVolume,
    });
  };

  const handleToggleMasterMute = () => {
    const nextMuted = !(masterAudioState?.isMuted ?? false);
    crestronApi.setMasterMute({
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
    setRoutes((currentRoutes) =>
      currentRoutes[displayId] === sourceId
        ? currentRoutes
        : {
            ...currentRoutes,
            [displayId]: sourceId,
          }
    );
    crestronApi.routeSourceToDisplay({ sourceId, displayId });
  };

  const handleRouteAll = (sourceId) => {
    if (!sourceId) return;

    setRoutes((currentRoutes) => {
      let changed = false;
      const nextRoutes = { ...currentRoutes };

      video.displays.forEach((display) => {
        if (nextRoutes[display.id] !== sourceId) {
          nextRoutes[display.id] = sourceId;
          changed = true;
        }
      });

      return changed ? nextRoutes : currentRoutes;
    });

    video.displays.forEach((display) => {
      crestronApi.routeSourceToDisplay({ sourceId, displayId: display.id });
    });
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
    <div
      className={`app-shell ${isSystemRunning ? 'system-running' : 'system-stopped'} ${
        isTouchpanelRuntime ? 'runtime-touchpanel' : ''
      }`}
    >
      <div className="app-glow app-glow-a" aria-hidden="true" />
      <div className="app-glow app-glow-b" aria-hidden="true" />
      <div className="app-noise" aria-hidden="true" />
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
                micVolume={selectedMicAudioState.volume}
                min={audio.minVolume}
                max={audio.maxVolume}
                unityGainPoint={audio.unityGainPoint ?? 89}
                onMicVolDown={handleVolumeDown}
                onMicVolUp={handleVolumeUp}
                micIsMuted={selectedMicAudioState.isMuted}
                onToggleMicMute={handleToggleMute}
                masterVolume={masterAudioState.volume}
                onMasterVolDown={handleMasterVolumeDown}
                onMasterVolUp={handleMasterVolumeUp}
                masterIsMuted={masterAudioState.isMuted}
                masterVolUpActive={masterAudioState.isVolUpActive}
                masterVolDownActive={masterAudioState.isVolDownActive}
                onToggleMasterMute={handleToggleMasterMute}
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
                onRouteAll={handleRouteAll}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
