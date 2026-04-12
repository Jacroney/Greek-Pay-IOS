// Mocks are provided by jest/expo-local-auth-mock.js and jest/expo-secure-store-mock.js via moduleNameMapper
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BiometricService } from '../biometric';

const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('BiometricService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('returns true when hardware exists and is enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);

      expect(await BiometricService.isAvailable()).toBe(true);
    });

    it('returns false when no hardware', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

      expect(await BiometricService.isAvailable()).toBe(false);
      expect(mockLocalAuth.isEnrolledAsync).not.toHaveBeenCalled();
    });

    it('returns false when not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

      expect(await BiometricService.isAvailable()).toBe(false);
    });
  });

  describe('getBiometricType', () => {
    it('returns Face ID for facial recognition', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      expect(await BiometricService.getBiometricType()).toBe('Face ID');
    });

    it('returns Touch ID for fingerprint', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      expect(await BiometricService.getBiometricType()).toBe('Touch ID');
    });

    it('returns Biometric as fallback', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);

      expect(await BiometricService.getBiometricType()).toBe('Biometric');
    });

    it('prefers Face ID over Touch ID when both available', async () => {
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      expect(await BiometricService.getBiometricType()).toBe('Face ID');
    });
  });

  describe('authenticate', () => {
    it('returns true on success', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
        error: undefined as any,
      });

      expect(await BiometricService.authenticate()).toBe(true);
    });

    it('returns false on failure', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'user_cancel' as any,
      });

      expect(await BiometricService.authenticate()).toBe(false);
    });

    it('uses custom prompt message', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
        error: undefined as any,
      });

      await BiometricService.authenticate('Custom prompt');

      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ promptMessage: 'Custom prompt' })
      );
    });

    it('uses default prompt message', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
        error: undefined as any,
      });

      await BiometricService.authenticate();

      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ promptMessage: 'Unlock GreekPay' })
      );
    });
  });

  describe('isEnabled', () => {
    it('returns true when stored value is "true"', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('true');
      expect(await BiometricService.isEnabled()).toBe(true);
    });

    it('returns false when stored value is null', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      expect(await BiometricService.isEnabled()).toBe(false);
    });

    it('returns false when stored value is "false"', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('false');
      expect(await BiometricService.isEnabled()).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('saves "true" to secure store when enabling', async () => {
      await BiometricService.setEnabled(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'greekpay_biometric_enabled',
        'true'
      );
    });

    it('deletes from secure store when disabling', async () => {
      await BiometricService.setEnabled(false);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'greekpay_biometric_enabled'
      );
    });
  });
});
