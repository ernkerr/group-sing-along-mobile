import ExpoModulesCore
import SafariServices

public class ExpoSafariReaderModule: Module {
  private class SafariDelegate: NSObject, SFSafariViewControllerDelegate {
    var onFinish: (() -> Void)?

    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
      onFinish?()
    }
  }

  private var safariDelegate = SafariDelegate()
  private var currentSafariVC: SFSafariViewController?
  private var dismissPromise: Promise?

  public func definition() -> ModuleDefinition {
    Name("ExpoSafariReader")

    AsyncFunction("openReaderView") { (url: String, promise: Promise) in
      DispatchQueue.main.async {
        self.openSafariReaderView(urlString: url, promise: promise)
      }
    }
  }

  private func openSafariReaderView(urlString: String, promise: Promise) {
    guard let url = URL(string: urlString) else {
      promise.reject("INVALID_URL", "The provided URL is invalid")
      return
    }

    guard let currentViewController = self.appContext?.utilities?.currentViewController() else {
      promise.reject("NO_VIEW_CONTROLLER", "Could not find a view controller")
      return
    }

    // Create Safari configuration with Reader mode enabled
    let config = SFSafariViewController.Configuration()
    config.entersReaderIfAvailable = true
    config.barCollapsingEnabled = true

    let safariVC = SFSafariViewController(url: url, configuration: config)

    // Set up delegate callback
    self.safariDelegate.onFinish = { [weak self] in
      self?.currentSafariVC = nil
      self?.dismissPromise?.resolve("dismissed")
      self?.dismissPromise = nil
    }
    safariVC.delegate = self.safariDelegate

    self.currentSafariVC = safariVC
    self.dismissPromise = promise

    currentViewController.present(safariVC, animated: true)
  }
}
