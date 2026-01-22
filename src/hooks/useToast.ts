import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
    duration: 3000,
  });

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration?: number) => {
      // Calculate duration based on message length for better readability
      // Base duration: 3000ms for short messages (< 50 chars)
      // For longer messages, add extra time based on character count
      // Average reading speed: ~200 words/min = ~1000 chars/min = ~17 chars/sec
      // Add buffer time for comprehension
      let calculatedDuration = duration;
      if (!calculatedDuration) {
        const baseDuration = 3000; // 3 seconds for short messages
        const charCount = message.length;
        if (charCount < 50) {
          calculatedDuration = baseDuration;
        } else if (charCount < 100) {
          calculatedDuration = 4500; // 4.5 seconds
        } else if (charCount < 150) {
          calculatedDuration = 6000; // 6 seconds
        } else if (charCount < 200) {
          calculatedDuration = 7500; // 7.5 seconds
        } else {
          // For very long messages, calculate based on reading time
          const readingTime = (charCount / 17) * 1000; // chars / chars per second * 1000ms
          calculatedDuration = Math.max(8000, Math.min(readingTime + 2000, 12000)); // Between 8-12 seconds
        }
      }
      
      setToast({
        message,
        type,
        visible: true,
        duration: calculatedDuration,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}


