// User Profile Type
export interface UserProfile {
  id: string;
  chapter_id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  year?: '1' | '2' | '3' | '4' | 'Graduate' | 'Alumni';
  major?: string;
  position?: string;
  role: 'admin' | 'exec' | 'treasurer' | 'member';
  dues_balance: number;
  status?: 'active' | 'inactive' | 'alumni' | 'pledge';
  is_active: boolean;
  installment_eligible?: boolean;
  created_at: string;
  updated_at: string;
}

// Member Dues Info (from getMemberDues RPC)
export interface MemberDuesInfo {
  dues_balance: number;
  chapter_name: string;
  period_name?: string;
}

// Member Dues (individual record)
export interface MemberDues {
  id: string;
  chapter_id: string;
  member_id: string;
  config_id: string | null;
  base_amount: number;
  late_fee: number;
  adjustments: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
  assigned_date: string;
  due_date: string | null;
  paid_date: string | null;
  late_fee_applied_date: string | null;
  notes: string | null;
  adjustment_reason: string | null;
  flexible_plan_deadline: string | null;
  flexible_plan_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

// Extended member dues with summary info
export interface MemberDuesSummary extends MemberDues {
  member_name: string;
  member_email: string;
  member_year: string | null;
  member_status: string;
  chapter_name: string;
  period_name: string;
  period_type: string;
  fiscal_year: number;
  category_name: string | null;
  is_overdue: boolean;
  days_overdue: number;
  early_discount: number;
}

// Dues Payment Record
export interface DuesPayment {
  id: string;
  member_dues_id: string;
  member_id: string;
  chapter_id: string;
  amount: number;
  payment_method: 'Cash' | 'Check' | 'Credit Card' | 'ACH' | 'Venmo' | 'Zelle' | 'Other' | null;
  payment_date: string;
  reference_number: string | null;
  receipt_url: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

// Installment Plan
export interface InstallmentPlan {
  id: string;
  member_dues_id: string;
  member_id: string;
  chapter_id: string;
  total_amount: number;
  num_installments: number;
  installment_amount: number;
  stripe_payment_method_id: string;
  payment_method_type: 'card' | 'us_bank_account';
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  installments_paid: number;
  amount_paid: number;
  start_date: string;
  next_payment_date: string | null;
  deadline_date: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  late_fee_enabled: boolean;
  late_fee_amount: number;
  late_fee_type: 'flat' | 'percentage' | null;
  created_at?: string;
  updated_at?: string;
}

// Installment Payment
export interface InstallmentPayment {
  id: string;
  installment_plan_id: string;
  member_dues_id: string;
  installment_number: number;
  amount: number;
  late_fee: number;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  payment_intent_id: string | null;
  status: 'scheduled' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  scheduled_date: string;
  processed_at: string | null;
  failure_reason: string | null;
  failure_code: string | null;
  retry_count: number;
  next_retry_at: string | null;
  created_at?: string;
  updated_at?: string;
}

// Installment Plan with Payments
export interface InstallmentPlanWithPayments extends InstallmentPlan {
  payments: InstallmentPayment[];
}

// Reimbursement Request
export interface ReimbursementRequest {
  id: string;
  chapter_id: string;
  member_id: string;
  purchase_name: string;
  reason: string;
  amount: number;
  purchase_date: string;
  payment_method: 'zelle' | 'venmo';
  payment_contact: string;
  payment_contact_type: 'phone' | 'email' | 'username';
  receipt_url: string | null;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

// Saved Payment Method
export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'us_bank_account';
  last4: string | null;
  brand: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Payment Intent Response
export interface CreatePaymentIntentResponse {
  success: boolean;
  client_secret?: string;
  payment_intent_id?: string;
  dues_amount?: number;
  stripe_fee?: number;
  platform_fee?: number;
  total_charge?: number;
  chapter_receives?: number;
  payment_method_type?: 'card' | 'us_bank_account';
  status?: string;
  using_saved_method?: boolean;
  requires_action?: boolean;
  payment_complete?: boolean;
  error?: string;
}
