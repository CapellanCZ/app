import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'heroui-native';

import { FileUploadDropzoneCard } from '@/components/FileUploadDropzoneCard';
import { IconPdfIcon } from '@/components/icons/IconPdfIcon';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UploadedFileListRow } from '@/components/UploadedFileListRow';

const TOAST_SUCCESS_ICON = '#079455';
const SUBMIT_BRAND = '#2970FF';
/** Simulated network delay before success (ms) */
const MOCK_SUBMIT_MS = 1400;

type UploadFileRow = {
  id: string;
  fileName: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [files, setFiles] = useState<UploadFileRow[]>([
    {
      id: 'demo-1',
      fileName: 'Name of document.pdf',
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

  const pickFiles = useCallback(async () => {
    if (isSubmitting) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;

    const now = new Date();
    const { dateLabel, timeLabel } = formatPickMeta(now);

    for (const asset of result.assets) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const fileName = asset.name ?? 'document';
      const sizeLabel = formatSize(asset.size);

      setFiles((prev) => [
        ...prev,
        {
          id,
          fileName,
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
  }, [clearTicker, isSubmitting]);

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
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar title="Upload Proof" showMenu={false} />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-4 pt-4">
        <FileUploadDropzoneCard
          onPickFiles={pickFiles}
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
                fileThumbnail={<IconPdfIcon size={28} />}
                onRemove={isSubmitting ? undefined : () => removeFile(f.id)}
              />
            ))}
          </View>
        </View>
        </View>
      </ScrollView>

      <View
        className="border-t border-[#F0F2F5] bg-[#FAFAFA] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isSubmitting ? 'Submitting proof to server' : 'Submit proof of compliance'
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
            <Text className="text-sm font-semibold text-white">Submit Proof of Compliance</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
