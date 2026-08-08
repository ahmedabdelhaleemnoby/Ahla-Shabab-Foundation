import React from 'react';
import { View, ActivityIndicator, Platform, I18nManager } from 'react-native';

// The app handles RTL explicitly (row-reverse / textAlign:right) for every component.
// Letting Android auto-flip the layout system when the device is in Arabic mode causes
// a double-flip that makes everything appear LTR. Lock the layout engine to LTR here,
// at module load time (before any component renders).
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);
import { enableScreens } from 'react-native-screens';

// react-native-screens renders stacked routes incorrectly on web — use the JS fallback there.
if (Platform.OS === 'web') enableScreens(false);
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { configureApi } from '@ahla/shared';
import { getAccessToken, restoreSession, getSessionEmail } from './src/store/session';
import { registerForPush } from './src/store/push';
import { appState } from './src/store/appState';
import { hydrateCms } from './src/store/cms';
import { hydrateContent } from './src/store/content';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';

import { colors } from './src/theme';
import { AppDrawer } from './src/components/AppDrawer';
import { navRef } from './src/navigation/ref';
import type { RootStackParamList, TabParamList } from './src/navigation/types';

import HomeScreen from './src/screens/HomeScreen';
import CasesScreen from './src/screens/CasesScreen';
import DonateScreen from './src/screens/DonateScreen';
import NewsScreen from './src/screens/NewsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OurServicesScreen from './src/screens/OurServicesScreen';
import UrgentCasesScreen from './src/screens/UrgentCasesScreen';
import SponsorshipScreen from './src/screens/SponsorshipScreen';
import ConsultationRequestScreen from './src/screens/ConsultationRequestScreen';
import PaymentInfoScreen from './src/screens/PaymentInfoScreen';
import CmsPageScreen from './src/screens/CmsPageScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import CaseDetailScreen from './src/screens/CaseDetailScreen';
import ConsultationsScreen from './src/screens/ConsultationsScreen';
import BookingScreen from './src/screens/BookingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import EmailAuthScreen from './src/screens/EmailAuthScreen';
import OtpScreen from './src/screens/OtpScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import DonationSuccessScreen from './src/screens/DonationSuccessScreen';
import NewsFeedScreen from './src/screens/NewsFeedScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import VolunteerScreen from './src/screens/VolunteerScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import LanguageScreen from './src/screens/LanguageScreen';
import DonationHistoryScreen from './src/screens/DonationHistoryScreen';
import ZakatCalculatorScreen from './src/screens/ZakatCalculatorScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FaqScreen from './src/screens/FaqScreen';
import ReceiptsScreen from './src/screens/ReceiptsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ServicesBrowseScreen from './src/screens/ServicesBrowseScreen';
import ProviderDetailScreen from './src/screens/ProviderDetailScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import GovernorateActivityScreen from './src/screens/GovernorateActivityScreen';
import ConsultantDashboardScreen from './src/screens/ConsultantDashboardScreen';

// Native stack renders stacked routes incorrectly on react-native-web — use the JS stack there.
// (Runtime-only switch; cast keeps a single callable type for TS.)
const createAppStack = (Platform.OS === 'web' ? createStackNavigator : createNativeStackNavigator) as typeof createNativeStackNavigator;
const Stack = createAppStack<RootStackParamList>();

// Test/dev-only navigation hook (no-op in release builds where __DEV__ is false).
export { navRef };
if (__DEV__) (globalThis as unknown as { __nav?: typeof navRef }).__nav = navRef;
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, primary: colors.navy700 },
};

import { TabBar } from './src/components/TabBar';

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cases" component={CasesScreen} />
      <Tab.Screen name="UrgentCases" component={UrgentCasesScreen} />
      <Tab.Screen name="Donate" component={DonateScreen} />
      <Tab.Screen name="Consultations" component={ConsultationsScreen} />
      <Tab.Screen name="About" component={NewsScreen} />
    </Tab.Navigator>
  );
}

/**
 * Point the shared API client at the backend.
 *
 * Done here rather than inside the client because Metro exposes
 * `process.env.EXPO_PUBLIC_*` while Vite exposes `import.meta.env` — referencing
 * either inside `@ahla/shared` breaks the other bundler. Override the host with
 * EXPO_PUBLIC_API_BASE; the client's own default is used when it is unset.
 */
configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE,
  // Bearer token for every authenticated request. Sync by contract, which is
  // why `session` keeps an in-memory mirror of the keystore value.
  getToken: getAccessToken,
  onError: (info) => {
    // Visible in dev, silent in release. A fallback is not an error the user
    // should see, but it must not vanish either.
    if (__DEV__) console.warn(`[api] ${info.endpoint}: ${info.message}${info.fellBack ? ' (used bundled content)' : ''}`);
  },
});

export default function App() {
  const [loaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });

  /*
   * Load the CMS and the public content BEFORE the first screen renders.
   *
   * Every store getter is synchronous because the screens call them during
   * render; hydrating behind the existing font gate means they return API data
   * from the first frame, so no screen needed a loading state or an async
   * rewrite. Neither hydrate call rejects — each degrades to the bundled
   * content — so a backend outage costs a slower boot, never a blank app.
   */
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    // `restoreSession` rotates a stored token pair so a returning user is still
    // signed in on the first frame. Like the content hydrators it never rejects:
    // an expired or revoked session simply clears itself and the app opens as a guest.
    Promise.all([
      hydrateCms(),
      hydrateContent(),
      // Restoring the keystore session must also re-enter it into appState, or
      // the app would hold a valid token while every LoginGate still treated
      // the user as a guest.
      restoreSession().then((ok) => {
        if (ok) {
          appState.login(getSessionEmail() ?? '');
          // A returning user never passes through the OTP screen, so this is the
          // only place their device gets re-registered. FCM rotates tokens and
          // the server drops ones it cannot deliver to, so skipping this would
          // leave long-lived sessions quietly unreachable.
          void registerForPush();
        }
      }),
    ])
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.navy700} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer ref={navRef} theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={Tabs} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
          <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
          <Stack.Screen name="Cases" component={CasesScreen} />
          <Stack.Screen name="UrgentCases" component={UrgentCasesScreen} />
          <Stack.Screen name="Sponsorship" component={SponsorshipScreen} />
          <Stack.Screen name="About" component={NewsScreen} />
          <Stack.Screen name="ConsultationRequest" component={ConsultationRequestScreen} />
          <Stack.Screen name="PaymentInfo" component={PaymentInfoScreen} />
          <Stack.Screen name="CmsPage" component={CmsPageScreen} />
          <Stack.Screen name="Consultations" component={ConsultationsScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="Projects" component={ProjectsScreen} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          <Stack.Screen name="DonationSuccess" component={DonationSuccessScreen} />
          <Stack.Screen name="NewsFeed" component={NewsFeedScreen} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
          <Stack.Screen name="Volunteer" component={VolunteerScreen} />
          <Stack.Screen name="ContactUs" component={ContactUsScreen} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
          <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="DonationHistory" component={DonationHistoryScreen} />
          <Stack.Screen name="ZakatCalculator" component={ZakatCalculatorScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Faq" component={FaqScreen} />
          <Stack.Screen name="Receipts" component={ReceiptsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="ServicesBrowse" component={ServicesBrowseScreen} />
          <Stack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
          <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
          <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
          <Stack.Screen name="GovernorateActivity" component={GovernorateActivityScreen} />
          <Stack.Screen name="ConsultantDashboard" component={ConsultantDashboardScreen} />
        </Stack.Navigator>
        <AppDrawer />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
