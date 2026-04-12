jest.mock('../supabase');

const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

import { DuesService, InstallmentService } from '../dues';

describe('DuesService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('getMemberDuesSummary', () => {
    it('returns dues summary array', async () => {
      const mockDues = [
        { id: '1', balance: 500, period_name: 'Spring 2025' },
        { id: '2', balance: 100, period_name: 'Fine' },
      ];
      supabase.rpc.mockResolvedValue({ data: mockDues, error: null });

      const result = await DuesService.getMemberDuesSummary();
      expect(result).toEqual(mockDues);
      expect(supabase.rpc).toHaveBeenCalledWith('get_my_dues_summary');
    });

    it('returns empty array when data is null', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await DuesService.getMemberDuesSummary();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      const mockError = { message: 'RPC failed', code: '500' };
      supabase.rpc.mockResolvedValue({ data: null, error: mockError });

      await expect(DuesService.getMemberDuesSummary()).rejects.toEqual(mockError);
    });
  });

  describe('getPaymentHistory', () => {
    it('returns payment history', async () => {
      const mockPayments = [
        { id: '1', amount: 200, payment_date: '2025-03-01' },
        { id: '2', amount: 100, payment_date: '2025-02-15' },
      ];
      mockTableResponse('dues_payments', { data: mockPayments, error: null });

      const result = await DuesService.getPaymentHistory('user-123');
      expect(result).toEqual(mockPayments);
      expect(supabase.from).toHaveBeenCalledWith('dues_payments');
    });

    it('returns empty array when no payments', async () => {
      mockTableResponse('dues_payments', { data: null, error: null });

      const result = await DuesService.getPaymentHistory('user-123');
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      const mockError = { message: 'Query failed' };
      mockTableResponse('dues_payments', { data: null, error: mockError });

      await expect(DuesService.getPaymentHistory('user-123')).rejects.toEqual(mockError);
    });
  });
});

describe('InstallmentService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('getActivePlan', () => {
    it('returns active plan', async () => {
      const mockPlan = { id: 'plan-1', status: 'active', num_installments: 4 };
      mockTableResponse('installment_plans', { data: mockPlan, error: null });

      const result = await InstallmentService.getActivePlan('dues-1');
      expect(result).toEqual(mockPlan);
    });

    it('returns null when no rows found (PGRST116)', async () => {
      mockTableResponse('installment_plans', {
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      });

      const result = await InstallmentService.getActivePlan('dues-1');
      expect(result).toBeNull();
    });

    it('throws on other errors', async () => {
      const mockError = { code: '500', message: 'Server error' };
      mockTableResponse('installment_plans', { data: null, error: mockError });

      await expect(InstallmentService.getActivePlan('dues-1')).rejects.toEqual(mockError);
    });
  });

  describe('getPlanWithPayments', () => {
    it('returns plan with payments combined', async () => {
      const mockPlan = { id: 'plan-1', num_installments: 3 };
      const mockPayments = [
        { id: 'pay-1', installment_number: 1, status: 'succeeded' },
        { id: 'pay-2', installment_number: 2, status: 'scheduled' },
      ];

      // Both calls use the same table builder pattern
      // getPlanWithPayments calls from('installment_plans') then from('installment_payments')
      mockTableResponse('installment_plans', { data: mockPlan, error: null });
      mockTableResponse('installment_payments', { data: mockPayments, error: null });

      const result = await InstallmentService.getPlanWithPayments('plan-1');
      expect(result).toMatchObject({ id: 'plan-1', num_installments: 3 });
      expect(result?.payments).toEqual(mockPayments);
    });

    it('returns null when plan not found', async () => {
      mockTableResponse('installment_plans', { data: null, error: { message: 'Not found' } });

      const result = await InstallmentService.getPlanWithPayments('nonexistent');
      expect(result).toBeNull();
    });

    it('returns null when payments query fails', async () => {
      mockTableResponse('installment_plans', { data: { id: 'plan-1' }, error: null });
      mockTableResponse('installment_payments', { data: null, error: { message: 'Failed' } });

      const result = await InstallmentService.getPlanWithPayments('plan-1');
      expect(result).toBeNull();
    });
  });
});
