import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  DollarSign,
  Clock,
  User,
  Settings,
  RefreshCw,
  Calendar,
  CreditCard,
  CheckCircle,
  Mail,
  GraduationCap,
  BookOpen,
  Award,
  Phone,
  Receipt,
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
import { MercuryCard } from '../../components/ui/MercuryCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';

export default function DashboardScreen() {
  const { user, profile, getMemberDues } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [duesInfo, setDuesInfo] = useState<MemberDuesInfo | null>(null);
  const [memberDuesSummary, setMemberDuesSummary] = useState<MemberDuesSummary[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlanWithPayments[]>([]);

  const loadDuesInfo = useCallback(async () => {
    if (!user || !profile) {
      setIsLoading(false);
      return;
    }

    try {
      const info = await getMemberDues();
      setDuesInfo(info);

      if (profile.email) {
        const summary = await DuesService.getMemberDuesSummary();
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
  }, [user, profile?.email, getMemberDues]);

  useEffect(() => {
    loadDuesInfo();
  }, [loadDuesInfo]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDuesInfo();
  }, [loadDuesInfo]);

  // Entrance animations — hooks must be before any early returns
  const fadeAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(20))).current;

  useEffect(() => {
    if (!isLoading) {
      const animations = fadeAnims.map((fade, i) =>
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 400, delay: i * 100, useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: i * 100, useNativeDriver: true }),
        ])
      );
      Animated.parallel(animations).start();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-bg">
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const duesBalance = duesInfo?.dues_balance ?? profile?.dues_balance ?? 0;
  const isOwed = duesBalance > 0;
  const chapterName = duesInfo?.chapter_name || 'Your Chapter';

  return (
    <SafeAreaView className="flex-1 bg-surface-bg" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-9 h-9 bg-primary rounded-lg items-center justify-center mr-2 p-1">
            <Image
              source={require('../../assets/logo.png')}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className="text-lg font-semibold text-gray-900">GreekPay</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/settings')} className="p-2">
          <Settings size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#214384" />
        }
      >
        {/* Welcome Card */}
        <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }} className="mx-4 mt-4 rounded-2xl overflow-hidden">
          <LinearGradient
            colors={['#f0f4f9', '#dce4f0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20, borderRadius: 16 }}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mr-4">
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
          </LinearGradient>
        </Animated.View>

        {/* Dues Balance Card */}
        <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }} className="mx-4 mt-4">
          <MercuryCard>
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

            {/* Early Discount Badges */}
            {memberDuesSummary
              .filter((dues) => (dues.early_discount || 0) > 0)
              .map((dues) => (
                <View key={`discount-${dues.id}`} className="mt-2">
                  <View className="self-start px-2.5 py-1 rounded-full bg-emerald-100">
                    <Text className="text-xs font-semibold text-emerald-700">
                      {formatCurrency(dues.early_discount)} early discount applied
                    </Text>
                  </View>
                </View>
              ))}

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
                  <GradientButton
                    key={dues.id}
                    title={`Pay ${formatCurrency(dues.balance)}`}
                    onPress={() => router.push(`/(app)/pay/${dues.id}`)}
                    icon={<CreditCard size={20} color="#FFFFFF" />}
                  />
                ))}
              </View>
            )}
          </MercuryCard>
        </Animated.View>

        {/* Active Installment Plans */}
        {installmentPlans.length > 0 &&
          installmentPlans.map((plan) => {
            const completedPayments = plan.payments.filter((p) => p.status === 'succeeded').length;
            const progressPercentage = (completedPayments / plan.num_installments) * 100;
            const nextPayment = plan.payments.find((p) => p.status === 'scheduled');

            return (
              <View key={plan.id} className="mx-4 mt-4">
                <MercuryCard>
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
                          ? 'bg-primary-soft'
                          : plan.status === 'completed'
                          ? 'bg-emerald-50'
                          : 'bg-rose-50'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          plan.status === 'active'
                            ? 'text-primary-700'
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
                        className="h-full bg-primary rounded-full"
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
                    <View className="mt-4 p-4 rounded-xl bg-primary-soft border border-primary-200">
                      <View className="flex-row items-start">
                        <CreditCard size={20} color="#214384" />
                        <View className="ml-3">
                          <Text className="text-sm font-medium text-primary-800">
                            Next payment: {formatCurrency(nextPayment.amount)}
                          </Text>
                          <Text className="text-xs text-primary-600">
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
                </MercuryCard>
              </View>
            );
          })}

        {/* Member Info Card */}
        <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }} className="mx-4 mt-4">
          <MercuryCard>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Member Information</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
                <Text className="text-primary font-medium">Edit</Text>
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
          </MercuryCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] }} className="mx-4 mt-4">
          <MercuryCard>
            <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap justify-between">
              <QuickActionButton
                icon={<User size={24} color="#214384" />}
                label="Profile"
                onPress={() => router.push('/(app)/profile')}
              />
              <QuickActionButton
                icon={<Clock size={24} color="#7C3AED" />}
                label="History"
                onPress={() => router.push('/(app)/payment-history')}
              />
              <QuickActionButton
                icon={<Receipt size={24} color="#059669" />}
                label="Reimburse"
                onPress={() => router.push('/(app)/reimbursement')}
              />
              <QuickActionButton
                icon={<Settings size={24} color="#6B7280" />}
                label="Settings"
                onPress={() => router.push('/(app)/settings')}
              />
            </View>
          </MercuryCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  mail: <Mail size={16} color="#214384" />,
  graduation: <GraduationCap size={16} color="#214384" />,
  book: <BookOpen size={16} color="#214384" />,
  award: <Award size={16} color="#214384" />,
  phone: <Phone size={16} color="#214384" />,
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center p-3 rounded-xl bg-gray-50">
      <View className="w-9 h-9 bg-primary-soft rounded-lg items-center justify-center">
        {ICON_MAP[icon]}
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
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="w-[48%] bg-white border border-gray-200/50 rounded-xl p-4 items-center mb-3"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      }}
    >
      <View className="w-12 h-12 bg-primary-soft rounded-xl items-center justify-center mb-2">
        {icon}
      </View>
      <Text className="text-sm font-medium text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
}
