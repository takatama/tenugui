import { useState, useEffect } from "react";
import { getAuthState, type AuthState } from "../lib/cloudflare-auth";
import { handleError } from "../lib/errorHandler";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const state = await getAuthState();
      setAuthState(state);
    } catch (error) {
      const userMessage = handleError(error, {
        operation: "認証チェック",
      });

      console.error("認証チェックエラー:", userMessage);
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
