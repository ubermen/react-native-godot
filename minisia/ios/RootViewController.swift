import UIKit

/// 홈 인디케이터(하단 바) 숨기기용 커스텀 VC
class RootViewController: UIViewController {
    // 홈 인디케이터 자동 숨김
    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    // 하단 제스처를 최대한 defer
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge {
        return .bottom
    }
}
