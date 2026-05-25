import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentProfileId,
  getProfiles,
  LearningProfile,
  migrateLegacyDataForProfile,
  readRawStorageItem,
  setCurrentProfileId,
  touchProfile,
  upsertProfile,
} from '../lib/storage';
import {
  CloudUser,
  fetchCurrentCloudUser,
  loginCloudAccount,
  logoutCloudAccount,
  registerCloudAccount,
} from '../lib/authClient';
import { collectLocalLearningData, pushCurrentProfileToCloud, syncCurrentProfileToCloud } from '../lib/cloudData';

type AuthMode = 'guest' | 'local' | 'cloud';
type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface AuthContextType {
  user: string | null;
  displayName: string | null;
  username: string | null;
  role: 'admin' | 'user' | null;
  authMode: AuthMode;
  profiles: LearningProfile[];
  syncState: SyncState;
  syncError: string;
  login: (profileId: string) => void;
  createProfile: (displayName: string) => LearningProfile;
  loginAccount: (input: { username: string; password: string }) => Promise<CloudUser>;
  registerAccount: (input: { username: string; password: string; displayName: string }) => Promise<CloudUser>;
  syncCloudData: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfiles: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<LearningProfile[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState('');

  const refreshProfiles = useCallback(() => {
    setProfiles(getProfiles());
  }, []);

  const activateCloudUser = useCallback(async (nextUser: CloudUser, sourceProfileId?: string | null) => {
    setCloudUser(nextUser);
    setCurrentProfileId(nextUser.id);
    setUser(nextUser.id);
    setSyncState('syncing');
    setSyncError('');

    try {
      const localSeed = sourceProfileId && sourceProfileId !== nextUser.id
        ? collectLocalLearningData(sourceProfileId)
        : undefined;
      await syncCurrentProfileToCloud(nextUser.id, localSeed);
      setSyncState('synced');
    } catch (error: any) {
      setSyncState('error');
      setSyncError(error?.message || '云端同步失败');
    }
  }, []);

  useEffect(() => {
    const savedProfileId = getCurrentProfileId();
    const legacyCurrentUser = savedProfileId ? null : readRawStorageItem('currentUser');
    if (legacyCurrentUser) {
      const legacyProfile = upsertProfile(legacyCurrentUser);
      setCurrentProfileId(legacyProfile.id);
      migrateLegacyDataForProfile(legacyProfile.id);
    }

    const currentProfileId = getCurrentProfileId();
    setProfiles(getProfiles());
    setUser(currentProfileId);

    fetchCurrentCloudUser()
      .then(response => {
        if (response.authenticated && response.user) {
          activateCloudUser(response.user, currentProfileId);
        }
      })
      .catch(() => undefined);
  }, [activateCloudUser]);

  useEffect(() => {
    if (!cloudUser) return undefined;

    let timer: number | undefined;
    const handleStorageWrite = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key || '';
      if (!key.endsWith(`_${cloudUser.id}`)) return;

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setSyncState('syncing');
        setSyncError('');
        pushCurrentProfileToCloud(cloudUser.id)
          .then(() => setSyncState('synced'))
          .catch((error: any) => {
            setSyncState('error');
            setSyncError(error?.message || '云端同步失败');
          });
      }, 1500);
    };

    window.addEventListener('backtrans-storage-write', handleStorageWrite);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('backtrans-storage-write', handleStorageWrite);
    };
  }, [cloudUser]);

  const login = useCallback((profileId: string) => {
    if (cloudUser) {
      logoutCloudAccount().catch(() => undefined);
      setCloudUser(null);
    }
    migrateLegacyDataForProfile(profileId);
    touchProfile(profileId);
    setCurrentProfileId(profileId);
    setUser(profileId);
    setSyncState('idle');
    setSyncError('');
    refreshProfiles();
  }, [cloudUser, refreshProfiles]);

  const createProfile = useCallback((displayName: string) => {
    const profile = upsertProfile(displayName);
    login(profile.id);
    return profile;
  }, [login]);

  const loginAccount = useCallback(async (input: { username: string; password: string }) => {
    const response = await loginCloudAccount(input);
    if (!response.authenticated || !response.user) throw new Error('登录失败，请重试。');
    await activateCloudUser(response.user, user);
    return response.user;
  }, [activateCloudUser, user]);

  const registerAccount = useCallback(async (input: { username: string; password: string; displayName: string }) => {
    const response = await registerCloudAccount(input);
    if (!response.authenticated || !response.user) throw new Error('注册失败，请重试。');
    await activateCloudUser(response.user, user);
    return response.user;
  }, [activateCloudUser, user]);

  const syncCloudData = useCallback(async () => {
    if (!cloudUser) return;
    setSyncState('syncing');
    setSyncError('');
    try {
      await syncCurrentProfileToCloud(cloudUser.id);
      setSyncState('synced');
    } catch (error: any) {
      setSyncState('error');
      setSyncError(error?.message || '云端同步失败');
      throw error;
    }
  }, [cloudUser]);

  const logout = useCallback(async () => {
    if (cloudUser) {
      await logoutCloudAccount().catch(() => undefined);
    }
    setCloudUser(null);
    setCurrentProfileId(null);
    setUser(null);
    setSyncState('idle');
    setSyncError('');
  }, [cloudUser]);

  const currentProfile = profiles.find(profile => profile.id === user);

  const value = useMemo<AuthContextType>(() => ({
    user,
    displayName: cloudUser?.displayName ?? currentProfile?.displayName ?? null,
    username: cloudUser?.username ?? null,
    role: cloudUser?.role ?? null,
    authMode: cloudUser ? 'cloud' : user ? 'local' : 'guest',
    profiles,
    syncState,
    syncError,
    login,
    createProfile,
    loginAccount,
    registerAccount,
    syncCloudData,
    logout,
    refreshProfiles,
  }), [
    user,
    cloudUser,
    currentProfile?.displayName,
    profiles,
    syncState,
    syncError,
    login,
    createProfile,
    loginAccount,
    registerAccount,
    syncCloudData,
    logout,
    refreshProfiles,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
