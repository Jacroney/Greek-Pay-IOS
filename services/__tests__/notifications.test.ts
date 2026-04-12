jest.mock('../supabase');

const { supabase, resetSupabaseMocks, mockTableResponse } = require('../supabase') as typeof import('../__mocks__/supabase');

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NotificationService } from '../notifications';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('NotificationService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    jest.clearAllMocks();
    (Device as any).isDevice = true;
  });

  describe('registerForPushNotifications', () => {
    it('returns null when not a physical device', async () => {
      (Device as any).isDevice = false;

      const token = await NotificationService.registerForPushNotifications();
      expect(token).toBeNull();
    });

    it('returns token when permission already granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        expires: 'never',
        canAskAgain: true,
      } as any);

      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
        type: 'expo',
      });

      const token = await NotificationService.registerForPushNotifications();
      expect(token).toBe('ExponentPushToken[abc123]');
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when not yet granted', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as any,
        granted: false,
        expires: 'never',
        canAskAgain: true,
      } as any);

      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted' as any,
        granted: true,
        expires: 'never',
        canAskAgain: true,
      } as any);

      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc123]',
        type: 'expo',
      });

      const token = await NotificationService.registerForPushNotifications();
      expect(token).toBe('ExponentPushToken[abc123]');
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns null when permission denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        expires: 'never',
        canAskAgain: false,
      } as any);

      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied' as any,
        granted: false,
        expires: 'never',
        canAskAgain: false,
      } as any);

      const token = await NotificationService.registerForPushNotifications();
      expect(token).toBeNull();
    });
  });

  describe('savePushToken', () => {
    it('upserts token to push_tokens table', async () => {
      mockTableResponse('push_tokens', { data: null, error: null });

      await NotificationService.savePushToken('user-123', 'ExponentPushToken[abc]');
      expect(supabase.from).toHaveBeenCalledWith('push_tokens');
    });

    it('does not throw on error', async () => {
      mockTableResponse('push_tokens', { data: null, error: { message: 'DB error' } });

      await expect(
        NotificationService.savePushToken('user-123', 'token')
      ).resolves.toBeUndefined();
    });
  });

  describe('removePushToken', () => {
    it('deletes token from push_tokens table', async () => {
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        data: 'ExponentPushToken[abc]',
        type: 'expo',
      });
      mockTableResponse('push_tokens', { data: null, error: null });

      await NotificationService.removePushToken('user-123');
      expect(supabase.from).toHaveBeenCalledWith('push_tokens');
    });

    it('does not throw on error', async () => {
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('No token'));

      await expect(NotificationService.removePushToken('user-123')).resolves.toBeUndefined();
    });
  });

  describe('addNotificationReceivedListener', () => {
    it('delegates to Expo Notifications', () => {
      const callback = jest.fn();
      NotificationService.addNotificationReceivedListener(callback);
      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalledWith(callback);
    });
  });

  describe('addNotificationResponseListener', () => {
    it('delegates to Expo Notifications', () => {
      const callback = jest.fn();
      NotificationService.addNotificationResponseListener(callback);
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(callback);
    });
  });
});
