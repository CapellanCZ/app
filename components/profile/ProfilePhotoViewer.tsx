import { Image, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

/** Full-screen profile photo preview — tap backdrop or close to dismiss. */
export function ProfilePhotoViewer({ visible, imageUrl, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.94)' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo preview"
          onPress={onClose}
          hitSlop={12}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 20,
            zIndex: 2,
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel="Profile photo"
          onPress={onClose}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Image
            source={{ uri: imageUrl }}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      </View>
    </Modal>
  );
}
