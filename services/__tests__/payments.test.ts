jest.mock('../supabase');

const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

// Must set env var before importing PaymentService (reads at module level)
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';

import { PaymentService } from '../payments';

const MOCK_SUPABASE_URL = 'https://test-project.supabase.co';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PaymentService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockFetch.mockReset();
  });

  describe('createPaymentIntent', () => {
    it('creates payment intent on success', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      });

      const apiResponse = {
        client_secret: 'pi_secret_123',
        payment_intent_id: 'pi_123',
        dues_amount: 500,
        stripe_fee: 15.25,
        platform_fee: 5,
        total_charge: 520.25,
        chapter_receives: 500,
        payment_method_type: 'card',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const result = await PaymentService.createPaymentIntent('dues-1', 500);

      expect(result.success).toBe(true);
      expect(result.client_secret).toBe('pi_secret_123');
      expect(result.stripe_fee).toBe(15.25);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-payment-intent'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('returns error when not authenticated', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await PaymentService.createPaymentIntent('dues-1', 500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns error on non-OK response', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Insufficient funds' }),
      });

      const result = await PaymentService.createPaymentIntent('dues-1', 500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('returns fallback error message on non-OK response without error field', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const result = await PaymentService.createPaymentIntent('dues-1', 500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed');
    });

    it('returns network error on fetch failure', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const result = await PaymentService.createPaymentIntent('dues-1', 500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please try again.');
    });

    it('defaults to card payment method', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ client_secret: 'cs' }),
      });

      await PaymentService.createPaymentIntent('dues-1', 500);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.payment_method_type).toBe('card');
    });

    it('accepts bank account payment method', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ client_secret: 'cs' }),
      });

      await PaymentService.createPaymentIntent('dues-1', 500, 'us_bank_account');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.payment_method_type).toBe('us_bank_account');
    });
  });

  describe('getPaymentStatus', () => {
    it('returns status when found', async () => {
      mockTableResponse('payment_intents', { data: { status: 'succeeded' }, error: null });

      const status = await PaymentService.getPaymentStatus('pi_123');
      expect(status).toBe('succeeded');
    });

    it('returns null on error', async () => {
      mockTableResponse('payment_intents', { data: null, error: { message: 'Not found' } });

      const status = await PaymentService.getPaymentStatus('pi_nonexistent');
      expect(status).toBeNull();
    });

    it('returns null when data has no status', async () => {
      mockTableResponse('payment_intents', { data: {}, error: null });

      const status = await PaymentService.getPaymentStatus('pi_123');
      expect(status).toBeNull();
    });
  });
});
