import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getCurrentProfileId,
  getProfiles,
  LearningProfile,
  migrateLegacyDataForProfile,
  setCurrentProfileId,
  touchProfile,
  upsertProfile,
} from '../lib/storage';

interface AuthContextType {
  user: string | null;
  displayName: string | null;
  profiles: LearningProfile[];
  login: (profileId: string) => void;
  createProfile: (displayName: string) => LearningProfile;
  logout: () => void;
  refreshProfiles: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<LearningProfile[]>([]);
  const [user, setUser] = useState<string | null>(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(getProfiles());
  }, []);

  useEffect(() => {
    const legacyCurrentUser = localStorage.getItem('currentUser');
    if (legacyCurrentUser) {
      const legacyProfile = upsertProfile(legacyCurrentUser);
      setCurrentProfileId(legacyProfile.id);
      migrateLegacyDataForProfile(legacyProfile.id);
    }

    const currentProfileId = getCurrentProfileId();
    setProfiles(getProfiles());
    setUser(currentProfileId);
  }, []);

  const login = useCallback((profileId: string) => {
    migrateLegacyDataForProfile(profileId);
    touchProfile(profileId);
    setCurrentProfileId(profileId);
    setUser(profileId);
    refreshProfiles();
  }, [refreshProfiles]);

  const createProfile = useCallback((displayName: string) => {
    const profile = upsertProfile(displayName);
    login(profile.id);
    return profile;
  }, [login]);

  const logout = useCallback(() => {
    setCurrentProfileId(null);
    setUser(null);
  }, []);

  const currentProfile = profiles.find(profile => profile.id === user);

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName: currentProfile?.displayName ?? null,
        profiles,
        login,
        createProfile,
        logout,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
