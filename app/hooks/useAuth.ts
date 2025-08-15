import { useState, useEffect } from "react";
import { getAuthState, type AuthState } from "../lib/cloudflare-auth";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log("[CLIENT] Checking auth state...");
      const state = await getAuthState();
      console.log("[CLIENT] Auth state result:", state);
      setAuthState(state);
    } catch (error) {
      console.error("[CLIENT] 認証チェックエラー:", error);
      setAuthState({
        isAuthenticated: false,
        user: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // ログアウト後の状態更新のため、フォーカス時にも再チェック
    const handleFocus = () => {
      console.log("[CLIENT] Window focused, rechecking auth state");
      checkAuth();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return {
    ...authState,
    isLoading,
    refreshAuth: checkAuth, // 手動で認証状態を更新する関数を公開
  };
}
