import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  Mail,
  LogOut,
  ExternalLink,
  Lock,
  Fingerprint,
  Bell,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { MercuryCard } from '../../components/ui/MercuryCard';
import { BiometricService } from '../../services/biometric';
import { NotificationService } from '../../services/notifications';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

const PRIVACY_POLICY_URL = 'https://greekpay.org/privacy';
const TERMS_OF_SERVICE_URL = 'https://greekpay.org/terms';
const SUPPORT_EMAIL = 'joseph@greekpay.org';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, profile, user } = useAuth();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Biometric
    const available = await BiometricService.isAvailable();
    setBiometricAvailable(available);
    if (available) {
      const enabled = await BiometricService.isEnabled();
      setBiometricEnabled(enabled);
      const type = await BiometricService.getBiometricType();
      setBiometricType(type);
    }

    // Notifications
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const toggleBiometric = async (value: boolean) => {
    Haptics.selectionAsync();
    if (value) {
      // Verify biometric works before enabling
      const success = await BiometricService.authenticate(`Enable ${biometricType}`);
      if (success) {
        await BiometricService.setEnabled(true);
        setBiometricEnabled(true);
      }
    } else {
      await BiometricService.setEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    Haptics.selectionAsync();
    if (value) {
      const token = await NotificationService.registerForPushNotifications();
      if (token && user) {
        await NotificationService.savePushToken(user.id, token);
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device Settings to receive payment reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else {
      if (user) {
        await NotificationService.removePushToken(user.id);
      }
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications Off',
        'You can re-enable notifications at any time. To fully disable, also turn off notifications in device Settings.'
      );
    }
  };

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleContactSupport = () => {
    const subject = 'Question about dues';
    const body = `Hi,\n\nI have a question about my dues balance.\n\nBest regards,\n${profile?.full_name || ''}`;
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Security Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            Security
          </Text>
          <View className="mx-4">
            <MercuryCard style={{ padding: 0 }}>
              {biometricAvailable && (
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <View className="w-9 h-9 bg-primary-soft rounded-lg items-center justify-center">
                      <Fingerprint size={20} color="#214384" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">{biometricType}</Text>
                      <Text className="text-gray-500 text-xs">Unlock app with {biometricType}</Text>
                    </View>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={toggleBiometric}
                    trackColor={{ false: '#D1D5DB', true: '#214384' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <View className="w-9 h-9 bg-amber-100 rounded-lg items-center justify-center">
                    <Bell size={20} color="#D97706" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-medium">Push Notifications</Text>
                    <Text className="text-gray-500 text-xs">Payment reminders & updates</Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#214384' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </MercuryCard>
          </View>
        </View>

        {/* Legal Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            Legal
          </Text>
          <View className="mx-4">
            <MercuryCard style={{ padding: 0 }}>
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                onPress={() => openLink(PRIVACY_POLICY_URL)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-primary-soft rounded-lg items-center justify-center">
                    <Shield size={20} color="#214384" />
                  </View>
                  <Text className="text-gray-900 font-medium ml-3">Privacy Policy</Text>
                </View>
                <ExternalLink size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                onPress={() => openLink(TERMS_OF_SERVICE_URL)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-purple-100 rounded-lg items-center justify-center">
                    <FileText size={20} color="#7C3AED" />
                  </View>
                  <Text className="text-gray-900 font-medium ml-3">Terms of Service</Text>
                </View>
                <ExternalLink size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </MercuryCard>
          </View>
        </View>

        {/* Support Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            Support
          </Text>
          <View className="mx-4">
            <MercuryCard style={{ padding: 0 }}>
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-emerald-100 rounded-lg items-center justify-center">
                    <Mail size={20} color="#059669" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-900 font-medium">Contact Support</Text>
                    <Text className="text-gray-500 text-sm">{SUPPORT_EMAIL}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </MercuryCard>
          </View>
        </View>

        {/* Account Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide px-4 mb-2">
            Account
          </Text>
          <View className="mx-4">
            <MercuryCard style={{ padding: 0 }}>
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                onPress={() => router.push('/(app)/change-password')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-amber-100 rounded-lg items-center justify-center">
                    <Lock size={20} color="#D97706" />
                  </View>
                  <Text className="text-gray-900 font-medium ml-3">Change Password</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 bg-rose-100 rounded-lg items-center justify-center">
                    <LogOut size={20} color="#DC2626" />
                  </View>
                  <Text className="text-rose-600 font-medium ml-3">Sign Out</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </MercuryCard>
          </View>
        </View>

        {/* App Info */}
        <View className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">GreekPay Member Portal</Text>
          <Text className="text-gray-400 text-sm mt-1">Version {appVersion}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
