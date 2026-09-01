import { useCallback, useEffect, useRef, useState } from 'react';

import type { AvatarUploadStatus } from '@/components/profile/PersonalInfoPhotoSection';
import { pickAvatarImage, uploadAvatarImage } from '@/lib/profile/profileApi';
import { showAppToast } from '@/lib/ui/toastBridge';

const SAVED_RESET_MS = 2600;

type UseAvatarUploadOptions = {
  userId: string | undefined;
  getCurrentAvatarUrl: () => string | null;
  onSuccess: (url: string | null) => void;
  onSynced?: () => void;
};

export function useAvatarUpload({
  userId,
  getCurrentAvatarUrl,
  onSuccess,
  onSynced,
}: UseAvatarUploadOptions) {
  const [uploadStatus, setUploadStatus] = useState<AvatarUploadStatus>('idle');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  const pickAndSave = useCallback(async () => {
    if (!userId || isActiveRef.current) return;

    isActiveRef.current = true;
    clearResetTimer();

    const picked = await pickAvatarImage();

    if (picked.outcome === 'cancelled') {
      isActiveRef.current = false;
      return;
    }

    if (picked.outcome === 'permission_denied') {
      isActiveRef.current = false;
      showAppToast({
        variant: 'warning',
        placement: 'top',
        label: 'Photo access needed',
        description: 'Allow photo library access in Settings to update your profile picture.',
      });
      return;
    }

    const previousAvatarUrl = getCurrentAvatarUrl();
    setUploadStatus('loading');
    onSuccess(picked.previewUri);

    const result = await uploadAvatarImage(userId, picked);
    isActiveRef.current = false;

    if (result.outcome === 'failed') {
      onSuccess(previousAvatarUrl);
      setUploadStatus('idle');
      showAppToast({
        variant: 'danger',
        placement: 'top',
        label: 'Could not save photo',
        description: result.message,
      });
      return;
    }

    onSuccess(result.url);
    onSynced?.();
    setUploadStatus('saved');

    resetTimerRef.current = setTimeout(() => {
      setUploadStatus('idle');
      resetTimerRef.current = null;
    }, SAVED_RESET_MS);
  }, [clearResetTimer, getCurrentAvatarUrl, onSuccess, onSynced, userId]);

  return { uploadStatus, pickAndSave, isBusy: uploadStatus !== 'idle' };
}
