import { View, Text } from 'react-native';
import {
  DollarSign,
  AlertTriangle,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Tag,
} from 'lucide-react-native';
import { MemberDuesSummary, InstallmentPlanWithPayments } from '../../types';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/format';
import { MercuryCard } from './MercuryCard';
import { GradientButton } from './GradientButton';

interface DuesCardProps {
  dues: MemberDuesSummary;
  installmentPlan?: InstallmentPlanWithPayments | null;
  onPay: () => void;
}

export function DuesCard({ dues, installmentPlan, onPay }: DuesCardProps) {
  const isPaid = dues.status === 'paid' || dues.status === 'waived';
  const hasBalance = dues.balance > 0;
  const label = dues.notes || dues.period_name || dues.category_name || 'Dues';
  const progressPercent = dues.total_amount > 0
    ? Math.min(100, (dues.amount_paid / dues.total_amount) * 100)
    : 0;
  const daysRemaining = dues.due_date ? getDaysRemaining(dues.due_date) : null;

  return (
    <MercuryCard>
      {/* Header: Label + Status Badge */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-3">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center ${
              isPaid ? 'bg-emerald-100' : dues.is_overdue ? 'bg-rose-100' : 'bg-primary-soft'
            }`}
          >
            {isPaid ? (
              <CheckCircle size={20} color="#059669" />
            ) : dues.is_overdue ? (
              <AlertTriangle size={20} color="#DC2626" />
            ) : (
              <DollarSign size={20} color="#214384" />
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>{label}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{dues.chapter_name}</Text>
          </View>
        </View>

        <View
          className={`px-2.5 py-1 rounded-full ${
            isPaid
              ? 'bg-emerald-50'
              : dues.is_overdue
              ? 'bg-rose-50'
              : dues.status === 'partial'
              ? 'bg-amber-50'
              : 'bg-primary-soft'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isPaid
                ? 'text-emerald-700'
                : dues.is_overdue
                ? 'text-rose-700'
                : dues.status === 'partial'
                ? 'text-amber-700'
                : 'text-primary-700'
            }`}
          >
            {isPaid
              ? 'Paid'
              : dues.is_overdue
              ? `Overdue${dues.days_overdue > 0 ? ` ${dues.days_overdue}d` : ''}`
              : dues.status === 'partial'
              ? 'Partial'
              : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Balance */}
      <View className="mb-3">
        <Text className="text-sm text-gray-500">Balance</Text>
        <Text
          className={`text-2xl font-bold ${
            isPaid ? 'text-emerald-600' : dues.is_overdue ? 'text-rose-600' : 'text-gray-900'
          }`}
        >
          {formatCurrency(Math.abs(dues.balance))}
        </Text>
      </View>

      {/* Payment Progress Bar */}
      {dues.amount_paid > 0 && dues.total_amount > 0 && (
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-500">
              {formatCurrency(dues.amount_paid)} of {formatCurrency(dues.total_amount)} paid
            </Text>
            <Text className="text-xs font-medium text-gray-600">
              {Math.round(progressPercent)}%
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}

      {/* Info Row: Due Date + Badges */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        {/* Due Date */}
        {dues.due_date && (
          <View className="flex-row items-center bg-gray-50 px-2.5 py-1.5 rounded-lg">
            <Calendar size={12} color="#6B7280" />
            <Text className="text-xs text-gray-600 ml-1.5">
              Due {formatDate(dues.due_date)}
              {daysRemaining !== null && daysRemaining > 0 && !isPaid && (
                <Text className="text-gray-400"> ({daysRemaining}d left)</Text>
              )}
            </Text>
          </View>
        )}

        {/* Early Discount Badge */}
        {(dues.early_discount || 0) > 0 && (
          <View className="flex-row items-center bg-emerald-50 px-2.5 py-1.5 rounded-lg">
            <Tag size={12} color="#059669" />
            <Text className="text-xs font-medium text-emerald-700 ml-1.5">
              {formatCurrency(dues.early_discount)} discount
            </Text>
          </View>
        )}

        {/* Late Fee Indicator */}
        {dues.late_fee > 0 && (
          <View className="flex-row items-center bg-rose-50 px-2.5 py-1.5 rounded-lg">
            <AlertTriangle size={12} color="#DC2626" />
            <Text className="text-xs font-medium text-rose-700 ml-1.5">
              +{formatCurrency(dues.late_fee)} late fee
            </Text>
          </View>
        )}
      </View>

      {/* Installment Plan (inline) */}
      {installmentPlan && installmentPlan.status === 'active' && (
        <View className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Clock size={14} color="#4F46E5" />
            <Text className="text-xs font-semibold text-indigo-900 ml-1.5">
              Payment Plan: {installmentPlan.installments_paid}/{installmentPlan.num_installments} payments
            </Text>
          </View>
          <View className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${(installmentPlan.installments_paid / installmentPlan.num_installments) * 100}%`,
              }}
            />
          </View>
          {installmentPlan.next_payment_date && (
            <Text className="text-xs text-indigo-600 mt-1.5">
              Next: {formatCurrency(installmentPlan.installment_amount)} on{' '}
              {formatDate(installmentPlan.next_payment_date)}
              {installmentPlan.payment_method_last4 && (
                <Text className="text-indigo-400">
                  {' '}via •••• {installmentPlan.payment_method_last4}
                </Text>
              )}
            </Text>
          )}
        </View>
      )}

      {/* Pay Button */}
      {hasBalance && !isPaid && !installmentPlan && (
        <GradientButton
          title={`Pay ${formatCurrency(dues.balance)}`}
          onPress={onPay}
          icon={<CreditCard size={18} color="#FFFFFF" />}
        />
      )}
    </MercuryCard>
  );
}
