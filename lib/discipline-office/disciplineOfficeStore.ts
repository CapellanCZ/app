import { create } from 'zustand';

import {
  fetchCasesByStudent,
  fetchNTEsByStudent,
  fetchSanctionsByStudent,
  mapNTEToCardProps,
} from './disciplineApi';

export type DisciplineNTEItem = ReturnType<typeof mapNTEToCardProps>;

type DisciplineOfficeState = {
  ntes: DisciplineNTEItem[];
  openCasesCount: number;
  sanctionsCount: number;
  hasLoaded: boolean;
  isLoading: boolean;
  refreshHub: (studentId: string) => Promise<void>;
  patchNte: (id: string, patch: Partial<DisciplineNTEItem>) => void;
  reset: () => void;
};

export const useDisciplineOfficeStore = create<DisciplineOfficeState>((set, get) => ({
  ntes: [],
  openCasesCount: 0,
  sanctionsCount: 0,
  hasLoaded: false,
  isLoading: false,

  refreshHub: async (studentId) => {
    if (!studentId) return;
    if (get().isLoading) return;

    const showLoading = !get().hasLoaded;
    if (showLoading) set({ isLoading: true });

    try {
      const [rawNTEs, rawCases, rawSanctions] = await Promise.all([
        fetchNTEsByStudent(studentId),
        fetchCasesByStudent(studentId),
        fetchSanctionsByStudent(studentId),
      ]);

      set({
        ntes: rawNTEs.filter((n) => n.status !== 'escalated').map(mapNTEToCardProps),
        openCasesCount: rawCases.length,
        sanctionsCount: rawSanctions.length,
        hasLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[disciplineOffice] refreshHub failed:', error);
      set({ isLoading: false, hasLoaded: true });
    }
  },

  patchNte: (id, patch) =>
    set((state) => ({
      ntes: state.ntes.map((nte) => (nte.id === id ? { ...nte, ...patch } : nte)),
    })),

  reset: () =>
    set({
      ntes: [],
      openCasesCount: 0,
      sanctionsCount: 0,
      hasLoaded: false,
      isLoading: false,
    }),
}));
