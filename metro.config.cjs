const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .mjs files used by @tabler/icons-react-native
config.resolver.sourceExts.push('mjs');

module.exports = config;
