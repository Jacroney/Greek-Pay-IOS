import { supabase } from './supabase';
import { ReimbursementRequest } from '../types';

export const ReimbursementService = {
  async uploadReceipt(fileUri: string, userId: string): Promise<string> {
    const ext = fileUri.split('.').pop() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const response = await fetch(fileUri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from('receipts')
      .upload(filePath, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  async createRequest(data: {
    chapter_id: string;
    member_id: string;
    purchase_name: string;
    reason: string;
    amount: number;
    purchase_date: string;
    payment_method: 'zelle' | 'venmo';
    payment_contact: string;
    payment_contact_type: 'phone' | 'email' | 'username';
    receipt_url?: string | null;
  }): Promise<ReimbursementRequest> {
    const { data: request, error } = await supabase
      .from('reimbursement_requests')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return request as ReimbursementRequest;
  },

  async getMyRequests(): Promise<ReimbursementRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reimbursement_requests')
      .select('*')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ReimbursementRequest[];
  },
};
