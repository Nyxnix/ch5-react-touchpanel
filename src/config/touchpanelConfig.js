export const touchpanelConfig = {
  appTitle: 'Crestron Touchpanel',
  home: {
    startButtonLabel: 'Start System',
    stopButtonLabel: 'Stop System',
  },
  audio: {
    minVolume: 0,
    maxVolume: 100,
    step: 5,
    defaultVolume: 45,
    microphones: [
      // SVG icon examples:
      // icon: 'wireless-mic.svg'
      // icon: 'audio/wireless-mic.svg'
      // icon: '/icons/wireless-mic.svg' (from public/icons)
      { id: 'mic-1', name: 'Wireless Mic A', icon: 'entities/microphone.svg' },
      { id: 'mic-2', name: 'Wireless Mic B', icon: 'entities/microphone.svg' },
      { id: 'mic-3', name: 'Podium Mic', icon: 'entities/microphone.svg' },
      { id: 'mic-4', name: 'Podium Mic 2', icon: 'entities/microphone.svg' },
      { id: 'mic-5', name: 'Audience Mic', icon: 'entities/microphone.svg' },
    ],
  },
  video: {
    displays: [
      { id: 'display-1', name: 'Front Display', icon: 'entities/display.svg' },
      { id: 'display-2', name: 'Rear Display', icon: 'entities/display.svg' },
      { id: 'display-3', name: 'Confidence Monitor', icon: 'entities/display.svg' },
      { id: 'display-4', name: 'Confidence Monitor 2', icon: 'entities/display.svg' },
    ],
    sources: [
      { id: 'source-1', name: 'Laptop HDMI', icon: 'entities/source-laptop.svg' },
      { id: 'source-2', name: 'AirMedia', icon: 'entities/source-wireless.svg' },
      { id: 'source-3', name: 'Document Camera', icon: 'entities/source-camera.svg' },
      { id: 'source-4', name: 'Signage Player', icon: 'entities/source-signage.svg' },
    ],
  },
};
