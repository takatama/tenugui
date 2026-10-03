import { useSyncExternalStore } from "react";

const KEY = "tenugui:favorites:v1";
const EMPTY = {
  favorites: [] as string[],
  error: "",
  storageMode: "loading" as const,
};
const LOAD_ERROR =
  "お気に入りを読み込めませんでした。もう一度ページを開いてください。";
const SAVE_ERROR = "お気に入りを保存できませんでした。もう一度お試しください。";
const LOCAL_ERROR =
  "お気に入りを保存できませんでした。ブラウザの保存設定をご確認ください。";

interface FavoritesSnapshot {
  favorites: string[];
  error: string;
  storageMode: "cloud" | "browser" | "loading";
}
export interface FavoritesEnvironment {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  readLocal: () => string[];
  writeLocal: (favorites: string[]) => void;
  subscribeLocal: (listener: () => void) => () => void;
}

/** Shared across sidebar, collection, and detail. Injectable dependencies allow
 * the actual request ordering and rollback behavior to be tested without a DOM. */
export function createFavoritesStore(
  getEnvironment: () => FavoritesEnvironment | null,
) {
  let snapshot: FavoritesSnapshot = EMPTY;
  let mode: "unknown" | "anonymous" | "authenticated" = "unknown";
  let initialized: Promise<void> | null = null;
  let confirmed = new Set<string>();
  const desired = new Map<string, boolean>();
  const inFlight = new Set<string>();
  const listeners = new Set<() => void>();
  let unsubscribeLocal: (() => void) | null = null;

  function publish(error = snapshot.error) {
    const visible = new Set(confirmed);
    desired.forEach((favorite, id) => {
      if (favorite) visible.add(id);
      else visible.delete(id);
    });
    snapshot = {
      favorites: [...visible],
      error,
      storageMode:
        mode === "authenticated"
          ? "cloud"
          : mode === "anonymous"
            ? "browser"
            : "loading",
    };
    listeners.forEach((listener) => listener());
  }

  async function save(id: string): Promise<void> {
    if (mode !== "authenticated" || inFlight.has(id) || !desired.has(id))
      return;
    const favorite = desired.get(id)!;
    if (confirmed.has(id) === favorite) {
      desired.delete(id);
      publish();
      return;
    }
    const environment = getEnvironment();
    if (!environment) return;
    inFlight.add(id);
    try {
      const response = await environment.fetch("/api/favorites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, favorite }),
      });
      if (!response.ok) throw new Error("Favorite save failed");
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        (result as { itemId?: unknown }).itemId !== id ||
        (result as { favorite?: unknown }).favorite !== favorite
      )
        throw new Error("Invalid favorite response");
      if (favorite) confirmed.add(id);
      else confirmed.delete(id);
      if (desired.get(id) === favorite) desired.delete(id);
      publish();
    } catch {
      // Keep a newer click when it supersedes this request. Otherwise roll just
      // this item back, preserving successful saves of other items.
      if (desired.get(id) === favorite) desired.delete(id);
      publish(SAVE_ERROR);
    } finally {
      inFlight.delete(id);
      if (desired.has(id)) void save(id);
    }
  }

  function saveLocal() {
    const environment = getEnvironment();
    if (!environment) return;
    const visible = new Set(confirmed);
    desired.forEach((favorite, id) => {
      if (favorite) visible.add(id);
      else visible.delete(id);
    });
    try {
      environment.writeLocal([...visible]);
      confirmed = visible;
      desired.clear();
      publish("");
    } catch {
      desired.clear();
      publish(LOCAL_ERROR);
    }
  }

  function initialize(): Promise<void> {
    if (initialized) return initialized;
    const environment = getEnvironment();
    if (!environment) return Promise.resolve();
    initialized = Promise.resolve().then(async () => {
      try {
        const response = await environment.fetch("/api/favorites", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Favorite load failed");
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          typeof (result as { authenticated?: unknown }).authenticated !==
            "boolean"
        )
          throw new Error("Invalid favorite response");
        const payload = result as {
          authenticated: boolean;
          favorites?: unknown;
        };
        if (payload.authenticated) {
          if (
            !Array.isArray(payload.favorites) ||
            payload.favorites.some((id) => typeof id !== "string")
          )
            throw new Error("Invalid favorite response");
          mode = "authenticated";
          confirmed = new Set(payload.favorites);
          publish("");
          desired.forEach((_, id) => {
            void save(id);
          });
        } else {
          mode = "anonymous";
          confirmed = new Set(environment.readLocal());
          if (desired.size) saveLocal();
          else publish("");
        }
      } catch {
        desired.clear();
        publish(LOAD_ERROR);
        initialized = null;
      }
    });
    return initialized;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const environment = getEnvironment();
    if (environment && !unsubscribeLocal)
      unsubscribeLocal = environment.subscribeLocal(() => {
        if (mode === "anonymous") {
          confirmed = new Set(environment.readLocal());
          publish("");
        }
      });
    if (environment && listeners.size === 1 && mode === "anonymous") {
      confirmed = new Set(environment.readLocal());
      publish("");
    }
    void initialize();
    return () => {
      listeners.delete(listener);
      if (!listeners.size) {
        unsubscribeLocal?.();
        unsubscribeLocal = null;
      }
    };
  }

  function toggleFavorite(id: string) {
    if (!id) return;
    // Respect the state shown to the user, including a click before GET finishes.
    desired.set(id, !snapshot.favorites.includes(id));
    publish("");
    if (mode === "authenticated") void save(id);
    else if (mode === "anonymous") saveLocal();
    else void initialize();
  }

  return { subscribe, getSnapshot: () => snapshot, initialize, toggleFavorite };
}

function browserEnvironment(): FavoritesEnvironment | null {
  if (typeof window === "undefined") return null;
  return {
    fetch: (url, init) => fetch(url, init),
    readLocal: () => {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(value)
          ? [
              ...new Set(
                value.filter((id): id is string => typeof id === "string"),
              ),
            ]
          : [];
      } catch {
        return [];
      }
    },
    writeLocal: (favorites) =>
      localStorage.setItem(KEY, JSON.stringify(favorites)),
    subscribeLocal: (listener) => {
      const storage = (event: StorageEvent) => {
        if (event.key === KEY || event.key === null) listener();
      };
      window.addEventListener("storage", storage);
      return () => window.removeEventListener("storage", storage);
    },
  };
}

const store = createFavoritesStore(browserEnvironment);
export function useFavorites() {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => EMPTY,
  );
  return { ...snapshot, toggleFavorite: store.toggleFavorite };
}
