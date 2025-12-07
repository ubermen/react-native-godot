import 'setimmediate';
import React, {useEffect, useState} from 'react';
import {RTNGodotView} from '@borndotcom/react-native-godot';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  ActivityIndicator,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useKeepAwake} from 'expo-keep-awake';
import DeviceInfo from 'react-native-device-info';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {useGodotBridge} from './components/Godot/useGodotBridge';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import googleServices from './android/app/google-services.json';

const findWebClientId = () => {
  for (const client of googleServices.client) {
    if (!client.oauth_client) continue;

    for (const oauth of client.oauth_client) {
      if (oauth.client_type === 3) {
        return oauth.client_id;
      }
    }
  }
  return null;
};

const guideUrl =
  'https://minisian.blogspot.com/2025/12/welcome-to-minisia-start-here.html';

/** ⭐ React Component */
const App = () => {
  useKeepAwake();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  useEffect(() => {
    auth().onAuthStateChanged(userState => {
      setUser(userState);

      if (loading) {
        setLoading(false);
      }
    });

    const webClientId = findWebClientId();

    if (webClientId) {
      GoogleSignin.configure({webClientId});
    } else {
      console.warn('Web client ID not found in google-services.json');
    }
  }, []);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const openGuide = () => setIsGuideOpen(true);
  const closeGuide = () => setIsGuideOpen(false);

  const [webviewKey, setWebviewKey] = useState(0);
  const webviewRef = React.useRef<WebView>(null);

  /** ⭐ WebViewBox 크기 계산용 상태 */
  const [boxWidth, setBoxWidth] = useState(640);
  const [boxHeight, setBoxHeight] = useState(360);

  /** ⭐ 비율 정보 */
  const TARGET_W = 640;
  const TARGET_H = 360;
  const RATIO = TARGET_W / TARGET_H; // 1.777...

  // ⭐ 숨겨진 TextInput용 상태
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardValue, setKeyboardValue] = useState('');
  const [keyboardTarget, setKeyboardTarget] = useState<string>('');
  const [keyboardMaxLength, setKeyboardMaxLength] = useState<number>(0);

  const goBackGuide = () => {
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  // ⭐ 추가
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const goHomeGuide = () => {
    setWebviewKey(prev => prev + 1);
  };

  const onLogOut = () => {
    setIsGuideOpen(false);
  };
  const onSignOut = async (from: String) => {
    setIsGuideOpen(false);

    if (from == 'lobby') {
      setShowLoginPopup(true);

      // 🔥 Firebase 인증 초기화
      try {
        await auth().signOut();
      } catch (e) {
        console.log('Firebase signOut error:', e);
      }

      // 🔥 Google 계정 초기화 → 다시 계정 선택 팝업 뜨게 함
      try {
        await GoogleSignin.revokeAccess(); // accessToken 강제 제거
        await GoogleSignin.signOut(); // Google 계정 연결 끊기
        console.log('Google signOut complete');
      } catch (e) {
        console.log('Google signOut error:', e);
      }
    }
  };

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const onClientInitialized = (from: string) => {
    console.log('onClientInitialized:', from);
    setShowLoginPopup(true);
  };

  /** ⭐ Godot → RN input 요청 */
  const onInputRequested = (from: string, maxLength: number) => {
    console.log('onInputRequested:', from, '(', maxLength, ')');
    setKeyboardMaxLength(maxLength);
    setKeyboardTarget(from);
    setKeyboardValue('');
    setShowKeyboard(true); // → 숨겨진 TextInput이 자동으로 키보드 띄움
  };
  const onInputReleased = () => {
    setShowKeyboard(false);
  };

  const godot = useGodotBridge('Minisia', {
    openGuide,
    closeGuide,
    goBackGuide,
    goHomeGuide,
    onLogOut,
    onSignOut,
    onClientInitialized,
    onInputRequested,
    onInputReleased,
  });

  /** ⭐ Firebase 로그인 → 성공 후 Godot 로그인 */
  const handleLogin = async () => {
    if (!loginId || !loginPw) return;

    try {
      console.log('Trying Firebase login...');

      // Firebase 이메일 로그인
      const result = await auth().signInWithEmailAndPassword(
        loginId.trim(),
        loginPw.trim(),
      );

      console.log('Firebase login success:', result.user.uid);

      // Firebase 성공 → Godot 로그인 호출
      godot.signIn(loginId, loginPw);

      // UI 정리
      setShowLoginPopup(false);
      setLoginId('');
      setLoginPw('');
    } catch (e) {
      console.log('Firebase login error:', e);
    }
  };
  /** ⭐ Firebase Anonymous → 성공 시 Godot Guest 로그인 */
  const handleGuestLogin = async () => {
    try {
      console.log('Trying Firebase guest login...');

      const result = await auth().signInAnonymously();

      console.log('Firebase guest login success:', result.user.uid);

      const uid = String(result.user.uid); // ⭐ 반드시 원시값으로 복사

      // ⭐ Godot로 게스트 로그인 신호 보내기
      godot.signIn(uid, '');

      setShowLoginPopup(false);
      setLoginId('');
      setLoginPw('');
    } catch (e) {
      console.log('Guest login error:', e);
    }
  };
  const handleGoogleLogin = async () => {
    try {
      console.log('Trying Google login...');

      // Google Play Services 체크
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

      // 사용자 Google 선택 → idToken + userInfo 반환
      const {data} = await GoogleSignin.signIn();

      if (!data) {
        return;
      }

      // Firebase Credential로 변환
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);

      // Firebase Auth 로그인
      const result = await auth().signInWithCredential(googleCredential);

      console.log('Google Firebase login success:', result.user.uid);

      // Godot 로그인
      const uid = String(result.user.uid);
      godot.signIn(uid, '');

      // UI 정리
      setShowLoginPopup(false);
      setLoginId('');
      setLoginPw('');
    } catch (e) {
      console.log('Google login error:', e);
    }
  };

  /** ⭐ RN → Godot input 전달 */
  const sendInput = (to: string, text: string) => {
    godot.sendInput(to, text, true);
  };

  const sendPowerStateHelper = (powerState: any) => {
    // powerState = {
    //   batteryLevel: number (0~1),
    //   batteryState: 'unplugged' | 'charging' | 'full' | 'unknown',
    //   lowPowerMode: boolean
    // }
    const {batteryLevel, batteryState, lowPowerMode} = powerState;
    godot.sendPowerState(batteryLevel, batteryState, lowPowerMode);
  };

  const sendPowerState = () => {
    DeviceInfo.getPowerState().then(sendPowerStateHelper);
  };

  useEffect(() => {
    godot.sendInput(keyboardTarget, keyboardValue, false);
  }, [keyboardTarget, keyboardValue]);

  useEffect(() => {
    // 1) 최초 전달
    sendPowerState();
    const deviceInfoEmitter = new NativeEventEmitter(
      NativeModules.RNDeviceInfo,
    );

    var powerStateListener = deviceInfoEmitter.addListener(
      'RNDeviceInfo_powerStateDidChange',
      sendPowerStateHelper,
    );
    var batteryListener = deviceInfoEmitter.addListener(
      'RNDeviceInfo_batteryLevelDidChange',
      level => {
        godot.sendBatteryLevel(level);
      },
    );

    return () => {
      powerStateListener.remove();
      batteryListener.remove();
    };
  }, []);

  /** ⭐ WebViewOverlay 크기 기반 WebViewBox 실측 조정 */
  const onOverlayLayout = (e: any) => {
    const {width: screenW, height: screenH} = e.nativeEvent.layout;

    // 가로모드 기준: 위아래 꽉 채움 → height = screenH
    const newHeight = screenH;

    // 비율에 따라 width 계산
    let newWidth = newHeight * RATIO; // height * 1.777...

    // 장치 width 보다 크면 clamp
    if (newWidth > screenW) {
      newWidth = screenW;
    }

    setBoxHeight(newHeight);
    setBoxWidth(newWidth);
  };

  return (
    <View style={styles.fullscreen}>
      <RTNGodotView style={styles.fullscreen} />

      <View
        onLayout={onOverlayLayout}
        style={[
          styles.webviewOverlay,
          {display: isGuideOpen ? 'flex' : 'none'},
        ]}
        pointerEvents={isGuideOpen ? 'box-none' : 'none'}>
        <View
          style={[
            styles.webviewBox,
            {width: boxWidth * 0.85, height: boxHeight + 160, top: -80},
          ]}
          pointerEvents="auto">
          <WebView
            key={webviewKey}
            ref={webviewRef}
            source={{uri: guideUrl}}
            style={{flex: 1}}
          />
        </View>
      </View>

      {showLoginPopup && (
        <View style={styles.loginPopup}>
          <View
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 10,
              width: 280,
            }}>
            <Text style={{fontSize: 20, textAlign: 'center', marginBottom: 12}}>
              Log In
            </Text>

            <TextInput
              placeholder="ID"
              style={styles.input}
              value={loginId}
              onChangeText={setLoginId}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <TextInput
              placeholder="Password"
              secureTextEntry
              style={styles.input}
              value={loginPw}
              onChangeText={setLoginPw}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            {/* ⭐ 로그인 버튼 */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, {backgroundColor: '#555', marginTop: 6}]}
              onPress={handleGuestLogin}>
              <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>
                Continue as Guest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginBtn,
                {backgroundColor: '#DB4437', marginTop: 6},
              ]}
              onPress={handleGoogleLogin}>
              <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showKeyboard && (
        <TextInput
          disableFullscreenUI={true}
          autoFocus={true}
          autoCorrect={false}
          multiline={false}
          maxLength={keyboardMaxLength}
          textBreakStrategy="simple"
          underlineColorAndroid="transparent"
          style={styles.hidden_input}
          value={keyboardValue}
          onChangeText={setKeyboardValue}
          autoCapitalize="none"
          onSubmitEditing={() => {
            sendInput(keyboardTarget, keyboardValue);
            setShowKeyboard(false);
          }}
          onBlur={() => {
            sendInput(keyboardTarget, keyboardValue);
            setShowKeyboard(false);
          }}
        />
      )}

      {/* ⭐ 로딩 오버레이 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {flex: 1},

  loginPopup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: 250,
    height: 45,
    backgroundColor: '#fff',
    color: '#000',
    marginVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  loginBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
  },

  hidden_input: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
    backgroundColor: '#fff',
    color: '#000',
  },

  webviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  webviewBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
});

export default App;
