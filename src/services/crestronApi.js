import { crestronConfig } from '../config/crestron';

const { contracts } = crestronConfig;

const micAudioStates = new Map();
const micListeners = new Map();
const micCommandQueues = new Map();
const micInFlight = new Map();
const masterListeners = new Set();
const systemListeners = new Set();
const videoRouteListeners = new Set();
const videoRouteSubscriptionIds = new Map();

let subscriptionsInitialized = false;
let processorSelectedMicId = null;
let processorSystemRunning = false;
let masterAudioState = {
  volume: 45,
  isMuted: false,
  isVolUpActive: false,
  isVolDownActive: false,
};
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

function notifyMasterState() {
  const snapshot = { ...masterAudioState };
  masterListeners.forEach((listener) => listener(snapshot));
}

function notifyVideoRoutes() {
  const snapshot = { ...processorVideoRoutes };
  videoRouteListeners.forEach((listener) => listener(snapshot));
}

function setProcessorDisplayRouteFromValue(displayId, value) {
  const sourceId = contracts.video?.sourceIdByValue?.[Number(value)] ?? null;
  if (processorVideoRoutes[displayId] === sourceId) {
    return;
  }
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
  if (processorSelectedMicId === micId) return;
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

  const micVolumeSignal = contracts.state.micVolume;
  const sMicVol = crSubscribe('n', micVolumeSignal, (value) => {
    if (!processorSelectedMicId) return;
    ensureMicState(processorSelectedMicId);
    const current = micAudioStates.get(processorSelectedMicId);
    const nextVolume = Number(value);
    if (current.volume === nextVolume) return;
    micAudioStates.set(processorSelectedMicId, {
      ...current,
      volume: nextVolume,
    });
    publishMicState(processorSelectedMicId);
  });

  const sMicMute = crSubscribe('b', contracts.state.selectedMicMute, (value) => {
    if (!processorSelectedMicId) return;
    ensureMicState(processorSelectedMicId);
    const current = micAudioStates.get(processorSelectedMicId);
    const nextMuted = !!value;
    if (current.isMuted === nextMuted) return;
    micAudioStates.set(processorSelectedMicId, {
      ...current,
      isMuted: nextMuted,
    });
    publishMicState(processorSelectedMicId);
  });

  const sMasterVol = contracts.state.masterVolume
    ? crSubscribe('n', contracts.state.masterVolume, (value) => {
        const nextVolume = Number(value);
        if (masterAudioState.volume === nextVolume) return;
        masterAudioState = {
          ...masterAudioState,
          volume: nextVolume,
        };
        notifyMasterState();
      })
    : null;

  const sMasterMute = contracts.state.masterMute
    ? crSubscribe('b', contracts.state.masterMute, (value) => {
        const nextMuted = !!value;
        if (masterAudioState.isMuted === nextMuted) return;
        masterAudioState = {
          ...masterAudioState,
          isMuted: nextMuted,
        };
        notifyMasterState();
      })
    : null;

  const masterVolUpStateSignal = contracts.state.masterVolUpState;
  const sMasterVolUp = masterVolUpStateSignal
    ? crSubscribe('b', masterVolUpStateSignal, (value) => {
        const nextVolUpActive = !!value;
        if (masterAudioState.isVolUpActive === nextVolUpActive) return;
        masterAudioState = {
          ...masterAudioState,
          isVolUpActive: nextVolUpActive,
        };
        notifyMasterState();
      })
    : null;

  const masterVolDownStateSignal = contracts.state.masterVolDownState;
  const sMasterVolDown = masterVolDownStateSignal
    ? crSubscribe('b', masterVolDownStateSignal, (value) => {
        const nextVolDownActive = !!value;
        if (masterAudioState.isVolDownActive === nextVolDownActive) return;
        masterAudioState = {
          ...masterAudioState,
          isVolDownActive: nextVolDownActive,
        };
        notifyMasterState();
      })
    : null;

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
      crUnsubscribe('n', micVolumeSignal, sMicVol);
      crUnsubscribe('b', contracts.state.selectedMicMute, sMicMute);
      if (contracts.state.masterVolume) {
        crUnsubscribe('n', contracts.state.masterVolume, sMasterVol);
      }
      if (contracts.state.masterMute) {
        crUnsubscribe('b', contracts.state.masterMute, sMasterMute);
      }
      if (masterVolUpStateSignal) {
        crUnsubscribe('b', masterVolUpStateSignal, sMasterVolUp);
      }
      if (masterVolDownStateSignal) {
        crUnsubscribe('b', masterVolDownStateSignal, sMasterVolDown);
      }
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
  subscribeMasterAudioState: (callback) => {
    setupProcessorSubscriptions();
    masterListeners.add(callback);
    callback({ ...masterAudioState });

    return () => {
      masterListeners.delete(callback);
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
  requestMasterAudioState: () => {
    setupProcessorSubscriptions();
    notifyMasterState();
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
    ensureMicState(micId);

    const current = micAudioStates.get(micId);
    micAudioStates.set(micId, {
      ...current,
      isMuted: !!isMuted,
    });
    publishMicState(micId);

    enqueueMicCommand(micId, {
      type: 'setMute',
      isMuted: !!isMuted,
    });
  },
  adjustMasterVolume: ({ delta }) => {
    if (!delta) return;
    setupProcessorSubscriptions();

    if (delta > 0) {
      crPulseDigital(contracts.event.masterVolumeUp);
    } else if (delta < 0) {
      crPulseDigital(contracts.event.masterVolumeDown);
    }
  },
  setMasterMute: ({ isMuted }) => {
    setupProcessorSubscriptions();
    crPulseDigital(contracts.event.masterVolumeMute);
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
