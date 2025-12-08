const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolve nativewind/jsx-dev-runtime to react/jsx-dev-runtime for NativeWind v2 compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'nativewind/jsx-dev-runtime') {
    return {
      filePath: require.resolve('react/jsx-dev-runtime'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'nativewind/jsx-runtime') {
    return {
      filePath: require.resolve('react/jsx-runtime'),
      type: 'sourceFile',
    };
  }
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

