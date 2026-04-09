import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { MercuryCard } from '../../components/ui/MercuryCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { IconInput } from '../../components/ui/IconInput';

const PRIVACY_POLICY_URL = 'https://greekpay.org/privacy';
const TERMS_OF_SERVICE_URL = 'https://greekpay.org/terms';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      const { success, error } = await signIn({ email: email.trim(), password });

      if (success) {
        router.replace('/(app)/dashboard');
      } else {
        Alert.alert('Login Failed', error || 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12 pb-8">
            {/* Logo / Header */}
            <View className="items-center mb-12">
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 96, height: 96, borderRadius: 20 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-gray-900 mt-4">GreekPay</Text>
              <Text className="text-gray-500 mt-2">Member Portal</Text>
            </View>

            {/* Login Form */}
            <MercuryCard elevated>
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <IconInput
                    icon={<Mail size={18} color="#535461" />}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>

                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                  <IconInput
                    icon={<Lock size={18} color="#535461" />}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isSubmitting}
                  />
                </View>

                <View className="mt-6">
                  <GradientButton
                    title="Sign In"
                    onPress={handleLogin}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  />
                </View>

                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity className="mt-4 items-center">
                    <Text className="text-primary font-medium">Forgot password?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </MercuryCard>

            {/* Footer */}
            <View className="mt-auto pt-8">
              <Text className="text-center text-gray-400 text-sm">
                By signing in, you agree to our{' '}
                <Text
                  className="text-primary"
                  onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  className="text-primary"
                  onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                >
                  Privacy Policy
                </Text>
              </Text>
              <Text className="text-center text-gray-400 text-xs mt-3">
                Contact your chapter admin if you need help signing in
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
