import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PlayerProfile } from '../types/progress.js';
import type { ContentPack } from '../types/content.js';
import { getDB } from '../db/schema.js';
import { seedDefaultPack } from '../db/packs.js';

interface ProfileContextValue {
  profile: PlayerProfile | null;
  activePack: ContentPack | null;
  loading: boolean;
  createProfile: (name: string, avatarEmoji: string) => Promise<PlayerProfile>;
  updateProfile: (updates: Partial<PlayerProfile>) => Promise<void>;
  refreshPack: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [activePack, setActivePack] = useState<ContentPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const db = await getDB();
      await seedDefaultPack();

      const profiles = await db.getAll('profiles');
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        if (p.activePackId) {
          const pack = await db.get('packs', p.activePackId);
          if (pack) setActivePack(pack);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const createProfile = useCallback(async (name: string, avatarEmoji: string) => {
    const db = await getDB();
    const packs = await db.getAll('packs');
    const defaultPackId = packs[0]?.id ?? '';

    const newProfile: PlayerProfile = {
      id: crypto.randomUUID(),
      name,
      avatarEmoji,
      activePackId: defaultPackId,
      currentDifficulty: 1,
      placementComplete: false,
      placementBand: 1,
      totalStars: 0,
      createdAt: Date.now(),
    };

    await db.put('profiles', newProfile);
    setProfile(newProfile);

    if (defaultPackId) {
      const pack = await db.get('packs', defaultPackId);
      if (pack) setActivePack(pack);
    }

    return newProfile;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<PlayerProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    const db = await getDB();
    await db.put('profiles', updated);
    setProfile(updated);

    if (updates.activePackId && updates.activePackId !== profile.activePackId) {
      const pack = await db.get('packs', updates.activePackId);
      if (pack) setActivePack(pack);
    }
  }, [profile]);

  const refreshPack = useCallback(async () => {
    if (!profile?.activePackId) return;
    const db = await getDB();
    const pack = await db.get('packs', profile.activePackId);
    if (pack) setActivePack(pack);
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ profile, activePack, loading, createProfile, updateProfile, refreshPack }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
