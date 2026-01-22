import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Always-current token for interceptors
  const tokenRef = useRef(null);

  // prevent refresh during initial bootstrap
  const bootstrappingRef = useRef(true);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  /* =========================
      INITIAL AUTH BOOTSTRAP
     - NEVER logs out on abort
     - NEVER blocks UI forever
  ========================= */
  useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("Auth init timeout, forcing UI");
        setLoading(false);
      }
    }, 4000);

    async function init() {
      try {
        const r = await api.post("/auth/refresh");

        if (!mounted) return;

        const token = r.data.accessToken;
        setAccessToken(token);
        tokenRef.current = token;

        const me = await api.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (mounted) {
          setUser(me.data);
        }
      } catch (err) {
        
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError"
        ) {
          return;
        }

        if (mounted) {
          setUser(null);
          setAccessToken(null);
          tokenRef.current = null;
        }
      } finally {
        bootstrappingRef.current = false;
        clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  /* =========================
      AXIOS INTERCEPTORS
     - NO QUEUES
     - NO GLOBAL LOCKS
     - FAIL FAST
  ========================= */
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use((config) => {
      if (tokenRef.current) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });

    const resInterceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;

        // Never intercept auth routes
        if (original?.url?.includes("/auth/")) {
          return Promise.reject(error);
        }

        //  handle 401
        if (error.response?.status !== 401) {
          return Promise.reject(error);
        }

        // Never retry twice
        if (original._retry) {
          return Promise.reject(error);
        }

        // Never refresh during bootstrap
        if (bootstrappingRef.current) {
          return Promise.reject(error);
        }

        original._retry = true;

        try {
          const r = await api.post("/auth/refresh");
          const newToken = r.data.accessToken;

          setAccessToken(newToken);
          tokenRef.current = newToken;

          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch (refreshErr) {
          // FAIL FAST — DO NOT BLOCK OTHER REQUESTS
          setUser(null);
          setAccessToken(null);
          tokenRef.current = null;
          return Promise.reject(refreshErr);
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
    const r = await api.post("/auth/login", { email, password });
    const token = r.data.accessToken;

    setAccessToken(token);
    tokenRef.current = token;

    const me = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUser(me.data);
  };

  const signup = async (username, email, password) => {
    const r = await api.post("/auth/signup", {
      username,
      email,
      password,
    });
    const token = r.data.accessToken;

    setAccessToken(token);
    tokenRef.current = token;

    const me = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setUser(me.data);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      tokenRef.current = null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
