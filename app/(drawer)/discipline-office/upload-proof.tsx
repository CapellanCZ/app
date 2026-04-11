import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FileUploadDropzoneCard } from '@/components/FileUploadDropzoneCard';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UploadedFileListRow } from '@/components/UploadedFileListRow';

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
  const { sanctionId } = useLocalSearchParams<{ sanctionId?: string }>();
  const tickers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

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
  }, [clearTicker]);

  const removeFile = useCallback(
    (id: string) => {
      clearTicker(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [clearTicker],
  );

  const onSubmit = useCallback(() => {
    Alert.alert(
      'Proof submitted',
      sanctionId
        ? `We recorded your upload for sanction “${sanctionId}”. Connect this to your API when ready.`
        : 'Connect this action to your compliance API when ready.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }, [router, sanctionId]);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar title="Upload Proof" showMenu={false} />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-4 pt-4">
        <FileUploadDropzoneCard onPickFiles={pickFiles} />

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
                onRemove={() => removeFile(f.id)}
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
          accessibilityLabel="Submit proof of compliance"
          onPress={onSubmit}
          className="w-full items-center justify-center rounded-full py-3 active:opacity-90"
          style={{
            backgroundColor: '#2970FF',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
          }}>
          <Text className="text-sm font-semibold text-white">Submit Proof of Compliance</Text>
        </Pressable>
      </View>
    </View>
  );
}
