import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Dialog } from 'heroui-native';

import { LogoutModalSadIcon } from '@/components/icons/LogoutModalSadIcon';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLogout: () => void | Promise<void>;
};

export function LogoutConfirmModal({ open, onOpenChange, onConfirmLogout }: Props) {
  const handleConfirm = useCallback(() => {
    void Promise.resolve(onConfirmLogout());
  }, [onConfirmLogout]);

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop is visual only — no tap-to-dismiss (must use Cancel / Logout). */}
        <Dialog.Overlay className="bg-black/50" isCloseOnPress={false} />

        {/* ── Card ── */}
        <Dialog.Content
          isSwipeable={false}
          className="mx-6 w-full max-w-sm self-center rounded-3xl bg-white px-6 pb-7 pt-7">

          {/* ── Header: icon circle ── */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <LogoutModalSadIcon size={26} color="#F04438" />
            </View>
          </View>

          {/* ── Title ── */}
          <Text style={styles.title}>Signing Out</Text>

          {/* ── Body ── */}
          <Text style={styles.body}>
            {'Are you sure you want to logout?\nYou\'ll need to login again to continue.'}
          </Text>

          {/* ── Footer: Cancel + Logout ── */}
          <View style={styles.footer}>
            {/* Cancel — outline danger */}
            <Button
              variant="outline"
              size="md"
              className="h-11 flex-1 border-[1.5px] border-[#F04438] bg-white"
              onPress={() => onOpenChange(false)}>
              <Button.Label className="text-sm font-semibold text-[#D92D20]">
                Cancel
              </Button.Label>
            </Button>

            {/* Logout — solid danger */}
            <Button
              variant="danger"
              size="md"
              className="h-11 flex-1"
              onPress={handleConfirm}>
              <Button.Label className="text-sm font-bold text-white">Logout</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

/* ─────────────────────── styles ─────────────────────── */

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  /** Soft red circle behind the icon — no elevation / shadow. */
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#181D27',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  body: {
    fontSize: 14,
    fontWeight: '400',
    color: '#535862',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
  },
});
