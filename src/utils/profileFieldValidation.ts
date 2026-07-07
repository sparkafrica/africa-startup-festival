export const validateEventGoals = (
  goals: string
): { valid: boolean; error?: string } => {
  if (!goals.trim()) {
    return { valid: false, error: "Tell us what you hope to get from the event" };
  }
  if (goals.trim().length < 10) {
    return {
      valid: false,
      error: "Please add a bit more detail (at least 10 characters)",
    };
  }
  if (goals.trim().length > 300) {
    return { valid: false, error: "Keep this under 300 characters" };
  }
  return { valid: true };
};

export const validateIndustriesToMeet = (
  industries: string[]
): { valid: boolean; error?: string } => {
  if (industries.length < 5) {
    return {
      valid: false,
      error: "Select at least 5 industries you want to meet",
    };
  }
  if (industries.length > 12) {
    return { valid: false, error: "Select at most 12 industries" };
  }
  return { valid: true };
};
