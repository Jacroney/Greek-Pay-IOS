jest.mock('../supabase');

const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

import { ReimbursementService } from '../reimbursement';

// Mock global fetch for file URI fetching
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ReimbursementService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockFetch.mockReset();
  });

  describe('uploadReceipt', () => {
    it('uploads file and returns public URL', async () => {
      const mockBlob = { type: 'image/jpeg' };
      const mockArrayBuffer = new ArrayBuffer(8);

      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const originalResponse = global.Response;
      global.Response = jest.fn().mockImplementation(() => ({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      })) as any;

      const mockStorageBucket = {
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/receipt.jpg' },
        }),
      };
      supabase.storage.from.mockReturnValue(mockStorageBucket);

      const url = await ReimbursementService.uploadReceipt(
        'file:///path/to/receipt.jpg',
        'user-123'
      );

      expect(url).toBe('https://storage.example.com/receipt.jpg');
      expect(supabase.storage.from).toHaveBeenCalledWith('receipts');
      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-123\/\d+\.jpg$/),
        mockArrayBuffer,
        expect.objectContaining({ contentType: 'image/jpeg' })
      );

      global.Response = originalResponse;
    });

    it('throws on upload error', async () => {
      const mockBlob = { type: 'image/png' };
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const originalResponse = global.Response;
      global.Response = jest.fn().mockImplementation(() => ({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      })) as any;

      const mockStorageBucket = {
        upload: jest.fn().mockResolvedValue({ error: { message: 'Storage full' } }),
        getPublicUrl: jest.fn(),
      };
      supabase.storage.from.mockReturnValue(mockStorageBucket);

      await expect(
        ReimbursementService.uploadReceipt('file:///photo.png', 'user-123')
      ).rejects.toEqual({ message: 'Storage full' });

      global.Response = originalResponse;
    });

    it('extracts file extension correctly', async () => {
      const mockBlob = { type: 'image/png' };
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const originalResponse = global.Response;
      global.Response = jest.fn().mockImplementation(() => ({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      })) as any;

      const mockStorageBucket = {
        upload: jest.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.png' },
        }),
      };
      supabase.storage.from.mockReturnValue(mockStorageBucket);

      await ReimbursementService.uploadReceipt('file:///photo.png', 'user-123');

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        expect.stringMatching(/\.png$/),
        expect.anything(),
        expect.anything()
      );

      global.Response = originalResponse;
    });
  });

  describe('createRequest', () => {
    it('creates and returns reimbursement request', async () => {
      const requestData = {
        chapter_id: 'ch-1',
        member_id: 'user-123',
        purchase_name: 'Supplies',
        reason: 'Chapter event',
        amount: 50,
        purchase_date: '2025-03-15',
        payment_method: 'venmo' as const,
        payment_contact: '@user',
        payment_contact_type: 'username' as const,
      };

      const mockResponse = { id: 'req-1', ...requestData, status: 'pending' };
      mockTableResponse('reimbursement_requests', { data: mockResponse, error: null });

      const result = await ReimbursementService.createRequest(requestData);
      expect(result).toEqual(mockResponse);
      expect(supabase.from).toHaveBeenCalledWith('reimbursement_requests');
    });

    it('throws on insert error', async () => {
      const mockError = { message: 'Insert failed' };
      mockTableResponse('reimbursement_requests', { data: null, error: mockError });

      await expect(
        ReimbursementService.createRequest({
          chapter_id: 'ch-1',
          member_id: 'user-123',
          purchase_name: 'Test',
          reason: 'Test',
          amount: 10,
          purchase_date: '2025-01-01',
          payment_method: 'zelle',
          payment_contact: '555-1234',
          payment_contact_type: 'phone',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('getMyRequests', () => {
    it('returns user requests', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockRequests = [
        { id: 'req-1', amount: 50, status: 'pending' },
        { id: 'req-2', amount: 25, status: 'approved' },
      ];
      mockTableResponse('reimbursement_requests', { data: mockRequests, error: null });

      const result = await ReimbursementService.getMyRequests();
      expect(result).toEqual(mockRequests);
    });

    it('throws when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(ReimbursementService.getMyRequests()).rejects.toThrow('Not authenticated');
    });

    it('returns empty array when no requests', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockTableResponse('reimbursement_requests', { data: null, error: null });

      const result = await ReimbursementService.getMyRequests();
      expect(result).toEqual([]);
    });
  });
});
