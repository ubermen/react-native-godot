import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export const LoginPopup = ({
  loginId,
  loginPw,
  setLoginId,
  setLoginPw,
  onLogin,
  onGuest,
  onGoogle,
}: {
  loginId: string;
  loginPw: string;
  setLoginId: (v: string) => void;
  setLoginPw: (v: string) => void;
  onLogin: () => void;
  onGuest: () => void;
  onGoogle: () => void;
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.title}>Log In</Text>

        <TextInput
          placeholder="ID"
          style={styles.input}
          value={loginId}
          onChangeText={setLoginId}
          placeholderTextColor="#999"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          value={loginPw}
          secureTextEntry
          onChangeText={setLoginPw}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.btn} onPress={onLogin}>
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.guest]} onPress={onGuest}>
          <Text style={styles.btnText}>Continue as Guest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.google]}
          onPress={onGoogle}>
          <Text style={styles.btnText}>Continue with Google</Text>
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
    marginVertical: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  guest: {
    backgroundColor: '#555',
  },
  google: {
    backgroundColor: '#DB4437',
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
