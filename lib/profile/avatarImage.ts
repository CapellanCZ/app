import * as ImagePicker from 'expo-image-picker';

import { toDataUri } from './base64';

/** Aggressive JPEG quality — avatars display small; keeps uploads fast. */
export const AVATAR_PICKER_QUALITY = 0.55;

export type AvatarPickResult =
  | {
      outcome: 'success';
      sourceUri: string;
      previewUri: string;
      mimeType: string;
      /** Native-compressed JPEG from the picker — skips slow file reads when present. */
      base64: string | null;
    }
  | { outcome: 'cancelled' }
  | { outcome: 'permission_denied' };

async function ensurePhotoLibraryAccess(): Promise<boolean> {
  const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

/** Opens the gallery picker — returns compressed base64 ready for upload. */
export async function pickAvatarFromLibrary(): Promise<AvatarPickResult> {
  const hasAccess = await ensurePhotoLibraryAccess();
  if (!hasAccess) {
    return { outcome: 'permission_denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: AVATAR_PICKER_QUALITY,
    base64: true,
    exif: false,
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return { outcome: 'cancelled' };
  }

  const asset = result.assets[0];
  const mimeType = 'image/jpeg';
  const base64 = asset.base64 ?? null;
  const previewUri = base64 ? toDataUri(base64, mimeType) : asset.uri;

  return {
    outcome: 'success',
    sourceUri: asset.uri,
    previewUri,
    mimeType,
    base64,
  };
}

/** Fallback when picker omits base64 — reads local file over the network stack. */
export async function readLocalFileBytes(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Response(blob).arrayBuffer();
}
