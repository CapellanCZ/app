import { create } from 'zustand';

import { resolveAvatarDisplayUrl } from './avatarUtils';
import { fetchStudentProfile, type StudentProfile } from './profileApi';

export type FetchProfileOptions = {
  email?: string;
  userMetadata?: Record<string, unknown>;
};

export function studentProfileFromMetadata(
  userId: string,
  email: string | undefined,
  metadata: Record<string, unknown> | undefined,
): StudentProfile | null {
  if (!metadata) return null;
  return {
    id: userId,
    email: email ?? String(metadata.email ?? ''),
    first_name: String(metadata.first_name ?? ''),
    last_name: String(metadata.last_name ?? ''),
    program: String(metadata.program ?? ''),
    student_id: String(metadata.student_id ?? ''),
    avatar_url: (metadata.avatar_url as string | null) ?? null,
  };
}

type ProfileState = {
  profile: StudentProfile | null;
  isLoading: boolean;
  fetchProfile: (userId: string, options?: FetchProfileOptions) => Promise<StudentProfile | null>;
  setAvatarUrl: (avatarUrl: string | null) => void;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async (userId, options) => {
    const existing = get().profile;
    if (existing?.id === userId) {
      console.log('[profileStore] profile already prefetched');
      return {
        ...existing,
        avatar_url: resolveAvatarDisplayUrl(existing.avatar_url),
      };
    }

    set({ isLoading: true });
    let profile = await fetchStudentProfile(userId);
    if (!profile) {
      profile = studentProfileFromMetadata(userId, options?.email, options?.userMetadata);
    } else if (profile.avatar_url) {
      profile = {
        ...profile,
        avatar_url: resolveAvatarDisplayUrl(profile.avatar_url),
      };
    }
    set({ profile, isLoading: false });
    return profile;
  },

  setAvatarUrl: (avatarUrl) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, avatar_url: resolveAvatarDisplayUrl(avatarUrl, true) }
        : state.profile,
    })),

  reset: () => set({ profile: null, isLoading: false }),
}));

export function getProfileAvatarUrl(profile: StudentProfile | null): string | null {
  return profile?.avatar_url ?? null;
}
