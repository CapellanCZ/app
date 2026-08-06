# 001 — Appointments status tabs: horizontal swipe + directional slide

- **Status**: DONE
- **Commit**: 08a96f4
- **Severity**: HIGH
- **Category**: Missed opportunities / Physicality & origin
- **Estimated scope**: 1–2 files (`app/(tabs)/appointments.tsx`, optional tiny helper)

## Problem

On the Appointments tab, Pending / Confirmed / Cancelled switch by hard `setActiveTab` with no motion and no pan gesture. The list teleports when the filter changes:

```tsx
/* app/(tabs)/appointments.tsx:157–164 — current */
{TABS.map((tab) => {
  const selected = activeTab === tab.id;
  return (
    <Pressable
      key={tab.id}
      onPress={() => setActiveTab(tab.id)}
```

```tsx
/* app/(tabs)/appointments.tsx:192–228 — current */
<View style={{ gap: 12, width: '100%' }}>
  {filtered.length === 0 ? (
    /* empty state */
  ) : (
    filtered.map((item, index) => {
      return <AppointmentCard key={item.id} /* … */ />;
```

Users expect mobile lateral navigation: swipe left → next tab (Pending → Confirmed → Cancelled), swipe right → previous, with content sliding in the same direction.

## Target

1. **Swipe** between the three status pages with a horizontal pan (threshold + velocity).
2. **Pill taps** stay; they must sync the pager index and play the same directional slide.
3. **Motion** (transform + opacity only):
   - Content enter: `translateX ±24` → `0`, opacity `0` → `1`, **180ms**, strong ease-out `Easing.bezier(0.23, 1, 0.32, 1)` (Reanimated `Easing.bezier(0.23, 1, 0.32, 1)`).
   - Content exit: `translateX` toward opposite direction, opacity → `0`, **140ms**, same curve.
   - Direction: forward (Pending→Confirmed→Cancelled) = content exits left / enters from right; back = exits right / enters from left.
4. **Reduced motion**: when `useReducedMotion()` is true, swap content with opacity crossfade only (120ms), no translate, no pan slide tracking (tap-only still works).
5. Durations stay ≤ 300ms. No layout animated properties (no height/width/margin animations).

Exact tab order index map:

```ts
const TAB_ORDER: AppointmentTab[] = ['pending', 'confirmed', 'cancelled'];
// forward = index increases; back = index decreases
```

## Repo conventions to follow

- Directional slide already exists in booking date strip — **imitate this pattern**:

```tsx
/* components/health-service/HealthBookingDateStrip.tsx:178–190 — exemplar */
const navigate = useCallback((delta: number) => {
  directionRef.current = delta > 0 ? 'forward' : 'back';
  setSlideKey((k) => k + 1);
  setWeekAnchor((prev) => addWeeks(prev, delta));
}, []);

const entering = directionRef.current === 'forward' ? FadeInRight.duration(180) : FadeInLeft.duration(180);
const exiting = directionRef.current === 'forward' ? FadeOutLeft.duration(140) : FadeOutRight.duration(140);
```

- Pan + spring reset from home stack cards — velocity / distance:

```ts
/* components/home/AppointmentCardStack.tsx:21–22 — exemplar thresholds */
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 650;
```

For tab swipe, use slightly lower distance so three short panels feel snappy: `TAB_SWIPE_DISTANCE = 56`, keep `TAB_SWIPE_VELOCITY = 650`.

- Stack already has `react-native-reanimated` and `react-native-gesture-handler` — **do not add packages**.

## Steps

1. In `app/(tabs)/appointments.tsx`, import:

```ts
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
```

2. Replace bare `activeTab` updates with a directed setter:

```ts
const TAB_ORDER: AppointmentTab[] = ['pending', 'confirmed', 'cancelled'];
const directionRef = useRef<'forward' | 'back'>('forward');
const [panelKey, setPanelKey] = useState(0);
const reduceMotion = useReducedMotion();

const goToTab = useCallback((next: AppointmentTab, direction: 'forward' | 'back') => {
  setActiveTab((prev) => {
    if (prev === next) return prev;
    directionRef.current = direction;
    setPanelKey((k) => k + 1);
    return next;
  });
}, []);

const goToIndex = useCallback((index: number) => {
  const clamped = Math.max(0, Math.min(TAB_ORDER.length - 1, index));
  const next = TAB_ORDER[clamped];
  const current = TAB_ORDER.indexOf(activeTab);
  if (clamped === current) return;
  goToTab(next, clamped > current ? 'forward' : 'back');
}, [activeTab, goToTab]);
```

3. Pill `onPress`:

```ts
onPress={() => {
  const nextIndex = TAB_ORDER.indexOf(tab.id);
  const current = TAB_ORDER.indexOf(activeTab);
  if (nextIndex === current) return;
  goToTab(tab.id, nextIndex > current ? 'forward' : 'back');
}}
```

4. Wrap the list body (`empty` + cards `View` at ~line 192) in a horizontal pan + animated panel:

```tsx
const dragX = useSharedValue(0);

const pan = Gesture.Pan()
  .activeOffsetX([-24, 24])
  .failOffsetY([-12, 12])
  .onUpdate((e) => {
    if (reduceMotion) return;
    dragX.value = e.translationX * 0.35; // rubber resistance while dragging
  })
  .onEnd((e) => {
    const current = TAB_ORDER.indexOf(activeTab);
    const shouldNext =
      e.translationX < -TAB_SWIPE_DISTANCE || e.velocityX < -TAB_SWIPE_VELOCITY;
    const shouldPrev =
      e.translationX > TAB_SWIPE_DISTANCE || e.velocityX > TAB_SWIPE_VELOCITY;

    if (shouldNext && current < TAB_ORDER.length - 1) {
      runOnJS(goToIndex)(current + 1);
    } else if (shouldPrev && current > 0) {
      runOnJS(goToIndex)(current - 1);
    }
    dragX.value = withSpring(0, { damping: 26, stiffness: 200, mass: 0.85 });
  });
```

Note: `activeTab` cannot be read reliably inside a worklet closure that never updates — capture index via `useSharedValue(activeTabIndex)` updated in `useEffect` when `activeTab` changes, and read that shared value in `onEnd`.

5. Animated panel wrapper:

```tsx
const entering = reduceMotion
  ? undefined
  : directionRef.current === 'forward'
    ? FadeInRight.duration(180).easing(Easing.bezier(0.23, 1, 0.32, 1))
    : FadeInLeft.duration(180).easing(Easing.bezier(0.23, 1, 0.32, 1));
const exiting = reduceMotion
  ? undefined
  : directionRef.current === 'forward'
    ? FadeOutLeft.duration(140).easing(Easing.bezier(0.23, 1, 0.32, 1))
    : FadeOutRight.duration(140).easing(Easing.bezier(0.23, 1, 0.32, 1));

<GestureDetector gesture={pan}>
  <Animated.View style={dragStyle}>
    <Animated.View
      key={panelKey}
      entering={entering}
      exiting={exiting}
      style={{ gap: 12, width: '100%' }}>
      {/* existing empty / cards */}
    </Animated.View>
  </Animated.View>
</GestureDetector>
```

`dragStyle` = `useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }] }))`.

6. Keep the outer vertical `ScrollView` for the title + pills; only the list panel is swipeable. Coordinate with vertical scroll via `.activeOffsetX` / `.failOffsetY` as above so vertical scrolling still works.

7. Optional polish (same file only): when pills change, do **not** animate the pill background with `width` — if adding a sliding pill indicator later, that is out of scope for this plan. Instant pill color swap is OK.

## Boundaries

- Do NOT modify admin/web, Supabase, or home `AppointmentCardStack`.
- Do NOT change appointment filtering / cancel logic.
- Do NOT add dependencies (`pager-view` etc.).
- Do NOT animate layout properties or use `transition: all`.
- Do NOT wire referrals or other tabs.
- Card stagger / press feedback belongs in plan **002** — do not implement press springs here unless already required for GestureDetector children (Pressable stays).

## Verification

- **Mechanical**: `npx tsc --noEmit` (or project typecheck script) passes for touched files; no new lint errors in `appointments.tsx`.
- **Feel check** (device or simulator):
  - Swipe left on cards area: Pending → Confirmed; content exits left, new list enters from right in ~180ms.
  - Swipe right: reverse direction.
  - Edge tabs (first/last) rubber-band back to 0; no crash, no tab overflow.
  - Vertical scroll of a long list still works (pan must fail when gesture is mostly vertical).
  - Tapping Confirmed from Pending uses the same forward slide as a swipe.
  - Enable Reduce Motion (iOS Settings): content fades only; swipe does not drag the panel sideways.
  - Slow the animation in mind: ease-out should feel responsive on enter (fast start), not sluggish.
- **Done when**: all three tabs reachable by swipe and tap with matching directional motion, and reduce-motion path verified.
