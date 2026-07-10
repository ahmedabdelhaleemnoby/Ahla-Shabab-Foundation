import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

// react-native-screens renders stacked routes incorrectly on web — use the JS fallback there.
if (Platform.OS === 'web') enableScreens(false);
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { TabBar } from './src/components/TabBar';
import type { RootStackParamList, TabParamList } from './src/navigation/types';

import HomeScreen from './src/screens/HomeScreen';
import CasesScreen from './src/screens/CasesScreen';
import DonateScreen from './src/screens/DonateScreen';
import NewsScreen from './src/screens/NewsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import CaseDetailScreen from './src/screens/CaseDetailScreen';
import ConsultationsScreen from './src/screens/ConsultationsScreen';
import BookingScreen from './src/screens/BookingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
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

// Native stack renders stacked routes incorrectly on react-native-web — use the JS stack there.
// (Runtime-only switch; cast keeps a single callable type for TS.)
const createAppStack = (Platform.OS === 'web' ? createStackNavigator : createNativeStackNavigator) as typeof createNativeStackNavigator;
const Stack = createAppStack<RootStackParamList>();

// Test/dev-only navigation hook (no-op in release builds where __DEV__ is false).
export const navRef = createNavigationContainerRef<RootStackParamList>();
if (__DEV__) (globalThis as unknown as { __nav?: typeof navRef }).__nav = navRef;
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, primary: colors.navy700 },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
      // Visual RTL order is handled inside TabBar (row-reverse); keep logical order here.
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={CasesScreen} />
      <Tab.Screen name="Donate" component={DonateScreen} />
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });

  if (!loaded) {
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
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
          <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
          <Stack.Screen name="Consultations" component={ConsultationsScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
