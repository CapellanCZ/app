import { create } from 'zustand';

import type { Patient } from '@/lib/patients/types';

import { resolveAvatarDisplayUrl } from './avatarUtils';
import { fetchStudentProfile, patientToProfile, type StudentProfile } from './profileApi';

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
    full_name: String(metadata.full_name ?? ''),
    program: String(metadata.program ?? metadata.affiliation ?? ''),
    student_id: String(metadata.student_id ?? ''),
    employee_id: metadata.employee_id ? String(metadata.employee_id) : undefined,
    patient_type: metadata.patient_type ? String(metadata.patient_type) : undefined,
    avatar_url: (metadata.avatar_url as string | null) ?? null,
  };
}

type ProfileState = {
  profile: StudentProfile | null;
  isLoading: boolean;
  fetchProfile: (userId: string, options?: FetchProfileOptions) => Promise<StudentProfile | null>;
  setFromPatient: (
    patient: Patient,
    authUserId: string,
    options?: { userMetadata?: Record<string, unknown> },
  ) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  setFromPatient: (patient, authUserId, options) => {
    const base = patientToProfile(patient, authUserId);
    const existingAvatar = get().profile?.id === authUserId ? get().profile?.avatar_url : null;
    const metaAvatar =
      typeof options?.userMetadata?.avatar_url === 'string'
        ? options.userMetadata.avatar_url
        : null;
    // Prefer DB avatar, then in-memory, then auth metadata fallback.
    set({
      profile: {
        ...base,
        avatar_url: resolveAvatarDisplayUrl(
          base.avatar_url ?? existingAvatar ?? metaAvatar,
        ),
      },
      isLoading: false,
    });
  },

  fetchProfile: async (userId, options) => {
    const existing = get().profile;
    if (existing?.id === userId && (existing.full_name || existing.first_name)) {
      return {
        ...existing,
        avatar_url: resolveAvatarDisplayUrl(existing.avatar_url),
      };
    }

    set({ isLoading: true });
    let profile = await fetchStudentProfile(userId);

    if (!profile) {
      profile = studentProfileFromMetadata(userId, options?.email, options?.userMetadata);
    }

    if (profile) {
      const metaAvatar = options?.userMetadata?.avatar_url;
      if (!profile.avatar_url && typeof metaAvatar === 'string' && metaAvatar) {
        profile = {
          ...profile,
          avatar_url: resolveAvatarDisplayUrl(metaAvatar),
        };
      } else if (profile.avatar_url) {
        profile = {
          ...profile,
          avatar_url: resolveAvatarDisplayUrl(profile.avatar_url),
        };
      }
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
