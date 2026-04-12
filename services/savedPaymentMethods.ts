import { supabase } from './supabase';
import { SavedPaymentMethod } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const SavedPaymentMethodsService = {
  async getMethods(): Promise<SavedPaymentMethod[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved payment methods:', error);
      throw error;
    }

    return (data || []) as SavedPaymentMethod[];
  },

  async deleteMethod(methodId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-payment-method`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_method_id: methodId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete payment method');
    }
  },

  async setDefault(methodId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Clear all defaults for this user
    const { error: clearError } = await supabase
      .from('saved_payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (clearError) throw clearError;

    // Set the new default
    const { error: setError } = await supabase
      .from('saved_payment_methods')
      .update({ is_default: true })
      .eq('id', methodId)
      .eq('user_id', user.id);

    if (setError) throw setError;
  },
};
