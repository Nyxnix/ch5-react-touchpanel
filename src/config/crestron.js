import { touchpanelConfig } from './touchpanelConfig';

const selectMicById = Object.fromEntries(
  (touchpanelConfig?.audio?.microphones ?? []).map((mic, index) => [
    mic.id,
    `Touchpanel.SelectMic${index + 1}Btn`,
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
    ipId: '0x04',
    host: '192.168.1.59',
    roomId: '',
    authToken: '',
  },
  contracts: {
    state: {
      systemRunning: 'Touchpanel.SystemRunningFb',
      selectedMicId: 'Touchpanel.SelectedMicIdFb',
      micVolume: 'Touchpanel.SelectedMicVolumeFb',
      masterVolume: 'Touchpanel.MasterVolumeFb',
      masterVolUpState: 'Touchpanel.MasterVolUpFb',
      masterVolDownState: 'Touchpanel.MasterVolDownFb',
      masterMute: 'Touchpanel.MasterVolMuteFb',
      selectedMicMute: 'Touchpanel.SelectedMicMuteFb',
    },
    event: {
      startSystem: 'Touchpanel.StartSystemBtn',
      stopSystem: 'Touchpanel.StopSystemBtn',
      volumeUp: 'Touchpanel.VolumeUpBtn',
      volumeDown: 'Touchpanel.VolumeDownBtn',
      setMute: 'Touchpanel.SetMuteBtn',
      masterVolumeUp: 'Touchpanel.MasterVolUpBtn',
      masterVolumeDown: 'Touchpanel.MasterVolDownBtn',
      masterVolumeMute: 'Touchpanel.MasterVolMuteBtn',
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
