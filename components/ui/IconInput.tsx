import { View, TextInput, TextInputProps } from 'react-native';

interface IconInputProps extends TextInputProps {
  icon: React.ReactNode;
}

export function IconInput({ icon, style, ...props }: IconInputProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbfcfd',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.5)',
        paddingHorizontal: 14,
        paddingVertical: 2,
      }}
    >
      <View style={{ marginRight: 10 }}>{icon}</View>
      <TextInput
        style={[{
          flex: 1,
          fontSize: 16,
          color: '#272735',
          paddingVertical: 12,
        }, style]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}
