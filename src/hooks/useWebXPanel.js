import { useEffect, useState } from 'react';

const defaultStatus = {
  isConnected: false,
  showBanner: false,
  message: '',
};

function buildDisconnectedStatus(message) {
  return {
    isConnected: false,
    showBanner: true,
    message,
  };
}

function isInvalidHost(host) {
  return !host || typeof host !== 'string' || host.trim().length === 0;
}

function resolveWebXPanelHost(host) {
  if (!host || typeof host !== 'string') return '';
  const normalized = host.trim().toLowerCase();
  if (normalized === '0.0.0.0') {
    return typeof window !== 'undefined' ? window.location.hostname : host;
  }
  return host.trim();
}

function sanitizeWebXPanelParams(params) {
  const cleaned = {};
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) {
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
}

function resolveQueryOverride(searchParams, keys) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function resolveRuntimeWebXPanelParams(params) {
  if (typeof window === 'undefined') {
    return params;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const host = resolveQueryOverride(searchParams, ['host']);
  const ipId = resolveQueryOverride(searchParams, ['ipid', 'ipId']);
  const roomId = resolveQueryOverride(searchParams, ['roomid', 'roomId']);
  const authToken = resolveQueryOverride(searchParams, ['authtoken', 'authToken']);
  const tokenUrl = resolveQueryOverride(searchParams, ['tokenurl', 'tokenUrl']);
  const tokenSource = resolveQueryOverride(searchParams, ['tokensource', 'tokenSource']);

  return {
    ...params,
    ...(host ? { host } : {}),
    ...(ipId ? { ipId } : {}),
    ...(roomId ? { roomId } : {}),
    ...(authToken ? { authToken } : {}),
    ...(tokenUrl ? { tokenUrl } : {}),
    ...(tokenSource ? { tokenSource } : {}),
  };
}

function resolveTokenUrl(tokenUrl) {
  if (typeof tokenUrl === 'string' && tokenUrl.trim().length > 0) {
    return tokenUrl.trim();
  }
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/cws/websocket/getWebSocketToken`;
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

export default function useWebXPanel(params) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    const runtimeParams = resolveRuntimeWebXPanelParams(params ?? {});
    const nativeTouchpanelRuntime = isNativeTouchpanelRuntime();

    if (typeof window === 'undefined' || !window.WebXPanel?.getWebXPanel) {
      if (nativeTouchpanelRuntime) {
        setIsActive(true);
        setStatus(defaultStatus);
        return undefined;
      }
      setStatus(
        buildDisconnectedStatus(
          'WebXPanel runtime is unavailable. Load in WebXPanel/container to connect to a processor.'
        )
      );
      return undefined;
    }

    if (isInvalidHost(runtimeParams?.host)) {
      if (nativeTouchpanelRuntime) {
        setIsActive(true);
        setStatus(defaultStatus);
        return undefined;
      }
      setStatus(
        buildDisconnectedStatus('Processor host is not configured. Set a valid host/IP to connect.')
      );
      return undefined;
    }

    const panelFactory = window.WebXPanel.getWebXPanel(!window.WebXPanel.runsInContainerApp());
    const { WebXPanel, isActive: panelIsActive, WebXPanelEvents } = panelFactory;
    const host = resolveWebXPanelHost(runtimeParams?.host);
    const tokenUrl = resolveTokenUrl(runtimeParams?.tokenUrl);

    setIsActive(panelIsActive || nativeTouchpanelRuntime);

    if (!panelIsActive) {
      if (nativeTouchpanelRuntime) {
        setStatus(defaultStatus);
        return undefined;
      }
      setStatus(
        buildDisconnectedStatus('WebXPanel is inactive in this runtime, so processor connection is unavailable.')
      );
      return undefined;
    }

    const canUsePanelEvents =
      WebXPanel &&
      typeof WebXPanel.addEventListener === 'function' &&
      typeof WebXPanel.removeEventListener === 'function';
    const eventTarget = canUsePanelEvents ? WebXPanel : window;

    let hasConnected = false;
    WebXPanel.initialize(
      sanitizeWebXPanelParams({
        ...runtimeParams,
        host,
        tokenUrl,
      })
    );

    setStatus(defaultStatus);

    const connectionTimeout = window.setTimeout(() => {
      if (!hasConnected) {
        setStatus(
          buildDisconnectedStatus(
            `Unable to connect to processor at ${host}. Verify host/IP and network access.`
          )
        );
      }
    }, 8000);

    const onConnectWs = () => console.log('WebXPanel websocket connected');
    const onConnectCip = () => {
      hasConnected = true;
      window.clearTimeout(connectionTimeout);
      setStatus(defaultStatus);
      console.log('WebXPanel CIP connected');
    };
    const onErrorWs = (event) => {
      setStatus(
        buildDisconnectedStatus(
          `WebSocket error while connecting to ${host}. Check processor availability and TLS settings.`
        )
      );
      console.log('WebXPanel websocket error', event?.detail);
    };
    const onAuthFailed = (event) => {
      setStatus(
        buildDisconnectedStatus(`Authentication failed for processor ${host}. Verify auth token/credentials.`)
      );
      console.log('WebXPanel authentication failed', event?.detail);
    };
    const onNotAuthorized = (event) => {
      setStatus(
        buildDisconnectedStatus(`Not authorized for processor ${host}. Confirm user access and room permissions.`)
      );
      console.log('WebXPanel not authorized', event?.detail);
    };
    const onDisconnectWs = (event) => {
      setStatus(
        buildDisconnectedStatus(`WebSocket disconnected from processor ${host}. Check processor/network status.`)
      );
      console.log('WebXPanel websocket disconnected', event?.detail);
    };
    const onDisconnectCip = (event) => {
      setStatus(
        buildDisconnectedStatus(`CIP disconnected from processor ${host}. Reconnect or verify control subsystem.`)
      );
      console.log('WebXPanel CIP disconnected', event?.detail);
    };

    eventTarget?.addEventListener?.(WebXPanelEvents.CONNECT_WS, onConnectWs);
    eventTarget?.addEventListener?.(WebXPanelEvents.ERROR_WS, onErrorWs);
    eventTarget?.addEventListener?.(WebXPanelEvents.CONNECT_CIP, onConnectCip);
    eventTarget?.addEventListener?.(WebXPanelEvents.AUTHENTICATION_FAILED, onAuthFailed);
    eventTarget?.addEventListener?.(WebXPanelEvents.NOT_AUTHORIZED, onNotAuthorized);
    eventTarget?.addEventListener?.(WebXPanelEvents.DISCONNECT_WS, onDisconnectWs);
    eventTarget?.addEventListener?.(WebXPanelEvents.DISCONNECT_CIP, onDisconnectCip);

    return () => {
      window.clearTimeout(connectionTimeout);
      eventTarget?.removeEventListener?.(WebXPanelEvents.CONNECT_WS, onConnectWs);
      eventTarget?.removeEventListener?.(WebXPanelEvents.ERROR_WS, onErrorWs);
      eventTarget?.removeEventListener?.(WebXPanelEvents.CONNECT_CIP, onConnectCip);
      eventTarget?.removeEventListener?.(WebXPanelEvents.AUTHENTICATION_FAILED, onAuthFailed);
      eventTarget?.removeEventListener?.(WebXPanelEvents.NOT_AUTHORIZED, onNotAuthorized);
      eventTarget?.removeEventListener?.(WebXPanelEvents.DISCONNECT_WS, onDisconnectWs);
      eventTarget?.removeEventListener?.(WebXPanelEvents.DISCONNECT_CIP, onDisconnectCip);
    };
  }, [params]);

  return { isActive, status };
}
