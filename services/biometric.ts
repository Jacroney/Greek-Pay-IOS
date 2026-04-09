import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'greekpay_biometric_enabled';

export const BiometricService = {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async getBiometricType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    return 'Biometric';
  },

  async authenticate(promptMessage?: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Unlock GreekPay',
      cancelLabel: 'Use Password',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });
    return result.success;
  },

  async isEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  },

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    }
  },
};
