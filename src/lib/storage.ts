export interface LearningProfile {
  id: string;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
}

const PROFILE_STORAGE_KEY = 'learningProfiles';
const CURRENT_PROFILE_KEY = 'currentProfileId';

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  return safeJsonParse(localStorage.getItem(key), fallback);
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
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
  return localStorage.getItem(CURRENT_PROFILE_KEY);
}

export function setCurrentProfileId(profileId: string | null) {
  if (profileId) {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
    localStorage.setItem('currentUser', profileId);
  } else {
    localStorage.removeItem(CURRENT_PROFILE_KEY);
    localStorage.removeItem('currentUser');
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
  if (!localStorage.getItem(completedKey)) {
    const legacyCompleted = localStorage.getItem('completedCorpusIds');
    if (legacyCompleted) localStorage.setItem(completedKey, legacyCompleted);
  }

  const errorBookKey = getScopedStorageKey('errorBook', profileId);
  if (!localStorage.getItem(errorBookKey)) {
    const legacyErrorBook = localStorage.getItem('errorBook');
    if (legacyErrorBook) localStorage.setItem(errorBookKey, legacyErrorBook);
  }

  const legacyUsers = readJson<any[]>('users', []);
  if (legacyUsers.length > 0) {
    legacyUsers.forEach(user => {
      if (user?.username) upsertProfile(user.username);
    });
    localStorage.removeItem('users');
  }
}
