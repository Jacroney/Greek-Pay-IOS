import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { PaymentService } from '../../../services/payments';
import { DuesService } from '../../../services/dues';
import { MemberDuesSummary } from '../../../types';
import { formatCurrency } from '../../../utils/format';

type PaymentStep = 'loading' | 'review' | 'processing' | 'success' | 'error';

export default function PaymentScreen() {
  const { duesId } = useLocalSearchParams<{ duesId: string }>();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [step, setStep] = useState<PaymentStep>('loading');
  const [dues, setDues] = useState<MemberDuesSummary | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    clientSecret: string;
    duesAmount: number;
    stripeFee: number;
    platformFee: number;
    totalCharge: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    loadDuesAndCreatePaymentIntent();
  }, [duesId]);

  const loadDuesAndCreatePaymentIntent = async () => {
    try {
      // Get dues info
      const summary = await DuesService.getMemberDuesSummaryByEmail('');
      const duesItem = summary.find((d) => d.id === duesId);

      if (!duesItem) {
        setErrorMessage('Dues record not found');
        setStep('error');
        return;
      }

      setDues(duesItem);

      // Create payment intent
      const result = await PaymentService.createPaymentIntent(
        duesId,
        duesItem.balance,
        'card'
      );

      if (!result.success || !result.client_secret) {
        setErrorMessage(result.error || 'Failed to initialize payment');
        setStep('error');
        return;
      }

      setPaymentDetails({
        clientSecret: result.client_secret,
        duesAmount: result.dues_amount || duesItem.balance,
        stripeFee: result.stripe_fee || 0,
        platformFee: result.platform_fee || 0,
        totalCharge: result.total_charge || duesItem.balance,
      });

      // Initialize Stripe payment sheet
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: result.client_secret,
        merchantDisplayName: 'GreekPay',
        style: 'automatic',
      });

      if (error) {
        setErrorMessage(error.message);
        setStep('error');
        return;
      }

      setStep('review');
    } catch (error) {
      console.error('Error loading payment:', error);
      setErrorMessage('An unexpected error occurred');
      setStep('error');
    }
  };

  const handlePayment = async () => {
    setStep('processing');

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === 'Canceled') {
        setStep('review');
      } else {
        setErrorMessage(error.message);
        setStep('error');
      }
      return;
    }

    setStep('success');
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 mt-4">Preparing payment...</Text>
          </View>
        );

      case 'review':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Payment Summary Card */}
            <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</Text>

              <View className="space-y-3">
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600">Dues Amount</Text>
                  <Text className="font-medium text-gray-900">
                    {formatCurrency(paymentDetails?.duesAmount || 0)}
                  </Text>
                </View>

                {(paymentDetails?.stripeFee || 0) > 0 && (
                  <View className="flex-row justify-between py-2">
                    <Text className="text-gray-600">Processing Fee</Text>
                    <Text className="font-medium text-gray-900">
                      {formatCurrency(paymentDetails?.stripeFee || 0)}
                    </Text>
                  </View>
                )}

                <View className="border-t border-gray-200 pt-3 mt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-lg font-semibold text-gray-900">Total</Text>
                    <Text className="text-lg font-bold text-blue-600">
                      {formatCurrency(paymentDetails?.totalCharge || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Period Info */}
            {dues && (
              <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                <Text className="text-sm text-gray-500 mb-1">Payment For</Text>
                <Text className="font-semibold text-gray-900">{dues.period_name}</Text>
                <Text className="text-sm text-gray-600 mt-1">{dues.chapter_name}</Text>
              </View>
            )}

            {/* Security Note */}
            <View className="mx-4 mt-4 p-4 bg-gray-100 rounded-xl">
              <Text className="text-xs text-gray-500 text-center">
                🔒 Your payment is secured by Stripe. Your card details are never stored on our
                servers.
              </Text>
            </View>

            {/* Pay Button */}
            <View className="mx-4 mt-6">
              <TouchableOpacity
                className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
                onPress={handlePayment}
                activeOpacity={0.8}
              >
                <CreditCard size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  Pay {formatCurrency(paymentDetails?.totalCharge || 0)}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'processing':
        return (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 mt-4">Processing payment...</Text>
          </View>
        );

      case 'success':
        return (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color="#059669" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">Payment Successful!</Text>
            <Text className="text-gray-500 text-center mt-3">
              Your payment of {formatCurrency(paymentDetails?.totalCharge || 0)} has been processed
              successfully.
            </Text>
            <TouchableOpacity
              className="mt-8 bg-blue-600 py-4 px-8 rounded-xl"
              onPress={() => router.replace('/(app)/dashboard')}
            >
              <Text className="text-white font-semibold">Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 bg-rose-100 rounded-full items-center justify-center mb-6">
              <AlertCircle size={40} color="#DC2626" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">Payment Failed</Text>
            <Text className="text-gray-500 text-center mt-3">{errorMessage}</Text>
            <View className="flex-row mt-8 space-x-4">
              <TouchableOpacity
                className="bg-gray-200 py-3 px-6 rounded-xl"
                onPress={() => router.back()}
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 py-3 px-6 rounded-xl"
                onPress={() => {
                  setStep('loading');
                  loadDuesAndCreatePaymentIntent();
                }}
              >
                <Text className="text-white font-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Pay Dues</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
