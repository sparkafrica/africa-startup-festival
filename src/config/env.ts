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
    BASE_URL: "http://localhost:3000/api", // Local development
    TIMEOUT: 30000, // 30 seconds
    WS_URL: "ws://localhost:3000",
  },
  staging: {
    BASE_URL: "https://api-staging.spark-events.com/api", // Staging server
    TIMEOUT: 30000,
    WS_URL: "wss://api-staging.spark-events.com",
  },
  production: {
    BASE_URL: "https://api.spark-events.com/api", // Production server
    TIMEOUT: 30000,
    WS_URL: "wss://api.spark-events.com",
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

// Log current environment (only in development)
if (__DEV__) {
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔗 API Base URL: ${ENV.BASE_URL}`);
}
