import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export const RegisterPopup = ({
  email,
  pw,
  pwConfirm,
  setEmail,
  setPw,
  setPwConfirm,
  onSubmit,
  onBack,
}: {
  email: string;
  pw: string;
  pwConfirm: string;
  setEmail: (v: string) => void;
  setPw: (v: string) => void;
  setPwConfirm: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.title}>Register</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={pw}
          onChangeText={setPw}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          secureTextEntry
          value={pwConfirm}
          onChangeText={setPwConfirm}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={onSubmit}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.back]} onPress={onBack}>
          <Text style={styles.btnText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  popup: {
    backgroundColor: '#fff',
    padding: 20,
    width: 280,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    width: 250,
    height: 45,
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  btn: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  back: {
    backgroundColor: '#555',
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
