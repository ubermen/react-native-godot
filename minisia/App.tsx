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

/** ⭐ Godot 엔진 초기화 */
function initGodot(
  name: string,
  openGuideRunOnJS: () => void,
  closeGuideRunOnJS: () => void,
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
    connectSignal(root, openGuideRunOnJS, closeGuideRunOnJS);
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
) {
  'worklet';
  const sigs = root.find_child('Sigs', true, false);
  if (!sigs) {
    console.log('Sigs node not found');
    return;
  }

  sigs.open_guide_requested.connect(function () {
    console.log('open_guide_requested (worklet)');
    // useRunOnJS 로 감싼 함수라 여기서 그냥 호출하면 JS 쪽에서 실행됨
    openGuideRunOnJS && openGuideRunOnJS();
  });

  sigs.close_guide_requested.connect(function () {
    console.log('close_guide_requested (worklet)');
    closeGuideRunOnJS && closeGuideRunOnJS();
  });
}

/** ⭐ React Component */
const App = () => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // JS 쪽 상태 업데이트 함수
  const openGuide = () => {
    console.log('openGuide (JS)');
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    console.log('closeGuide (JS)');
    setIsGuideOpen(false);
  };

  /**
   * ⭐ worklets-core의 useRunOnJS 사용
   * - Godot 쓰레드(worklet)에서 호출 가능한 함수로 래핑
   * - 내부에서는 JS 쓰레드로 돌아와서 openGuide / closeGuide 실행
   */
  const openGuideRunOnJS = useRunOnJS(openGuide, [setIsGuideOpen]);
  const closeGuideRunOnJS = useRunOnJS(closeGuide, [setIsGuideOpen]);

  /** Godot 초기화 */
  useEffect(() => {
    initGodot('Minisia', openGuideRunOnJS, closeGuideRunOnJS);
  }, [openGuideRunOnJS, closeGuideRunOnJS]);

  return (
    <View style={styles.fullscreen}>
      <RTNGodotView style={styles.fullscreen} />
      {isGuideOpen && (
        <View
          style={styles.webviewOverlay}
          pointerEvents="box-none" // ⭐ 핵심!
        >
          <View
            style={styles.webviewBox}
            pointerEvents="auto" // ⭐ WebView는 정상 터치 가능
          >
            <WebView
              source={{
                uri: 'https://www.reddit.com/r/minisia/comments/1p9nkwu/welcome_to_minisia_start_here/',
              }}
              style={{flex: 1}}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {flex: 1},

  /** ⭐ WebView 중앙 배치 오버레이 */
  webviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  webviewBox: {
    width: 580,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
});

export default App;
