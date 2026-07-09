import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = sessionStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem("accessToken") || null;
  });

  const [loading, setLoading] = useState(!sessionStorage.getItem("accessToken"));

  const tokenRef = useRef(accessToken);
  const bootstrappingRef = useRef(true);

  const updateAuth = (token, userData) => {
    setAccessToken(token);
    tokenRef.current = token;
    setUser(userData);

    if (token && userData) {
      sessionStorage.setItem("accessToken", token);
      sessionStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");
    }
  };

  /* =========================
     INITIAL AUTH BOOTSTRAP
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
        
        const me = await api.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (mounted) {
          updateAuth(token, me.data);
        }
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return;
        }
        
        if (mounted) {
          updateAuth(null, null);
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

        if (original?.url?.includes("/auth/")) {
          return Promise.reject(error);
        }

        if (error.response?.status !== 401) {
          return Promise.reject(error);
        }

        if (original._retry) {
          return Promise.reject(error);
        }

        if (bootstrappingRef.current) {
          return Promise.reject(error);
        }

        original._retry = true;

        try {
          const r = await api.post("/auth/refresh");
          const newToken = r.data.accessToken;

          setAccessToken(newToken);
          tokenRef.current = newToken;
          sessionStorage.setItem("accessToken", newToken);

          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch (refreshErr) {
          updateAuth(null, null);
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

    const me = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    updateAuth(token, me.data);
  };

  const signup = async (username, email, password) => {
    await api.post("/auth/signup", {
      username,
      email,
      password,
    });
  };

  const verifyAccount = async (tokenString) => {
    const r = await api.post("/auth/verify-user", { token: tokenString });
    const token = r.data.accessToken;

    const me = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    updateAuth(token, me.data);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      updateAuth(null, null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, verifyAccount, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);