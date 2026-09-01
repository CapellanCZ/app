import * as SplashScreen from 'expo-splash-screen';

let preventAutoHideCalled = false;
let splashHidden = false;

/** Call once at app entry before React renders. */
export function prepareSplashScreen(): void {
  if (preventAutoHideCalled) return;
  preventAutoHideCalled = true;
  void SplashScreen.preventAutoHideAsync().catch(() => {
    // Already hidden on reload — safe to ignore.
  });
}

/**
 * Hide the native splash once. Safe to call from any screen; iOS modals
 * may throw if hide runs on a child view controller — we swallow that.
 */
export async function hideSplashScreenOnce(): Promise<void> {
  if (splashHidden) return;

  try {
    await SplashScreen.hideAsync();
  } catch {
    // iOS: "No native splash screen registered for given view controller"
    // when hide runs after navigating to a modal stack.
  } finally {
    splashHidden = true;
  }
}
