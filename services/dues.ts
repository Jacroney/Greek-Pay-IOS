import { supabase } from './supabase';
import { MemberDuesSummary, DuesPayment, InstallmentPlan, InstallmentPlanWithPayments } from '../types';

export const DuesService = {
  async getMemberDuesSummaryByEmail(email: string): Promise<MemberDuesSummary[]> {
    const { data, error } = await supabase.rpc('get_my_dues_summary');

    if (error) {
      console.error('Error fetching dues summary:', error);
      throw error;
    }

    return (data || []) as MemberDuesSummary[];
  },

  async getPaymentHistory(userId: string): Promise<DuesPayment[]> {
    const { data, error } = await supabase
      .from('dues_payments')
      .select('*')
      .eq('member_id', userId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }

    return (data || []) as DuesPayment[];
  },
};

export const InstallmentService = {
  async getActivePlan(memberDuesId: string): Promise<InstallmentPlan | null> {
    const { data, error } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('member_dues_id', memberDuesId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching active plan:', error);
      throw error;
    }

    return data as InstallmentPlan;
  },

  async getPlanWithPayments(planId: string): Promise<InstallmentPlanWithPayments | null> {
    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      return null;
    }

    // Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('installment_plan_id', planId)
      .order('installment_number', { ascending: true });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return null;
    }

    return {
      ...plan,
      payments: payments || [],
    } as InstallmentPlanWithPayments;
  },
};
