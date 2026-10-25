import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Inter } from '@/lib/typography/inter';

type Props = {
  visible: boolean;
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
};

/**
 * Full-screen announcement image viewer — swipe between images, contain fit (no crop).
 */
export function AnnouncementImageViewer({
  visible,
  urls,
  initialIndex = 0,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowW, height: windowH } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const start = Math.max(0, Math.min(urls.length - 1, initialIndex));
    setIndex(start);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: start * windowW, y: 0, animated: false });
    });
  }, [visible, initialIndex, urls.length, windowW]);

  if (urls.length === 0) return null;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / windowW);
    setIndex(Math.max(0, Math.min(urls.length - 1, next)));
  };

  const imageMaxH = windowH - insets.top - insets.bottom - 96;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.94)' }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}>
          <Text
            style={{
              fontFamily: Inter.medium,
              fontSize: 14,
              color: 'rgba(255,255,255,0.85)',
            }}>
            {urls.length > 1 ? `${index + 1} / ${urls.length}` : ' '}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
            onPress={onClose}
            hitSlop={12}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center' }}>
          {urls.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Image ${i + 1} of ${urls.length}. Double tap to close.`}
              onPress={onClose}
              style={{
                width: windowW,
                height: imageMaxH,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
              }}>
              <Image
                source={{ uri }}
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
