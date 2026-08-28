import { Modal, Pressable, Text, View } from 'react-native';

import type { NotificationItem } from '@/lib/notifications/types';
import { Inter } from '@/lib/typography/inter';

type Props = {
  item: NotificationItem | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
};

/** Single shared long-press sheet — avoids mounting a Modal per list row. */
export function NotificationItemMenu({ item, onClose, onMarkRead, onArchive }: Props) {
  return (
    <Modal visible={item != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
        onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingBottom: 36,
            paddingHorizontal: 20,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E3E3E3',
              marginBottom: 20,
            }}
          />
          {item && !item.read ? (
            <Pressable
              onPress={() => {
                onClose();
                onMarkRead(item.id);
              }}
              style={{ paddingVertical: 14 }}>
              <Text style={{ fontFamily: Inter.medium, fontSize: 15, color: '#222222' }}>
                Mark as read
              </Text>
            </Pressable>
          ) : null}
          {item ? (
            <Pressable
              onPress={() => {
                onArchive(item.id);
                onClose();
              }}
              style={{ paddingVertical: 14 }}>
              <Text style={{ fontFamily: Inter.medium, fontSize: 15, color: '#EF4444' }}>
                Archive
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
