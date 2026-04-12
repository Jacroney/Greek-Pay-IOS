jest.mock('../../services/supabase');
jest.mock('../../services/auth');

const { supabase, resetSupabaseMocks } = require('../../services/supabase') as typeof import('../../services/__mocks__/supabase');

import { AuthService } from '../../services/auth';

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('AuthProvider logic', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    jest.clearAllMocks();
  });

  describe('signIn flow', () => {
    it('AuthService.signIn returns user on valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@test.com' };
      mockAuthService.signIn = jest.fn().mockResolvedValue({
        user: mockUser,
        error: undefined,
      });

      const result = await AuthService.signIn({ email: 'test@test.com', password: 'password' });
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it('AuthService.signIn returns error on invalid credentials', async () => {
      mockAuthService.signIn = jest.fn().mockResolvedValue({
        user: null,
        error: { message: 'Invalid credentials' },
      });

      const result = await AuthService.signIn({ email: 'bad@test.com', password: 'wrong' });
      expect(result.user).toBeNull();
      expect(result.error.message).toBe('Invalid credentials');
    });
  });

  describe('signOut flow', () => {
    it('AuthService.signOut succeeds', async () => {
      mockAuthService.signOut = jest.fn().mockResolvedValue({ error: null });
      const result = await AuthService.signOut();
      expect(result.error).toBeNull();
    });
  });

  describe('getMemberDues aggregation', () => {
    it('aggregates balances from RPC response', async () => {
      const mockDues = [
        { balance: 300, chapter_name: 'Alpha Beta', period_name: 'Spring' },
        { balance: 100, chapter_name: 'Alpha Beta', period_name: 'Fine' },
      ];
      supabase.rpc.mockResolvedValue({ data: mockDues, error: null });

      const { data, error } = await supabase.rpc('get_my_dues_summary');

      expect(error).toBeNull();
      expect(data).toHaveLength(2);

      const totalBalance = data.reduce((sum: number, item: any) => sum + (item.balance || 0), 0);
      expect(totalBalance).toBe(400);
      expect(data[0].chapter_name).toBe('Alpha Beta');
    });

    it('handles empty dues data', async () => {
      supabase.rpc.mockResolvedValue({ data: [], error: null });
      const { data } = await supabase.rpc('get_my_dues_summary');
      expect(data).toHaveLength(0);
    });

    it('handles RPC error', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
      const { error } = await supabase.rpc('get_my_dues_summary');
      expect(error).not.toBeNull();
    });
  });

  describe('profile loading', () => {
    it('getUserProfile returns profile data', async () => {
      const mockProfile = { id: '123', full_name: 'Test User', email: 'test@test.com' };
      mockAuthService.getUserProfile = jest.fn().mockResolvedValue(mockProfile);

      const profile = await AuthService.getUserProfile('123');
      expect(profile).toEqual(mockProfile);
    });

    it('getUserProfile returns null when not found', async () => {
      mockAuthService.getUserProfile = jest.fn().mockResolvedValue(null);
      const profile = await AuthService.getUserProfile('nonexistent');
      expect(profile).toBeNull();
    });
  });

  describe('profile update', () => {
    it('updateUserProfile returns updated profile', async () => {
      const updatedProfile = { id: '123', full_name: 'Updated Name' };
      mockAuthService.updateUserProfile = jest.fn().mockResolvedValue({
        profile: updatedProfile,
        error: null,
      });

      const result = await AuthService.updateUserProfile({ full_name: 'Updated Name' });
      expect(result.profile).toEqual(updatedProfile);
    });

    it('updateUserProfile returns error when not authenticated', async () => {
      mockAuthService.updateUserProfile = jest.fn().mockResolvedValue({
        profile: null,
        error: new Error('Not authenticated'),
      });

      const result = await AuthService.updateUserProfile({ full_name: 'Test' });
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
