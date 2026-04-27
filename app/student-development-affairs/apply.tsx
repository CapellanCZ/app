import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
  Keyboard,
  Pressable,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Dialog, TextArea, TextField, useToast } from 'heroui-native';

import { ScreenNavbar } from '@/components/ScreenNavbar';
import { IconPdfIcon } from '@/components/icons/IconPdfIcon';
import { IconsaxCalendarIcon } from '@/components/icons/IconsaxCalendarIcon';
import { UploadedFileListRow } from '@/components/ui/UploadedFileListRow';
import { useScholarshipStore } from '@/lib/scholarships/scholarshipStore';
import type { ScholarshipRequirement, ApplicationDocument } from '@/lib/scholarships/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fileThumbnail(mimeType?: string) {
  const mime = (mimeType ?? '').toLowerCase();
  if (mime.startsWith('image/')) return <Ionicons name="image-outline" size={24} color="#2970FF" />;
  return <IconPdfIcon size={24} />;
}

const ICON_SUFFIX = '#717680';
const SUBMIT_BRAND = '#2970FF';

// ─── Requirement row ──────────────────────────────────────────────────────────

type RequirementRowProps = {
  requirement: ScholarshipRequirement;
  uploadedDoc?: ApplicationDocument;
  isUploading: boolean;
  isSubmitting: boolean;
  onUpload: (req: ScholarshipRequirement) => void;
  onRemove: (doc: ApplicationDocument) => void;
};

function RequirementRow({
  requirement,
  uploadedDoc,
  isUploading,
  isSubmitting,
  onUpload,
  onRemove,
}: RequirementRowProps) {
  const disabled = isUploading || isSubmitting;

  return (
    <View className="rounded-2xl border border-[rgba(164,167,174,0.24)] bg-white p-4 gap-3">
      {/* Header */}
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold leading-5 text-[#181D27]">{requirement.name}</Text>
          {requirement.description ? (
            <Text className="mt-1 text-xs leading-4 text-[#717680]">{requirement.description}</Text>
          ) : null}
        </View>
        {requirement.isRequired ? (
          <View className="shrink-0 rounded-full bg-[#FEF3F2] px-2.5 py-1">
            <Text className="text-xs font-semibold text-[#D92D20]">Required</Text>
          </View>
        ) : (
          <View className="shrink-0 rounded-full bg-[#F2F4F7] px-2.5 py-1">
            <Text className="text-xs font-semibold text-[#717680]">Optional</Text>
          </View>
        )}
      </View>

      {/* Uploaded file */}
      {uploadedDoc ? (
        <View className="rounded-xl bg-[#F8F9FE]">
          <UploadedFileListRow
            fileName={uploadedDoc.originalFilename}
            dateLabel={formatDate(uploadedDoc.createdAt)}
            timeLabel={formatTime(uploadedDoc.createdAt)}
            sizeLabel={formatSize(uploadedDoc.fileSizeBytes)}
            progress={100}
            fileThumbnail={fileThumbnail(uploadedDoc.mimeType ?? undefined)}
            onRemove={disabled ? undefined : () => onRemove(uploadedDoc)}
          />
        </View>
      ) : (
        // Upload CTA
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Upload ${requirement.name}`}
          onPress={() => !disabled && onUpload(requirement)}
          className={`flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-[#C5C6CC] py-4 ${disabled ? 'opacity-50' : 'active:opacity-70'}`}>
          {isUploading ? (
            <ActivityIndicator size="small" color={SUBMIT_BRAND} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color={SUBMIT_BRAND} />
              <Text className="text-sm font-semibold text-[#2970FF]">Tap to upload</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Allowed types hint */}
      {requirement.allowedFileTypes && requirement.allowedFileTypes.length > 0 ? (
        <Text className="text-xs leading-4 text-[#98A2B3]">
          Accepted: {requirement.allowedFileTypes.join(', ')} · Max {requirement.maxFileSizeMb ?? 10}MB
        </Text>
      ) : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ApplyScholarshipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const {
    currentApplication,
    currentProgram,
    isLoadingApplication,
    isUploading,
    isSubmitting,
    fetchApplicationById,
    fetchProgramById,
    updateApplication,
    submitApplication,
    uploadDocument,
    deleteDocument,
    subscribeToApplication,
  } = useScholarshipStore();

  const [personalStatement, setPersonalStatement] = useState('');
  const [currentYearLevel, setCurrentYearLevel] = useState('');
  const [currentProgramField, setCurrentProgramField] = useState('');
  const [currentGpa, setCurrentGpa] = useState('');
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const pendingReqRef = useRef<ScholarshipRequirement | null>(null);
  const submitLockedRef = useRef(false);
  const docPickerBusyRef = useRef(false);

  // ── Load data ──
  useEffect(() => {
    if (!applicationId) return;
    fetchApplicationById(applicationId);
  }, [applicationId, fetchApplicationById]);

  // ── Pre-fill saved draft fields ──
  useEffect(() => {
    if (!currentApplication) return;
    if (currentApplication.personalStatement) {
      setPersonalStatement(currentApplication.personalStatement);
    }
    if (currentApplication.currentYearLevel) {
      setCurrentYearLevel(currentApplication.currentYearLevel);
    }
    if (currentApplication.currentProgram) {
      setCurrentProgramField(currentApplication.currentProgram);
    }
    if (currentApplication.currentGpa != null) {
      setCurrentGpa(String(currentApplication.currentGpa));
    }
  }, [currentApplication?.id]);

  // ── Fetch program if not loaded ──
  useEffect(() => {
    if (!currentApplication?.programId) return;
    if (!currentProgram || currentProgram.id !== currentApplication.programId) {
      fetchProgramById(currentApplication.programId);
    }
  }, [currentApplication?.programId]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!applicationId) return;
    const unsubscribe = subscribeToApplication(applicationId);
    return unsubscribe;
  }, [applicationId, subscribeToApplication]);

  // ── Derived data ──
  const requirements = useMemo(() => currentProgram?.requirements ?? [], [currentProgram]);

  const uploadedDocsByReqId = useMemo(() => {
    const map = new Map<string, ApplicationDocument>();
    for (const doc of currentApplication?.documents ?? []) {
      map.set(doc.requirementId, doc);
    }
    return map;
  }, [currentApplication?.documents]);

  const requiredReqs = useMemo(
    () => requirements.filter((r) => r.isRequired),
    [requirements],
  );

  const uploadedRequiredCount = useMemo(
    () => requiredReqs.filter((r) => uploadedDocsByReqId.has(r.id)).length,
    [requiredReqs, uploadedDocsByReqId],
  );

  const allRequiredUploaded = uploadedRequiredCount === requiredReqs.length;

  const hasUnsavedChanges =
    personalStatement.trim().length > 0 ||
    currentYearLevel.trim().length > 0 ||
    currentProgramField.trim().length > 0 ||
    currentGpa.trim().length > 0;

  const canSubmit =
    allRequiredUploaded &&
    !isSubmitting &&
    !isUploading &&
    currentApplication?.status === 'draft';

  // ── Back handler ──
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/student-development-affairs');
  }, [router]);

  const requestLeave = useCallback(() => {
    if (hasUnsavedChanges) {
      setDiscardDialogOpen(true);
    } else {
      goBack();
    }
  }, [goBack, hasUnsavedChanges]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (hasUnsavedChanges) {
          setDiscardDialogOpen(true);
          return true;
        }
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [goBack, hasUnsavedChanges]),
  );

  // ── File picking ──
  const pickAndUpload = useCallback(async (req: ScholarshipRequirement) => {
    if (docPickerBusyRef.current || isUploading) return;
    docPickerBusyRef.current = true;
    pendingReqRef.current = req;
    setUploadingReqId(req.id);
    Keyboard.dismiss();

    try {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(() => setTimeout(resolve, 120));
        });
      });

      let result: Awaited<ReturnType<typeof DocumentPicker.getDocumentAsync>>;
      try {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
          multiple: false,
        });
      } catch {
        // Fallback — shouldn't happen but guard it
        setUploadingReqId(null);
        return;
      }

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = asset.name ?? 'document';
      const mimeType = asset.mimeType ?? 'application/octet-stream';

      // Convert URI to Blob for Supabase Storage
      const blob = await fetch(uri).then((r) => r.blob());

      await uploadDocument(applicationId, req.id, blob, fileName, mimeType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploadingReqId(null);
      pendingReqRef.current = null;
      docPickerBusyRef.current = false;
    }
  }, [applicationId, isUploading, uploadDocument]);

  const handlePickMedia = useCallback(async (req: ScholarshipRequirement) => {
    if (isUploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to attach images. You can change this in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingReqId(req.id);
    try {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
      await uploadDocument(applicationId, req.id, blob, `photo.${ext}`, asset.mimeType ?? 'image/jpeg');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploadingReqId(null);
    }
  }, [applicationId, isUploading, uploadDocument]);

  // ── Remove doc ──
  const handleRemove = useCallback(async (doc: ApplicationDocument) => {
    Alert.alert('Remove file', `Remove "${doc.originalFilename}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc.id);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            Alert.alert('Could not remove', msg);
          }
        },
      },
    ]);
  }, [deleteDocument]);

  // ── Save draft silently ──
  const saveDraft = useCallback(async () => {
    if (!applicationId || !hasUnsavedChanges) return;
    try {
      await updateApplication(applicationId, {
        personalStatement: personalStatement.trim() || undefined,
        currentYearLevel: currentYearLevel.trim() || undefined,
        currentProgram: currentProgramField.trim() || undefined,
        currentGpa: currentGpa.trim() ? parseFloat(currentGpa) : undefined,
      });
    } catch {
      // Silent — user can retry on submit
    }
  }, [applicationId, hasUnsavedChanges, personalStatement, currentYearLevel, currentProgramField, currentGpa, updateApplication]);

  // ── Submit ──
  const onSubmit = useCallback(async () => {
    if (!canSubmit || submitLockedRef.current) return;
    submitLockedRef.current = true;

    // Save draft fields first
    await saveDraft();

    try {
      await submitApplication(applicationId);
      toast.show({
        variant: 'success',
        placement: 'top',
        duration: 6000,
        label: 'Application submitted!',
        description: `Your application for ${currentProgram?.name ?? 'this scholarship'} has been submitted. You will be notified of updates.`,
        icon: (
          <View className="shrink-0 pt-0.5">
            <Ionicons name="checkmark-circle" size={26} color="#079455" />
          </View>
        ),
      });
      await new Promise<void>((r) => setTimeout(r, 400));
      router.replace('/student-development-affairs');
    } catch (err) {
      submitLockedRef.current = false;
      const msg = err instanceof Error ? err.message : 'Submission failed';
      Alert.alert('Submit failed', msg);
    }
  }, [canSubmit, applicationId, saveDraft, submitApplication, currentProgram, toast, router]);

  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoadingApplication || !currentApplication) {
    return (
      <View className="flex-1 bg-white">
        <ScreenNavbar title="Apply for Scholarship" showMenu={false} onBackPress={goBack} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={SUBMIT_BRAND} />
          <Text className="mt-3 text-sm leading-5 text-[#717680]">Loading application…</Text>
        </View>
      </View>
    );
  }

  const program = currentProgram;
  const slotsLeft =
    program && program.totalSlots > 0
      ? program.totalSlots - program.filledSlots
      : null;

  return (
    <View className="flex-1 bg-white">
      <ScreenNavbar
        title={program ? `Apply — ${program.name}` : 'Scholarship Application'}
        titleNumberOfLines={2}
        showMenu={false}
        onBackPress={requestLeave}
      />

      <KeyboardAwareScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        bottomOffset={100}
        extraKeyboardSpace={24}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          flexGrow: 1,
        }}>

        {/* ── Program summary card ── */}
        {program ? (
          <View className="mb-5 gap-3 rounded-2xl border border-[rgba(164,167,174,0.24)] bg-[#F8F9FE] p-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-[#717680]">
              {program.sponsorName}
            </Text>
            <Text className="text-lg font-bold leading-6 text-[#181D27]">{program.name}</Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
              {slotsLeft != null ? (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="people-outline" size={16} color={ICON_SUFFIX} />
                  <Text className="text-sm leading-5 text-[#535862]">{slotsLeft} slots left</Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1.5">
                <IconsaxCalendarIcon size={16} color={ICON_SUFFIX} />
                <Text className="text-sm leading-5 text-[#535862]">
                  Closes {formatDate(program.applicationCloseDate)}
                </Text>
              </View>
            </View>
            {/* Reference number */}
            {currentApplication.referenceNumber ? (
              <View className="rounded-xl bg-[#EAF2FF] px-3 py-2">
                <Text className="text-xs font-semibold text-[#2970FF]">
                  Ref: {currentApplication.referenceNumber}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Student information ── */}
        <View className="mb-5 gap-4">
          <Text className="text-base font-semibold leading-6 text-[#181D27]">Your Information</Text>
          <Text className="text-xs leading-4 text-[#717680]">
            Optional — helps SDAO assess your application faster.
          </Text>

          <View className="gap-2">
            <Text className="text-sm font-semibold leading-5 text-[#2A2A2A]">Year Level</Text>
            <TextField className="w-full">
              <TextArea
                variant="primary"
                className="w-full"
                style={{ minHeight: 48, maxHeight: 48 }}
                placeholder="e.g. 2nd Year"
                placeholderColorClassName="text-[#8F9098]"
                value={currentYearLevel}
                onChangeText={setCurrentYearLevel}
                editable={!isSubmitting}
                multiline={false}
              />
            </TextField>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold leading-5 text-[#2A2A2A]">Program / Course</Text>
            <TextField className="w-full">
              <TextArea
                variant="primary"
                className="w-full"
                style={{ minHeight: 48, maxHeight: 48 }}
                placeholder="e.g. BS Computer Science"
                placeholderColorClassName="text-[#8F9098]"
                value={currentProgramField}
                onChangeText={setCurrentProgramField}
                editable={!isSubmitting}
                multiline={false}
              />
            </TextField>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold leading-5 text-[#2A2A2A]">Current GPA</Text>
            <TextField className="w-full">
              <TextArea
                variant="primary"
                className="w-full"
                style={{ minHeight: 48, maxHeight: 48 }}
                placeholder="e.g. 1.75"
                placeholderColorClassName="text-[#8F9098]"
                value={currentGpa}
                onChangeText={(t) => setCurrentGpa(t.replace(/[^0-9.]/g, ''))}
                editable={!isSubmitting}
                multiline={false}
                keyboardType="decimal-pad"
              />
            </TextField>
          </View>
        </View>

        {/* ── Personal statement ── */}
        <View className="mb-5 gap-2">
          <Text className="text-base font-semibold leading-6 text-[#181D27]">Personal Statement</Text>
          <Text className="text-xs leading-4 text-[#717680]">
            Tell SDAO why you deserve this scholarship. Describe your achievements, goals, and financial situation if applicable.
          </Text>
          <TextField className="w-full gap-2">
            <TextArea
              variant="primary"
              className="min-h-[160px] w-full"
              placeholder="Write your personal statement here…"
              placeholderColorClassName="text-[#8F9098]"
              value={personalStatement}
              onChangeText={setPersonalStatement}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </TextField>
        </View>

        {/* ── Requirements ── */}
        <View className="mb-2 gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-base font-semibold leading-6 text-[#181D27]">Requirements</Text>
            <View className="rounded-full bg-[#EAF2FF] px-3 py-1">
              <Text className="text-xs font-semibold text-[#2970FF]">
                {uploadedRequiredCount} / {requiredReqs.length} required
              </Text>
            </View>
          </View>

          {requirements.length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-sm leading-5 text-[#717680]">No documents required for this scholarship.</Text>
            </View>
          ) : (
            requirements.map((req) => (
              <RequirementRow
                key={req.id}
                requirement={req}
                uploadedDoc={uploadedDocsByReqId.get(req.id)}
                isUploading={uploadingReqId === req.id}
                isSubmitting={isSubmitting}
                onUpload={pickAndUpload}
                onRemove={handleRemove}
              />
            ))
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* ── Sticky submit bar ── */}
      <KeyboardStickyView
        className="border-t border-[#E8EFFF] bg-white/95 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        offset={{ closed: 0, opened: 4 }}>
        {!allRequiredUploaded && requirements.length > 0 ? (
          <Text className="mb-2 px-0.5 text-center text-xs leading-4 text-[#D92D20]">
            Upload all required documents before submitting.
          </Text>
        ) : (
          <Text className="mb-2 px-0.5 text-center text-xs leading-4 text-[#6B7280]">
            Review your documents before submitting. You cannot edit after submission.
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSubmitting ? 'Submitting application' : 'Submit application'}
          accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
          disabled={!canSubmit}
          pointerEvents={!canSubmit ? 'none' : 'auto'}
          onPress={onSubmit}
          style={({ pressed }) => ({
            opacity: !canSubmit ? 1 : pressed ? 0.9 : 1,
            backgroundColor: !canSubmit && !isSubmitting ? '#A8C4FF' : SUBMIT_BRAND,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
          })}
          className="w-full flex-row items-center justify-center gap-2 rounded-full py-3">
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text className="text-sm font-semibold text-white">Submitting…</Text>
            </>
          ) : (
            <Text className="text-sm font-semibold text-white">Submit Application</Text>
          )}
        </Pressable>
      </KeyboardStickyView>

      {/* ── Discard dialog ── */}
      <Dialog isOpen={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" isCloseOnPress={false} />
          <Dialog.Content
            isSwipeable={false}
            className="mx-6 w-full max-w-sm self-center rounded-3xl bg-white px-6 pb-7 pt-7">
            <Dialog.Title className="text-center text-lg font-bold text-[#181D27]">
              Leave application?
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-center text-sm leading-5 text-[#535862]">
              Your uploaded documents are saved but unsaved text fields will be lost. You can return to continue later.
            </Dialog.Description>
            <View className="mt-6 flex-row gap-3">
              <Button
                variant="outline"
                size="md"
                className="h-11 flex-1 border-[1.5px] border-[#D0D5DD] bg-white"
                onPress={() => setDiscardDialogOpen(false)}>
                <Button.Label className="text-sm font-semibold text-[#344054]">Keep editing</Button.Label>
              </Button>
              <Button
                variant="danger"
                size="md"
                className="h-11 flex-1"
                onPress={() => {
                  setDiscardDialogOpen(false);
                  goBack();
                }}>
                <Button.Label className="text-sm font-bold text-white">Leave</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
