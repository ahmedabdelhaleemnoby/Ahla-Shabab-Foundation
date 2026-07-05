// Metro config tuned for the npm-workspaces monorepo so the mobile app can
// resolve and live-reload the shared @ahla/shared package.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so edits to /shared trigger fast refresh.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force single copies of React & React Native from mobile/node_modules to prevent duplicate
// React issues ("Invalid hook call") when monorepo root has React 18 for dashboard.
const mobileEntryPoint = path.join(projectRoot, 'index.ts');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-dom' ||
    moduleName.startsWith('react-dom/') ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react-native/') ||
    moduleName === 'react-native-web' ||
    moduleName.startsWith('react-native-web/')
  ) {
    // Force Metro to resolve react/react-native/react-dom as if imported from mobile/index.ts
    return context.resolveRequest(
      {
        ...context,
        originModulePath: mobileEntryPoint,
      },
      moduleName,
      platform
    );
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
