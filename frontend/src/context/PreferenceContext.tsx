import React, { createContext, useContext, useState } from "react";
import type { UserPreference, PreferenceContextType } from "../types";
import { useAuth } from "./AuthContext";

const PreferenceContext = createContext<PreferenceContextType | undefined>(
  undefined
);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const defaultPreferences: UserPreference = {
  language: [],
  topic: [],
  experience: "",
  hasContributed: false,
};

export const PreferenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreference>(
    user?.preference || defaultPreferences
  );
  const [loading, setLoading] = useState(false);

  const updatePreferences = (prefs: Partial<UserPreference>) => {
    setPreferences((prev) => ({
      ...prev,
      ...prefs,
    }));
  };

  const savePreferences = async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/preference/${user.githubId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error saving preferences:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PreferenceContext.Provider
      value={{ preferences, updatePreferences, savePreferences, loading }}
    >
      {children}
    </PreferenceContext.Provider>
  );
};

export const usePreference = (): PreferenceContextType => {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error("usePreference must be used within PreferenceProvider");
  }
  return context;
};
