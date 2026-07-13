import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * App-wide navigation ref. Lets non-screen UI (the sidebar drawer) and the
 * dev-only test hook navigate without a screen's navigation prop.
 */
export const navRef = createNavigationContainerRef<RootStackParamList>();
