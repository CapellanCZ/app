import { useId } from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

/** Matches Android tab label inactive color (`#B0B3B8`). */
export const HOME_TAB_ICON_INACTIVE = '#B0B3B8';
/** Soft sky blue — same family as Upcoming Appointments card. */
export const HOME_TAB_ICON_ACTIVE = '#6BAED6';

type Props = {
  focused: boolean;
  size?: number;
};

/** Solid filled home for Android tab bar. */
export function IconsaxHomeTabIcon({ focused, size = 24 }: Props) {
  const uid = useId().replace(/:/g, '_');
  const clipId = `iconsax_home_${uid}`;
  const color = focused ? HOME_TAB_ICON_ACTIVE : HOME_TAB_ICON_INACTIVE;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path
          d="M20.83 8.01002L14.28 2.77002C13 1.75002 11 1.74002 9.72996 2.76002L3.17996 8.01002C2.23996 8.76002 1.66996 10.26 1.86996 11.44L3.12996 18.98C3.41996 20.67 4.98996 22 6.69996 22H17.3C18.99 22 20.59 20.64 20.88 18.97L22.14 11.43C22.32 10.26 21.75 8.76002 20.83 8.01002Z"
          fill={color}
        />
        <Path
          d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18C12.75 18.41 12.41 18.75 12 18.75Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
}
