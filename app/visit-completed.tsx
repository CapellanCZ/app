import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { useConsultationSummaryStore } from '@/lib/consultation/consultationSummaryStore';

/**
 * Deep-link / legacy route → opens the root Consultation Summary modal, then leaves.
 */
export default function VisitCompletedRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const open = useConsultationSummaryStore((s) => s.open);

  useEffect(() => {
    const appointmentId = id ? String(id) : '';
    if (appointmentId) {
      open(appointmentId);
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/appointments');
    }
  }, [id, open]);

  return null;
}
