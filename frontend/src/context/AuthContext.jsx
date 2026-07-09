import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
const CACHE_KEY = "algorhythm_user_cache";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(!localStorage.getItem(CACHE_KEY));

  const tokenRef = useRef(null);
  const refreshLockRef = useRef(null);
  const sessionVersion = useRef(0);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const handleSessionUpdate = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  };

  /* =========================
     CROSS-TAB SYNCHRONIZATION
  ========================= */
  useEffect(() => {
    const syncLogout = (e) => {
      if (e.key === CACHE_KEY && !e.newValue) {
        setUser(null);
        setAccessToken(null);
        tokenRef.current = null;
        sessionVersion.current++; 
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  /* =========================
     INITIAL AUTH BOOTSTRAP
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!localStorage.getItem(CACHE_KEY)) {
        if (mounted) setLoading(false);
        return;
      }

      const currentVersion = sessionVersion.current;
      let resolveLock;
      refreshLockRef.current = new Promise((resolve) => { resolveLock = resolve; });

      try {
        const r = await api.post("/auth/refresh", {}, { timeout: 10000 });
        
        if (!mounted || currentVersion !== sessionVersion.current) return;

        const token = r.data.accessToken;
        setAccessToken(token);
        tokenRef.current = token;

        const me = await api.get("/me");

        if (mounted && currentVersion === sessionVersion.current) {
          handleSessionUpdate(me.data);
        }

      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (mounted) {
          handleSessionUpdate(null);
          setAccessToken(null);
          tokenRef.current = null;
        }
      } finally {
        resolveLock?.();
        refreshLockRef.current = null;
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => { mounted = false; };
  }, []);

  /* =========================
     AXIOS INTERCEPTORS
  ========================= */
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use(async (config) => {
      if (refreshLockRef.current && !config.url?.includes("/auth/refresh")) {
        try { await refreshLockRef.current; } catch (e) {}
      }

      if (tokenRef.current) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });

    const resInterceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;

        if (original?.url?.includes("/auth/")) return Promise.reject(error);
        if (error.response?.status !== 401) return Promise.reject(error);
        if (original._retry) return Promise.reject(error);

        original._retry = true;

        if (refreshLockRef.current) {
          try {
            await refreshLockRef.current;
            if (!tokenRef.current) return Promise.reject(error);

            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${tokenRef.current}`;
            return api(original);
          } catch (e) {
             return Promise.reject(error);
          }
        }

        const currentVersion = sessionVersion.current;
        let resolveLock;
        refreshLockRef.current = new Promise((resolve) => { resolveLock = resolve; });

        try {
          const r = await api.post("/auth/refresh", {}, { timeout: 10000 });
          
          if (currentVersion !== sessionVersion.current) {
             return Promise.reject(new Error("Session invalidated during refresh"));
          }

          const newToken = r.data.accessToken;
          setAccessToken(newToken);
          tokenRef.current = newToken;
          if (currentVersion !== sessionVersion.current) {
            return Promise.reject(new Error("Session invalidated immediately before retry"));
          }

          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          
          return api(original);
        } catch (refreshErr) {
          handleSessionUpdate(null);
          setAccessToken(null);
          tokenRef.current = null;
          return Promise.reject(refreshErr);
        } finally {
          resolveLock?.();
          refreshLockRef.current = null;
        }
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  /* =========================
     AUTH ACTIONS
  ========================= */
  const login = async (email, password) => {
    try {
      const r = await api.post("/auth/login", { email, password });
      const token = r.data.accessToken;
      setAccessToken(token);
      tokenRef.current = token;
      
      const me = await api.get("/me");
      handleSessionUpdate(me.data);
    } catch (error) {
      setAccessToken(null);
      tokenRef.current = null;
      throw error;
    }
  };

  const signup = async (username, email, password) => {
    await api.post("/auth/signup", { username, email, password });
  };

  const verifyAccount = async (tokenString) => {
    try {
      const r = await api.post("/auth/verify-user", { token: tokenString });
      const token = r.data.accessToken;
      setAccessToken(token);
      tokenRef.current = token;
      
      const me = await api.get("/me");
      handleSessionUpdate(me.data);
    } catch (error) {
       setAccessToken(null);
       tokenRef.current = null;
       throw error;
    }
  };

  const logout = async () => {
    sessionVersion.current++; 
    try {
      await api.post("/auth/logout");
    } finally {
      handleSessionUpdate(null);
      setAccessToken(null);
      tokenRef.current = null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);