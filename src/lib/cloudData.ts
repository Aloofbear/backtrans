import { fetchCloudLearningData, saveCloudLearningData } from './authClient';
import { getScopedStorageKey, listRawStorageKeys, readJson, writeJson } from './storage';

type LearningPayload = {
  practiceHistory?: any[];
  completedCorpusIds?: string[];
  errorBook?: any[];
  favoriteExpressions?: any[];
  sentenceCounts?: Record<string, number>;
  drafts?: Record<string, any>;
};

const ARRAY_KEYS = ['practiceHistory', 'errorBook', 'favoriteExpressions'] as const;

function uniqueArray(items: any[]) {
  const map = new Map<string, any>();
  items.forEach(item => {
    const key = item?.id || item?.expression || JSON.stringify(item);
    map.set(String(key), item);
  });
  return Array.from(map.values());
}

function mergeCounts(local: Record<string, number> = {}, remote: Record<string, number> = {}) {
  const result: Record<string, number> = { ...remote };
  Object.entries(local).forEach(([key, value]) => {
    result[key] = Math.max(Number(result[key] || 0), Number(value || 0));
  });
  return result;
}

function mergeDrafts(local: Record<string, any> = {}, remote: Record<string, any> = {}) {
  const result: Record<string, any> = { ...remote };
  Object.entries(local).forEach(([key, value]) => {
    const remoteUpdatedAt = new Date(result[key]?.updatedAt || 0).getTime();
    const localUpdatedAt = new Date(value?.updatedAt || 0).getTime();
    if (!result[key] || localUpdatedAt >= remoteUpdatedAt) {
      result[key] = value;
    }
  });
  return result;
}

export function collectLocalLearningData(userId: string): LearningPayload {
  const payload: LearningPayload = {
    practiceHistory: readJson<any[]>(getScopedStorageKey('practiceHistory', userId), []),
    completedCorpusIds: readJson<string[]>(getScopedStorageKey('completedCorpusIds', userId), []),
    errorBook: readJson<any[]>(getScopedStorageKey('errorBook', userId), []),
    favoriteExpressions: readJson<any[]>(getScopedStorageKey('favoriteExpressions', userId), []),
    sentenceCounts: readJson<Record<string, number>>(getScopedStorageKey('sentenceCounts', userId), {}),
    drafts: {},
  };

  const suffix = `_${userId}`;
  listRawStorageKeys()
    .filter(key => key.startsWith('translationDraft_') && key.endsWith(suffix))
    .forEach(key => {
      const draftBase = key.slice(0, -suffix.length);
      payload.drafts![draftBase] = readJson<any>(key, null);
    });

  return payload;
}

export function applyCloudLearningData(userId: string, payload: LearningPayload) {
  writeJson(getScopedStorageKey('practiceHistory', userId), payload.practiceHistory || []);
  writeJson(getScopedStorageKey('completedCorpusIds', userId), payload.completedCorpusIds || []);
  writeJson(getScopedStorageKey('errorBook', userId), payload.errorBook || []);
  writeJson(getScopedStorageKey('favoriteExpressions', userId), payload.favoriteExpressions || []);
  writeJson(getScopedStorageKey('sentenceCounts', userId), payload.sentenceCounts || {});

  Object.entries(payload.drafts || {}).forEach(([draftBase, value]) => {
    writeJson(getScopedStorageKey(draftBase, userId), value);
  });
}

export function mergeLearningPayload(local: LearningPayload, remote: LearningPayload): LearningPayload {
  const result: LearningPayload = {};

  ARRAY_KEYS.forEach(key => {
    result[key] = uniqueArray([...(local[key] || []), ...(remote[key] || [])]);
  });

  result.completedCorpusIds = Array.from(new Set([...(remote.completedCorpusIds || []), ...(local.completedCorpusIds || [])]));
  result.sentenceCounts = mergeCounts(local.sentenceCounts, remote.sentenceCounts);
  result.drafts = mergeDrafts(local.drafts, remote.drafts);

  return result;
}

export async function syncCurrentProfileToCloud(userId: string, localSeed?: LearningPayload) {
  const local = localSeed
    ? mergeLearningPayload(localSeed, collectLocalLearningData(userId))
    : collectLocalLearningData(userId);
  const remote = await fetchCloudLearningData().catch(() => ({ payload: {}, updatedAt: null }));
  const merged = mergeLearningPayload(local, remote.payload as LearningPayload);
  applyCloudLearningData(userId, merged);
  await saveCloudLearningData(merged as Record<string, unknown>);
  return merged;
}

export async function pushCurrentProfileToCloud(userId: string) {
  const payload = collectLocalLearningData(userId);
  await saveCloudLearningData(payload as Record<string, unknown>);
  return payload;
}
