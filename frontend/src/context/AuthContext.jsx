import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      connectSocket();
    } catch {
      localStorage.removeItem("taskflow_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("taskflow_token")) fetchMe();
    else setLoading(false);
  }, []);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("taskflow_token", data.token);
    setUser(data.user);
    connectSocket();
    toast.success("Welcome back!");
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("taskflow_token", data.token);
    setUser(data.user);
    connectSocket();
    toast.success("Account created!");
  };

  const logout = () => {
    localStorage.removeItem("taskflow_token");
    disconnectSocket();
    setUser(null);
    toast.success("Logged out");
  };

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
