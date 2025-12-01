import 'setimmediate';
import React, {useEffect, useState} from 'react';
import {
  RTNGodot,
  RTNGodotView,
  runOnGodotThread,
} from '@borndotcom/react-native-godot';
import * as FileSystem from 'expo-file-system/legacy';
import {StyleSheet, View, Platform, Text} from 'react-native';
import * as Device from 'expo-device';
import {WebView} from 'react-native-webview';
import {useRunOnJS} from 'react-native-worklets-core';

const guideUrl =
  'https://minisian.blogspot.com/2025/12/welcome-to-minisia-start-here.html';

/** ⭐ Godot 엔진 초기화 */
function initGodot(
  name: string,
  openGuideRunOnJS: () => void,
  closeGuideRunOnJS: () => void,
  goBackGuideRunOnJS: () => void,
  goHomeGuideRunOnJS: () => void,
  onLogOutRunOnJS: () => void,
  onSignOutRunOnJS: () => void,
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
  onSignOutRunOnJS: () => void,
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

  sigs.signout_requested.connect(function () {
    console.log('signout_requested (worklet)');
    onSignOutRunOnJS && onSignOutRunOnJS();
  });
}

/** ⭐ React Component */
const App = () => {
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

  const onLogOut = () => setIsGuideOpen(false);
  const onSignOut = () => setIsGuideOpen(false);

  const openGuideRunOnJS = useRunOnJS(openGuide, [setIsGuideOpen]);
  const closeGuideRunOnJS = useRunOnJS(closeGuide, [setIsGuideOpen]);
  const goBackGuideRunOnJS = useRunOnJS(goBackGuide, []);
  const goHomeGuideRunOnJS = useRunOnJS(goHomeGuide, []);
  const onLogOutRunOnJS = useRunOnJS(onLogOut, []);
  const onSignOutRunOnJS = useRunOnJS(onSignOut, []);

  useEffect(() => {
    initGodot(
      'Minisia',
      openGuideRunOnJS,
      closeGuideRunOnJS,
      goBackGuideRunOnJS,
      goHomeGuideRunOnJS,
      onLogOutRunOnJS,
      onSignOutRunOnJS,
    );
  }, [
    openGuideRunOnJS,
    closeGuideRunOnJS,
    goBackGuideRunOnJS,
    goHomeGuideRunOnJS,
    onLogOutRunOnJS,
    onSignOutRunOnJS,
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
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {flex: 1},

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
