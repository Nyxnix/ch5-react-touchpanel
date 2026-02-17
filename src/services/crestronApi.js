import { crestronConfig } from '../config/crestron';

const { contracts } = crestronConfig;

const micAudioStates = new Map();
const micListeners = new Map();
const micCommandQueues = new Map();
const micInFlight = new Map();
const systemListeners = new Set();
const videoRouteListeners = new Set();
const videoRouteSubscriptionIds = new Map();

let subscriptionsInitialized = false;
let processorSelectedMicId = null;
let processorSystemRunning = false;
const processorVideoRoutes = Object.fromEntries(
  Object.keys(contracts.video?.displaySourceFbById ?? {}).map((displayId) => [displayId, null])
);

function hasCrComLib() {
  return typeof window !== 'undefined' && !!window.CrComLib;
}

function ensureMicState(micId) {
  if (!micId) return;
  if (!micAudioStates.has(micId)) {
    micAudioStates.set(micId, { volume: 45, isMuted: false });
  }
  if (!micListeners.has(micId)) {
    micListeners.set(micId, new Set());
  }
  if (!micCommandQueues.has(micId)) {
    micCommandQueues.set(micId, []);
  }
  if (!micInFlight.has(micId)) {
    micInFlight.set(micId, false);
  }
}

function buildMicPublicState(micId) {
  ensureMicState(micId);

  if (!micId) {
    return {
      volume: 45,
      isMuted: false,
    };
  }

  const base = micAudioStates.get(micId);

  return {
    volume: base.volume,
    isMuted: base.isMuted,
  };
}

function publishMicState(micId) {
  if (!micId) return;

  const listeners = micListeners.get(micId);
  if (!listeners) return;

  const publicState = buildMicPublicState(micId);
  listeners.forEach((listener) => listener(publicState));
}

function notifySystemState() {
  systemListeners.forEach((listener) => listener(processorSystemRunning));
}

function notifyVideoRoutes() {
  const snapshot = { ...processorVideoRoutes };
  videoRouteListeners.forEach((listener) => listener(snapshot));
}

function setProcessorDisplayRouteFromValue(displayId, value) {
  const sourceId = contracts.video?.sourceIdByValue?.[Number(value)] ?? null;
  processorVideoRoutes[displayId] = sourceId;
  notifyVideoRoutes();
}

function crSubscribe(type, signalName, callback) {
  if (!hasCrComLib()) return null;
  return window.CrComLib.subscribeState(type, signalName, callback, (error) => {
    console.error(`[CrComLib] subscribeState failed (${type}:${signalName})`, error);
  });
}

function crUnsubscribe(type, signalName, subscribeId) {
  if (!hasCrComLib() || subscribeId === null || subscribeId === undefined) return;
  window.CrComLib.unsubscribeState(type, signalName, subscribeId);
}

function crPublish(type, signalName, value) {
  if (!hasCrComLib()) return;
  window.CrComLib.publishEvent(type, signalName, value);
}

function crPulseDigital(signalName, pulseMs = 75) {
  if (!signalName) return;
  crPublish('b', signalName, true);
  setTimeout(() => {
    crPublish('b', signalName, false);
  }, pulseMs);
}

function publishSelectMicDigital(micId) {
  const signalName = contracts.event.selectMicById?.[micId];
  if (!signalName) return false;
  crPulseDigital(signalName);
  return true;
}

function handleProcessorSelectedMicId(micId) {
  if (!micId) return;
  processorSelectedMicId = micId;
  ensureMicState(micId);
  publishMicState(micId);
}

function setupProcessorSubscriptions() {
  if (subscriptionsInitialized || !hasCrComLib()) {
    return;
  }

  subscriptionsInitialized = true;

  const sSystem = crSubscribe('b', contracts.state.systemRunning, (value) => {
    processorSystemRunning = !!value;
    notifySystemState();
  });

  const sMicId = crSubscribe('s', contracts.state.selectedMicId, (value) => {
    handleProcessorSelectedMicId(value);
  });

  const sMicVol = crSubscribe('n', contracts.state.selectedMicVolume, (value) => {
    if (!processorSelectedMicId) return;
    ensureMicState(processorSelectedMicId);
    const current = micAudioStates.get(processorSelectedMicId);
    micAudioStates.set(processorSelectedMicId, {
      ...current,
      volume: Number(value),
    });
    publishMicState(processorSelectedMicId);
  });

  const sMicMute = crSubscribe('b', contracts.state.selectedMicMute, (value) => {
    if (!processorSelectedMicId) return;
    ensureMicState(processorSelectedMicId);
    const current = micAudioStates.get(processorSelectedMicId);
    micAudioStates.set(processorSelectedMicId, {
      ...current,
      isMuted: !!value,
    });
    publishMicState(processorSelectedMicId);
  });

  Object.entries(contracts.video?.displaySourceFbById ?? {}).forEach(([displayId, signalName]) => {
    const subscribeId = crSubscribe('n', signalName, (value) => {
      setProcessorDisplayRouteFromValue(displayId, value);
    });
    videoRouteSubscriptionIds.set(displayId, { signalName, subscribeId });
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      crUnsubscribe('b', contracts.state.systemRunning, sSystem);
      crUnsubscribe('s', contracts.state.selectedMicId, sMicId);
      crUnsubscribe('n', contracts.state.selectedMicVolume, sMicVol);
      crUnsubscribe('b', contracts.state.selectedMicMute, sMicMute);
      videoRouteSubscriptionIds.forEach(({ signalName, subscribeId }) => {
        crUnsubscribe('n', signalName, subscribeId);
      });
      videoRouteSubscriptionIds.clear();
      subscriptionsInitialized = false;
    });
  }
}

function processMicCommandQueue(micId) {
  ensureMicState(micId);
  if (micInFlight.get(micId)) return;

  const queue = micCommandQueues.get(micId);
  if (!queue?.length) {
    publishMicState(micId);
    return;
  }

  const command = queue.shift();
  micInFlight.set(micId, true);
  publishMicState(micId);

  const completeCommand = () => {
    micInFlight.set(micId, false);
    publishMicState(micId);
    processMicCommandQueue(micId);
  };

  // Commands are processor-authoritative through subscribed state joins.
  if (processorSelectedMicId !== micId) {
    publishSelectMicDigital(micId);
    processorSelectedMicId = micId;
  }

  if (command.type === 'volumeDelta') {
    const delta = command.delta;
    if (delta > 0) {
      crPulseDigital(contracts.event.volumeUp);
    } else if (delta < 0) {
      crPulseDigital(contracts.event.volumeDown);
    }
  }

  if (command.type === 'setMute') {
    crPulseDigital(contracts.event.setMute);
  }

  setTimeout(completeCommand, 120);
}

function enqueueMicCommand(micId, command) {
  ensureMicState(micId);
  micCommandQueues.get(micId).push(command);
  publishMicState(micId);
  processMicCommandQueue(micId);
}

setupProcessorSubscriptions();

export const crestronApi = {
  startSystem: () => {
    setupProcessorSubscriptions();
    crPulseDigital(contracts.event.startSystem);
  },
  stopSystem: () => {
    setupProcessorSubscriptions();
    crPulseDigital(contracts.event.stopSystem);
  },
  subscribeSystemState: (callback) => {
    setupProcessorSubscriptions();
    systemListeners.add(callback);
    callback(processorSystemRunning);

    return () => {
      systemListeners.delete(callback);
    };
  },
  requestSystemState: () => {
    setupProcessorSubscriptions();
    notifySystemState();
  },
  selectMicrophone: (micId) => {
    if (!micId) return;
    setupProcessorSubscriptions();
    ensureMicState(micId);
    publishSelectMicDigital(micId);
    handleProcessorSelectedMicId(micId);
  },
  subscribeMicAudioState: (micId, callback) => {
    setupProcessorSubscriptions();
    ensureMicState(micId);

    const listeners = micListeners.get(micId);
    listeners.add(callback);
    callback(buildMicPublicState(micId));

    return () => {
      listeners.delete(callback);
    };
  },
  requestMicAudioState: (micId) => {
    if (!micId) return;
    setupProcessorSubscriptions();
    ensureMicState(micId);

    // Select the mic to force processor-selected mic state joins to represent this mic.
    publishSelectMicDigital(micId);
    handleProcessorSelectedMicId(micId);
    publishMicState(micId);
  },
  ingestProcessorMicAudioState: (micId, state) => {
    if (!micId) return;
    ensureMicState(micId);
    const current = micAudioStates.get(micId);

    micAudioStates.set(micId, {
      ...current,
      volume: typeof state.volume === 'number' ? state.volume : current.volume,
      isMuted: typeof state.isMuted === 'boolean' ? state.isMuted : current.isMuted,
    });

    publishMicState(micId);
  },
  adjustMicVolume: ({ micId, delta, min = 0, max = 100 }) => {
    if (!micId || !delta) return;
    setupProcessorSubscriptions();
    enqueueMicCommand(micId, {
      type: 'volumeDelta',
      delta,
      min,
      max,
    });
  },
  setMicMute: ({ micId, isMuted }) => {
    if (!micId) return;
    setupProcessorSubscriptions();
    enqueueMicCommand(micId, {
      type: 'setMute',
      isMuted: !!isMuted,
    });
  },
  subscribeVideoRoutes: (callback) => {
    setupProcessorSubscriptions();
    videoRouteListeners.add(callback);
    callback({ ...processorVideoRoutes });

    return () => {
      videoRouteListeners.delete(callback);
    };
  },
  requestVideoRoutes: () => {
    setupProcessorSubscriptions();
    notifyVideoRoutes();
  },
  routeSourceToDisplay: ({ sourceId, displayId }) => {
    setupProcessorSubscriptions();
    const sourceValue = contracts.video?.sourceValueById?.[sourceId];
    const displayPressSignal = contracts.video?.displaySourcePressById?.[displayId];

    if (!sourceValue || !displayPressSignal) return;
    // Display press carries source index to route to this display.
    crPublish('n', displayPressSignal, sourceValue);
  },
};
