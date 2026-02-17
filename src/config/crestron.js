import { touchpanelConfig } from './touchpanelConfig';

const selectMicById = Object.fromEntries(
  (touchpanelConfig?.audio?.microphones ?? []).map((mic, index) => [
    mic.id,
    `Touchpanel.SelectMic${index + 1}Event`,
  ])
);

const videoDisplays = touchpanelConfig?.video?.displays ?? [];
const videoSources = touchpanelConfig?.video?.sources ?? [];

const displaySourceFbById = Object.fromEntries(
  videoDisplays.map((display, index) => [display.id, `Touchpanel.Display${index + 1}SourceFb`])
);

const displaySourcePressById = Object.fromEntries(
  videoDisplays.map((display, index) => [display.id, `Touchpanel.Display${index + 1}SourcePress`])
);

const sourceValueById = Object.fromEntries(
  videoSources.map((source, index) => [source.id, index + 1])
);

const sourceIdByValue = Object.fromEntries(
  videoSources.map((source, index) => [index + 1, source.id])
);

export const crestronConfig = {
  webXPanel: {
    ipId: '0x03',
    host: '192.168.1.59',
    roomId: '',
    authToken: '',
  },
  contracts: {
    state: {
      systemRunning: 'Touchpanel.SystemRunningState',
      selectedMicId: 'Touchpanel.SelectedMicIdState',
      selectedMicVolume: 'Touchpanel.SelectedMicVolumeState',
      selectedMicMute: 'Touchpanel.SelectedMicMuteState',
    },
    event: {
      startSystem: 'Touchpanel.StartSystemEvent',
      stopSystem: 'Touchpanel.StopSystemEvent',
      volumeUp: 'Touchpanel.VolumeUpEvent',
      volumeDown: 'Touchpanel.VolumeDownEvent',
      setMute: 'Touchpanel.SetMuteEvent',
      selectMicById,
    },
    video: {
      displaySourceFbById,
      displaySourcePressById,
      sourceValueById,
      sourceIdByValue,
    },
  },
};
