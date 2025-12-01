import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Minisia",
      in: window,
      launchOptions: launchOptions
    )

    // React Native가 만든 ViewController
    guard let rnVC = window?.rootViewController else { return true }

    // 새로운 RootViewController 생성
    let rootVC = RootViewController()

    // window에 RootViewController 세팅
    window?.rootViewController = rootVC
    window?.makeKeyAndVisible()

    // RN 뷰컨트롤러를 child로 추가
    rootVC.addChild(rnVC)
    rootVC.view.addSubview(rnVC.view)
    rnVC.view.frame = rootVC.view.bounds
    rnVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    rnVC.didMove(toParent: rootVC)

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
