import 'setimmediate';
import React, {useEffect, useRef, useState} from 'react';
import {RTNGodotView} from '@borndotcom/react-native-godot';
import {
  StyleSheet,
  View,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';

import {useKeepAwake} from 'expo-keep-awake';
import DeviceInfo from 'react-native-device-info';

import {useAuth} from './components/Auth/useAuth';
import {LoginPopup} from './components/Auth/LoginPopup';

import {
  WebGuideOverlay,
  WebGuideOverlayRef,
} from './components/Godot/WebGuideOverlay';

import {useGodotBridge} from './components/Godot/useGodotBridge';
import {HiddenKeyboardInput} from './components/Godot/HiddenKeyboardInput';

const guideUrl =
  'https://minisian.blogspot.com/2025/12/welcome-to-minisia-start-here.html';

const App = () => {
  useKeepAwake();

  /** ⭐ Firebase Auth */
  const {
    user,
    loading: authLoading,
    loginWithEmail,
    loginWithGoogle,
    loginAsGuest,
    logout,
  } = useAuth();

  /** ⭐ 게임 클라이언트 초기화 여부 */
  const [initialized, setInitialized] = useState(false);

  /** ⭐ 로그인 UI */
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  /** ⭐ WebGuide */
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const webGuideRef = useRef<WebGuideOverlayRef>(null);

  /** ⭐ Hidden keyboard */
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardValue, setKeyboardValue] = useState('');
  const [keyboardTarget, setKeyboardTarget] = useState('');
  const [keyboardMaxLength, setKeyboardMaxLength] = useState(0);

  /** ⭐ Godot Bridge */
  const godot = useGodotBridge('Minisia', {
    openGuide: () => setIsGuideOpen(true),
    closeGuide: () => setIsGuideOpen(false),
    goBackGuide: () => webGuideRef.current?.goBack(),
    goHomeGuide: () => webGuideRef.current?.goHome(),
    onLogOut: () => setIsGuideOpen(false),
    onSignOut: async () => {
      setIsGuideOpen(false);
      await logout();
      setShowLoginPopup(true);
    },
    onClientInitialized: () => setInitialized(true),
    onInputRequested: (from, maxLen) => {
      setKeyboardTarget(from);
      setKeyboardValue('');
      setKeyboardMaxLength(maxLen);
      setShowKeyboard(true);
    },
    onInputReleased: () => setShowKeyboard(false),
  });

  /** ⭐ 인증 + 게임 초기화 → Godot 로그인 */
  useEffect(() => {
    if (!initialized) return; // Godot 준비X
    if (!user?.uid) {
      setShowLoginPopup(true);
      return;
    }

    godot.signIn(user.uid, '');
    setShowLoginPopup(false);
    setLoginId('');
    setLoginPw('');
  }, [initialized, user]);

  /** ⭐ PowerState Reporting */
  useEffect(() => {
    const sendPowerStateHelper = (state: any) => {
      godot.sendPowerState(
        state.batteryLevel,
        state.batteryState,
        state.lowPowerMode,
      );
    };

    DeviceInfo.getPowerState().then(sendPowerStateHelper);

    const emitter = new NativeEventEmitter(NativeModules.RNDeviceInfo);

    const p1 = emitter.addListener(
      'RNDeviceInfo_powerStateDidChange',
      sendPowerStateHelper,
    );
    const p2 = emitter.addListener(
      'RNDeviceInfo_batteryLevelDidChange',
      lvl => {
        godot.sendBatteryLevel(lvl);
      },
    );

    return () => {
      p1.remove();
      p2.remove();
    };
  }, []);

  /** ⭐ Hidden keyboard 실시간 입력 전달 */
  useEffect(() => {
    if (!keyboardTarget) return;
    godot.sendInput(keyboardTarget, keyboardValue, false);
  }, [keyboardValue]);

  return (
    <View style={styles.full}>
      <RTNGodotView style={styles.full} />

      <WebGuideOverlay
        ref={webGuideRef}
        visible={isGuideOpen}
        guideUrl={guideUrl}
      />

      {showLoginPopup && (
        <LoginPopup
          loginId={loginId}
          loginPw={loginPw}
          setLoginId={setLoginId}
          setLoginPw={setLoginPw}
          onLogin={() => loginWithEmail(loginId, loginPw)}
          onGuest={loginAsGuest}
          onGoogle={loginWithGoogle}
        />
      )}

      <HiddenKeyboardInput
        visible={showKeyboard}
        value={keyboardValue}
        maxLength={keyboardMaxLength}
        onChange={setKeyboardValue}
        onSubmit={() => {
          godot.sendInput(keyboardTarget, keyboardValue, true);
          setShowKeyboard(false);
        }}
        onBlur={() => setShowKeyboard(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  full: {flex: 1},
});

export default App;
