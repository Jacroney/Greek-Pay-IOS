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
import { ChevronLeft, CreditCard, CheckCircle, AlertCircle, Building2 } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { PaymentService } from '../../../services/payments';
import { DuesService } from '../../../services/dues';
import { SavedPaymentMethodsService } from '../../../services/savedPaymentMethods';
import { MemberDuesSummary, SavedPaymentMethod } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { MercuryCard } from '../../../components/ui/MercuryCard';
import { GradientButton } from '../../../components/ui/GradientButton';

type PaymentStep = 'loading' | 'review' | 'processing' | 'success' | 'error';
type PaymentMethodType = 'card' | 'us_bank_account';

export default function PaymentScreen() {
  const { duesId } = useLocalSearchParams<{ duesId: string }>();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [step, setStep] = useState<PaymentStep>('loading');
  const [dues, setDues] = useState<MemberDuesSummary | null>(null);
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>('card');
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<SavedPaymentMethod | null>(null);
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
      setStep('loading');

      // Get dues info
      const summary = await DuesService.getMemberDuesSummary();
      const duesItem = summary.find((d) => d.id === duesId);

      if (!duesItem) {
        setErrorMessage('Dues record not found');
        setStep('error');
        return;
      }

      setDues(duesItem);

      // Load saved payment methods
      try {
        const methods = await SavedPaymentMethodsService.getMethods();
        setSavedMethods(methods);
        // Auto-select default method
        const defaultMethod = methods.find((m) => m.is_default);
        if (defaultMethod) {
          setSelectedSavedMethod(defaultMethod);
          setPaymentMethodType(defaultMethod.type);
        }
      } catch {
        // Non-critical — continue without saved methods
      }

      // Create payment intent
      await createIntent(duesItem.balance, paymentMethodType);
    } catch (error) {
      console.error('Error loading payment:', error);
      setErrorMessage('An unexpected error occurred');
      setStep('error');
    }
  };

  const createIntent = async (amount: number, methodType: PaymentMethodType) => {
    const result = await PaymentService.createPaymentIntent(duesId, amount, methodType);

    if (!result.success || !result.client_secret) {
      setErrorMessage(result.error || 'Failed to initialize payment');
      setStep('error');
      return;
    }

    setPaymentDetails({
      clientSecret: result.client_secret,
      duesAmount: result.dues_amount || amount,
      stripeFee: result.stripe_fee || 0,
      platformFee: result.platform_fee || 0,
      totalCharge: result.total_charge || amount,
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
  };

  const handleMethodTypeChange = async (newType: PaymentMethodType) => {
    if (newType === paymentMethodType) return;
    setPaymentMethodType(newType);
    setSelectedSavedMethod(null);

    if (!dues) return;
    setStep('loading');
    try {
      await createIntent(dues.balance, newType);
    } catch {
      setErrorMessage('Failed to update payment method');
      setStep('error');
    }
  };

  const handleSelectSavedMethod = (method: SavedPaymentMethod) => {
    if (selectedSavedMethod?.id === method.id) {
      setSelectedSavedMethod(null);
    } else {
      setSelectedSavedMethod(method);
      if (method.type !== paymentMethodType) {
        handleMethodTypeChange(method.type);
      }
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

  const getFeeLabel = () => {
    return paymentMethodType === 'card'
      ? 'Card Processing Fee (2.9% + $0.30)'
      : 'Bank Transfer Fee (0.8%)';
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#214384" />
            <Text className="text-gray-500 mt-4">Preparing payment...</Text>
          </View>
        );

      case 'review':
        return (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Payment Method Type Toggle */}
            <View className="mx-4 mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Payment Method</Text>
              <View className="flex-row bg-gray-100 rounded-xl p-1">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                    paymentMethodType === 'card' ? 'bg-white shadow-sm' : ''
                  }`}
                  onPress={() => handleMethodTypeChange('card')}
                >
                  <CreditCard size={16} color={paymentMethodType === 'card' ? '#214384' : '#9CA3AF'} />
                  <Text
                    className={`ml-2 font-medium ${
                      paymentMethodType === 'card' ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    Card
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                    paymentMethodType === 'us_bank_account' ? 'bg-white shadow-sm' : ''
                  }`}
                  onPress={() => handleMethodTypeChange('us_bank_account')}
                >
                  <Building2 size={16} color={paymentMethodType === 'us_bank_account' ? '#214384' : '#9CA3AF'} />
                  <Text
                    className={`ml-2 font-medium ${
                      paymentMethodType === 'us_bank_account' ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    Bank
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Saved Payment Methods */}
            {savedMethods.length > 0 && (
              <View className="mx-4 mt-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Saved Methods</Text>
                {savedMethods
                  .filter((m) => m.type === paymentMethodType)
                  .map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                        selectedSavedMethod?.id === method.id
                          ? 'border-primary bg-primary-soft'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => handleSelectSavedMethod(method)}
                    >
                      {method.type === 'card' ? (
                        <CreditCard size={18} color="#374151" />
                      ) : (
                        <Building2 size={18} color="#374151" />
                      )}
                      <Text className="ml-3 font-medium text-gray-900 flex-1">
                        {method.brand ? `${method.brand} ` : ''}•••• {method.last4}
                      </Text>
                      {method.is_default && (
                        <View className="bg-primary-soft px-2 py-0.5 rounded-full">
                          <Text className="text-xs text-primary font-medium">Default</Text>
                        </View>
                      )}
                      {selectedSavedMethod?.id === method.id && (
                        <CheckCircle size={18} color="#214384" className="ml-2" />
                      )}
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            {/* Payment Summary Card */}
            <View className="mx-4 mt-4">
              <MercuryCard elevated>
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
                      <Text className="text-gray-600 flex-1 mr-2">{getFeeLabel()}</Text>
                      <Text className="font-medium text-gray-900">
                        {formatCurrency(paymentDetails?.stripeFee || 0)}
                      </Text>
                    </View>
                  )}

                  {(paymentDetails?.platformFee || 0) > 0 && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-gray-600">Service Fee</Text>
                      <Text className="font-medium text-gray-900">
                        {formatCurrency(paymentDetails?.platformFee || 0)}
                      </Text>
                    </View>
                  )}

                  <View className="border-t border-gray-200 pt-3 mt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-lg font-semibold text-gray-900">Total</Text>
                      <Text className="text-lg font-bold text-primary">
                        {formatCurrency(paymentDetails?.totalCharge || 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              </MercuryCard>
            </View>

            {/* Period Info */}
            {dues && (
              <View className="mx-4 mt-4">
                <MercuryCard>
                  <Text className="text-sm text-gray-500 mb-1">Payment For</Text>
                  <Text className="font-semibold text-gray-900">
                    {dues.notes || dues.period_name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">{dues.chapter_name}</Text>
                </MercuryCard>
              </View>
            )}

            {/* Refund Policy Note */}
            <View className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Text className="text-xs text-amber-800 text-center">
                Refunds are handled by your chapter treasurer on a case-by-case basis. Contact them
                directly for refund requests.
              </Text>
            </View>

            {/* Security Note */}
            <View className="mx-4 mt-3 p-4 bg-gray-100 rounded-xl">
              <Text className="text-xs text-gray-500 text-center">
                Your payment is secured by Stripe. Your card details are never stored on our
                servers.
              </Text>
            </View>

            {/* Pay Button */}
            <View className="mx-4 mt-6">
              <GradientButton
                title={`Pay ${formatCurrency(paymentDetails?.totalCharge || 0)}`}
                onPress={handlePayment}
                icon={<CreditCard size={20} color="#FFFFFF" />}
              />
            </View>
          </ScrollView>
        );

      case 'processing':
        return (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#214384" />
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
            <View className="mt-8 w-full">
              <GradientButton
                title="Back to Dashboard"
                onPress={() => router.replace('/(app)/dashboard')}
              />
            </View>
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
              <View>
                <GradientButton
                  title="Try Again"
                  onPress={() => {
                    setStep('loading');
                    loadDuesAndCreatePaymentIntent();
                  }}
                />
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
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
