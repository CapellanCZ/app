# 002 — Appointment list cards: staggered enter + press scale

- **Status**: DONE
- **Commit**: 08a96f4
- **Severity**: MEDIUM
- **Category**: Missed opportunities / Physicality & origin
- **Estimated scope**: 2 files (`components/appointments/AppointmentCard.tsx`, `app/(tabs)/appointments.tsx`)

## Problem

Appointment cards mount with no enter motion and only `active:opacity-90` press feedback (opacity snaps via NativeWind, not a spring). After a tab change (plan 001), the new list should feel like cards arrive in space — not a flat cut.

```tsx
/* components/appointments/AppointmentCard.tsx:56–73 — current */
return (
  <Pressable
    /* … */
    style={{
      backgroundColor,
      borderWidth: 1,
      borderColor: '#FFFFFF',
      borderRadius: 16,
      /* … */
    }}
    className="active:opacity-90">
```

```tsx
/* app/(tabs)/appointments.tsx:245–275 — current */
return (
  <AppointmentCard
    key={item.id}
    /* no entering prop / Animated wrapper */
```

## Target

1. **Enter** (list appear / panel remount after tab change):
   - Each card: fade + slide up using existing helper `fadeSlideUpEntering(index)` from `lib/animations/fadeSlideUp.ts`:
     - duration **260ms**
     - stagger **45ms** per index, capped at **280ms** delay
   - Implemented via Reanimated `entering` on an `Animated.View` wrapper (or on the card root if converted to `Animated.View`).
   - Never `scale(0)`. If adding scale: start at **`scale(0.97)`** + opacity 0 (AUDIT.md physicality). Prefer the existing fadeSlideUp helper (translateY + opacity) — do not invent a second enter style.

2. **Press**:
   - `scale` → **0.97** (within AUDIT 0.95–0.98), opacity → **0.92**
   - Spring: `{ damping: 18, stiffness: 380, mass: 0.35 }` (match QuickActionPill)
   - On release: spring back to scale 1 / opacity 1
   - Animate **transform + opacity only** on the UI thread via Reanimated

3. **Reduced motion**:
   - If `useReducedMotion()`, skip enter translate (use plain mount) and skip press scale — keep a light opacity press optional (`0.92`) with `withTiming(..., { duration: 100 })` or none.

4. Cancelled cards (`onPress` undefined / disabled) must **not** scale on press.

## Repo conventions to follow

```ts
/* lib/animations/fadeSlideUp.ts — exemplar (use as-is) */
const DURATION_MS = 260;
const STAGGER_MS = 45;
const MAX_STAGGER_MS = 280;

export function fadeSlideUpEntering(index = 0) {
  const delay = Math.min(index * STAGGER_MS, MAX_STAGGER_MS);
  return FadeInDown.delay(delay).duration(DURATION_MS);
}
```

```tsx
/* components/home/QuickActionPill.tsx:10–56 — press exemplar */
const PRESS_SPRING = { damping: 18, stiffness: 380, mass: 0.35 } as const;
const PRESS_SCALE = 0.96; // AppointmentCard target: 0.97 (AUDIT)
// onPressIn / onPressOut → withSpring(…)
```

Prefer extracting shared constants only if duplication is awkward; copying the spring object into `AppointmentCard` is acceptable to avoid scope creep.

## Steps

1. Update `components/appointments/AppointmentCard.tsx`:
   - Import Reanimated (`Animated`, `useAnimatedStyle`, `useSharedValue`, `withSpring`, `useReducedMotion`).
   - Add optional prop `enterIndex?: number` (default `undefined` = no entering animation when not in a list).
   - Replace outer `Pressable` content wrapper with:

```tsx
const reduceMotion = useReducedMotion();
const scale = useSharedValue(1);
const dim = useSharedValue(1);
const pressStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: dim.value,
}));

const canPress = Boolean(onPress);

const onPressIn = () => {
  if (!canPress || reduceMotion) return;
  scale.value = withSpring(0.97, PRESS_SPRING);
  dim.value = withSpring(0.92, PRESS_SPRING);
};
const onPressOut = () => {
  if (!canPress) return;
  scale.value = withSpring(1, PRESS_SPRING);
  dim.value = withSpring(1, PRESS_SPRING);
};

return (
  <Pressable
    disabled={!canPress}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    /* remove className="active:opacity-90" */
  >
    <Animated.View
      entering={
        enterIndex != null && !reduceMotion
          ? fadeSlideUpEntering(enterIndex)
          : undefined
      }
      style={[
        {
          backgroundColor,
          borderWidth: 1,
          borderColor: '#FFFFFF',
          borderRadius: 16,
          paddingTop: 18,
          paddingBottom: 12,
          paddingHorizontal: 16,
          width: '100%',
          gap: 10,
        },
        pressStyle,
      ]}>
      {/* existing children unchanged */}
    </Animated.View>
  </Pressable>
);
```

   - Move the pastel background / border / padding styles from `Pressable` onto the `Animated.View` so scale includes the visible card surface.

2. In `app/(tabs)/appointments.tsx`, pass stagger index:

```tsx
<AppointmentCard
  key={item.id}
  enterIndex={index}
  /* …existing props */
/>
```

3. Ensure cancel / call buttons inside the card use `e.stopPropagation` if they already prevent parent press (verify existing behavior — do not break call/cancel). Press scale should still run when pressing the card body; if cancel `Pressable` is nested, parent may still receive pressIn — acceptable if cancels still fire.

4. Do not add stagger delays that block interaction — entering is decorative only (AUDIT.md).

## Boundaries

- Do NOT restyle pastel colors, typography, or Figma layout of the card.
- Do NOT change navigation targets / cancel alerts.
- Do NOT invent new animation tokens files — use `fadeSlideUpEntering` + inline spring matching QuickActionPill.
- Do NOT add dependencies.
- Tab swipe / directional panel is plan **001**; this plan only owns card enter + press. Implement after or with 001; card `entering` must remount with panel `key` from 001 so stagger replays on tab change.

## Verification

- **Mechanical**: typecheck / lint clean on the two files.
- **Feel check**:
  - Open Appointments → Pending with ≥3 cards: cards cascade in ~45ms steps, each sliding up faintly (not bouncing wildly).
  - Switch to Confirmed: list remounts with the same stagger (depends on 001’s `panelKey`).
  - Press a tappable card: subtle shrink to ~0.97, releases spring back; no opacity-only flash.
  - Cancelled tab cards: no press scale (disabled).
  - Reduce Motion on: instant list paint, no slide-up, no press scale.
  - Scrub feel at slow speed: enter uses ease from FadeInDown (acceptable); press spring should feel snappy (high stiffness), not jelly.
- **Done when**: enter stagger visible on non-reduced-motion devices and press feedback matches QuickActionPill quality on this card.
