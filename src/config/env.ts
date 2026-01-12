/**
 * Environment Configuration
 *
 * Manages API base URLs and environment-specific settings.
 * Update these values based on your backend deployment.
 */

// Determine environment
const getEnvironment = (): "development" | "staging" | "production" => {
  // In development, use __DEV__ flag
  if (__DEV__) {
    return "development";
  }

  // In production builds, you can use Constants.expoConfig.extra.releaseChannel
  // For now, defaulting to staging for non-dev builds
  // TODO: Update this logic based on your build configuration
  return "staging";
};

const environment = getEnvironment();

// API Configuration
export const API_CONFIG = {
  development: {
    BASE_URL: "https://dev-api.africatechnologyexpo.com", // Development server
    TIMEOUT: 30000, // 30 seconds
    WS_URL: "wss://dev-api.africatechnologyexpo.com",
  },
  staging: {
    BASE_URL: "https://dev-api.africatechnologyexpo.com", // Staging server (update when staging URL is available)
    TIMEOUT: 30000,
    WS_URL: "wss://dev-api.africatechnologyexpo.com",
  },
  production: {
    BASE_URL: "https://api.africatechnologyexpo.com", // Production server (update when production URL is available)
    TIMEOUT: 30000,
    WS_URL: "wss://api.africatechnologyexpo.com",
  },
} as const;

// Get current environment config
export const ENV = API_CONFIG[environment];

// CDN Configuration (for images, assets)
export const CDN_CONFIG = {
  development: "http://localhost:3000",
  staging: "https://cdn-staging.spark-events.com",
  production: "https://cdn.spark-events.com",
} as const;

export const CDN_BASE_URL = CDN_CONFIG[environment];

// Event Configuration
// TODO: Consider fetching current event from backend API in the future
export const EVENT_ID = 10;

// Log current environment (only in development)
if (__DEV__) {
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔗 API Base URL: ${ENV.BASE_URL}`);
  console.log(`🎫 Event ID: ${EVENT_ID}`);
}
