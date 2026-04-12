jest.mock('../supabase');

// Import the mocked module through the mocked path (Jest resolves to __mocks__/supabase)
const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

import { AuthService } from '../auth';

describe('AuthService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('signIn', () => {
    it('returns user on success', async () => {
      const mockUser = { id: '123', email: 'test@test.com' };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await AuthService.signIn({ email: 'test@test.com', password: 'pass' });
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Invalid credentials', status: 401 };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.signIn({ email: 'bad@test.com', password: 'wrong' });
      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('returns null user when auth data is undefined', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await AuthService.signIn({ email: 'test@test.com', password: 'pass' });
      expect(result.user).toBeNull();
    });
  });

  describe('signUp', () => {
    it('returns user on success', async () => {
      const mockUser = { id: '456', email: 'new@test.com' };
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await AuthService.signUp({
        email: 'new@test.com',
        password: 'pass',
        full_name: 'Test User',
      });
      expect(result.user).toEqual(mockUser);
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Email taken' };
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await AuthService.signUp({
        email: 'taken@test.com',
        password: 'pass',
        full_name: 'Test',
      });
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('returns no error on success', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null });
      const result = await AuthService.signOut();
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Sign out failed' };
      supabase.auth.signOut.mockResolvedValue({ error: mockError });
      const result = await AuthService.signOut();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: '123' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      const user = await AuthService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('returns null when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const user = await AuthService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getSession', () => {
    it('returns session when exists', async () => {
      const mockSession = { access_token: 'token123' };
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
      const session = await AuthService.getSession();
      expect(session).toEqual(mockSession);
    });

    it('returns null when no session', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      const session = await AuthService.getSession();
      expect(session).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('returns profile on success', async () => {
      const mockProfile = { id: '123', full_name: 'Test User', email: 'test@test.com' };
      mockTableResponse('user_profiles', { data: mockProfile, error: null });

      const profile = await AuthService.getUserProfile('123');
      expect(profile).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    });

    it('returns null on error', async () => {
      mockTableResponse('user_profiles', { data: null, error: { message: 'Not found' } });

      const profile = await AuthService.getUserProfile('nonexistent');
      expect(profile).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('returns updated profile on success', async () => {
      const mockUser = { id: '123' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const updatedProfile = { id: '123', full_name: 'Updated Name' };
      mockTableResponse('user_profiles', { data: updatedProfile, error: null });

      const result = await AuthService.updateUserProfile({ full_name: 'Updated Name' });
      expect(result.profile).toEqual(updatedProfile);
      expect(result.error).toBeNull();
    });

    it('returns error when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await AuthService.updateUserProfile({ full_name: 'Test' });
      expect(result.profile).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Not authenticated');
    });

    it('returns error when update fails', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } } });
      mockTableResponse('user_profiles', { data: null, error: { message: 'DB error' } });

      const result = await AuthService.updateUserProfile({ full_name: 'Test' });
      expect(result.profile).toBeNull();
      expect(result.error?.message).toBe('DB error');
    });
  });

  describe('resetPasswordForEmail', () => {
    it('returns no error on success', async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
      const result = await AuthService.resetPasswordForEmail('test@test.com');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Rate limited' };
      supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: mockError });
      const result = await AuthService.resetPasswordForEmail('test@test.com');
      expect(result.error).toEqual(mockError);
    });
  });

  describe('updatePassword', () => {
    it('returns no error on success', async () => {
      supabase.auth.updateUser.mockResolvedValue({ error: null });
      const result = await AuthService.updatePassword('newpass123');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Weak password' };
      supabase.auth.updateUser.mockResolvedValue({ error: mockError });
      const result = await AuthService.updatePassword('123');
      expect(result.error).toEqual(mockError);
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes to auth changes', () => {
      const callback = jest.fn();
      AuthService.onAuthStateChange(callback);
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});
