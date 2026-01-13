import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DollarSign,
  Clock,
  User,
  LogOut,
  RefreshCw,
  Calendar,
  CreditCard,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { DuesService, InstallmentService } from '../../services/dues';
import { MemberDuesSummary, InstallmentPlanWithPayments, MemberDuesInfo } from '../../types';
import {
  formatCurrency,
  getInitials,
  getFirstName,
  getYearLabel,
  formatDate,
  getDaysRemaining,
} from '../../utils/format';

export default function DashboardScreen() {
  const { profile, signOut, getMemberDues } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [duesInfo, setDuesInfo] = useState<MemberDuesInfo | null>(null);
  const [memberDuesSummary, setMemberDuesSummary] = useState<MemberDuesSummary[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlanWithPayments[]>([]);

  const loadDuesInfo = useCallback(async () => {
    try {
      const info = await getMemberDues();
      setDuesInfo(info);

      if (profile?.email) {
        const summary = await DuesService.getMemberDuesSummaryByEmail(profile.email);
        setMemberDuesSummary(summary);

        const plans: InstallmentPlanWithPayments[] = [];
        for (const dues of summary) {
          try {
            const activePlan = await InstallmentService.getActivePlan(dues.id);
            if (activePlan) {
              const planWithPayments = await InstallmentService.getPlanWithPayments(activePlan.id);
              if (planWithPayments) {
                plans.push(planWithPayments);
              }
            }
          } catch {
            // No plan for this dues
          }
        }
        setInstallmentPlans(plans);
      }
    } catch (error) {
      console.error('Error loading dues info:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.email, getMemberDues]);

  useEffect(() => {
    loadDuesInfo();
  }, [loadDuesInfo]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDuesInfo();
  }, [loadDuesInfo]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const duesBalance = duesInfo?.dues_balance ?? profile?.dues_balance ?? 0;
  const isOwed = duesBalance > 0;
  const chapterName = duesInfo?.chapter_name || 'Your Chapter';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-9 h-9 bg-blue-600 rounded-lg items-center justify-center mr-2">
            <Text className="text-white font-bold">GP</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900">Member Portal</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} className="p-2">
          <LogOut size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#2563eb" />
        }
      >
        {/* Welcome Card */}
        <View className="bg-gradient-to-br from-blue-50 to-indigo-50 mx-4 mt-4 rounded-2xl p-5">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mr-4">
              <Text className="text-white text-xl font-bold">
                {getInitials(profile?.full_name)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                Welcome back, {getFirstName(profile?.full_name)}!
              </Text>
              <Text className="text-gray-600 mt-1">{chapterName}</Text>
            </View>
          </View>
        </View>

        {/* Dues Balance Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center ${
                  isOwed ? 'bg-rose-100' : 'bg-emerald-100'
                }`}
              >
                <DollarSign size={28} color={isOwed ? '#DC2626' : '#059669'} />
              </View>
              <View className="ml-4">
                <Text className="text-sm text-gray-500">Dues Balance</Text>
                <Text
                  className={`text-3xl font-bold ${
                    isOwed ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(Math.abs(duesBalance))}
                </Text>
              </View>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full ${
                isOwed ? 'bg-rose-50' : 'bg-emerald-50'
              }`}
            >
              <Text className={`text-sm font-medium ${isOwed ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isOwed ? 'Payment Due' : 'Paid in Full'}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 text-sm">
            {isOwed
              ? 'Amount owed for the current term'
              : duesBalance === 0
              ? 'Your balance is paid in full - thank you!'
              : 'You have a credit balance'}
          </Text>

          {/* Flexible Payment Plan Info */}
          {memberDuesSummary.some((dues) => dues.flexible_plan_deadline) && (
            <View className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center">
                  <Calendar size={20} color="#7C3AED" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-purple-900">Flexible Payment Plan</Text>
                  {memberDuesSummary
                    .filter((dues) => dues.flexible_plan_deadline)
                    .map((dues) => {
                      const daysRemaining = getDaysRemaining(dues.flexible_plan_deadline!);
                      const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
                      const suggestedWeekly = dues.balance / weeksRemaining;

                      return (
                        <View key={dues.id} className="mt-1">
                          <Text className="text-sm text-purple-700">
                            Deadline: {formatDate(dues.flexible_plan_deadline!)}
                            {daysRemaining > 0 && (
                              <Text className="text-purple-500">
                                {' '}
                                ({daysRemaining} days remaining)
                              </Text>
                            )}
                          </Text>
                          {daysRemaining > 0 && dues.balance > 0 && (
                            <Text className="text-xs text-purple-600 mt-0.5">
                              Suggested: ~{formatCurrency(suggestedWeekly)}/week
                            </Text>
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>
            </View>
          )}

          {/* Pay Dues Button */}
          {isOwed && memberDuesSummary.length > 0 && (
            <View className="mt-4 pt-4 border-t border-gray-100">
              {memberDuesSummary.map((dues) => (
                <TouchableOpacity
                  key={dues.id}
                  className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center"
                  onPress={() => router.push(`/(app)/pay/${dues.id}`)}
                  activeOpacity={0.8}
                >
                  <CreditCard size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Pay {formatCurrency(dues.balance)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Active Installment Plans */}
        {installmentPlans.length > 0 &&
          installmentPlans.map((plan) => {
            const completedPayments = plan.payments.filter((p) => p.status === 'succeeded').length;
            const progressPercentage = (completedPayments / plan.num_installments) * 100;
            const nextPayment = plan.payments.find((p) => p.status === 'scheduled');

            return (
              <View key={plan.id} className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center">
                      <Calendar size={24} color="#4F46E5" />
                    </View>
                    <View className="ml-3">
                      <Text className="font-semibold text-gray-900">Payment Plan Active</Text>
                      <Text className="text-sm text-gray-500">
                        {plan.num_installments} payments of {formatCurrency(plan.installment_amount)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`px-2.5 py-1 rounded-full ${
                      plan.status === 'active'
                        ? 'bg-blue-50'
                        : plan.status === 'completed'
                        ? 'bg-emerald-50'
                        : 'bg-rose-50'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        plan.status === 'active'
                          ? 'text-blue-700'
                          : plan.status === 'completed'
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {plan.status === 'active'
                        ? 'Active'
                        : plan.status === 'completed'
                        ? 'Completed'
                        : 'Cancelled'}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-600 text-sm">Progress</Text>
                    <Text className="font-medium text-gray-900">
                      {completedPayments} of {plan.num_installments} payments
                    </Text>
                  </View>
                  <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </View>
                </View>

                {/* Payment Schedule */}
                <View className="space-y-2">
                  {plan.payments.map((payment, idx) => (
                    <View
                      key={payment.id}
                      className={`flex-row items-center justify-between p-3 rounded-lg ${
                        payment.status === 'succeeded'
                          ? 'bg-emerald-50'
                          : payment.status === 'scheduled'
                          ? 'bg-gray-50'
                          : payment.status === 'failed'
                          ? 'bg-rose-50'
                          : 'bg-yellow-50'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            payment.status === 'succeeded'
                              ? 'bg-emerald-500'
                              : payment.status === 'scheduled'
                              ? 'bg-gray-300'
                              : payment.status === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-yellow-500'
                          }`}
                        >
                          {payment.status === 'succeeded' ? (
                            <CheckCircle size={16} color="#FFFFFF" />
                          ) : (
                            <Text className="text-sm font-medium text-white">{idx + 1}</Text>
                          )}
                        </View>
                        <View className="ml-3">
                          <Text className="text-sm font-medium text-gray-900">
                            Payment {idx + 1}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {payment.status === 'succeeded' && payment.processed_at
                              ? `Paid ${formatDate(payment.processed_at)}`
                              : `Due ${formatDate(payment.scheduled_date)}`}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Text
                          className={`text-xs ${
                            payment.status === 'succeeded'
                              ? 'text-emerald-600'
                              : payment.status === 'failed'
                              ? 'text-rose-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {payment.status === 'succeeded'
                            ? 'Paid'
                            : payment.status === 'failed'
                            ? 'Failed'
                            : payment.status === 'processing'
                            ? 'Processing'
                            : 'Scheduled'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Next Payment Info */}
                {nextPayment && plan.status === 'active' && (
                  <View className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <View className="flex-row items-start">
                      <CreditCard size={20} color="#2563EB" />
                      <View className="ml-3">
                        <Text className="text-sm font-medium text-blue-800">
                          Next payment: {formatCurrency(nextPayment.amount)}
                        </Text>
                        <Text className="text-xs text-blue-600">
                          Scheduled for {formatDate(nextPayment.scheduled_date)}
                          {plan.payment_method_type &&
                            ` via ${plan.payment_method_type === 'card' ? 'Card' : 'Bank Transfer'}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Completion Message */}
                {plan.status === 'completed' && (
                  <View className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <View className="flex-row items-center">
                      <CheckCircle size={20} color="#059669" />
                      <Text className="ml-3 text-sm font-medium text-emerald-800">
                        Payment plan completed! Thank you for your payments.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        {/* Member Info Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Member Information</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
              <Text className="text-blue-600 font-medium">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            <InfoRow icon="mail" label="Email" value={profile?.email || 'Not set'} />
            <InfoRow
              icon="graduation"
              label="Year"
              value={getYearLabel(profile?.year)}
            />
            <InfoRow icon="book" label="Major" value={profile?.major || 'Not specified'} />
            <InfoRow icon="award" label="Position" value={profile?.position || 'Member'} />
            <InfoRow icon="phone" label="Phone" value={profile?.phone_number || 'Not provided'} />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <QuickActionButton
              icon={<User size={24} color="#2563EB" />}
              label="Profile"
              color="blue"
              onPress={() => router.push('/(app)/profile')}
            />
            <QuickActionButton
              icon={<Clock size={24} color="#7C3AED" />}
              label="History"
              color="purple"
              onPress={() => router.push('/(app)/payment-history')}
            />
            <QuickActionButton
              icon={<RefreshCw size={24} color="#0891B2" />}
              label="Refresh"
              color="cyan"
              onPress={handleRefresh}
            />
            <QuickActionButton
              icon={<LogOut size={24} color="#DC2626" />}
              label="Sign Out"
              color="rose"
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center p-3 rounded-xl bg-gray-50">
      <View className="w-9 h-9 bg-white rounded-lg items-center justify-center shadow-sm">
        {icon === 'mail' && <Text className="text-gray-500">✉️</Text>}
        {icon === 'graduation' && <Text className="text-gray-500">🎓</Text>}
        {icon === 'book' && <Text className="text-gray-500">📚</Text>}
        {icon === 'award' && <Text className="text-gray-500">🏆</Text>}
        {icon === 'phone' && <Text className="text-gray-500">📱</Text>}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    cyan: 'bg-cyan-50',
    rose: 'bg-rose-50',
  };

  return (
    <TouchableOpacity
      className="w-[48%] bg-white border border-gray-200 rounded-xl p-4 items-center mb-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-12 h-12 ${bgColors[color]} rounded-xl items-center justify-center mb-2`}>
        {icon}
      </View>
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
}
