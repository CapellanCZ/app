import Svg, { G, Path, Rect, ClipPath, Defs } from 'react-native-svg';
import { useId } from 'react';

type Props = {
  size?: number;
  color?: string;
};

/** `assets/icons/iconsax-document-text.svg` */
export function IconsaxDocumentTextIcon({ size = 48, color = '#A4A7AE' }: Props) {
  const clipId = useId().replace(/:/g, '');

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={48} height={48} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path
          opacity={0.4}
          d="M41 20.38H35.22C30.48 20.38 26.62 16.52 26.62 11.78V6C26.62 4.9 25.72 4 24.62 4H16.14C9.98 4 5 8 5 15.14V32.86C5 40 9.98 44 16.14 44H31.86C38.02 44 43 40 43 32.86V22.38C43 21.28 42.1 20.38 41 20.38Z"
          fill={color}
        />
        <Path
          d="M31.6004 4.42096C30.7804 3.60096 29.3604 4.16096 29.3604 5.30096V12.281C29.3604 15.201 31.8404 17.621 34.8604 17.621C36.7604 17.641 39.4004 17.641 41.6604 17.641C42.8004 17.641 43.4004 16.301 42.6004 15.501C39.7204 12.601 34.5604 7.38096 31.6004 4.42096Z"
          fill={color}
        />
        <Path
          d="M27 27.5H15C14.18 27.5 13.5 26.82 13.5 26C13.5 25.18 14.18 24.5 15 24.5H27C27.82 24.5 28.5 25.18 28.5 26C28.5 26.82 27.82 27.5 27 27.5Z"
          fill={color}
        />
        <Path
          d="M23 35.5H15C14.18 35.5 13.5 34.82 13.5 34C13.5 33.18 14.18 32.5 15 32.5H23C23.82 32.5 24.5 33.18 24.5 34C24.5 34.82 23.82 35.5 23 35.5Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
