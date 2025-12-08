// WebGuideOverlay.tsx
import React, {useState, useRef, useImperativeHandle, forwardRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

export interface WebGuideOverlayRef {
  goBack: () => void;
  goHome: () => void;
}

interface Props {
  visible: boolean;
  guideUrl: string;
}

export const WebGuideOverlay = forwardRef<WebGuideOverlayRef, Props>(
  ({visible, guideUrl}, ref) => {
    const webviewRef = useRef<WebView>(null);
    const [webviewKey, setWebviewKey] = useState(0);

    // ⭐ 현재 URL을 state로 관리해야 home 이동 가능
    const [currentUrl, setCurrentUrl] = useState(guideUrl);

    const [boxWidth, setBoxWidth] = useState(640);
    const [boxHeight, setBoxHeight] = useState(360);

    const onLayout = (e: any) => {
      const {width: screenW, height: screenH} = e.nativeEvent.layout;
      const RATIO = 640 / 360;

      const newHeight = screenH;
      let newWidth = newHeight * RATIO;
      if (newWidth > screenW) newWidth = screenW;

      setBoxHeight(newHeight);
      setBoxWidth(newWidth);
    };

    // ⭐ goBack, goHome 외부로 노출
    useImperativeHandle(ref, () => ({
      goBack: () => {
        webviewRef.current?.goBack();
      },
      goHome: () => {
        // 홈 URL을 다시 설정하면 WebView가 홈으로 이동함
        setCurrentUrl(guideUrl);
        setWebviewKey(prev => prev + 1);
      },
    }));

    return (
      <View
        style={StyleSheet.absoluteFill}
        onLayout={onLayout}
        pointerEvents="box-none">
        {/* dim background */}
        <View
          style={[styles.dim, {opacity: visible ? 1 : 0}]}
          pointerEvents="none"
        />

        {/* WebView */}
        <View
          style={[styles.center, {opacity: visible ? 1 : 0}]}
          pointerEvents={visible ? 'auto' : 'none'}>
          <View
            style={[
              styles.webviewBox,
              {
                width: boxWidth * 0.85,
                height: boxHeight + 160,
              },
            ]}>
            <WebView
              key={webviewKey}
              ref={webviewRef}
              source={{uri: currentUrl}}
              onNavigationStateChange={nav => {
                // 뒤로가기 판단에도 유용할 수 있음
              }}
              style={{flex: 1}}
            />
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
});
