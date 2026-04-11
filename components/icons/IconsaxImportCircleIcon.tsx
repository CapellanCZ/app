import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  /** Matches Figma “Upload Proof” link color (`brand/text-brand-secondary`). */
  color?: string;
};

/** Upload / import-in-circle (Figma `iconsax-import-circle-01`). */
export function IconsaxImportCircleIcon({ size = 20, color = '#004EEB' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V8M8.5 11.5L12 8L15.5 11.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
