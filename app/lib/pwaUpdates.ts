export interface PwaUpdateState {
  available: boolean;
  applying: boolean;
  blocked: boolean;
  error: string | null;
}
export const INITIAL_PWA_UPDATE_STATE: PwaUpdateState = {
  available: false, applying: false, blocked: false, error: null,
};
interface PwaUpdateOptions {
  serviceWorker: ServiceWorkerContainer;
  window: Pick<Window, "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout">;
  document: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  canReload: () => boolean;
  reload: () => void;
  onState: (state: PwaUpdateState) => void;
  now?: () => number;
}

/** Each tab owns its consent; another tab's update never reloads this one. */
export function createPwaUpdateController(options: PwaUpdateOptions) {
  const { serviceWorker, window, document, canReload, reload, onState } = options;
  const now = options.now ?? Date.now;
  let registration: ServiceWorkerRegistration | null = null;
  let waiting: ServiceWorker | null = null;
  let requested: ServiceWorker | null = null;
  let dismissed: ServiceWorker | null = null;
  let needsReload = false;
  let reloadDismissed = false;
  let hadController = !!serviceWorker.controller;
  let applying = false;
  let reloaded = false;
  let disposed = false;
  let registering = false;
  let checking = false;
  let lastChecked = -Infinity;
  let timeout: number | undefined;
  let error: string | null = null;
  const observedWorkers = new Map<ServiceWorker, () => void>();

  function publish() {
    if (disposed) return;
    onState({
      available: needsReload ? !reloadDismissed : !!waiting && waiting !== dismissed,
      applying, blocked: !canReload(), error,
    });
  }
  function clearTimeout() {
    if (timeout !== undefined) window.clearTimeout(timeout);
    timeout = undefined;
  }
  function reloadOnce() {
    if (reloaded || disposed) return;
    if (!canReload()) {
      // Input can start after pressing Update, while activation is pending.
      applying = false;
      needsReload = true;
      reloadDismissed = false;
      publish();
      return;
    }
    reloaded = true;
    reload();
  }
  function offer(worker: ServiceWorker | null) {
    if (!worker || worker.state === "redundant") return;
    if (waiting !== worker) {
      waiting = worker;
      dismissed = null;
      error = null;
    }
    publish();
  }
  function observe(worker: ServiceWorker) {
    if (observedWorkers.has(worker)) return;
    const onChange = () => {
      if (worker.state === "installed" && (serviceWorker.controller || registration?.active)) {
        offer(worker);
      } else if (worker.state === "redundant" && requested === worker) {
        clearTimeout();
        requested = null;
        applying = false;
        error = "更新できませんでした。もう一度お試しください。";
        publish();
      }
    };
    observedWorkers.set(worker, onChange);
    worker.addEventListener("statechange", onChange);
    onChange();
  }
  function onUpdateFound() {
    if (registration?.installing) observe(registration.installing);
  }
  function onControllerChange() {
    const controller = serviceWorker.controller;
    if (!controller) return;
    const previouslyControlled = hadController;
    hadController = true;
    if (requested && controller === requested) {
      clearTimeout();
      requested = null;
      waiting = null;
      needsReload = true;
      reloadDismissed = false;
      reloadOnce();
    } else if (previouslyControlled) {
      // Another tab applied an update. Offer a reload without interrupting this tab.
      clearTimeout();
      requested = null;
      applying = false;
      error = null;
      waiting = null;
      needsReload = true;
      reloadDismissed = false;
      publish();
    }
  }
  async function checkForUpdate() {
    if (disposed || !registration || checking || now() - lastChecked < 60_000) return;
    if (registration.waiting && (serviceWorker.controller || registration.active)) {
      offer(registration.waiting);
    }
    checking = true;
    lastChecked = now();
    try { await registration.update(); } catch {
      // Offline starts/resumes are ordinary; retain already-ready updates.
      lastChecked = -Infinity;
    } finally { checking = false; }
  }
  function onResume() {
    if (document.visibilityState !== "visible") return;
    if (registration) void checkForUpdate();
    else void register();
  }
  serviceWorker.addEventListener("controllerchange", onControllerChange);
  window.addEventListener("focus", onResume);
  window.addEventListener("pageshow", onResume);
  window.addEventListener("online", onResume);
  document.addEventListener("visibilitychange", onResume);
  async function register() {
    if (disposed || registering) return;
    registering = true;
    try {
      const value = await serviceWorker.register("/sw.js", { updateViaCache: "none" });
      if (disposed) return;
      registration = value;
      registration.addEventListener("updatefound", onUpdateFound);
      if (registration.waiting && (serviceWorker.controller || registration.active)) {
        offer(registration.waiting);
      }
      if (registration.installing) observe(registration.installing);
      await checkForUpdate();
    } catch {
      // Browsers without usable service workers remain normal web apps.
    } finally { registering = false; }
  }
  const ready = register();
  return {
    ready,
    refresh: publish,
    dismiss() {
      if (applying) return;
      dismissed = waiting;
      reloadDismissed = needsReload;
      publish();
    },
    apply() {
      if (disposed || applying || reloaded) return;
      error = null;
      if (!canReload()) { publish(); return; }
      if (needsReload) { reloadOnce(); return; }
      if (!waiting) return;
      requested = waiting;
      applying = true;
      publish();
      timeout = window.setTimeout(() => {
        requested = null;
        applying = false;
        error = "更新できませんでした。通信環境を確認して、もう一度お試しください。";
        publish();
      }, 20_000);
      try { waiting.postMessage({ type: "SKIP_WAITING" }); } catch {
        clearTimeout();
        requested = null;
        applying = false;
        error = "更新できませんでした。もう一度お試しください。";
        publish();
      }
    },
    dispose() {
      disposed = true;
      clearTimeout();
      serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("pageshow", onResume);
      window.removeEventListener("online", onResume);
      document.removeEventListener("visibilitychange", onResume);
      registration?.removeEventListener("updatefound", onUpdateFound);
      for (const [worker, listener] of observedWorkers) worker.removeEventListener("statechange", listener);
    },
  };
}
