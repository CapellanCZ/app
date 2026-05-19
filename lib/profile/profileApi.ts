import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

import { avatarStoragePath, resolveAvatarDisplayUrl } from './avatarUtils';

export type StudentProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  program: string;
  student_id: string;
  avatar_url: string | null;
};

function withResolvedAvatar(row: StudentProfile): StudentProfile {
  return {
    ...row,
    avatar_url: resolveAvatarDisplayUrl(row.avatar_url),
  };
}

async function persistAvatarPath(userId: string, storagePath: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('students')
    .update({ avatar_url: storagePath })
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (!error && data) return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const { data: byEmail, error: emailError } = await supabase
      .from('students')
      .update({ avatar_url: storagePath })
      .eq('email', user.email)
      .select('id')
      .maybeSingle();
    if (!emailError && byEmail) return true;
  }

  console.error('[profileApi] persistAvatarPath failed:', error);
  return false;
}

async function recoverAvatarFromStorage(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data: files, error } = await supabase.storage.from('avatars').list(userId, { limit: 5 });
  if (error || !files?.length) return null;

  const avatarFile = files.find((f) => f.name?.startsWith('avatar.'));
  if (!avatarFile?.name) return null;

  const path = `${userId}/${avatarFile.name}`;
  await persistAvatarPath(userId, path);
  return resolveAvatarDisplayUrl(path);
}

async function finalizeProfile(row: StudentProfile): Promise<StudentProfile> {
  if (row.avatar_url) return withResolvedAvatar(row);

  const recovered = await recoverAvatarFromStorage(row.id);
  if (!recovered) return row;

  return { ...row, avatar_url: recovered };
}

/** Fetch the student row for the authenticated user (by auth user id, then email fallback). */
export async function fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
  if (!supabase) return null;

  const { data: byId } = await supabase
    .from('students')
    .select('id, email, first_name, last_name, program, student_id, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (byId) return finalizeProfile(byId as StudentProfile);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: byEmail, error } = await supabase
    .from('students')
    .select('id, email, first_name, last_name, program, student_id, avatar_url')
    .eq('email', user.email)
    .maybeSingle();
  if (error) {
    console.error('[profileApi] fetchStudentProfile', error);
    return null;
  }
  return byEmail ? finalizeProfile(byEmail as StudentProfile) : null;
}

/** Pick a photo from the library and upload it to the avatars bucket. Returns the public URL. */
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

  const saved = await persistAvatarPath(userId, filePath);
  if (!saved) {
    console.error('[profileApi] avatar uploaded but students.avatar_url was not updated (check RLS)');
    return null;
  }

  return resolveAvatarDisplayUrl(filePath, true);
}
