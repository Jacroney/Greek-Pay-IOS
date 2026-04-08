import { View, ViewStyle } from 'react-native';

interface MercuryCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
}

export function MercuryCard({ children, elevated, style }: MercuryCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#ffffff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(229, 231, 235, 0.5)',
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: elevated ? 4 : 1 },
          shadowOpacity: elevated ? 0.08 : 0.04,
          shadowRadius: elevated ? 12 : 4,
          elevation: elevated ? 4 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
