import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, getYearLabel } from '../../utils/format';
import { UserProfile } from '../../types';

const YEAR_OPTIONS = [
  { value: '1', label: 'Freshman' },
  { value: '2', label: 'Sophomore' },
  { value: '3', label: 'Junior' },
  { value: '4', label: 'Senior' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Alumni', label: 'Alumni' },
];

export default function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [year, setYear] = useState(profile?.year || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const hasChanges =
    fullName !== (profile?.full_name || '') ||
    phoneNumber !== (profile?.phone_number || '') ||
    year !== (profile?.year || '') ||
    major !== (profile?.major || '');

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        year: (year as UserProfile['year']) || undefined,
        major: major.trim() || undefined,
      };

      const success = await updateProfile(updates);

      if (success) {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Edit Profile</Text>
        </View>
        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" />
                <Text className="text-white font-medium ml-1">Save</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Avatar */}
          <View className="items-center py-8">
            <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center">
              <Text className="text-white text-3xl font-bold">
                {getInitials(fullName || profile?.full_name)}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="mx-4 space-y-4">
            {/* Email (Read-only) */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3.5">
                <Text className="text-gray-500">{profile?.email}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">Email cannot be changed</Text>
            </View>

            {/* Full Name */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
              <TextInput
                className="bg-surface-bg border border-gray-200/50 rounded-xl px-4 py-3.5 text-gray-900"
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Phone Number */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
              <TextInput
                className="bg-surface-bg border border-gray-200/50 rounded-xl px-4 py-3.5 text-gray-900"
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            {/* Year */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
              <TouchableOpacity
                className="bg-surface-bg border border-gray-200/50 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                onPress={() => setShowYearPicker(!showYearPicker)}
              >
                <Text className={year ? 'text-gray-900' : 'text-gray-400'}>
                  {year ? getYearLabel(year) : 'Select your year'}
                </Text>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>

              {showYearPicker && (
                <View className="bg-white border border-gray-200/50 rounded-xl mt-2 overflow-hidden">
                  {YEAR_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-3 border-b border-gray-100 flex-row items-center justify-between ${
                        year === option.value ? 'bg-primary-soft' : ''
                      }`}
                      onPress={() => {
                        setYear(option.value);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text
                        className={`${
                          year === option.value ? 'text-primary font-medium' : 'text-gray-900'
                        }`}
                      >
                        {option.label}
                      </Text>
                      {year === option.value && <Check size={18} color="#214384" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Major */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
              <TextInput
                className="bg-surface-bg border border-gray-200/50 rounded-xl px-4 py-3.5 text-gray-900"
                placeholder="Enter your major"
                placeholderTextColor="#9CA3AF"
                value={major}
                onChangeText={setMajor}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Position (Read-only) */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Position</Text>
              <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3.5">
                <Text className="text-gray-500">{profile?.position || 'Member'}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">Contact admin to change position</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
