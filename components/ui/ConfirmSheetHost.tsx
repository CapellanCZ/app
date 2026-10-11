import { useCallback } from 'react';

import { ConfirmSheet, OptionSheet } from '@/components/ui/ConfirmSheet';
import { useConfirmSheetStore } from '@/lib/ui/confirmSheetStore';

/**
 * Root host for imperative CampusCare confirm / option sheets (replaces Alert.alert).
 */
export function ConfirmSheetHost() {
  const confirm = useConfirmSheetStore((s) => s.confirm);
  const options = useConfirmSheetStore((s) => s.options);
  const hide = useConfirmSheetStore((s) => s.hide);

  const handleConfirm = useCallback(() => {
    const req = useConfirmSheetStore.getState().confirm;
    hide();
    req?.onConfirm();
  }, [hide]);

  const handleCancel = useCallback(() => {
    const req = useConfirmSheetStore.getState().confirm;
    hide();
    req?.onCancel?.();
  }, [hide]);

  const handleOptionSelect = useCallback(
    (id: string) => {
      const req = useConfirmSheetStore.getState().options;
      hide();
      req?.onSelect(id);
    },
    [hide],
  );

  const handleOptionCancel = useCallback(() => {
    const req = useConfirmSheetStore.getState().options;
    hide();
    req?.onCancel?.();
  }, [hide]);

  return (
    <>
      <ConfirmSheet
        visible={confirm != null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        icon={confirm?.icon}
        cancelLabel={confirm?.cancelLabel}
        confirmLabel={confirm?.confirmLabel ?? 'OK'}
        destructive={confirm?.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <OptionSheet
        visible={options != null}
        title={options?.title ?? ''}
        message={options?.message}
        options={options?.options ?? []}
        onSelect={handleOptionSelect}
        onCancel={handleOptionCancel}
      />
    </>
  );
}
