import { getDB } from './schema.js';

export async function getUnsyncedAttempts(limit: number = 50) {
  const db = await getDB();
  const all = await db.getAllFromIndex('attempts', 'by-synced', 0);
  return all.slice(0, limit);
}

export async function markAttemptsSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('attempts', 'readwrite');
  for (const id of ids) {
    const attempt = await tx.store.get(id);
    if (attempt) {
      attempt.synced = true;
      await tx.store.put(attempt);
    }
  }
  await tx.done;
}

export async function purgeOldSyncedAudioBlobs(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('attempts');
  let purged = 0;

  const tx = db.transaction('attempts', 'readwrite');
  for (const attempt of all) {
    if (attempt.synced && attempt.audioBlob) {
      attempt.audioBlob = undefined;
      await tx.store.put(attempt);
      purged++;
    }
  }
  await tx.done;
  return purged;
}

export async function checkStorageQuota(): Promise<{ used: number; quota: number; percentUsed: number }> {
  if (!navigator.storage?.estimate) {
    return { used: 0, quota: 0, percentUsed: 0 };
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return {
    used: usage,
    quota,
    percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
  };
}
