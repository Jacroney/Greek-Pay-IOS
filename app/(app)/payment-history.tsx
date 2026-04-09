import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, DollarSign } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { DuesService } from '../../services/dues';
import { DuesPayment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { PaymentHistorySkeleton } from '../../components/ui/SkeletonLoader';

export default function PaymentHistoryScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<DuesPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPayments = async () => {
    if (!profile?.id) return;

    try {
      const data = await DuesService.getPaymentHistory(profile.id);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [profile?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPayments();
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case 'Credit Card':
      case 'card':
        return '💳';
      case 'ACH':
      case 'us_bank_account':
        return '🏦';
      case 'Venmo':
        return '📱';
      case 'Zelle':
        return '⚡';
      case 'Cash':
        return '💵';
      case 'Check':
        return '📝';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">Payment History</Text>
        </View>
        <PaymentHistorySkeleton />
      </SafeAreaView>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Payment History</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#214384" />
        }
      >
        {/* Summary Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-emerald-100 rounded-2xl items-center justify-center">
              <DollarSign size={28} color="#059669" />
            </View>
            <View className="ml-4">
              <Text className="text-sm text-gray-500">Total Paid</Text>
              <Text className="text-3xl font-bold text-emerald-600">
                {formatCurrency(totalPaid)}
              </Text>
            </View>
          </View>
          <View className="flex-row mt-4 pt-4 border-t border-gray-100">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{payments.length}</Text>
              <Text className="text-sm text-gray-500">Total Payments</Text>
            </View>
          </View>
        </View>

        {/* Payment List */}
        <View className="mx-4 mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">All Payments</Text>

          {payments.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <CreditCard size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">No payments recorded yet</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {payments.map((payment) => (
                <View
                  key={payment.id}
                  className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
                >
                  <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center">
                    <Text className="text-2xl">{getPaymentMethodIcon(payment.payment_method)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </Text>
                    <Text className="text-sm text-gray-500">{formatDate(payment.payment_date)}</Text>
                    {payment.payment_method && (
                      <Text className="text-xs text-gray-400 mt-0.5">
                        via {payment.payment_method}
                      </Text>
                    )}
                  </View>
                  <View className="bg-emerald-50 px-2.5 py-1 rounded-full">
                    <Text className="text-xs font-medium text-emerald-700">Paid</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
