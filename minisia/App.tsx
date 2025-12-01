import 'setimmediate';
import React, {useEffect} from 'react';
import {
  RTNGodot,
  RTNGodotView,
  runOnGodotThread,
} from '@borndotcom/react-native-godot';
import * as FileSystem from 'expo-file-system/legacy';
import {StyleSheet, View, Platform} from 'react-native';
import * as Device from 'expo-device';

function initGodot(name: string) {
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
  });
}

const App = () => {
  // ⭐ 앱 시작 시 곧바로 initGodot 실행
  useEffect(() => {
    console.log('Auto-starting Godot…');
    initGodot('Minisia');
  }, []);

  return (
    <View style={styles.fullscreen}>
      {/* ⭐ 화면 전체를 GodotView로 채움 */}
      <RTNGodotView style={styles.fullscreen} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
});

export default App;
