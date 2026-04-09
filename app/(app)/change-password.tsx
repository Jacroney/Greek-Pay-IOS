import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { AuthService } from '../../services/auth';
import { MercuryCard } from '../../components/ui/MercuryCard';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: '#DC2626', bg: 'bg-rose-500', width: '33%' };
  if (score <= 4) return { label: 'Medium', color: '#D97706', bg: 'bg-amber-500', width: '66%' };
  return { label: 'Strong', color: '#059669', bg: 'bg-emerald-500', width: '100%' };
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /[0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRequirementsMet && passwordsMatch && !isSubmitting;
  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const { error } = await AuthService.updatePassword(newPassword);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to update password');
      } else {
        Alert.alert('Success', 'Your password has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Change Password</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mx-4 mt-6">
          <MercuryCard>
            {/* New Password */}
            <Text className="text-sm font-medium text-gray-700 mb-1">New Password</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-2">
              <TextInput
                className="flex-1 text-gray-900 text-base"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} className="ml-2">
                {showNew ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {/* Strength Bar */}
            {newPassword.length > 0 && (
              <View className="mb-4">
                <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <View
                    className={`h-full ${strength.bg} rounded-full`}
                    style={{ width: strength.width as any }}
                  />
                </View>
                <Text className="text-xs font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* Requirements Checklist */}
            <View className="mb-4">
              {requirements.map((req) => (
                <View key={req.label} className="flex-row items-center mb-1.5">
                  {req.met ? (
                    <Check size={14} color="#059669" />
                  ) : (
                    <X size={14} color="#9CA3AF" />
                  )}
                  <Text
                    className={`ml-2 text-xs ${req.met ? 'text-emerald-700' : 'text-gray-500'}`}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Confirm Password */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-2">
              <TextInput
                className="flex-1 text-gray-900 text-base"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="ml-2">
                {showConfirm ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && (
              <Text
                className={`text-xs mb-4 ${passwordsMatch ? 'text-emerald-700' : 'text-rose-600'}`}
              >
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            )}

            {/* Submit */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-2 ${
                canSubmit ? 'bg-primary' : 'bg-gray-300'
              }`}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Change Password</Text>
              )}
            </TouchableOpacity>
          </MercuryCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
