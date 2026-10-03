import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { createPwaUpdateController, INITIAL_PWA_UPDATE_STATE } from "../lib/pwaUpdates";

const reloadGuards = new Set<() => boolean>();
const guardListeners = new Set<() => void>();
function notifyGuards() { for (const listener of guardListeners) listener(); }

/** Protect React state such as photos and order as well as text fields. */
export function usePwaReloadGuard(blocked: boolean) {
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  useEffect(() => {
    const guard = () => blockedRef.current;
    reloadGuards.add(guard);
    notifyGuards();
    return () => { reloadGuards.delete(guard); notifyGuards(); };
  }, []);
  useEffect(notifyGuards, [blocked]);
}

export function usePwaUpdates() {
  const [state, setState] = useState(INITIAL_PWA_UPDATE_STATE);
  const navigation = useNavigation();
  const busyRef = useRef(navigation.state !== "idle");
  busyRef.current = navigation.state !== "idle";
  const controllerRef = useRef<ReturnType<typeof createPwaUpdateController> | null>(null);
  useEffect(() => {
    // A development worker can trap local HMR assets and old routes.
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    const editedControls = new Set<Element>();
    const canReload = () => {
      for (const control of editedControls) {
        if (!control.isConnected) editedControls.delete(control);
      }
      return !busyRef.current && !editedControls.size && ![...reloadGuards].some((guard) => guard());
    };
    const controller = createPwaUpdateController({
      serviceWorker: navigator.serviceWorker, window, document, canReload,
      reload: () => window.location.reload(), onState: setState,
    });
    controllerRef.current = controller;
    const onEdit = (event: Event) => {
      const control = event.target;
      if (!(control instanceof Element) || !control.closest("form") || control.closest("[data-pwa-managed-form]")) return;
      editedControls.add(control);
      controller.refresh();
    };
    const onReset = (event: Event) => {
      // Wait until the native reset completes, preserving cancelled resets.
      queueMicrotask(() => {
        if (event.defaultPrevented || !(event.target instanceof Element)) return;
        for (const control of editedControls) {
          if (event.target.contains(control)) editedControls.delete(control);
        }
        controller.refresh();
      });
    };
    guardListeners.add(controller.refresh);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    document.addEventListener("reset", onReset, true);
    return () => {
      controller.dispose(); controllerRef.current = null;
      guardListeners.delete(controller.refresh);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
      document.removeEventListener("reset", onReset, true);
    };
  }, []);
  useEffect(() => controllerRef.current?.refresh(), [navigation.state, navigation.location]);
  return { ...state, apply: () => controllerRef.current?.apply(), dismiss: () => controllerRef.current?.dismiss() };
}
