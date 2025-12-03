import 'setimmediate';
import React, {useEffect, useState} from 'react';
import {
  RTNGodot,
  RTNGodotView,
  runOnGodotThread,
} from '@borndotcom/react-native-godot';
import * as FileSystem from 'expo-file-system/legacy';
import {
  StyleSheet,
  View,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Device from 'expo-device';
import {WebView} from 'react-native-webview';
import {useRunOnJS} from 'react-native-worklets-core';
import {useKeepAwake} from 'expo-keep-awake';

const guideUrl =
  'https://minisian.blogspot.com/2025/12/welcome-to-minisia-start-here.html';

function withSigsNode(callback: (sigs: any) => void) {
  runOnGodotThread(() => {
    'worklet';

    const Godot = RTNGodot.API();
    const engine = Godot.Engine;
    const sceneTree = engine.get_main_loop();
    const root = sceneTree.get_root();
    const sigs = root.find_child('Sigs', true, false);

    if (!sigs) {
      console.log('Sigs node not found');
      return;
    }

    callback(sigs);
  });
}

/** ⭐ Godot 엔진 초기화 */
function initGodot(
  name: string,
  openGuideRunOnJS: () => void,
  closeGuideRunOnJS: () => void,
  goBackGuideRunOnJS: () => void,
  goHomeGuideRunOnJS: () => void,
  onLogOutRunOnJS: () => void,
  onSignOutRunOnJS: (from: String) => void,
  onClientInitializedOnJS: (from: String) => void,
) {
  if (RTNGodot.getInstance() != null) {
    console.log('Godot already initialized.');
    return;
  }

  console.log('Initializing Godot');

  runOnGodotThread(() => {
    'worklet';

    if (Platform.OS === 'android') {
      RTNGodot.createInstance([
        '--verbose',
        '--path',
        '/' + name,
        '--rendering-driver',
        'opengl3',
        '--rendering-method',
        'gl_compatibility',
        '--display-driver',
        'embedded',
      ]);
    } else {
      let args = [
        '--verbose',
        '--main-pack',
        FileSystem.bundleDirectory + name + '.pck',
        '--display-driver',
        'embedded',
      ];

      if (Device.isDevice) {
        args.push(
          '--rendering-driver',
          'opengl3',
          '--rendering-method',
          'gl_compatibility',
        );
      } else {
        args.push(
          '--rendering-driver',
          'metal',
          '--rendering-method',
          'mobile',
        );
      }

      RTNGodot.createInstance(args);
    }

    const Godot = RTNGodot.API();
    const engine = Godot.Engine;
    const sceneTree = engine.get_main_loop();
    const root = sceneTree.get_root();

    connectLog(root);
    connectSignal(
      root,
      openGuideRunOnJS,
      closeGuideRunOnJS,
      goBackGuideRunOnJS,
      goHomeGuideRunOnJS,
      onLogOutRunOnJS,
      onSignOutRunOnJS,
      onClientInitializedOnJS,
    );
  });
}

function connectLog(root: any) {
  'worklet';
  const vars = root.find_child('Vars', true, false);
  if (!vars) {
    console.log('Vars node not found');
    return;
  }

  vars.log.connect(function (text: String, color: String) {
    console.log(String(text));
  });
}

function connectSignal(
  root: any,
  openGuideRunOnJS: () => void,
  closeGuideRunOnJS: () => void,
  goBackGuideRunOnJS: () => void,
  goHomeGuideRunOnJS: () => void,
  onLogOutRunOnJS: () => void,
  onSignOutRunOnJS: (from: String) => void,
  onClientInitializedOnJS: (from: String) => void,
) {
  'worklet';
  const sigs = root.find_child('Sigs', true, false);
  if (!sigs) {
    console.log('Sigs node not found');
    return;
  }

  sigs.open_guide_requested.connect(function () {
    console.log('open_guide_requested (worklet)');
    openGuideRunOnJS && openGuideRunOnJS();
  });

  sigs.close_guide_requested.connect(function () {
    console.log('close_guide_requested (worklet)');
    closeGuideRunOnJS && closeGuideRunOnJS();
  });

  sigs.go_back_guide_requested.connect(function () {
    console.log('go_back_guide_requested (worklet)');
    goBackGuideRunOnJS && goBackGuideRunOnJS();
  });

  sigs.go_home_guide_requested.connect(function () {
    console.log('go_home_guide_requested (worklet)');
    goHomeGuideRunOnJS && goHomeGuideRunOnJS();
  });

  sigs.logout_requested.connect(function () {
    console.log('logout_requested (worklet)');
    onLogOutRunOnJS && onLogOutRunOnJS();
  });

  sigs.signout_completed.connect(function (from: String) {
    console.log('signout_completed (worklet)');
    onSignOutRunOnJS && onSignOutRunOnJS(from);
  });

  sigs.client_initialized.connect(function (from: String) {
    console.log('client_initialized (worklet)');
    onClientInitializedOnJS && onClientInitializedOnJS(from);
  });
}

/** ⭐ React Component */
const App = () => {
  useKeepAwake();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // ⭐ 추가
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const [webviewKey, setWebviewKey] = useState(0);
  const webviewRef = React.useRef<WebView>(null);

  /** ⭐ WebViewBox 크기 계산용 상태 */
  const [boxWidth, setBoxWidth] = useState(640);
  const [boxHeight, setBoxHeight] = useState(360);

  /** ⭐ 비율 정보 */
  const TARGET_W = 640;
  const TARGET_H = 360;
  const RATIO = TARGET_W / TARGET_H; // 1.777...

  const openGuide = () => setIsGuideOpen(true);
  const closeGuide = () => setIsGuideOpen(false);

  const goBackGuide = () => {
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  const goHomeGuide = () => {
    setWebviewKey(prev => prev + 1);
  };

  const onLogOut = () => {
    setIsGuideOpen(false);
  };
  const onSignOut = (from: String) => {
    setIsGuideOpen(false);
    if (from == 'lobby') {
      setShowLoginPopup(true);
    }
  };
  const onClientInitialized = (from: String) => {
    console.log('onClientInitialized:', from);
    setShowLoginPopup(true);
  };
  const signIn = (id: String, password: String) => {
    withSigsNode(sigs => {
      'worklet';
      sigs.signin(id, password);
    });
  };

  const openGuideRunOnJS = useRunOnJS(openGuide, [setIsGuideOpen]);
  const closeGuideRunOnJS = useRunOnJS(closeGuide, [setIsGuideOpen]);
  const goBackGuideRunOnJS = useRunOnJS(goBackGuide, []);
  const goHomeGuideRunOnJS = useRunOnJS(goHomeGuide, []);
  const onLogOutRunOnJS = useRunOnJS(onLogOut, []);
  const onSignOutRunOnJS = useRunOnJS(onSignOut, []);
  const onClientInitializedOnJS = useRunOnJS(onClientInitialized, []);

  useEffect(() => {
    initGodot(
      'Minisia',
      openGuideRunOnJS,
      closeGuideRunOnJS,
      goBackGuideRunOnJS,
      goHomeGuideRunOnJS,
      onLogOutRunOnJS,
      onSignOutRunOnJS,
      onClientInitializedOnJS,
    );
  }, [
    openGuideRunOnJS,
    closeGuideRunOnJS,
    goBackGuideRunOnJS,
    goHomeGuideRunOnJS,
    onLogOutRunOnJS,
    onSignOutRunOnJS,
    onClientInitializedOnJS,
  ]);

  /** ⭐ WebViewOverlay 크기 기반 WebViewBox 실측 조정 */
  const onOverlayLayout = e => {
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
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                signIn(loginId, loginPw);
                setShowLoginPopup(false);
                setLoginId('');
                setLoginPw('');
              }}>
              <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>
                Log In
              </Text>
            </TouchableOpacity>
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
});

export default App;
