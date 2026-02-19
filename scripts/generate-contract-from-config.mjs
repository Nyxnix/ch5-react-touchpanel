import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { touchpanelConfig } from '../src/config/touchpanelConfig.js';

const contractName = 'CrestronTouchpanel';
const componentName = 'Touchpanel';
const microphones = touchpanelConfig?.audio?.microphones ?? [];
const displays = touchpanelConfig?.video?.displays ?? [];
const micCount = microphones.length;
const displayCount = displays.length;

const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
const mappingPath = resolve('contracts/output/CrestronTouchpanel/interface/mapping/CrestronTouchpanel.cse2j');
const ccePath = resolve('contracts/CrestronTouchpanel.cce');

mkdirSync(resolve('contracts/output/CrestronTouchpanel/interface/mapping'), { recursive: true });

const smartObjectId = 1;

const stateSignals = {
  boolean: {
    SystemRunningFb: 1,
    StopSystemFb: 2,
    SelectedMicMuteFb: 3,
    VolumeUpFb: 4,
    VolumeDownFb: 5,
    MasterVolUpFb: 6,
    MasterVolDownFb: 7,
    MasterVolMuteFb: 8,
  },
  numeric: {
    SelectedMicVolumeFb: 1,
    MasterVolumeFb: 2,
  },
  string: {
    SelectedMicIdFb: 1,
  },
};

const eventSignals = {
  boolean: {
    StartSystemBtn: 1,
    StopSystemBtn: 2,
    SetMuteBtn: 3,
    VolumeUpBtn: 4,
    VolumeDownBtn: 5,
    MasterVolUpBtn: 6,
    MasterVolDownBtn: 7,
    MasterVolMuteBtn: 8,
  },
  numeric: {
    SelectedMicVolumeBtn: 1,
    MasterVolumeBtn: 2,
  },
  string: {
    SelectedMicIdBtn: 1,
  },
};

for (let index = 0; index < micCount; index += 1) {
  const micNum = index + 1;
  stateSignals.boolean[`SelectMic${micNum}Fb`] = 9 + index;
  eventSignals.boolean[`SelectMic${micNum}Btn`] = 9 + index;
}

for (let index = 0; index < displayCount; index += 1) {
  const displayNum = index + 1;
  const joinId = 3 + index;
  stateSignals.numeric[`Display${displayNum}SourceFb`] = joinId;
  eventSignals.numeric[`Display${displayNum}SourcePress`] = joinId;
}

function toQualifiedMap(signalMap) {
  const qualified = {};
  Object.entries(signalMap).forEach(([name, joinId]) => {
    qualified[`${componentName}.${name}`] = {
      joinId,
      smartObjectId,
    };
  });
  return qualified;
}

function toStateJoinMap(signalMap) {
  return {
    [smartObjectId]: Object.fromEntries(
      Object.entries(signalMap).map(([name, joinId]) => [joinId, `${componentName}.${name}`])
    ),
  };
}

const cse2j = {
  name: contractName,
  timestamp,
  version: '1.0.0.0',
  schema_version: 1,
  extra_value: 'Auto-generated from src/config/touchpanelConfig.js',
  signals: {
    states: {
      boolean: toStateJoinMap(stateSignals.boolean),
      numeric: toStateJoinMap(stateSignals.numeric),
      string: toStateJoinMap(stateSignals.string),
    },
    events: {
      boolean: toQualifiedMap(eventSignals.boolean),
      numeric: toQualifiedMap(eventSignals.numeric),
      string: toQualifiedMap(eventSignals.string),
    },
  },
};

const componentId = '_ctcomponent';
const pairs = [
  { commandName: 'SystemRunningFb', feedbackName: 'StartSystemBtn', dataType: 1 },
  { commandName: 'StopSystemFb', feedbackName: 'StopSystemBtn', dataType: 1 },
  { commandName: 'SelectedMicMuteFb', feedbackName: 'SetMuteBtn', dataType: 1 },
  { commandName: 'VolumeUpFb', feedbackName: 'VolumeUpBtn', dataType: 1 },
  { commandName: 'VolumeDownFb', feedbackName: 'VolumeDownBtn', dataType: 1 },
  { commandName: 'MasterVolUpFb', feedbackName: 'MasterVolUpBtn', dataType: 1 },
  { commandName: 'MasterVolDownFb', feedbackName: 'MasterVolDownBtn', dataType: 1 },
  { commandName: 'MasterVolMuteFb', feedbackName: 'MasterVolMuteBtn', dataType: 1 },
  { commandName: 'SelectedMicVolumeFb', feedbackName: 'SelectedMicVolumeBtn', dataType: 2 },
  { commandName: 'MasterVolumeFb', feedbackName: 'MasterVolumeBtn', dataType: 2 },
  { commandName: 'SelectedMicIdFb', feedbackName: 'SelectedMicIdBtn', dataType: 3 },
];

for (let index = 0; index < micCount; index += 1) {
  pairs.push({
    commandName: `SelectMic${index + 1}Fb`,
    feedbackName: `SelectMic${index + 1}Btn`,
    dataType: 1,
  });
}

for (let index = 0; index < displayCount; index += 1) {
  pairs.push({
    commandName: `Display${index + 1}SourceFb`,
    feedbackName: `Display${index + 1}SourcePress`,
    dataType: 2,
  });
}

const stateExists = {
  1: new Set(Object.keys(stateSignals.boolean)),
  2: new Set(Object.keys(stateSignals.numeric)),
  3: new Set(Object.keys(stateSignals.string)),
};
const eventExists = {
  1: new Set(Object.keys(eventSignals.boolean)),
  2: new Set(Object.keys(eventSignals.numeric)),
  3: new Set(Object.keys(eventSignals.string)),
};

pairs.forEach((pair) => {
  if (!stateExists[pair.dataType]?.has(pair.commandName)) {
    throw new Error(
      `[contract:generate] Missing state mapping for ${componentName}.${pair.commandName} (dataType=${pair.dataType})`
    );
  }
  if (!eventExists[pair.dataType]?.has(pair.feedbackName)) {
    throw new Error(
      `[contract:generate] Missing event mapping for ${componentName}.${pair.feedbackName} (dataType=${pair.dataType})`
    );
  }
});

const commands = [];
const feedbacks = [];

pairs.forEach((pair, index) => {
  const commandId = `_c${String(index + 1).padStart(2, '0')}`;
  const feedbackId = `_f${String(index + 1).padStart(2, '0')}`;

  commands.push({
    Errors: [],
    name: pair.commandName,
    siblingId: feedbackId,
    dataType: pair.dataType,
    notes: '',
    id: commandId,
    parentId: componentId,
    attributeType: 0,
  });

  feedbacks.push({
    Errors: [],
    name: pair.feedbackName,
    siblingId: commandId,
    dataType: pair.dataType,
    notes: '',
    id: feedbackId,
    parentId: componentId,
    attributeType: 1,
  });
});

const cce = {
  Errors: [],
  id: '_ctroot',
  name: contractName,
  description: 'Auto-generated from src/config/touchpanelConfig.js',
  company: '',
  client: '',
  author: '',
  version: '1.0.0.0',
  schemaVersion: 1,
  subContractLinks: [],
  subContracts: [],
  specifications: [
    {
      Errors: [],
      parentId: '_ctroot',
      id: '_ctspec',
      componentId,
      instanceName: componentName,
      numberOfInstances: 1,
    },
  ],
  components: [
    {
      Errors: [],
      parentId: '_ctroot',
      id: componentId,
      name: componentName,
      commands,
      feedbacks,
      specifications: [],
    },
  ],
  allComponentsForAllContracts: [],
};

writeFileSync(mappingPath, `${JSON.stringify(cse2j, null, 2)}\n`);
writeFileSync(ccePath, `${JSON.stringify(cce, null, 2)}\n`);

console.log(`[contract:generate] Generated ${mappingPath}`);
console.log(`[contract:generate] Generated ${ccePath}`);
console.log(`[contract:generate] Microphone digital select events: ${micCount}`);
console.log(`[contract:generate] Video display analog contracts: ${displayCount}`);
