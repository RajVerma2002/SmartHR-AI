import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("smarthr_user");
    const token = localStorage.getItem("smarthr_token");
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const persist = (user, token) => {
    localStorage.setItem("smarthr_user", JSON.stringify(user));
    localStorage.setItem("smarthr_token", token);
    setUser(user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.user, data.token);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persist(data.user, data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("smarthr_user");
    localStorage.removeItem("smarthr_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
