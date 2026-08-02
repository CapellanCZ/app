import * as ImagePicker from 'expo-image-picker';
import { fetchPatientByAuthUserId } from '@/lib/patients/patientsApi';
import type { Patient } from '@/lib/patients/types';
import { supabase } from '@/lib/supabase';

import { avatarStoragePath, resolveAvatarDisplayUrl } from './avatarUtils';

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

/** Pick a photo, upload to `avatars`, and persist path on `patients.avatar_url`. */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  const filePath = avatarStoragePath(userId, normalizedExt);

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, arrayBuffer, {
    contentType: asset.mimeType ?? `image/${normalizedExt}`,
    upsert: true,
  });

  if (uploadError) {
    console.error('[profileApi] upload avatar', uploadError);
    return null;
  }

  const { error: dbError } = await supabase.rpc('set_my_patient_avatar', {
    p_avatar_url: filePath,
  });

  if (dbError) {
    console.error('[profileApi] set_my_patient_avatar', dbError);
    return null;
  }

  // Keep auth metadata in sync for session fallbacks.
  await supabase.auth.updateUser({
    data: { avatar_url: filePath },
  });

  return resolveAvatarDisplayUrl(filePath, true);
}
