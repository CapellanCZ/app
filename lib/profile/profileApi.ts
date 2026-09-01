import { fetchPatientByAuthUserId } from '@/lib/patients/patientsApi';
import type { Patient } from '@/lib/patients/types';
import { supabase } from '@/lib/supabase';

import {
  pickAvatarFromLibrary,
  readLocalFileBytes,
  type AvatarPickResult,
} from './avatarImage';
import { base64ToArrayBuffer } from './base64';
import { avatarStoragePath, deleteUserAvatarsFromStorage, resolveAvatarDisplayUrl } from './avatarUtils';

export type AvatarUploadResult =
  | { outcome: 'success'; url: string }
  | { outcome: 'cancelled' }
  | { outcome: 'permission_denied' }
  | { outcome: 'failed'; message: string };

export type AvatarPersistResult =
  | { outcome: 'success'; url: string }
  | { outcome: 'failed'; message: string };

export type { AvatarPickResult };

/** UI profile shape — sourced from `patients` after login. */
export type StudentProfile = {
  /** Auth user id (used for cache matching). */
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  /** Mapped from patients.affiliation */
  program: string;
  student_id: string;
  employee_id?: string;
  patient_type?: string;
  full_name?: string;
  avatar_url: string | null;
};

export function patientToProfile(patient: Patient, authUserId: string): StudentProfile {
  const parts = patient.full_name.trim().split(/\s+/).filter(Boolean);
  const first_name = parts[0] ?? '';
  const last_name = parts.slice(1).join(' ');

  return {
    id: authUserId,
    email: patient.email ?? '',
    first_name,
    last_name,
    full_name: patient.full_name,
    program:
      patient.affiliation?.trim() ||
      (patient.patient_type === 'faculty' ? 'Faculty' : patient.patient_type === 'student' ? 'Student' : ''),
    student_id: patient.student_id ?? '',
    employee_id: patient.employee_id ?? undefined,
    patient_type: patient.patient_type,
    avatar_url: patient.avatar_url ?? null,
  };
}

/**
 * Fetch profile for the authenticated user from CampusCare `patients`
 * (linked via auth_user_id).
 */
export async function fetchStudentProfile(authUserId: string): Promise<StudentProfile | null> {
  const patient = await fetchPatientByAuthUserId(authUserId);
  if (!patient) return null;
  return patientToProfile(patient, authUserId);
}

/** Opens the photo library and returns the picked local URI. */
export async function pickAvatarImage(): Promise<AvatarPickResult> {
  return pickAvatarFromLibrary();
}

/** Upload avatar bytes and persist path for the current user. */
export async function uploadAvatarImage(
  userId: string,
  picked: Extract<AvatarPickResult, { outcome: 'success' }>,
): Promise<AvatarPersistResult> {
  if (!supabase) {
    return { outcome: 'failed', message: 'Storage is not configured.' };
  }

  const filePath = avatarStoragePath(userId, 'jpg');
  const contentType = 'image/jpeg';

  try {
    await deleteUserAvatarsFromStorage(userId);

    const arrayBuffer = picked.base64
      ? base64ToArrayBuffer(picked.base64)
      : await readLocalFileBytes(picked.sourceUri);

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, arrayBuffer, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      console.error('[profileApi] upload avatar', uploadError);
      return { outcome: 'failed', message: uploadError.message };
    }

    const { error: dbError } = await supabase.rpc('set_my_patient_avatar', {
      p_avatar_url: filePath,
    });

    if (dbError) {
      console.error('[profileApi] set_my_patient_avatar', dbError);
      return { outcome: 'failed', message: dbError.message };
    }

    void supabase.auth
      .updateUser({ data: { avatar_url: filePath } })
      .then(({ error }) => {
        if (error) {
          console.warn('[profileApi] auth avatar metadata sync', error.message);
        }
      });

    const url = resolveAvatarDisplayUrl(filePath, true);
    if (!url) {
      return { outcome: 'failed', message: 'Could not resolve photo URL.' };
    }

    return { outcome: 'success', url };
  } catch (error) {
    console.error('[profileApi] uploadAvatarImage', error);
    return {
      outcome: 'failed',
      message: error instanceof Error ? error.message : 'Upload failed.',
    };
  }
}

/** @deprecated Use pickAvatarImage + uploadAvatarImage for responsive UI. */
export async function pickAndUploadAvatar(userId: string): Promise<AvatarUploadResult> {
  const picked = await pickAvatarImage();
  if (picked.outcome === 'cancelled') return { outcome: 'cancelled' };
  if (picked.outcome === 'permission_denied') return { outcome: 'permission_denied' };
  return uploadAvatarImage(userId, picked);
}
