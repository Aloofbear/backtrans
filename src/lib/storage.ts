export interface LearningProfile {
  id: string;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
}

const PROFILE_STORAGE_KEY = 'learningProfiles';
const CURRENT_PROFILE_KEY = 'currentProfileId';
const memoryStorage = new Map<string, string>();
const STORAGE_WRITE_EVENT = 'backtrans-storage-write';

function notifyStorageWrite(key: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_WRITE_EVENT, { detail: { key } }));
}

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    const testKey = '__backtrans_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export function isPersistentStorageAvailable() {
  return Boolean(getBrowserStorage());
}

export function readRawStorageItem(key: string) {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  }
  return memoryStorage.get(key) ?? null;
}

export function listRawStorageKeys() {
  const keys = new Set<string>(memoryStorage.keys());
  const storage = getBrowserStorage();
  if (storage) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key) keys.add(key);
      }
    } catch {
      // Keep key discovery best-effort.
    }
  }
  return Array.from(keys);
}

export function writeRawStorageItem(key: string, value: string) {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      notifyStorageWrite(key);
      return;
    } catch {
      // Fall through to session-only memory storage.
    }
  }
  memoryStorage.set(key, value);
  notifyStorageWrite(key);
}

export function removeRawStorageItem(key: string) {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Keep cleanup best-effort.
    }
  }
  memoryStorage.delete(key);
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  return safeJsonParse(readRawStorageItem(key), fallback);
}

export function writeJson<T>(key: string, value: T) {
  writeRawStorageItem(key, JSON.stringify(value));
}

export function normalizeProfileId(name: string) {
  const normalized = name
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `profile-${Date.now()}`;
}

export function getProfiles(): LearningProfile[] {
  return readJson<LearningProfile[]>(PROFILE_STORAGE_KEY, []);
}

export function saveProfiles(profiles: LearningProfile[]) {
  writeJson(PROFILE_STORAGE_KEY, profiles);
}

export function getCurrentProfileId() {
  return readRawStorageItem(CURRENT_PROFILE_KEY);
}

export function setCurrentProfileId(profileId: string | null) {
  if (profileId) {
    writeRawStorageItem(CURRENT_PROFILE_KEY, profileId);
    writeRawStorageItem('currentUser', profileId);
  } else {
    removeRawStorageItem(CURRENT_PROFILE_KEY);
    removeRawStorageItem('currentUser');
  }
}

export function upsertProfile(displayName: string): LearningProfile {
  const now = new Date().toISOString();
  const id = normalizeProfileId(displayName);
  const profiles = getProfiles();
  const existing = profiles.find(profile => profile.id === id);

  if (existing) {
    existing.displayName = displayName.trim();
    existing.lastActiveAt = now;
    saveProfiles(profiles);
    return existing;
  }

  const profile = {
    id,
    displayName: displayName.trim(),
    createdAt: now,
    lastActiveAt: now,
  };

  saveProfiles([...profiles, profile]);
  return profile;
}

export function touchProfile(profileId: string) {
  const profiles = getProfiles();
  const profile = profiles.find(item => item.id === profileId);
  if (!profile) return;
  profile.lastActiveAt = new Date().toISOString();
  saveProfiles(profiles);
}

export function getScopedStorageKey(base: string, profileId: string | null | undefined) {
  return profileId ? `${base}_${profileId}` : `${base}_guest`;
}

export function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFutureDateString(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return getTodayDateString(date);
}

export function migrateLegacyDataForProfile(profileId: string) {
  const migrateArray = (legacyKey: string, scopedKey: string, filterFn?: (item: any) => boolean) => {
    const legacyData = readJson<any[]>(legacyKey, []);
    if (legacyData.length === 0) return;

    const dataForProfile = filterFn ? legacyData.filter(filterFn) : legacyData;
    if (dataForProfile.length === 0) return;

    const existingData = readJson<any[]>(scopedKey, []);
    const merged = [...dataForProfile, ...existingData];
    const unique = Array.from(new Map(merged.map(item => [item.id ?? JSON.stringify(item), item])).values());
    writeJson(scopedKey, unique);

    if (filterFn) {
      writeJson(legacyKey, legacyData.filter(item => !filterFn(item)));
    }
  };

  migrateArray('practiceHistory', getScopedStorageKey('practiceHistory', profileId), item => item.userId === profileId);

  const completedKey = getScopedStorageKey('completedCorpusIds', profileId);
  if (!readRawStorageItem(completedKey)) {
    const legacyCompleted = readRawStorageItem('completedCorpusIds');
    if (legacyCompleted) writeRawStorageItem(completedKey, legacyCompleted);
  }

  const errorBookKey = getScopedStorageKey('errorBook', profileId);
  if (!readRawStorageItem(errorBookKey)) {
    const legacyErrorBook = readRawStorageItem('errorBook');
    if (legacyErrorBook) writeRawStorageItem(errorBookKey, legacyErrorBook);
  }

  const legacyUsers = readJson<any[]>('users', []);
  if (legacyUsers.length > 0) {
    legacyUsers.forEach(user => {
      if (user?.username) upsertProfile(user.username);
    });
    removeRawStorageItem('users');
  }
}
