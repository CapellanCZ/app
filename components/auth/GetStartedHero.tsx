import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type TextLayoutEventData,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { GetStartedGlassButton } from '@/components/auth/GetStartedGlassButton';
import { GetStartedPagerDots } from '@/components/auth/GetStartedPagerDots';
import {
  GET_STARTED_SLIDES,
  type GetStartedSlide,
} from '@/components/auth/getStartedSlides';
import { Inter } from '@/lib/typography/inter';

const BG = '#F9F9F9';
/** How much the model sits under the bottom panel (px). */
const MODEL_PANEL_BLEED = 60;
/** Auto-advance interval for the onboarding carousel. */
const AUTO_SLIDE_MS = 3800;

/** panel paddingHorizontal 20×2 + textBlock paddingHorizontal 4×2 */
const HEADLINE_HORIZONTAL_PAD = 48;
const HEADLINE_SIZE_BUMP = 2;
const SUBTITLE_SIZE_BUMP = 2;

/** Longest lead line across slides — drives the shared type scale. */
const LONGEST_HEADLINE_LEAD = GET_STARTED_SLIDES.reduce(
  (max, s) => (s.headlineLead.length > max.length ? s.headlineLead : max),
  '',
);

/**
 * One shared headline size for every slide — sized against the longest lead line
 * so paging never changes type scale.
 */
function headlineMetrics(screenW: number) {
  const contentWidth = Math.max(240, screenW - HEADLINE_HORIZONTAL_PAD);

  const raw = Math.round(screenW * (42 / 390));
  let fontSize = Math.min(44, Math.max(20, raw));

  const avgCharEm = 0.44;
  const maxForSingleLine = Math.floor(
    (contentWidth / (LONGEST_HEADLINE_LEAD.length * avgCharEm)) * 0.86,
  );
  fontSize = Math.min(fontSize, maxForSingleLine);
  fontSize = Math.max(20, fontSize);
  fontSize = Math.min(46, fontSize + HEADLINE_SIZE_BUMP);
  fontSize = Math.max(22, fontSize);

  const lineHeight = Math.round(fontSize * 1.2);
  const letterSpacing = -Math.min(3.2, Math.max(1.6, fontSize * 0.07));
  return { fontSize, lineHeight, letterSpacing };
}

/** Reference: 390pt width → 17px subtitle; stays in proportion with the headline. */
function subtitleMetrics(screenW: number, headlineFontSize: number) {
  const fromWidth = Math.round(screenW * (17 / 390));
  const fromHeadline = Math.round(headlineFontSize * (17 / 38));
  let fontSize = Math.min(fromWidth, fromHeadline);
  fontSize = Math.min(18, Math.max(14, fontSize));
  fontSize = Math.min(20, fontSize + SUBTITLE_SIZE_BUMP);
  fontSize = Math.max(16, fontSize);

  const lineHeight = Math.round(fontSize * (22 / 17));
  const letterSpacing = fontSize * (-0.4 / 17);
  return { fontSize, lineHeight, letterSpacing };
}

/** Reference: 390pt → 13px legal; stays readable and tappable on small phones. */
function legalMetrics(screenW: number) {
  const raw = Math.round(screenW * (13 / 390));
  const fontSize = Math.min(14, Math.max(12, raw));
  const lineHeight = Math.round(fontSize * (17 / 13));
  const letterSpacing = fontSize * (-0.2 / 13);
  return { fontSize, lineHeight, letterSpacing };
}

/** Fit a slide image inside the measured hero area. */
function modelMetrics(
  areaW: number,
  areaH: number,
  topReserve: number,
  layout?: GetStartedSlide['layout'],
) {
  const align = layout?.align ?? 'bottom';
  const aspect = layout?.aspect ?? 0.8;
  const widthRatio =
    layout?.widthRatio ?? (areaW < 360 ? 1.04 : areaW > 430 ? 1 : 1.02);

  const usableH = Math.max(
    220,
    areaH - topReserve + (align === 'bottom' ? MODEL_PANEL_BLEED : 0),
  );
  const maxW = areaW * widthRatio;
  const heightRatio =
    align === 'center'
      ? 0.72
      : areaH < 420
        ? 1.12
        : areaH < 520
          ? 1.08
          : 1.04;
  const maxH = usableH * heightRatio;

  const widthFromHeight = maxH * aspect;
  const heightFromWidth = maxW / aspect;
  if (heightFromWidth <= maxH) {
    return { width: maxW, height: heightFromWidth, align };
  }
  return {
    width: Math.min(maxW, widthFromHeight),
    height: maxH,
    align,
  };
}

function SlideImage({
  slide,
  index,
  pageWidth,
  pageHeight,
  scrollX,
  topReserve,
}: {
  slide: GetStartedSlide;
  index: number;
  pageWidth: number;
  pageHeight: number;
  scrollX: SharedValue<number>;
  topReserve: number;
}) {
  const model = modelMetrics(pageWidth, pageHeight, topReserve, slide.layout);
  const centered = model.align === 'center';

  const style = useAnimatedStyle(() => {
    if (pageWidth <= 0) return { opacity: index === 0 ? 1 : 0.6, transform: [{ scale: 1 }] };
    const input = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];
    return {
      opacity: interpolate(scrollX.get(), input, [0.45, 1, 0.45], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(scrollX.get(), input, [0.92, 1, 0.92], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View
      style={{
        width: pageWidth,
        height: pageHeight,
        alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-end',
        paddingTop: centered ? Math.max(8, topReserve * 0.25) : 0,
      }}>
      <Animated.View style={style}>
        <Image
          source={slide.image}
          style={{
            width: model.width,
            height: model.height,
            marginBottom: centered ? Math.max(12, MODEL_PANEL_BLEED * 0.35) : -MODEL_PANEL_BLEED,
          }}
          resizeMode="contain"
          accessibilityLabel={slide.imageLabel}
        />
      </Animated.View>
    </View>
  );
}

export type GetStartedHeroProps = {
  onSignIn: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
};

export function GetStartedHero({ onSignIn, onTerms, onPrivacy }: GetStartedHeroProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = GET_STARTED_SLIDES[activeIndex] ?? GET_STARTED_SLIDES[0];
  const activeIndexRef = useRef(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  // Shared type scale — screen width only, never per-slide.
  const headline = headlineMetrics(screenW);
  const [headlineFontSize, setHeadlineFontSize] = useState(headline.fontSize);
  const [imageArea, setImageArea] = useState({ width: screenW, height: screenH * 0.55 });

  const scrollX = useSharedValue(0);

  useEffect(() => {
    setHeadlineFontSize(headlineMetrics(screenW).fontSize);
  }, [screenW]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const topReserve = insets.top + 32;
  const pageWidth = imageArea.width > 0 ? imageArea.width : screenW;

  // Auto-advance through the 3 slides; pauses while the user is dragging.
  useEffect(() => {
    if (paused || pageWidth <= 0 || GET_STARTED_SLIDES.length <= 1) return;

    const timer = setInterval(() => {
      const next = (activeIndexRef.current + 1) % GET_STARTED_SLIDES.length;
      scrollRef.current?.scrollTo({ x: next * pageWidth, y: 0, animated: true });
      setActiveIndex(next);
    }, AUTO_SLIDE_MS);

    return () => clearInterval(timer);
  }, [paused, pageWidth]);

  const headlineLineHeight = Math.round(headlineFontSize * 1.2);
  const headlineLetterSpacing = -Math.min(
    3.2,
    Math.max(1.6, headlineFontSize * 0.07),
  );

  const subtitle = subtitleMetrics(screenW, headlineFontSize);
  const legal = legalMetrics(screenW);

  const headlineStyle = [
    styles.headline,
    {
      fontSize: headlineFontSize,
      lineHeight: headlineLineHeight,
      letterSpacing: headlineLetterSpacing,
    },
  ] as const;

  const subtitleStyle = [
    styles.subtitle,
    {
      fontSize: subtitle.fontSize,
      lineHeight: subtitle.lineHeight,
      letterSpacing: subtitle.letterSpacing,
    },
  ] as const;

  const legalStyle = [
    styles.legal,
    {
      fontSize: legal.fontSize,
      lineHeight: legal.lineHeight,
      letterSpacing: legal.letterSpacing,
    },
  ] as const;

  // Shrink only from the hidden longest-lead probe so every slide shares one size.
  const onMeasureLeadLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (e.nativeEvent.lines.length > 1) {
      setHeadlineFontSize((size) => (size <= 22 ? size : size - 1));
    }
  };

  const onImageAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setImageArea((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.set(event.contentOffset.x);
    },
  });

  const syncIndex = (x: number) => {
    if (pageWidth <= 0) return;
    const next = Math.round(x / pageWidth);
    const clamped = Math.max(0, Math.min(GET_STARTED_SLIDES.length - 1, next));
    setActiveIndex((prev) => (prev === clamped ? prev : clamped));
  };

  const onScrollBeginDrag = () => {
    setPaused(true);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncIndex(e.nativeEvent.contentOffset.x);
    setPaused(false);
  };

  return (
    <View style={styles.root}>
      {/* Offscreen probe — measures longest lead at the shared size. */}
      <Text
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[headlineStyle, styles.measureText]}
        onTextLayout={onMeasureLeadLayout}
        allowFontScaling={false}>
        {LONGEST_HEADLINE_LEAD}
      </Text>

      <View style={styles.imageArea} onLayout={onImageAreaLayout}>
        {pageWidth > 0 ? (
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onScrollBeginDrag={onScrollBeginDrag}
            onMomentumScrollEnd={onMomentumScrollEnd}
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}>
            {GET_STARTED_SLIDES.map((item, index) => (
              <SlideImage
                key={item.id}
                slide={item}
                index={index}
                pageWidth={pageWidth}
                pageHeight={imageArea.height}
                scrollX={scrollX}
                topReserve={topReserve}
              />
            ))}
          </Animated.ScrollView>
        ) : null}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.safePanel}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.12)']}
          locations={[0, 0.55, 1]}
          style={styles.topShadow}
        />
        <View style={styles.panel}>
          <GetStartedPagerDots
            count={GET_STARTED_SLIDES.length}
            scrollX={scrollX}
            pageWidth={pageWidth}
          />

          <Animated.View
            key={slide.id}
            entering={FadeIn.duration(220)}
            style={styles.textBlock}>
            <View
              style={styles.headlineBlock}
              accessible
              accessibilityRole="header"
              accessibilityLabel={`${slide.headlineLead} ${slide.headlineAccent}`}>
              <Text style={headlineStyle} allowFontScaling={false}>
                {slide.headlineLead}
              </Text>
              <Text style={headlineStyle} allowFontScaling={false}>
                {slide.headlineAccent}
              </Text>
            </View>
            <Text style={subtitleStyle} allowFontScaling={false}>
              {slide.subtitle}
            </Text>
          </Animated.View>

          <View style={styles.btnStack}>
            <GetStartedGlassButton onPress={onSignIn} />
          </View>

          <Text style={legalStyle} allowFontScaling={false}>
            {'By proceeding, you agree to our '}
            <Text
              style={styles.legalLink}
              onPress={onTerms}
              suppressHighlighting={false}
              accessibilityRole="link"
              accessibilityLabel="Terms of Use">
              Terms of Use
            </Text>
            {' and acknowledge that you have read our '}
            <Text
              style={styles.legalLink}
              onPress={onPrivacy}
              suppressHighlighting={false}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy">
              Privacy Policy
            </Text>
          </Text>
        </View>
      </SafeAreaView>

      <View style={[styles.logoRow, { top: insets.top + 18 }]} pointerEvents="none">
        <View style={styles.logoLockup}>
          <Image
            source={require('../../assets/icon-grey.png')}
            style={styles.logoIcon}
            resizeMode="contain"
            accessibilityLabel="CampusCare"
          />
          <Text style={styles.logoText} allowFontScaling={false}>
            CampusCare
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  imageArea: {
    flex: 1,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  safePanel: {
    backgroundColor: '#F9F9F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    zIndex: 2,
    flexShrink: 0,
    marginTop: -48,
  },
  topShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -36,
    height: 36,
    zIndex: 3,
  },
  panel: {
    backgroundColor: '#F9F9F9',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 2,
    gap: 12,
  },
  textBlock: {
    gap: 10,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  headlineBlock: {
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
  },
  headline: {
    fontFamily: Inter.medium,
    color: '#111111',
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontFamily: Inter.regular,
    color: '#727272',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  btnStack: {
    marginTop: 4,
    gap: 12,
  },
  legal: {
    fontFamily: Inter.regular,
    color: '#A4A7AE',
    textAlign: 'center',
    paddingHorizontal: 12,
    // Extra vertical hit area so small type stays easy to tap.
    paddingVertical: 6,
  },
  legalLink: {
    color: '#717680',
    textDecorationLine: 'underline',
  },
  logoRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  /** Fixed-height lockup so icon + wordmark share one optical mid-line. */
  logoLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 7,
  },
  logoIcon: {
    width: 42,
    height: 34,
    opacity: 0.55,
  },
  logoText: {
    fontFamily: Inter.regular,
    fontSize: 22,
    lineHeight: 26,
    height: 26,
    color: '#B8B8B8',
    letterSpacing: -1.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
