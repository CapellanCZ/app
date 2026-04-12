import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheet,
  Button,
  InputGroup,
  TextArea,
  TextField,
  useToast,
} from 'heroui-native';

import { FileUploadDropzoneCard } from '@/components/FileUploadDropzoneCard';
import { IconPdfIcon } from '@/components/icons/IconPdfIcon';
import { IconsaxArrowDownIcon } from '@/components/icons/IconsaxArrowDownIcon';
import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { IconsaxClockIcon } from '@/components/icons/IconsaxClockIcon';
import { IconsaxLocationIcon } from '@/components/icons/IconsaxLocationIcon';
import { IconsaxPeopleIcon } from '@/components/icons/IconsaxPeopleIcon';
import { ScreenNavbar } from '@/components/ScreenNavbar';
import { UploadedFileListRow } from '@/components/UploadedFileListRow';

const TOAST_SUCCESS_ICON = '#079455';
const SUBMIT_BRAND = '#2970FF';
const MOCK_SUBMIT_MS = 1400;
const ICON_SUFFIX = '#717680';

const INCIDENT_TYPES = [
  'Academic dishonesty',
  'Harassment or discrimination',
  'Safety concern',
  'Property damage or theft',
  'Disruptive conduct',
  'Other',
] as const;

const INCIDENT_TYPE_OTHER = 'Other';

/** PDFs, images, and videos for evidence (expo-document-picker MIME list). */
const EVIDENCE_DOCUMENT_TYPES = [
  'application/pdf',
  'image/*',
  'video/*',
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/webm',
  'video/3gpp',
] as const;

function evidenceThumbnail(fileName: string, mimeType?: string | null) {
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

function formatPickedDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPickedTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function startOfToday() {
  const t = new Date();
  t.setHours(23, 59, 59, 999);
  return t;
}

function fiveYearsAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 5);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function IncidentReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const submitLockedRef = useRef(false);

  const [incidentTypeOpen, setIncidentTypeOpen] = useState(false);
  const [incidentType, setIncidentType] = useState('');
  /** Required when incident type is "Other". */
  const [incidentTypeOther, setIncidentTypeOther] = useState('');
  const [incidentDate, setIncidentDate] = useState<Date | null>(null);
  const [incidentTime, setIncidentTime] = useState<Date | null>(null);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());
  const [draftTime, setDraftTime] = useState(() => {
    const t = new Date();
    t.setSeconds(0, 0);
    return t;
  });
  const [location, setLocation] = useState('');
  const [personsInvolved, setPersonsInvolved] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [files, setFiles] = useState<UploadFileRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Mirrors draft pickers so we can persist when the sheet closes without tapping Done. */
  const draftDateRef = useRef(draftDate);
  draftDateRef.current = draftDate;
  const draftTimeRef = useRef(draftTime);
  draftTimeRef.current = draftTime;

  const ingestEvidenceItems = useCallback(
    (items: { fileName: string; size?: number; mimeType?: string | null }[]) => {
      if (items.length === 0) return;
      const now = new Date();
      const { dateLabel, timeLabel } = formatPickMeta(now);

      const newRows: UploadFileRow[] = items.map((item, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
        fileName: item.fileName,
        mimeType: item.mimeType ?? null,
        dateLabel,
        timeLabel,
        sizeLabel: formatSize(item.size),
        progress: 100,
      }));

      setFiles((prev) => [...prev, ...newRows]);
    },
    [],
  );

  const pickMediaFromLibrary = useCallback(async () => {
    if (isSubmitting) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access so you can attach photos and videos to this report. You can change this in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    ingestEvidenceItems(
      result.assets.map((asset) => {
        const isVideo = asset.type === 'video';
        const fileName =
          (asset.fileName && asset.fileName.trim()) ||
          (isVideo ? 'Video.mp4' : 'Photo.jpg');
        return {
          fileName,
          size: asset.fileSize,
          mimeType:
            asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
        };
      }),
    );
  }, [ingestEvidenceItems, isSubmitting]);

  const pickFiles = useCallback(async () => {
    if (isSubmitting) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: [...EVIDENCE_DOCUMENT_TYPES],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return;

    ingestEvidenceItems(
      result.assets.map((asset) => ({
        fileName: asset.name ?? 'document',
        size: asset.size,
        mimeType: asset.mimeType ?? null,
      })),
    );
  }, [ingestEvidenceItems, isSubmitting]);

  const removeFile = useCallback(
    (id: string) => {
      if (isSubmitting) return;
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [isSubmitting],
  );

  const selectIncidentType = useCallback((value: string) => {
    setIncidentType(value);
    if (value !== INCIDENT_TYPE_OTHER) {
      setIncidentTypeOther('');
    }
    setIncidentTypeOpen(false);
  }, []);

  const onDateSheetOpenChange = useCallback(
    (open: boolean) => {
      if (isSubmitting) return;
      if (open) {
        Keyboard.dismiss();
        const initial = incidentDate ?? new Date();
        draftDateRef.current = initial;
        setDraftDate(initial);
      } else {
        setIncidentDate(draftDateRef.current);
      }
      setDateSheetOpen(open);
    },
    [incidentDate, isSubmitting],
  );

  const onTimeSheetOpenChange = useCallback(
    (open: boolean) => {
      if (isSubmitting) return;
      if (open) {
        Keyboard.dismiss();
        const initial = incidentTime ?? new Date();
        draftTimeRef.current = initial;
        setDraftTime(initial);
      } else {
        setIncidentTime(draftTimeRef.current);
      }
      setTimeSheetOpen(open);
    },
    [incidentTime, isSubmitting],
  );

  const onDraftDateChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      draftDateRef.current = selected;
      setDraftDate(selected);
    }
  }, []);

  const onDraftTimeChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      draftTimeRef.current = selected;
      setDraftTime(selected);
    }
  }, []);

  const commitDate = useCallback(() => {
    setIncidentDate(draftDateRef.current);
    setDateSheetOpen(false);
  }, []);

  const commitTime = useCallback(() => {
    setIncidentTime(draftTimeRef.current);
    setTimeSheetOpen(false);
  }, []);

  const dateDisplay = incidentDate ? formatPickedDate(incidentDate) : '';
  const timeDisplay = incidentTime ? formatPickedTime(incidentTime) : '';

  const datePickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'calendar';
  const timePickerDisplay = Platform.OS === 'ios' ? 'spinner' : 'clock';

  const incidentTypeComplete =
    incidentType.length > 0 &&
    (incidentType !== INCIDENT_TYPE_OTHER || incidentTypeOther.trim().length > 0);

  // Supporting evidence is optional — do not require files.
  const canSubmit =
    incidentTypeComplete &&
    incidentDate != null &&
    incidentTime != null &&
    location.trim().length > 0 &&
    whatHappened.trim().length > 0 &&
    !isSubmitting;

  const submitDisabled = !canSubmit || isSubmitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit || submitLockedRef.current) return;
    submitLockedRef.current = true;
    setIsSubmitting(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, MOCK_SUBMIT_MS));
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 4200,
        label: 'Report received',
        description:
          'Thank you. Your incident report was submitted. The discipline office will review it and follow up if needed.',
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
  }, [canSubmit, router, toast]);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <ScreenNavbar title="Incident Report" showMenu={false} />

      <KeyboardAvoidingView
        className="flex-1"
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
          }}>
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Type of Incident</Text>
            <BottomSheet
              className="w-full"
              isOpen={incidentTypeOpen}
              onOpenChange={setIncidentTypeOpen}>
              <BottomSheet.Trigger className="w-full" accessibilityLabel="Select type of incident">
                <InputGroup className="relative w-full">
                  <InputGroup.Input
                    variant="primary"
                    editable={false}
                    pointerEvents="none"
                    showSoftInputOnFocus={false}
                    placeholder="What type of incident happened?"
                    placeholderColorClassName="text-[#8F9098]"
                    value={incidentType}
                  />
                  <InputGroup.Suffix isDecorative>
                    <IconsaxArrowDownIcon size={18} color={ICON_SUFFIX} />
                  </InputGroup.Suffix>
                </InputGroup>
              </BottomSheet.Trigger>
              <BottomSheet.Portal>
                <BottomSheet.Overlay isCloseOnPress />
                <BottomSheet.Content snapPoints={['50%', '75%']} index={0}>
                  <BottomSheet.Title className="mb-2 px-1 text-base font-semibold leading-6 text-[#181D27]">
                    Type of Incident
                  </BottomSheet.Title>
                  <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    {INCIDENT_TYPES.map((opt) => (
                      <Pressable
                        key={opt}
                        accessibilityRole="button"
                        className="rounded-xl px-3 py-3.5 active:bg-[#FAFAFA]"
                        onPress={() => selectIncidentType(opt)}>
                        <Text
                          className={`text-sm leading-5 ${incidentType === opt ? 'font-semibold text-[#2970FF]' : 'text-[#181D27]'}`}>
                          {opt}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </BottomSheet.Content>
              </BottomSheet.Portal>
            </BottomSheet>
            {incidentType === INCIDENT_TYPE_OTHER ? (
              <View className="gap-2 pt-1">
                <Text className="text-xs font-semibold leading-4 text-[#494A50]">
                  Describe the incident type
                </Text>
                <InputGroup className="relative w-full">
                  <InputGroup.Input
                    variant="primary"
                    editable={!isSubmitting}
                    placeholder="Briefly describe what type of incident this is"
                    placeholderColorClassName="text-[#8F9098]"
                    value={incidentTypeOther}
                    onChangeText={setIncidentTypeOther}
                  />
                </InputGroup>
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-xs font-semibold leading-4 text-[#494A50]">Date</Text>
              <BottomSheet
                className="w-full"
                isOpen={dateSheetOpen}
                onOpenChange={onDateSheetOpenChange}>
                <BottomSheet.Trigger className="w-full" accessibilityLabel="Choose incident date">
                  <InputGroup className="relative w-full">
                    <InputGroup.Input
                      variant="primary"
                      editable={false}
                      pointerEvents="none"
                      showSoftInputOnFocus={false}
                      placeholder="Select date"
                      placeholderColorClassName="text-[#8F9098]"
                      value={dateDisplay}
                    />
                    <InputGroup.Suffix isDecorative>
                      <IconsaxCalendarIcon size={18} color={ICON_SUFFIX} />
                    </InputGroup.Suffix>
                  </InputGroup>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                  <BottomSheet.Overlay isCloseOnPress />
                  <BottomSheet.Content
                    snapPoints={Platform.OS === 'android' ? ['62%', '85%'] : ['48%', '72%']}
                    index={0}>
                    <BottomSheet.Title className="mb-1 px-1 text-base font-semibold leading-6 text-[#181D27]">
                      Incident date
                    </BottomSheet.Title>
                    <Text className="mb-3 px-1 text-xs leading-4 text-[#8F9098]">
                      Choose the date the incident occurred (not in the future).
                    </Text>
                    <View className="items-center">
                      <DateTimePicker
                        value={draftDate}
                        mode="date"
                        display={datePickerDisplay}
                        themeVariant="light"
                        minimumDate={fiveYearsAgo()}
                        maximumDate={startOfToday()}
                        onChange={onDraftDateChange}
                      />
                    </View>
                    <Button
                      variant="primary"
                      className="mt-4 h-12 w-full rounded-full bg-[#2970FF]"
                      onPress={commitDate}>
                      <Button.Label className="font-semibold text-white">Done</Button.Label>
                    </Button>
                  </BottomSheet.Content>
                </BottomSheet.Portal>
              </BottomSheet>
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-xs font-semibold leading-4 text-[#494A50]">Time</Text>
              <BottomSheet
                className="w-full"
                isOpen={timeSheetOpen}
                onOpenChange={onTimeSheetOpenChange}>
                <BottomSheet.Trigger className="w-full" accessibilityLabel="Choose incident time">
                  <InputGroup className="relative w-full">
                    <InputGroup.Input
                      variant="primary"
                      editable={false}
                      pointerEvents="none"
                      showSoftInputOnFocus={false}
                      placeholder="Select time"
                      placeholderColorClassName="text-[#8F9098]"
                      value={timeDisplay}
                    />
                    <InputGroup.Suffix isDecorative>
                      <IconsaxClockIcon size={18} color={ICON_SUFFIX} />
                    </InputGroup.Suffix>
                  </InputGroup>
                </BottomSheet.Trigger>
                <BottomSheet.Portal>
                  <BottomSheet.Overlay isCloseOnPress />
                  <BottomSheet.Content snapPoints={['48%', '72%']} index={0}>
                    <BottomSheet.Title className="mb-1 px-1 text-base font-semibold leading-6 text-[#181D27]">
                      Incident time
                    </BottomSheet.Title>
                    <Text className="mb-3 px-1 text-xs leading-4 text-[#8F9098]">
                      Choose the time the incident occurred.
                    </Text>
                    <View className="items-center">
                      <DateTimePicker
                        value={draftTime}
                        mode="time"
                        display={timePickerDisplay}
                        themeVariant="light"
                        onChange={onDraftTimeChange}
                      />
                    </View>
                    <Button
                      variant="primary"
                      className="mt-4 h-12 w-full rounded-full bg-[#2970FF]"
                      onPress={commitTime}>
                      <Button.Label className="font-semibold text-white">Done</Button.Label>
                    </Button>
                  </BottomSheet.Content>
                </BottomSheet.Portal>
              </BottomSheet>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Location</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                placeholder="Where did it happen?"
                placeholderColorClassName="text-[#8F9098]"
                value={location}
                onChangeText={setLocation}
              />
              <InputGroup.Suffix isDecorative>
                <IconsaxLocationIcon size={18} color={ICON_SUFFIX} />
              </InputGroup.Suffix>
            </InputGroup>
          </View>

          <View className="gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">Person(s) Involved</Text>
            <InputGroup className="relative w-full">
              <InputGroup.Input
                variant="primary"
                placeholder="Who are the persons involved?"
                placeholderColorClassName="text-[#8F9098]"
                value={personsInvolved}
                onChangeText={setPersonsInvolved}
              />
              <InputGroup.Suffix isDecorative>
                <IconsaxPeopleIcon size={18} color={ICON_SUFFIX} />
              </InputGroup.Suffix>
            </InputGroup>
            <Text className="text-[10px] leading-[14px] tracking-[0.15px] text-[#8F9098]">
              Leave blank if unknown or for an anonymous report
            </Text>
          </View>

          <TextField className="w-full gap-2">
            <Text className="text-xs font-semibold leading-4 text-[#494A50]">What happened?</Text>
            <TextArea
              variant="primary"
              className="min-h-[120px]"
              placeholder="Provide a detailed description of the incident. Include what you witnessed, who was involved, and any other relevant details."
              placeholderColorClassName="text-[#8F9098]"
              value={whatHappened}
              onChangeText={setWhatHappened}
              textAlignVertical="top"
            />
            <Text className="text-[10px] leading-[14px] tracking-[0.15px] text-[#8F9098]">
              Required. Include what you saw and any details that help the office review your report.
            </Text>
          </TextField>

          <View className="gap-2">
            <View className="gap-1">
              <Text className="text-xs font-semibold text-[#2F3036]">Supporting evidence</Text>
              <Text className="text-xs leading-4 tracking-[0.12px] text-[#8F9098]">
                Photos, screenshots, videos, or documents that support your report. Optional.
              </Text>
            </View>
            <FileUploadDropzoneCard
              onPickMedia={pickMediaFromLibrary}
              onPickFiles={pickFiles}
              hintText="Tap above for photos and videos from your library, or Upload Files for PDFs and other documents."
              className={isSubmitting ? 'opacity-50' : undefined}
            />
            {files.length > 0 ? (
              <View className="gap-3 pt-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold tracking-wide text-[#1F2024]">
                    Uploaded files
                  </Text>
                  <View
                    className="min-w-[28px] items-center justify-center rounded-full px-2 py-1"
                    style={{ backgroundColor: '#2970FF' }}>
                    <Text className="text-xs font-semibold text-white">{files.length}</Text>
                  </View>
                </View>
                {files.map((f) => (
                  <UploadedFileListRow
                    key={f.id}
                    fileName={f.fileName}
                    dateLabel={f.dateLabel}
                    timeLabel={f.timeLabel}
                    sizeLabel={f.sizeLabel}
                    progress={f.progress}
                    fileThumbnail={evidenceThumbnail(f.fileName, f.mimeType)}
                    onRemove={isSubmitting ? undefined : () => removeFile(f.id)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
        </ScrollView>

        <View
          className="border-t border-[#F0F2F5] bg-[#FAFAFA] px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Text className="mb-2 px-0.5 text-center text-[11px] leading-[15px] text-[#8F9098]">
            You can submit without attachments. Evidence is optional.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSubmitting ? 'Submitting report' : 'Submit incident report'}
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
              <Text className="text-sm font-semibold text-white">Submit Report</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
