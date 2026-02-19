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

        event EventHandler<UIEventArgs> StartSystemBtn;
        event EventHandler<UIEventArgs> StopSystemBtn;
        event EventHandler<UIEventArgs> SetMuteBtn;
        event EventHandler<UIEventArgs> VolumeUpBtn;
        event EventHandler<UIEventArgs> VolumeDownBtn;
        event EventHandler<UIEventArgs> MasterVolUpBtn;
        event EventHandler<UIEventArgs> MasterVolDownBtn;
        event EventHandler<UIEventArgs> MasterVolMuteBtn;
        event EventHandler<UIEventArgs> SelectMic1Btn;
        event EventHandler<UIEventArgs> SelectMic2Btn;
        event EventHandler<UIEventArgs> SelectMic3Btn;
        event EventHandler<UIEventArgs> SelectMic4Btn;
        event EventHandler<UIEventArgs> SelectMic5Btn;
        event EventHandler<UIEventArgs> SelectedMicVolumeBtn;
        event EventHandler<UIEventArgs> MasterVolumeBtn;
        event EventHandler<UIEventArgs> Display1SourcePress;
        event EventHandler<UIEventArgs> Display2SourcePress;
        event EventHandler<UIEventArgs> Display3SourcePress;
        event EventHandler<UIEventArgs> Display4SourcePress;
        event EventHandler<UIEventArgs> SelectedMicIdBtn;

        void SystemRunningFb(TouchpanelBoolInputSigDelegate callback);
        void StopSystemFb(TouchpanelBoolInputSigDelegate callback);
        void SelectedMicMuteFb(TouchpanelBoolInputSigDelegate callback);
        void VolumeUpFb(TouchpanelBoolInputSigDelegate callback);
        void VolumeDownFb(TouchpanelBoolInputSigDelegate callback);
        void MasterVolUpFb(TouchpanelBoolInputSigDelegate callback);
        void MasterVolDownFb(TouchpanelBoolInputSigDelegate callback);
        void MasterVolMuteFb(TouchpanelBoolInputSigDelegate callback);
        void SelectMic1Fb(TouchpanelBoolInputSigDelegate callback);
        void SelectMic2Fb(TouchpanelBoolInputSigDelegate callback);
        void SelectMic3Fb(TouchpanelBoolInputSigDelegate callback);
        void SelectMic4Fb(TouchpanelBoolInputSigDelegate callback);
        void SelectMic5Fb(TouchpanelBoolInputSigDelegate callback);
        void SelectedMicVolumeFb(TouchpanelUShortInputSigDelegate callback);
        void MasterVolumeFb(TouchpanelUShortInputSigDelegate callback);
        void Display1SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display2SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display3SourceFb(TouchpanelUShortInputSigDelegate callback);
        void Display4SourceFb(TouchpanelUShortInputSigDelegate callback);
        void SelectedMicIdFb(TouchpanelStringInputSigDelegate callback);

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
                public const uint StartSystemBtn = 1;
                public const uint StopSystemBtn = 2;
                public const uint SetMuteBtn = 3;
                public const uint VolumeUpBtn = 4;
                public const uint VolumeDownBtn = 5;
                public const uint MasterVolUpBtn = 6;
                public const uint MasterVolDownBtn = 7;
                public const uint MasterVolMuteBtn = 8;
                public const uint SelectMic1Btn = 9;
                public const uint SelectMic2Btn = 10;
                public const uint SelectMic3Btn = 11;
                public const uint SelectMic4Btn = 12;
                public const uint SelectMic5Btn = 13;

                public const uint SystemRunningFb = 1;
                public const uint StopSystemFb = 2;
                public const uint SelectedMicMuteFb = 3;
                public const uint VolumeUpFb = 4;
                public const uint VolumeDownFb = 5;
                public const uint MasterVolUpFb = 6;
                public const uint MasterVolDownFb = 7;
                public const uint MasterVolMuteFb = 8;
                public const uint SelectMic1Fb = 9;
                public const uint SelectMic2Fb = 10;
                public const uint SelectMic3Fb = 11;
                public const uint SelectMic4Fb = 12;
                public const uint SelectMic5Fb = 13;
            }
            internal static class Numerics
            {
                public const uint SelectedMicVolumeBtn = 1;
                public const uint MasterVolumeBtn = 2;
                public const uint Display1SourcePress = 3;
                public const uint Display2SourcePress = 4;
                public const uint Display3SourcePress = 5;
                public const uint Display4SourcePress = 6;

                public const uint SelectedMicVolumeFb = 1;
                public const uint MasterVolumeFb = 2;
                public const uint Display1SourceFb = 3;
                public const uint Display2SourceFb = 4;
                public const uint Display3SourceFb = 5;
                public const uint Display4SourceFb = 6;
            }
            internal static class Strings
            {
                public const uint SelectedMicIdBtn = 1;

                public const uint SelectedMicIdFb = 1;
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
 
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.StartSystemBtn, onStartSystemBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.StopSystemBtn, onStopSystemBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SetMuteBtn, onSetMuteBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.VolumeUpBtn, onVolumeUpBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.VolumeDownBtn, onVolumeDownBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.MasterVolUpBtn, onMasterVolUpBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.MasterVolDownBtn, onMasterVolDownBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.MasterVolMuteBtn, onMasterVolMuteBtn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic1Btn, onSelectMic1Btn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic2Btn, onSelectMic2Btn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic3Btn, onSelectMic3Btn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic4Btn, onSelectMic4Btn);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.SelectMic5Btn, onSelectMic5Btn);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.SelectedMicVolumeBtn, onSelectedMicVolumeBtn);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.MasterVolumeBtn, onMasterVolumeBtn);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display1SourcePress, onDisplay1SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display2SourcePress, onDisplay2SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display3SourcePress, onDisplay3SourcePress);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.Display4SourcePress, onDisplay4SourcePress);
            ComponentMediator.ConfigureStringEvent(controlJoinId, Joins.Strings.SelectedMicIdBtn, onSelectedMicIdBtn);

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

        public event EventHandler<UIEventArgs> StartSystemBtn;
        private void onStartSystemBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = StartSystemBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> StopSystemBtn;
        private void onStopSystemBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = StopSystemBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SetMuteBtn;
        private void onSetMuteBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SetMuteBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> VolumeUpBtn;
        private void onVolumeUpBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = VolumeUpBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> VolumeDownBtn;
        private void onVolumeDownBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = VolumeDownBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> MasterVolUpBtn;
        private void onMasterVolUpBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = MasterVolUpBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> MasterVolDownBtn;
        private void onMasterVolDownBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = MasterVolDownBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> MasterVolMuteBtn;
        private void onMasterVolMuteBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = MasterVolMuteBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic1Btn;
        private void onSelectMic1Btn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic1Btn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic2Btn;
        private void onSelectMic2Btn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic2Btn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic3Btn;
        private void onSelectMic3Btn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic3Btn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic4Btn;
        private void onSelectMic4Btn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic4Btn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> SelectMic5Btn;
        private void onSelectMic5Btn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectMic5Btn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void SystemRunningFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SystemRunningFb], this);
            }
        }

        public void StopSystemFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.StopSystemFb], this);
            }
        }

        public void SelectedMicMuteFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectedMicMuteFb], this);
            }
        }

        public void VolumeUpFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.VolumeUpFb], this);
            }
        }

        public void VolumeDownFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.VolumeDownFb], this);
            }
        }

        public void MasterVolUpFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.MasterVolUpFb], this);
            }
        }

        public void MasterVolDownFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.MasterVolDownFb], this);
            }
        }

        public void MasterVolMuteFb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.MasterVolMuteFb], this);
            }
        }

        public void SelectMic1Fb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic1Fb], this);
            }
        }

        public void SelectMic2Fb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic2Fb], this);
            }
        }

        public void SelectMic3Fb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic3Fb], this);
            }
        }

        public void SelectMic4Fb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic4Fb], this);
            }
        }

        public void SelectMic5Fb(TouchpanelBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.SelectMic5Fb], this);
            }
        }

        public event EventHandler<UIEventArgs> SelectedMicVolumeBtn;
        private void onSelectedMicVolumeBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectedMicVolumeBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> MasterVolumeBtn;
        private void onMasterVolumeBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = MasterVolumeBtn;
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


        public void SelectedMicVolumeFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.SelectedMicVolumeFb], this);
            }
        }

        public void MasterVolumeFb(TouchpanelUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.MasterVolumeFb], this);
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

        public event EventHandler<UIEventArgs> SelectedMicIdBtn;
        private void onSelectedMicIdBtn(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = SelectedMicIdBtn;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void SelectedMicIdFb(TouchpanelStringInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].StringInput[Joins.Strings.SelectedMicIdFb], this);
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

            StartSystemBtn = null;
            StopSystemBtn = null;
            SetMuteBtn = null;
            VolumeUpBtn = null;
            VolumeDownBtn = null;
            MasterVolUpBtn = null;
            MasterVolDownBtn = null;
            MasterVolMuteBtn = null;
            SelectMic1Btn = null;
            SelectMic2Btn = null;
            SelectMic3Btn = null;
            SelectMic4Btn = null;
            SelectMic5Btn = null;
            SelectedMicVolumeBtn = null;
            MasterVolumeBtn = null;
            Display1SourcePress = null;
            Display2SourcePress = null;
            Display3SourcePress = null;
            Display4SourcePress = null;
            SelectedMicIdBtn = null;
        }

        #endregion

    }
}
