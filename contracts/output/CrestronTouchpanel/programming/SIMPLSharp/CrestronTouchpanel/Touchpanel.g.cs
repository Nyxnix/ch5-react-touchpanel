using System;
using System.Collections.Generic;
using System.Linq;
using Crestron.SimplSharpPro.DeviceSupport;
using Crestron.SimplSharpPro;

namespace CrestronTouchpanel
{
    public interface ITouchpanel
    {
        object UserObject { get; set; }

        event EventHandler<UIEventArgs> StartSystemEvent;
        event EventHandler<UIEventArgs> StopSystemEvent;
        event EventHandler<UIEventArgs> SetMuteEvent;
        event EventHandler<UIEventArgs> VolumeUpEvent;
        event EventHandler<UIEventArgs> VolumeDownEvent;
        event EventHandler<UIEventArgs> SelectMic1Event;
        event EventHandler<UIEventArgs> SelectMic2Event;
        event EventHandler<UIEventArgs> SelectMic3Event;
        event EventHandler<UIEventArgs> SelectMic4Event;
        event EventHandler<UIEventArgs> SelectMic5Event;
        event EventHandler<UIEventArgs> SelectedMicVolumeEvent;
        event EventHandler<UIEventArgs> Display1SourcePress;
        event EventHandler<UIEventArgs> Display2SourcePress;
        event EventHandler<UIEventArgs> Display3SourcePress;
        event EventHandler<UIEventArgs> Display4SourcePress;
        event EventHandler<UIEventArgs> SelectedMicIdEvent;

        void SystemRunningState(TouchpanelBoolInputSigDelegate callback);
        void StopSystemState(TouchpanelBoolInputSigDelegate callback);
        void SelectedMicMuteState(TouchpanelBoolInputSigDelegate callback);
        void VolumeUpState(TouchpanelBoolInputSigDelegate callback);
        void VolumeDownState(TouchpanelBoolInputSigDelegate callback);
        void SelectMic1State(TouchpanelBoolInputSigDelegate callback);
        void SelectMic2State(TouchpanelBoolInputSigDelegate callback);
        void SelectMic3State(TouchpanelBoolInputSigDelegate callback);
        void SelectMic4State(TouchpanelBoolInputSigDelegate callback);
        void SelectMic5State(TouchpanelBoolInputSigDelegate callback);
        void SelectedMicVolumeState(TouchpanelUShortInputSigDelegate callback);
        void Display1SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display2SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display3SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display4SourceFb(TouchpanelUShortInputSigDelegate callback);
        void SelectedMicIdState(TouchpanelStringInputSigDelegate callback);

    }

    public delegate void TouchpanelBoolInputSigDelegate(BoolInputSig boolInputSig, ITouchpanel touchpanel);
    public delegate void TouchpanelUShortInputSigDelegate(UShortInputSig uShortInputSig, ITouchpanel touchpanel);
    public delegate void TouchpanelStringInputSigDelegate(StringInputSig stringInputSig, ITouchpanel touchpanel);

    internal class Touchpanel : ITouchpanel, IDisposable
    {
        #region Standard CH5 Component members

        private ComponentMediator ComponentMediator { get; set; }

        public object UserObject { get; set; }

        public uint ControlJoinId { get; private set; }

        private IList<BasicTriListWithSmartObject> _devices;
        public IList<BasicTriListWithSmartObject> Devices { get { return _devices; } }

        #endregion

        #region Joins

        private static class Joins
        {
            internal static class Booleans
            {
                public const uint StartSystemEvent = 1;
                public const uint StopSystemEvent = 2;
                public const uint SetMuteEvent = 3;
                public const uint VolumeUpEvent = 4;
                public const uint VolumeDownEvent = 5;
                public const uint SelectMic1Event = 6;
                public const uint SelectMic2Event = 7;
                public const uint SelectMic3Event = 8;
                public const uint SelectMic4Event = 9;
                public const uint SelectMic5Event = 10;

                public const uint SystemRunningState = 1;
                public const uint StopSystemState = 2;
                public const uint SelectedMicMuteState = 3;
                public const uint VolumeUpState = 4;
                public const uint VolumeDownState = 5;
                public const uint SelectMic1State = 6;
                public const uint SelectMic2State = 7;
                public const uint SelectMic3State = 8;
                public const uint SelectMic4State = 9;
                public const uint SelectMic5State = 10;
            }
            internal static class Numerics
            {
                public const uint SelectedMicVolumeEvent = 1;
                public const uint Display1SourcePress = 2;
                public const uint Display2SourcePress = 3;
                public const uint Display3SourcePress = 4;
                public const uint Display4SourcePress = 5;

                public const uint SelectedMicVolumeState = 1;
                public const uint Display1SourceFb = 2;
                public const uint Display2SourceFb = 3;
                public const uint Display3SourceFb = 4;
                public const uint Display4SourceFb = 5;
            }
            internal static class Strings
            {
                public const uint SelectedMicIdEvent = 1;

                public const uint SelectedMicIdState = 1;
            }
        }

        #endregion

        #region Construction and Initialization

        internal Touchpanel(ComponentMediator componentMediator, uint controlJoinId)
        {
            ComponentMediator = componentMediator;
            Initialize(controlJoinId);
        }

        private void Initialize(uint controlJoinId)
        {
            ControlJoinId = controlJoinId; 
 
            _devices = new List<BasicTriListWithSmartObject>(); 
 
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.StartSystemEvent, onStartSystemEvent);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.StopSystemEvent, onStopSystemEvent);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SetMuteEvent, onSetMuteEvent);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.VolumeUpEvent, onVolumeUpEvent);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.VolumeDownEvent, onVolumeDownEvent);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic1Event, onSelectMic1Event);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic2Event, onSelectMic2Event);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic3Event, onSelectMic3Event);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic4Event, onSelectMic4Event);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic5Event, onSelectMic5Event);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.SelectedMicVolumeEvent, onSelectedMicVolumeEvent);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display1SourcePress, onDisplay1SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display2SourcePress, onDisplay2SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display3SourcePress, onDisplay3SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display4SourcePress, onDisplay4SourcePress);
            ComponentMediator.ConfigureStringEvent(controlJoinId, Joins.Strings.SelectedMicIdEvent, onSelectedMicIdEvent);

        }

        public void AddDevice(BasicTriListWithSmartObject device)
        {
            Devices.Add(device);
            ComponentMediator.HookSmartObjectEvents(device.SmartObjects[ControlJoinId]);
        }

        public void RemoveDevice(BasicTriListWithSmartObject device)
        {
            Devices.Remove(device);
            ComponentMediator.UnHookSmartObjectEvents(device.SmartObjects[ControlJoinId]);
        }

        #endregion

        #region CH5 Contract

        public event EventHandler<UIEventArgs> StartSystemEvent;
        private void onStartSystemEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = StartSystemEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> StopSystemEvent;
        private void onStopSystemEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = StopSystemEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SetMuteEvent;
        private void onSetMuteEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SetMuteEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> VolumeUpEvent;
        private void onVolumeUpEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = VolumeUpEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> VolumeDownEvent;
        private void onVolumeDownEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = VolumeDownEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic1Event;
        private void onSelectMic1Event(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic1Event;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic2Event;
        private void onSelectMic2Event(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic2Event;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic3Event;
        private void onSelectMic3Event(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic3Event;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic4Event;
        private void onSelectMic4Event(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic4Event;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic5Event;
        private void onSelectMic5Event(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic5Event;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void SystemRunningState(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SystemRunningState], this);
            }
        }

        public void StopSystemState(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.StopSystemState], this);
            }
        }

        public void SelectedMicMuteState(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectedMicMuteState], this);
            }
        }

        public void VolumeUpState(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.VolumeUpState], this);
            }
        }

        public void VolumeDownState(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.VolumeDownState], this);
            }
        }

        public void SelectMic1State(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic1State], this);
            }
        }

        public void SelectMic2State(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic2State], this);
            }
        }

        public void SelectMic3State(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic3State], this);
            }
        }

        public void SelectMic4State(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic4State], this);
            }
        }

        public void SelectMic5State(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic5State], this);
            }
        }

        public event EventHandler<UIEventArgs> SelectedMicVolumeEvent;
        private void onSelectedMicVolumeEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectedMicVolumeEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Display1SourcePress;
        private void onDisplay1SourcePress(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Display1SourcePress;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Display2SourcePress;
        private void onDisplay2SourcePress(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Display2SourcePress;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Display3SourcePress;
        private void onDisplay3SourcePress(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Display3SourcePress;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Display4SourcePress;
        private void onDisplay4SourcePress(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Display4SourcePress;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void SelectedMicVolumeState(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.SelectedMicVolumeState], this);
            }
        }

        public void Display1SourceFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.Display1SourceFb], this);
            }
        }

        public void Display2SourceFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.Display2SourceFb], this);
            }
        }

        public void Display3SourceFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.Display3SourceFb], this);
            }
        }

        public void Display4SourceFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.Display4SourceFb], this);
            }
        }

        public event EventHandler<UIEventArgs> SelectedMicIdEvent;
        private void onSelectedMicIdEvent(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectedMicIdEvent;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void SelectedMicIdState(TouchpanelStringInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].StringInput[Joins.Strings.SelectedMicIdState], this);
            }
        }

        #endregion

        #region Overrides

        public override int GetHashCode()
        {
            return (int)ControlJoinId;
        }

        public override string ToString()
        {
            return string.Format("Contract: {0} Component: {1} HashCode: {2} {3}", "Touchpanel", GetType().Name, GetHashCode(), UserObject != null ? "UserObject: " + UserObject : null);
        }

        #endregion

        #region IDisposable

        public bool IsDisposed { get; set; }

        public void Dispose()
        {
            if (IsDisposed)
                return;

            IsDisposed = true;

            StartSystemEvent = null;
            StopSystemEvent = null;
            SetMuteEvent = null;
            VolumeUpEvent = null;
            VolumeDownEvent = null;
            SelectMic1Event = null;
            SelectMic2Event = null;
            SelectMic3Event = null;
            SelectMic4Event = null;
            SelectMic5Event = null;
            SelectedMicVolumeEvent = null;
            Display1SourcePress = null;
            Display2SourcePress = null;
            Display3SourcePress = null;
            Display4SourcePress = null;
            SelectedMicIdEvent = null;
        }

        #endregion

    }
}
