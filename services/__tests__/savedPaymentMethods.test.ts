jest.mock('../supabase');

const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

// Must set env var before importing service
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';

import { SavedPaymentMethodsService } from '../savedPaymentMethods';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SavedPaymentMethodsService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockFetch.mockReset();
  });

  describe('getMethods', () => {
    it('returns saved payment methods for authenticated user', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockMethods = [
        { id: '1', type: 'card', last4: '4242', brand: 'Visa', is_default: true },
        { id: '2', type: 'us_bank_account', last4: '6789', brand: null, is_default: false },
      ];
      mockTableResponse('saved_payment_methods', { data: mockMethods, error: null });

      const result = await SavedPaymentMethodsService.getMethods();
      expect(result).toEqual(mockMethods);
      expect(supabase.from).toHaveBeenCalledWith('saved_payment_methods');
    });

    it('throws when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(SavedPaymentMethodsService.getMethods()).rejects.toThrow('Not authenticated');
    });

    it('throws on query error', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockTableResponse('saved_payment_methods', { data: null, error: { message: 'DB error' } });

      await expect(SavedPaymentMethodsService.getMethods()).rejects.toEqual({ message: 'DB error' });
    });

    it('returns empty array when no methods', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockTableResponse('saved_payment_methods', { data: null, error: null });

      const result = await SavedPaymentMethodsService.getMethods();
      expect(result).toEqual([]);
    });
  });

  describe('deleteMethod', () => {
    it('calls Edge Function to delete method', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await SavedPaymentMethodsService.deleteMethod('method-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/delete-payment-method'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('throws when not authenticated', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      await expect(SavedPaymentMethodsService.deleteMethod('method-123')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('throws on Edge Function error', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Method not found' }),
      });

      await expect(SavedPaymentMethodsService.deleteMethod('bad-id')).rejects.toThrow(
        'Method not found'
      );
    });
  });

  describe('setDefault', () => {
    it('clears existing defaults and sets new one', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Mock both update calls (clear all, then set new)
      mockTableResponse('saved_payment_methods', { data: null, error: null });

      await SavedPaymentMethodsService.setDefault('method-456');

      // Should have called from('saved_payment_methods') for both updates
      expect(supabase.from).toHaveBeenCalledWith('saved_payment_methods');
    });

    it('throws when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(SavedPaymentMethodsService.setDefault('method-456')).rejects.toThrow(
        'Not authenticated'
      );
    });
  });
});
