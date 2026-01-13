import { supabase } from './supabase';
import { CreatePaymentIntentResponse } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const PaymentService = {
  async createPaymentIntent(
    memberDuesId: string,
    amount: number,
    paymentMethodType: 'card' | 'us_bank_account' = 'card'
  ): Promise<CreatePaymentIntentResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_dues_id: memberDuesId,
          payment_amount: amount,
          payment_method_type: paymentMethodType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Payment failed' };
      }

      return {
        success: true,
        client_secret: data.client_secret,
        payment_intent_id: data.payment_intent_id,
        dues_amount: data.dues_amount,
        stripe_fee: data.stripe_fee,
        platform_fee: data.platform_fee,
        total_charge: data.total_charge,
        chapter_receives: data.chapter_receives,
        payment_method_type: data.payment_method_type,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getPaymentStatus(paymentIntentId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('payment_intents')
        .select('status')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (error) {
        console.error('Error fetching payment status:', error);
        return null;
      }

      return data?.status || null;
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  },
};
