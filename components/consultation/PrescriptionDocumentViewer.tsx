import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import type { IssuedPrescriptionDocument } from '@/lib/consultation/types';
import { Inter } from '@/lib/typography/inter';
import { androidPressProps } from '@/lib/ui/androidPress';

const HSO_ADDRESS =
  "Sampaloc 1 Bridge, SM Dasmarinas, Government's Dr, Dasmarinas Cavite, Philippines";

function formatIssuedDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  document: IssuedPrescriptionDocument | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
};

/**
 * Official HSO prescription form viewer — matches web PrescriptionPrint layout.
 */
export function PrescriptionDocumentViewer({
  visible,
  document,
  loading,
  error,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  const openStoredFile = async () => {
    const url = document?.documentFileUrl?.trim();
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      // Viewer already shows the form body.
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Prescription</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close prescription"
            onPress={onClose}
            {...androidPressProps({ hitSlop: 8 })}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>Loading prescription…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>Unable to open prescription</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : !document ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>Prescription unavailable</Text>
            <Text style={styles.stateText}>
              No issued prescription document was found for this visit.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            bouncesZoom>
            <View style={styles.page}>
              <View style={styles.header}>
                <Text style={styles.orgTitle}>NU DASMARIÑAS Health Service Office</Text>
                <Text style={styles.address}>{HSO_ADDRESS}</Text>
                <Text style={styles.formCode}>NUD-ADM-HSO Prescription Form</Text>
              </View>

              <Text style={styles.pageTitle}>PRESCRIPTION</Text>

              <View style={styles.details}>
                <DetailRow label="Name" value={document.patientFullName} />
                <DetailRow label="Address" value={document.patientAddress ?? '—'} />
                <DetailRow
                  label="Age / Sex"
                  value={
                    [document.patientAge, document.patientSex].filter(Boolean).join(' / ') || '—'
                  }
                />
                <DetailRow label="Date" value={formatIssuedDate(document.issuedAt)} />
              </View>

              <Text style={styles.rxSymbol}>℞</Text>

              <View style={styles.medList}>
                {document.medications.map((med, index) => {
                  const meta = [
                    med.strength,
                    med.quantity ? `Qty: ${med.quantity}` : null,
                    med.frequency,
                    med.route,
                    med.duration,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <View key={`${med.name ?? 'med'}-${index}`} style={styles.medItem}>
                      <Text style={styles.medIndex}>{index + 1}.</Text>
                      <View style={styles.medBody}>
                        <Text style={styles.medName}>{med.name?.trim() || '—'}</Text>
                        {meta ? <Text style={styles.medMeta}>{meta}</Text> : null}
                        {med.instructions?.trim() ? (
                          <Text style={styles.medInstructions}>{med.instructions.trim()}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              {document.diagnosticLines.length > 0 ? (
                <View style={styles.diagnostics}>
                  {document.diagnosticLines.length === 1 ? (
                    <Text style={styles.diagnosticTitle}>
                      Request for {document.diagnosticLines[0]}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.diagnosticTitle}>Request for:</Text>
                      {document.diagnosticLines.map((line) => (
                        <Text key={line} style={styles.diagnosticLine}>
                          • {line}
                        </Text>
                      ))}
                    </>
                  )}
                </View>
              ) : null}

              <View style={styles.footer}>
                <Text style={styles.licenseLabel}>Licensed No.</Text>
                <View style={styles.licenseLine}>
                  <Text style={styles.licenseValue}>{document.licenseNumber || ' '}</Text>
                </View>
                <Text style={styles.doctorName}>{document.doctorName ?? 'Physician'}</Text>
                <Text style={styles.docNumber}>Document No. {document.documentNumber}</Text>
              </View>

              {document.documentFileUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open stored PDF"
                  onPress={() => void openStoredFile()}
                  {...androidPressProps()}
                  style={({ pressed }) => [styles.openPdfBtn, { opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={styles.openPdfLabel}>Open stored PDF</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  toolbarTitle: {
    fontFamily: Inter.semiBold,
    fontSize: 18,
    color: '#111111',
    letterSpacing: -0.4,
  },
  closeLabel: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#2563EB',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  stateTitle: {
    fontFamily: Inter.semiBold,
    fontSize: 18,
    color: '#111111',
    textAlign: 'center',
  },
  stateText: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: '#6C6C6C',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  page: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 4,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  orgTitle: {
    fontFamily: Inter.semiBold,
    fontSize: 15,
    color: '#1E3A8A',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  address: {
    fontFamily: Inter.regular,
    fontSize: 10,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 14,
  },
  formCode: {
    fontFamily: Inter.medium,
    fontSize: 10,
    color: '#737373',
    marginTop: 2,
  },
  pageTitle: {
    fontFamily: Inter.bold,
    fontSize: 20,
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: 16,
  },
  details: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  detailLabel: {
    width: 72,
    fontFamily: Inter.semiBold,
    fontSize: 12,
    color: '#404040',
  },
  detailValueWrap: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#A3A3A3',
    paddingBottom: 2,
  },
  detailValue: {
    fontFamily: Inter.semiBold,
    fontSize: 13,
    color: '#111111',
  },
  rxSymbol: {
    fontFamily: Inter.regular,
    fontSize: 36,
    fontStyle: 'italic',
    color: '#262626',
    marginTop: 20,
    marginBottom: 8,
  },
  medList: {
    gap: 14,
  },
  medItem: {
    flexDirection: 'row',
    gap: 8,
  },
  medIndex: {
    fontFamily: Inter.semiBold,
    fontSize: 13,
    color: '#111111',
    width: 18,
  },
  medBody: {
    flex: 1,
    gap: 2,
  },
  medName: {
    fontFamily: Inter.semiBold,
    fontSize: 14,
    color: '#111111',
  },
  medMeta: {
    fontFamily: Inter.regular,
    fontSize: 11,
    color: '#404040',
  },
  medInstructions: {
    fontFamily: Inter.regular,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#525252',
    marginTop: 2,
  },
  diagnostics: {
    marginTop: 18,
    gap: 4,
  },
  diagnosticTitle: {
    fontFamily: Inter.semiBold,
    fontSize: 12,
    color: '#171717',
  },
  diagnosticLine: {
    fontFamily: Inter.regular,
    fontSize: 12,
    color: '#171717',
  },
  footer: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    gap: 4,
  },
  licenseLabel: {
    fontFamily: Inter.semiBold,
    fontSize: 11,
    color: '#404040',
  },
  licenseLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    maxWidth: 160,
    minHeight: 20,
    marginBottom: 12,
  },
  licenseValue: {
    fontFamily: Inter.regular,
    fontSize: 13,
    color: '#111111',
  },
  doctorName: {
    fontFamily: Inter.semiBold,
    fontSize: 14,
    color: '#111111',
  },
  docNumber: {
    fontFamily: Inter.regular,
    fontSize: 11,
    color: '#737373',
    marginTop: 4,
  },
  openPdfBtn: {
    marginTop: 20,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPdfLabel: {
    fontFamily: Inter.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
