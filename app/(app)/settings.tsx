import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
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
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { MercuryCard } from '../../components/ui/MercuryCard';
import Constants from 'expo-constants';

const PRIVACY_POLICY_URL = 'https://greekpay.org/privacy';
const TERMS_OF_SERVICE_URL = 'https://greekpay.org/terms';
const SUPPORT_EMAIL = 'support@greekpay.org';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

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
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Greek Pay App Support`);
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
                    <Shield size={20} color="#5266eb" />
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
