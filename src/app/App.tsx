import { useState, useEffect, createContext, useCallback } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Login } from "./components/Login";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installGlobalErrorListeners } from "./lib/error-handler";
import { supabase, ghostSignIn, isGhostMode } from "./lib/supabaseClient";
import { useYYC3Head } from "./hooks/useYYC3Head";
import { useI18nProvider, I18nContext } from "./hooks/useI18n";
import type { AuthContextValue, UserRole, AppSession } from "./types";

/** 认证上下文 - 提供登出功能和当前用户信息 */
export const AuthContext = createContext<AuthContextValue>({
  logout: () => {},
  userEmail: "",
  userRole: "",
  isGhost: false,
});

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole | "">("");
  const [isGhost, setIsGhost] = useState(false);

  // 国际化
  const i18nValue = useI18nProvider();

  // 注入 YYC3 品牌 <head> 标签 (favicon / manifest / theme-color / title)
  useYYC3Head();

  // 安装全局错误监听器（仅一次）
  useEffect(() => {
    installGlobalErrorListeners();
  }, []);

  useEffect(() => {
    // 检查现有会话
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      if (data.session) {
        const session = data.session as AppSession;
        setUserEmail(session.user?.email ?? "admin@cloudpivot.local");
        setUserRole(session.user?.role ?? "admin");
        setIsGhost(isGhostMode());
      }
    });
  }, []);

  const handleLoginSuccess = useCallback(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session as AppSession | null;
      setUserEmail(session?.user?.email ?? "admin@cloudpivot.local");
      setUserRole(session?.user?.role ?? "admin");
      setIsGhost(isGhostMode());
    });
    setAuthenticated(true);
  }, []);

  /** 幽灵登录 · 跳过认证直接进入 */
  const handleGhostLogin = useCallback(() => {
    const session = ghostSignIn();
    setUserEmail(session.user.email);
    setUserRole(session.user.role as UserRole);
    setIsGhost(true);
    setAuthenticated(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setUserEmail("");
    setUserRole("");
    setIsGhost(false);
  }, []);

  // 初始化检查中 - 显示加载
  if (authenticated === null) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #060e1f 0%, #0a1628 30%, #081430 60%, #040c1a 100%)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[rgba(0,212,255,0.2)] border-t-[#00d4ff] rounded-full animate-spin" />
          <span className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.75rem" }}>
            正在初始化...
          </span>
        </div>
      </div>
    );
  }

  // 未登录 - 显示登录页
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} onGhostLogin={handleGhostLogin} />;
  }

  // 已登录 - 显示主应用
  return (
    <ErrorBoundary level="page" source="App">
      <AuthContext.Provider value={{ logout: handleLogout, userEmail, userRole, isGhost }}>
        <I18nContext.Provider value={i18nValue}>
          <RouterProvider router={router} />
        </I18nContext.Provider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}
