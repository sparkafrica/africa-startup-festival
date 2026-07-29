import { useEffect } from "react";
import { AppState, Keyboard, type AppStateStatus } from "react-native";

/**
 * Dismisses the keyboard when the app leaves the foreground.
 * Avoids iOS layout glitches (blank white screen on return) when users
 * switch apps mid-form — common with third-party keyboards (e.g. Grammarly).
 */
export function useDismissKeyboardOnBackground(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          Keyboard.dismiss();
        }
      },
    );
    return () => subscription.remove();
  }, []);
}
