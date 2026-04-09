import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { StripeProvider } from '@stripe/stripe-react-native';
import { NotificationService } from '../services/notifications';
import type { EventSubscription } from 'expo-modules-core';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function NotificationHandler() {
  const { user } = useAuth();
  const router = useRouter();
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // Register push token when user is authenticated
    (async () => {
      const token = await NotificationService.registerForPushNotifications();
      if (token) {
        await NotificationService.savePushToken(user.id, token);
      }
    })();

    // Handle notification taps (navigate to relevant screen)
    responseListener.current = NotificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'payment-history') {
          router.push('/(app)/payment-history');
        } else if (data?.screen === 'dashboard') {
          router.push('/(app)/dashboard');
        } else if (data?.duesId) {
          router.push(`/(app)/pay/${data.duesId}`);
        }
      }
    );

    return () => {
      responseListener.current?.remove();
    };
  }, [user]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <StatusBar style="dark" />
        <NotificationHandler />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </StripeProvider>
    </AuthProvider>
  );
}
