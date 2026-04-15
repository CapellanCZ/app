import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'heroui-native';

import { DisciplineOfficeScreenShell } from '@/components/discipline-office';
import { FileUploadDropzoneCard } from '@/components/FileUploadDropzoneCard';
import { IconPdfIcon } from '@/components/icons/IconPdfIcon';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UploadedFileListRow } from '@/components/UploadedFileListRow';

const TOAST_SUCCESS_ICON = '#079455';
const SUBMIT_BRAND = '#2970FF';
/** Simulated network delay before success (ms) */
const MOCK_SUBMIT_MS = 1400;

function proofThumbnail(fileName: string, mimeType?: string | null) {
  const mime = mimeType?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) {
    return <Ionicons name="image-outline" size={28} color="#2970FF" />;
  }
  if (mime.startsWith('video/')) {
    return <Ionicons name="videocam-outline" size={28} color="#2970FF" />;
  }
  const lower = fileName.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|heic|heif|bmp|tiff?)$/i.test(lower)) {
    return <Ionicons name="image-outline" size={28} color="#2970FF" />;
  }
  if (/\.(mp4|mov|m4v|webm|mkv|avi|3gp|mpeg|mpg)$/i.test(lower)) {
    return <Ionicons name="videocam-outline" size={28} color="#2970FF" />;
  }
  return <IconPdfIcon size={28} />;
}

type UploadFileRow = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  dateLabel: string;
  timeLabel: string;
  sizeLabel: string;
  progress: number;
};

function formatPickMeta(d: Date) {
  return {
    dateLabel: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
    timeLabel: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function formatSize(bytes: number | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const tickers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  /** Synchronous guard — blocks double-taps before `isSubmitting` re-renders */
  const submitLockedRef = useRef(false);
  /** Avoids native `PickingInProgressException` when the document picker is invoked twice quickly. */
  const documentPickerBusyRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [files, setFiles] = useState<UploadFileRow[]>([
    {
      id: 'demo-1',
      fileName: 'Name of document.pdf',
      mimeType: 'application/pdf',
      dateLabel: '11 Feb, 2026',
      timeLabel: '12:24 pm',
      sizeLabel: '13 MB',
      progress: 25,
    },
  ]);

  const clearTicker = useCallback((id: string) => {
    const t = tickers.current[id];
    if (t) {
      clearInterval(t);
      delete tickers.current[id];
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(tickers.current).forEach((id) => clearTicker(id));
    };
  }, [clearTicker]);

  const addProofItemsWithProgress = useCallback(
    (items: { fileName: string; size?: number; mimeType?: string | null }[]) => {
      if (items.length === 0) return;
      const now = new Date();
      const { dateLabel, timeLabel } = formatPickMeta(now);

      for (const item of items) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const sizeLabel = formatSize(item.size);

        setFiles((prev) => [
          ...prev,
          {
            id,
            fileName: item.fileName,
            mimeType: item.mimeType ?? null,
            dateLabel,
            timeLabel,
            sizeLabel,
            progress: 0,
          },
        ]);

        tickers.current[id] = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id !== id) return f;
              const next = Math.min(100, f.progress + 8);
              if (next >= 100) clearTicker(id);
              return { ...f, progress: next };
            }),
          );
        }, 220);
      }
    },
    [clearTicker],
  );

  const pickMediaFromLibrary = useCallback(async () => {
    if (isSubmitting) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access so you can attach photos or videos. You can change this in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    addProofItemsWithProgress(
      result.assets.map((asset) => {
        const isVideo = asset.type === 'video';
        const fileName =
          (asset.fileName && asset.fileName.trim()) ||
          (isVideo ? 'Video.mp4' : 'Photo.jpg');
        return {
          fileName,
          size: asset.fileSize,
          mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
        };
      }),
    );
  }, [addProofItemsWithProgress, isSubmitting]);

  const pickFiles = useCallback(async () => {
    if (isSubmitting || documentPickerBusyRef.current) return;
    documentPickerBusyRef.current = true;
    Keyboard.dismiss();

    const openPicker = (multiple: boolean) =>
      DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple,
      });

    try {
      // Defer until the active screen has a window (avoids iOS MissingViewController / Android activity timing issues with Expo Router).
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => setTimeout(resolve, 120));
        });
      });

      let result: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
      try {
        result = await openPicker(true);
      } catch {
        result = await openPicker(false);
      }

      if (result.canceled || !result.assets?.length) return;

      addProofItemsWithProgress(
        result.assets.map((asset) => ({
          fileName: asset.name ?? 'document',
          size: asset.size,
          mimeType: asset.mimeType ?? null,
        })),
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'Unknown error';
      Alert.alert(
        'Could not open files',
        `${message}\n\nYou can use “Tap to upload” for photos and videos from your library.`,
      );
    } finally {
      documentPickerBusyRef.current = false;
    }
  }, [addProofItemsWithProgress, isSubmitting]);

  const allUploadsComplete = useMemo(
    () => files.length > 0 && files.every((f) => f.progress >= 100),
    [files],
  );

  const removeFile = useCallback(
    (id: string) => {
      if (isSubmitting) return;
      clearTicker(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [clearTicker, isSubmitting],
  );

  const onSubmit = useCallback(async () => {
    if (!allUploadsComplete || submitLockedRef.current) return;
    submitLockedRef.current = true;
    setIsSubmitting(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, MOCK_SUBMIT_MS));
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 4200,
        label: 'Proof received',
        description:
          "Your upload is with our team. Reviews usually finish in 1-3 business days. We'll notify you in the app.",
        icon: (
          <View className="shrink-0 pt-0.5">
            <Ionicons name="checkmark-circle" size={26} color={TOAST_SUCCESS_ICON} />
          </View>
        ),
      });
      router.back();
    } catch {
      submitLockedRef.current = false;
      setIsSubmitting(false);
    }
  }, [allUploadsComplete, router, toast]);

  const submitDisabled = !allUploadsComplete || isSubmitting;

  return (
    <DisciplineOfficeScreenShell>
      <ScreenNavbar title="Proof of Compliance" showMenu={false} />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-4 pt-4">
        <FileUploadDropzoneCard
          onPickMedia={pickMediaFromLibrary}
          onPickFiles={pickFiles}
          hintText="Tap above for photos & videos from your library, or Upload Files for PDFs and documents."
          className={isSubmitting ? 'opacity-50' : undefined}
        />

        <View className="mt-8 w-full gap-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold tracking-wide text-[#1F2024]">
              Uploaded Files
            </Text>
            <View
              className="min-w-[28px] items-center justify-center rounded-full px-2 py-1"
              style={{ backgroundColor: '#2970FF' }}>
              <Text className="text-xs font-semibold text-white">{files.length}</Text>
            </View>
          </View>

          <View className="gap-3">
            {files.map((f) => (
              <UploadedFileListRow
                key={f.id}
                fileName={f.fileName}
                dateLabel={f.dateLabel}
                timeLabel={f.timeLabel}
                sizeLabel={f.sizeLabel}
                progress={f.progress}
                fileThumbnail={proofThumbnail(f.fileName, f.mimeType)}
                onRemove={isSubmitting ? undefined : () => removeFile(f.id)}
              />
            ))}
          </View>
        </View>
        </View>
      </ScrollView>

      <View
        className="border-t border-[#E8EFFF] bg-white/95 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSubmitting ? 'Uploading your proof of compliance' : 'Submit proof of compliance'
          }
          accessibilityState={{ disabled: submitDisabled, busy: isSubmitting }}
          disabled={submitDisabled}
          pointerEvents={submitDisabled ? 'none' : 'auto'}
          onPress={onSubmit}
          style={({ pressed }) => ({
            opacity: submitDisabled ? 1 : pressed ? 0.9 : 1,
            backgroundColor: submitDisabled && !isSubmitting ? '#A8C4FF' : SUBMIT_BRAND,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
          })}
          className="w-full flex-row items-center justify-center gap-2 rounded-full py-3">
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-sm font-semibold text-white">Submitting...</Text>
            </>
          ) : (
            <Text className="text-sm font-semibold text-white">Submit my proof of compliance</Text>
          )}
        </Pressable>
      </View>
    </DisciplineOfficeScreenShell>
  );
}
