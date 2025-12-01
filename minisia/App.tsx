import 'setimmediate';
import React, {useEffect} from 'react';
import {
  RTNGodot,
  RTNGodotView,
  runOnGodotThread,
} from '@borndotcom/react-native-godot';
import * as FileSystem from 'expo-file-system/legacy';
import {StyleSheet, View, Platform, Text} from 'react-native';
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

    let Godot = RTNGodot.API();
    var engine = Godot.Engine;
    var sceneTree = engine.get_main_loop();
    var root = sceneTree.get_root();

    connectLog(root);
    connectSignal(root);
  });
}

function connectLog(root: any) {
  'worklet';
  const vars = root.find_child('Vars', true, false);
  vars.log.connect(function (text: String, color: String) {
    console.log(text);
  });
}

function connectSignal(root: any) {
  'worklet';
  const sigs = root.find_child('Sigs', true, false);
  sigs.open_guide_requested.connect(function () {
    console.log('open_guide_requested');
  });
  sigs.close_guide_requested.connect(function () {
    console.log('close_guide_requested');
  });
}

const App = () => {
  useEffect(() => {
    initGodot('Minisia');
  }, []);

  return (
    <View style={styles.fullscreen}>
      <RTNGodotView style={styles.fullscreen} />

      <View style={{position: 'absolute', top: 50, left: 20}}>
        <Text style={{fontSize: 20, color: 'white'}}>Hello World!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
});

export default App;
