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
  onRegister,
  onGuest,
  onGoogle,
  onApple, // ⭐ 애플 로그인 추가
}: {
  loginId: string;
  loginPw: string;
  setLoginId: (v: string) => void;
  setLoginPw: (v: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onGuest: () => void;
  onGoogle: () => void;
  onApple: () => void;
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.title}>Log In</Text>

        {/* ⭐ 2열 가로모드 레이아웃 */}
        <View style={styles.row}>
          {/* 왼쪽: Email/Password 로그인 */}
          <View style={styles.leftCol}>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={loginId}
              onChangeText={setLoginId}
              placeholderTextColor="#999"
              autoCapitalize="none"
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

            <TouchableOpacity
              style={[styles.btn, styles.register]}
              onPress={onRegister}>
              <Text style={styles.btnText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* 오른쪽: Social / Guest 로그인 */}
          <View style={styles.rightCol}>
            <TouchableOpacity
              style={[styles.btn, styles.google]}
              onPress={onGoogle}>
              <Text style={styles.btnText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.apple]}
              onPress={onApple}>
              <Text style={styles.btnText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.guest]}
              onPress={onGuest}>
              <Text style={styles.btnText}>Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
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

  // 가로모드 최적화 폭
  popup: {
    backgroundColor: '#fff',
    padding: 20,
    width: 560, // ⭐ 가로모드 최적 폭
    borderRadius: 10,
  },

  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },

  // ⭐ 좌우 2열
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  leftCol: {
    width: '48%',
  },

  rightCol: {
    width: '48%',
    justifyContent: 'flex-start',
  },

  input: {
    height: 42,
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

  register: {
    backgroundColor: '#28a745',
  },
  guest: {
    backgroundColor: '#555',
  },
  google: {
    backgroundColor: '#DB4437',
  },
  apple: {
    backgroundColor: '#000',
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
  },
});
