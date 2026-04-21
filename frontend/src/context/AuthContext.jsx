import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [igAccount, setIgAccount]     = useState(null);
  const [loading, setLoading]         = useState(true);

  const fetchMe = async () => {
    try {
      const res = await axios.get("/auth/me", { withCredentials: true });
      setUser(res.data.user);
      setIgAccount(res.data.instagramAccount);
    } catch {
      setUser(null);
      setIgAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const logout = async () => {
    await axios.post("/auth/logout", {}, { withCredentials: true });
    setUser(null);
    setIgAccount(null);
  };

  return (
    <AuthContext.Provider value={{ user, igAccount, setIgAccount, loading, fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
