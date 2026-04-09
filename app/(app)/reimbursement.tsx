import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Camera,
  X,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { ReimbursementService } from '../../services/reimbursement';
import { ReimbursementRequest } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { MercuryCard } from '../../components/ui/MercuryCard';

export default function ReimbursementScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [purchaseName, setPurchaseName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zelle' | 'venmo'>('zelle');
  const [contactType, setContactType] = useState<'phone' | 'email' | 'username'>('email');
  const [paymentContact, setPaymentContact] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastRequests, setPastRequests] = useState<ReimbursementRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const requests = await ReimbursementService.getMyRequests();
      setPastRequests(requests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoadingRequests(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload a receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a receipt photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleReceiptPick = () => {
    Alert.alert('Add Receipt', 'Choose how to add your receipt', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickReceipt },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setPurchaseName('');
    setReason('');
    setAmount('');
    setPurchaseDate('');
    setPaymentMethod('zelle');
    setContactType('email');
    setPaymentContact('');
    setReceiptUri(null);
  };

  const handleSubmit = async () => {
    if (!purchaseName.trim()) return Alert.alert('Required', 'Enter a purchase name.');
    if (!reason.trim()) return Alert.alert('Required', 'Enter a reason.');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('Required', 'Enter a valid amount.');
    if (!purchaseDate.trim()) return Alert.alert('Required', 'Enter the purchase date (YYYY-MM-DD).');
    if (!paymentContact.trim()) return Alert.alert('Required', 'Enter your payment contact info.');
    if (!receiptUri) return Alert.alert('Required', 'Please upload a receipt.');
    if (!profile?.chapter_id || !profile?.id) return Alert.alert('Error', 'Profile not loaded.');

    setIsSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      try {
        receiptUrl = await ReimbursementService.uploadReceipt(receiptUri, profile.id);
      } catch (uploadError) {
        Alert.alert('Upload Error', 'Failed to upload receipt. Try a JPG or PNG image.');
        setIsSubmitting(false);
        return;
      }

      await ReimbursementService.createRequest({
        chapter_id: profile.chapter_id,
        member_id: profile.id,
        purchase_name: purchaseName.trim(),
        reason: reason.trim(),
        amount: parsedAmount,
        purchase_date: purchaseDate.trim(),
        payment_method: paymentMethod,
        payment_contact: paymentContact.trim(),
        payment_contact_type: contactType,
        receipt_url: receiptUrl,
      });

      Alert.alert('Success', 'Your reimbursement request has been submitted.');
      resetForm();
      loadRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved', Icon: CheckCircle, color: '#059669' };
      case 'denied':
        return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Denied', Icon: XCircle, color: '#DC2626' };
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', Icon: Clock, color: '#D97706' };
    }
  };

  const contactPlaceholder = paymentMethod === 'venmo'
    ? 'username'
    : contactType === 'email'
    ? 'zelle@example.com'
    : '(555) 123-4567';

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Reimbursement Request</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#214384" />
        }
      >
        {/* Request Form */}
        <View className="mx-4 mt-4">
          <MercuryCard>
            <Text className="text-lg font-semibold text-gray-900 mb-4">New Request</Text>

            {/* Purchase Name */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Purchase Name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              value={purchaseName}
              onChangeText={setPurchaseName}
              placeholder="Event supplies, printing costs..."
              placeholderTextColor="#9CA3AF"
            />

            {/* Reason */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Reason</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              value={reason}
              onChangeText={setReason}
              placeholder="Describe why this purchase was made"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />

            {/* Amount */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Amount ($)</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            {/* Purchase Date */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Purchase Date</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-base mb-3"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />

            {/* Payment Method Toggle */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Payment Method</Text>
            <View className="flex-row mb-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-l-xl border items-center ${
                  paymentMethod === 'zelle'
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => {
                  setPaymentMethod('zelle');
                  setContactType('email');
                }}
              >
                <Text
                  className={`font-medium ${
                    paymentMethod === 'zelle' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Zelle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-r-xl border items-center ${
                  paymentMethod === 'venmo'
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => {
                  setPaymentMethod('venmo');
                  setContactType('username');
                }}
              >
                <Text
                  className={`font-medium ${
                    paymentMethod === 'venmo' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Venmo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contact Type (Zelle only) */}
            {paymentMethod === 'zelle' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Contact Type</Text>
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    className={`flex-1 py-2.5 rounded-l-xl border items-center ${
                      contactType === 'email'
                        ? 'bg-primary-soft border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setContactType('email')}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        contactType === 'email' ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-2.5 rounded-r-xl border items-center ${
                      contactType === 'phone'
                        ? 'bg-primary-soft border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setContactType('phone')}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        contactType === 'phone' ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      Phone
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Payment Contact */}
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {paymentMethod === 'venmo' ? 'Venmo Username' : 'Zelle Contact'}
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-3">
              {paymentMethod === 'venmo' && (
                <Text className="text-gray-500 mr-1">@</Text>
              )}
              <TextInput
                className="flex-1 text-gray-900 text-base"
                value={paymentContact}
                onChangeText={setPaymentContact}
                placeholder={contactPlaceholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={contactType === 'email' ? 'email-address' : contactType === 'phone' ? 'phone-pad' : 'default'}
                autoCapitalize="none"
              />
            </View>

            {/* Receipt Upload */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Receipt</Text>
            {receiptUri ? (
              <View className="mb-3">
                <View className="rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    source={{ uri: receiptUri }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  className="mt-2 flex-row items-center justify-center"
                  onPress={() => setReceiptUri(null)}
                >
                  <X size={16} color="#DC2626" />
                  <Text className="text-rose-600 text-sm ml-1">Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-3"
                onPress={handleReceiptPick}
                activeOpacity={0.7}
              >
                <Camera size={32} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-2">Tap to add receipt photo</Text>
                <Text className="text-gray-400 text-xs mt-1">Image files, max 5MB</Text>
              </TouchableOpacity>
            )}

            {/* Submit */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mt-2 ${
                isSubmitting ? 'bg-gray-300' : 'bg-primary'
              }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Submit Request</Text>
              )}
            </TouchableOpacity>
          </MercuryCard>
        </View>

        {/* Past Requests */}
        <View className="mx-4 mt-4">
          <MercuryCard>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Your Past Requests</Text>

            {isLoadingRequests ? (
              <ActivityIndicator color="#214384" />
            ) : pastRequests.length === 0 ? (
              <View className="items-center py-6">
                <Receipt size={32} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-2">No requests yet</Text>
              </View>
            ) : (
              pastRequests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <View
                    key={req.id}
                    className="flex-row items-center justify-between p-3 rounded-xl bg-gray-50 mb-2"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                        {req.purchase_name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatCurrency(req.amount)} &middot; {formatDate(req.purchase_date)}
                      </Text>
                    </View>
                    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${badge.bg}`}>
                      <badge.Icon size={12} color={badge.color} />
                      <Text className={`text-xs font-medium ml-1 ${badge.text}`}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </MercuryCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
