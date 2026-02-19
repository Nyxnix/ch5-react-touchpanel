export const touchpanelConfig = {
  appTitle: 'Crestron Touchpanel',
  home: {
    startButtonLabel: 'Start System',
    stopButtonLabel: 'Stop System',
  },
  audio: {
    minVolume: 0,
    maxVolume: 100,
    unityGainPoint: 89,
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
      { id: 'mic-5', name: 'Bluetooth', icon: 'entities/bluetooth.svg' },
      { id: 'mic-6', name: 'Lapel Mic A', icon: 'entities/microphone.svg' },
      { id: 'mic-7', name: 'Lapel Mic B', icon: 'entities/microphone.svg' },
      { id: 'mic-8', name: 'Handheld Mic A', icon: 'entities/microphone.svg' },
      { id: 'mic-9', name: 'Handheld Mic B', icon: 'entities/microphone.svg' },
      { id: 'mic-10', name: 'Program Audio', icon: 'entities/microphone.svg' },
    ],
  },
  video: {
    displays: [
      { id: 'display-1', name: 'Front Display', icon: 'entities/display.svg' },
      { id: 'display-2', name: 'Rear Display', icon: 'entities/display.svg' },
      { id: 'display-3', name: 'Confidence Monitor', icon: 'entities/display.svg' },
      { id: 'display-4', name: 'Confidence Monitor 2', icon: 'entities/display.svg' },
      { id: 'display-5', name: 'Side Display A', icon: 'entities/display.svg' },
      { id: 'display-6', name: 'Side Display B', icon: 'entities/display.svg' },
      { id: 'display-7', name: 'Overflow Display A', icon: 'entities/display.svg' },
      { id: 'display-8', name: 'Overflow Display B', icon: 'entities/display.svg' },
      { id: 'display-9', name: 'Recording Monitor', icon: 'entities/display.svg' },
      { id: 'display-10', name: 'Lobby Preview', icon: 'entities/display.svg' },
    ],
    sources: [
      { id: 'source-1', name: 'Laptop HDMI', icon: 'entities/source-laptop.svg' },
      { id: 'source-2', name: 'AirMedia', icon: 'entities/source-wireless.svg' },
      { id: 'source-3', name: 'Document Camera', icon: 'entities/source-camera.svg' },
      { id: 'source-4', name: 'Signage Player', icon: 'entities/source-signage.svg' },
    ],
  },
};
