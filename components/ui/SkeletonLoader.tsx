import { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBlock({ width, height, borderRadius = 12, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {/* Welcome Card */}
      <SkeletonBlock width="100%" height={100} borderRadius={16} />

      {/* Dues Balance Card */}
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock width="100%" height={200} borderRadius={16} />
      </View>

      {/* Member Info Card */}
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock width="100%" height={260} borderRadius={16} />
      </View>

      {/* Quick Actions */}
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock width="100%" height={140} borderRadius={16} />
      </View>
    </View>
  );
}

export function PaymentHistorySkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {/* Summary Card */}
      <SkeletonBlock width="100%" height={130} borderRadius={16} />

      {/* Payment Items */}
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock width={120} height={20} borderRadius={8} style={{ marginBottom: 12 }} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <SkeletonBlock width="100%" height={72} borderRadius={12} />
          </View>
        ))}
      </View>
    </View>
  );
}
