// src/godot/useGodotBridge.ts
import {Platform} from 'react-native';
import {RTNGodot, runOnGodotThread} from '@borndotcom/react-native-godot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Device from 'expo-device';
import {useRunOnJS} from 'react-native-worklets-core';
import {useEffect, useRef} from 'react';

/** ------------------------------------------------------
 * 내부적으로 Sigs node 찾기
 * ------------------------------------------------------ */
function withSigs(callback: (sigs: any) => void) {
  runOnGodotThread(() => {
    'worklet';

    const Godot = RTNGodot.API();
    const engine = Godot.Engine;
    const tree = engine.get_main_loop();
    const root = tree.get_root();

    const sigs = root.find_child('Sigs', true, false);
    if (!sigs) {
      console.log('Sigs not found');
      return;
    }

    callback(sigs);
  });
}

/** ------------------------------------------------------
 * Hook: Godot 커넥션 + 제어 API
 * ------------------------------------------------------ */
export function useGodotBridge(
  name: string,
  appCallbacks: {
    openGuide: () => void;
    closeGuide: () => void;
    goBackGuide: () => void;
    goHomeGuide: () => void;
    onLogOut: () => void;
    onSignOut: (from: string) => void;
    onClientInitialized: (from: string) => void;
    onInputRequested: (from: string, maxLength: number) => void;
    onInputReleased: () => void;
  },
) {
  /** ------------------------------------------------------
   *  App 콜백을 worklet-safe 형태로 변환
   * ------------------------------------------------------ */
  const cb = {
    openGuide: useRunOnJS(appCallbacks.openGuide, []),
    closeGuide: useRunOnJS(appCallbacks.closeGuide, []),
    goBackGuide: useRunOnJS(appCallbacks.goBackGuide, []),
    goHomeGuide: useRunOnJS(appCallbacks.goHomeGuide, []),
    onLogOut: useRunOnJS(appCallbacks.onLogOut, []),
    onSignOut: useRunOnJS(appCallbacks.onSignOut, []),
    onClientInitialized: useRunOnJS(appCallbacks.onClientInitialized, []),
    onInputRequested: useRunOnJS(appCallbacks.onInputRequested, []),
    onInputReleased: useRunOnJS(appCallbacks.onInputReleased, []),
  };

  /** ------------------------------------------------------
   * Godot → RN 시그널 연결
   * ------------------------------------------------------ */
  function connectSignals(root: any) {
    'worklet';

    const sigs = root.find_child('Sigs', true, false);
    if (!sigs) {
      console.log('Sigs node not found');
      return;
    }

    sigs.open_guide_requested.connect(function () {
      console.log('open_guide_requested (worklet)');
      cb.openGuide();
    });

    sigs.close_guide_requested.connect(function () {
      console.log('close_guide_requested (worklet)');
      cb.closeGuide();
    });

    sigs.go_back_guide_requested.connect(function () {
      console.log('go_back_guide_requested (worklet)');
      cb.goBackGuide();
    });

    sigs.go_home_guide_requested.connect(function () {
      console.log('go_home_guide_requested (worklet)');
      cb.goHomeGuide();
    });

    sigs.logout_requested.connect(function () {
      console.log('logout_requested (worklet)');
      cb.onLogOut();
    });

    sigs.signout_completed.connect(function (from: string) {
      console.log('signout_completed (worklet)');
      cb.onSignOut(from);
    });

    sigs.client_initialized.connect(function (from: string) {
      console.log('client_initialized (worklet)');
      cb.onClientInitialized(from);
    });

    sigs.input_requested.connect(function (from: string, maxLength: number) {
      console.log('input_requested (worklet)');
      cb.onInputRequested(from, maxLength);
    });
    sigs.input_released.connect(function (from: String) {
      console.log('input_released (worklet)');
      cb.onInputReleased();
    });
  }

  /** ------------------------------------------------------
   * Godot 초기화
   * ------------------------------------------------------ */
  useEffect(() => {
    if (RTNGodot.getInstance()) return;

    console.log('Initializing Godot Bridge...');

    runOnGodotThread(() => {
      'worklet';

      let args: string[];

      if (Platform.OS === 'android') {
        args = [
          '--verbose',
          '--path',
          '/' + name,
          '--rendering-driver',
          'opengl3',
          '--rendering-method',
          'gl_compatibility',
          '--display-driver',
          'embedded',
        ];
      } else {
        args = [
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
      }

      RTNGodot.createInstance(args);

      const Godot = RTNGodot.API();
      const engine = Godot.Engine;
      const root = engine.get_main_loop().get_root();

      connectSignals(root);
    });
  }, []);

  /** ------------------------------------------------------
   * 외부에 제공할 Godot API (App.tsx는 이 함수들만 사용)
   * ------------------------------------------------------ */
  const api = useRef({
    signIn(id: string, pw: string) {
      withSigs(sigs => {
        'worklet';
        sigs.signin(id, pw);
      });
    },

    sendGuestLogin(uid: string) {
      withSigs(sigs => {
        'worklet';
        sigs.signin(uid, '');
      });
    },

    sendInput(to: string, text: string, release: boolean = true) {
      withSigs(sigs => {
        'worklet';
        sigs.send_input(to, text, release);
      });
    },

    sendPowerState(level: number, state: string, low: boolean) {
      withSigs(sigs => {
        'worklet';
        sigs.send_power_state(level, state, low);
      });
    },

    sendBatteryLevel(level: number) {
      withSigs(sigs => {
        'worklet';
        sigs.send_battery_level(level);
      });
    },
  });

  return api.current;
}
