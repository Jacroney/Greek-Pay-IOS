import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { BiometricService } from '../services/biometric';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // User has a session — check if biometric is enabled
    checkBiometric();
  }, [isAuthenticated, isLoading]);

  const checkBiometric = async () => {
    const enabled = await BiometricService.isEnabled();
    const available = await BiometricService.isAvailable();

    if (enabled && available) {
      const type = await BiometricService.getBiometricType();
      setBiometricType(type);
      setBiometricRequired(true);
      setChecking(false);
      // Auto-prompt on first load
      attemptBiometric();
    } else {
      // No biometric lock — go straight to dashboard
      router.replace('/(app)/dashboard');
    }
  };

  const attemptBiometric = async () => {
    const success = await BiometricService.authenticate();
    if (success) {
      router.replace('/(app)/dashboard');
    }
  };

  if (isLoading || (checking && isAuthenticated)) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-bg">
        <ActivityIndicator size="large" color="#214384" />
      </View>
    );
  }

  // Biometric lock screen
  if (biometricRequired) {
    return (
      <SafeAreaView className="flex-1 bg-surface-bg">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-6 p-3">
            <Image
              source={require('../assets/logo.png')}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">GreekPay</Text>
          <Text className="text-gray-500 text-center mb-8">
            Use {biometricType} to unlock
          </Text>

          <TouchableOpacity
            className="w-20 h-20 bg-primary-soft rounded-full items-center justify-center mb-4"
            onPress={attemptBiometric}
            activeOpacity={0.7}
          >
            <Fingerprint size={40} color="#214384" />
          </TouchableOpacity>

          <TouchableOpacity onPress={attemptBiometric}>
            <Text className="text-primary font-medium">Tap to unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-surface-bg">
      <ActivityIndicator size="large" color="#214384" />
    </View>
  );
}
