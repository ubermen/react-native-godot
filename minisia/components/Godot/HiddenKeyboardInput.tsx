// components/Godot/HiddenKeyboardInput.tsx

import React from 'react';
import {TextInput, StyleSheet} from 'react-native';

type Props = {
  visible: boolean;
  value: string;
  maxLength: number;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onBlur: () => void;
};

export const HiddenKeyboardInput = ({
  visible,
  value,
  maxLength,
  onChange,
  onSubmit,
  onBlur,
}: Props) => {
  if (!visible) return null;

  return (
    <TextInput
      disableFullscreenUI={true}
      autoFocus={true}
      autoCorrect={false}
      multiline={false}
      maxLength={maxLength}
      textBreakStrategy="simple"
      underlineColorAndroid="transparent"
      style={styles.hidden_input}
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
      onSubmitEditing={onSubmit}
      onBlur={onBlur}
    />
  );
};

const styles = StyleSheet.create({
  hidden_input: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
    backgroundColor: '#fff',
    color: '#000',
  },
});
