# Animation plans

Plans from `improve-animations` for CampusCare mobile. Execute with an agent (`improve-animations execute <plan>` or any implementer agent). Do not improvise values — follow each plan’s Target section.

| # | Title | Severity | Status | Depends on |
| --- | --- | --- | --- | --- |
| 001 | Appointments status tabs: horizontal swipe + directional slide | HIGH | DONE | — |
| 002 | Appointment list cards: staggered enter + press scale | MEDIUM | DONE | Best after 001 (stagger replays on tab `panelKey`) |

## Recommended order

1. **001** — swipe + directional panel (highest leverage; removes teleport between Pending / Confirmed / Cancelled).
2. **002** — card enter stagger + press scale (pairs with 001 remount).

## Notes

- Stack: Expo Router + React Native + Reanimated 4 + Gesture Handler (already installed).
- Personality: crisp campus clinic app — short easings, light springs, no playful bounce on list chrome.
- Repo exemplars cited in plans: `HealthBookingDateStrip`, `fadeSlideUp.ts`, `QuickActionPill`, `AppointmentCardStack`.
