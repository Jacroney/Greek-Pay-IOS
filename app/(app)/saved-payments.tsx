import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CreditCard,
  Building2,
  Trash2,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SavedPaymentMethodsService } from '../../services/savedPaymentMethods';
import { SavedPaymentMethod } from '../../types';
import { MercuryCard } from '../../components/ui/MercuryCard';

export default function SavedPaymentsScreen() {
  const router = useRouter();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    try {
      const data = await SavedPaymentMethodsService.getMethods();
      setMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMethods();
  };

  const handleDelete = (method: SavedPaymentMethod) => {
    const label = `${method.brand || method.type} •••• ${method.last4}`;
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(method.id);
            try {
              await SavedPaymentMethodsService.deleteMethod(method.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMethods((prev) => prev.filter((m) => m.id !== method.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove payment method. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (method: SavedPaymentMethod) => {
    if (method.is_default) return;

    Haptics.selectionAsync();
    try {
      await SavedPaymentMethodsService.setDefault(method.id);
      setMethods((prev) =>
        prev.map((m) => ({ ...m, is_default: m.id === method.id }))
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to set default payment method.');
    }
  };

  const getMethodIcon = (type: string) => {
    return type === 'card'
      ? <CreditCard size={22} color="#374151" />
      : <Building2 size={22} color="#374151" />;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Payment Methods</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#214384" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Payment Methods</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#214384" />
        }
      >
        {methods.length === 0 ? (
          <View className="mx-4 mt-8 items-center">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <CreditCard size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 font-semibold text-lg">No Saved Methods</Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              Payment methods are saved automatically when you make a payment.
            </Text>
          </View>
        ) : (
          <View className="mx-4 mt-4">
            {methods.map((method) => (
              <View key={method.id} className="mb-3">
                <MercuryCard>
                  <View className="flex-row items-center">
                    {/* Icon */}
                    <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center">
                      {getMethodIcon(method.type)}
                    </View>

                    {/* Details */}
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="font-semibold text-gray-900">
                          {method.brand || (method.type === 'card' ? 'Card' : 'Bank Account')}
                        </Text>
                        {method.is_default && (
                          <View className="ml-2 bg-primary-soft px-2 py-0.5 rounded-full">
                            <Text className="text-xs text-primary font-medium">Default</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-gray-500 mt-0.5">
                        •••• {method.last4}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center">
                      {!method.is_default && (
                        <TouchableOpacity
                          className="p-2 mr-1"
                          onPress={() => handleSetDefault(method)}
                        >
                          <Star size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        className="p-2"
                        onPress={() => handleDelete(method)}
                        disabled={deletingId === method.id}
                      >
                        {deletingId === method.id ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <Trash2 size={18} color="#DC2626" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </MercuryCard>
              </View>
            ))}
          </View>
        )}

        {/* Info Note */}
        <View className="mx-4 mt-4 p-4 bg-gray-100 rounded-xl">
          <Text className="text-xs text-gray-500 text-center">
            Payment methods are saved securely by Stripe when you make a payment.
            Tap the star to set a default method for faster checkout.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
