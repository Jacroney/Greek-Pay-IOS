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
  User,
  Settings,
  Clock,
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
} from '../../utils/format';
import { MercuryCard } from '../../components/ui/MercuryCard';
import { DuesCard } from '../../components/ui/DuesCard';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';

export default function DashboardScreen() {
  const { user, profile, getMemberDues } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [duesInfo, setDuesInfo] = useState<MemberDuesInfo | null>(null);
  const [memberDuesSummary, setMemberDuesSummary] = useState<MemberDuesSummary[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlanWithPayments[]>([]);
  // Map plans by member_dues_id for inline display in DuesCards
  const plansByDuesId = installmentPlans.reduce<Record<string, InstallmentPlanWithPayments>>(
    (acc, plan) => { acc[plan.member_dues_id] = plan; return acc; },
    {}
  );

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

        {/* Total Balance Summary */}
        <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }} className="mx-4 mt-4">
          <View className="flex-row items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-200/50">
            <View className="flex-row items-center">
              <View
                className={`w-11 h-11 rounded-xl items-center justify-center ${
                  isOwed ? 'bg-rose-100' : 'bg-emerald-100'
                }`}
              >
                <DollarSign size={22} color={isOwed ? '#DC2626' : '#059669'} />
              </View>
              <View className="ml-3">
                <Text className="text-xs text-gray-500">Total Balance</Text>
                <Text
                  className={`text-xl font-bold ${
                    isOwed ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(Math.abs(duesBalance))}
                </Text>
              </View>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full ${isOwed ? 'bg-rose-50' : 'bg-emerald-50'}`}
            >
              <Text className={`text-xs font-medium ${isOwed ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isOwed ? `${memberDuesSummary.length} item${memberDuesSummary.length !== 1 ? 's' : ''}` : 'Paid in Full'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Individual Dues Cards */}
        {memberDuesSummary.map((dues, index) => (
          <Animated.View
            key={dues.id}
            style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }}
            className="mx-4 mt-3"
          >
            <DuesCard
              dues={dues}
              installmentPlan={plansByDuesId[dues.id]}
              onPay={() => router.push(`/(app)/pay/${dues.id}`)}
            />
          </Animated.View>
        ))}

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
