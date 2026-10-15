// Records one screencast of Kanaemi at work on macOS.
//
// Opens a window with a large text field, switches the input source to
// Kanaemi, records the window with CleanShot X while it sends the keys a
// scene file lists, and shows each key and a caption in bands above and
// below the field, so the reader sees what was pressed as well as what the
// input method did with it.
//
// Usage: stage <scene file> <output .cleanshotvideo>
//
// The keys are posted as hardware events, so Kanaemi receives them exactly
// as typed ones; the program needs the Accessibility permission to post
// them and CleanShot X with its Screen Recording permission.

import AppKit
import Carbon

let kanaemiBundleID = "io.github.kanaemi-app.inputmethod.Kanaemi"
let windowSize = NSSize(width: 960, height: 540)
let defaultKeyInterval = 0.14

// MARK: - Scenes

enum Step {
  case caption(String)
  case type(String)
  case key(String)
  case tap(String)
  case wait(Double)
  case clear
  case clipboard(String)
  case speed(Double)
}

/// One step a line: `caption …`, `type …`, `key <combo>`, `tap lshift|rshift`,
/// `wait <ms>`, `clear`, `clipboard …`, `speed <ms per key>`. `#` starts a
/// comment line.
func parseScene(_ text: String) throws -> [Step] {
  var steps: [Step] = []
  for (number, raw) in text.split(separator: "\n", omittingEmptySubsequences: false).enumerated() {
    let line = raw.trimmingCharacters(in: .whitespaces)
    if line.isEmpty || line.hasPrefix("#") { continue }
    let (word, rest) = line.firstIndex(of: " ").map {
      (String(line[..<$0]), String(line[line.index(after: $0)...]))
    } ?? (line, "")
    switch word {
    case "caption": steps.append(.caption(rest))
    case "type": steps.append(.type(rest))
    case "key":
      for combo in rest.split(separator: " ") {
        guard keyCode(of: String(combo)) != nil else {
          throw SceneError(line: number + 1, message: "unknown key \(combo)")
        }
        steps.append(.key(String(combo)))
      }
    case "tap":
      guard ["lshift", "rshift"].contains(rest) else {
        throw SceneError(line: number + 1, message: "tap takes lshift or rshift")
      }
      steps.append(.tap(rest))
    case "wait":
      guard let ms = Double(rest) else { throw SceneError(line: number + 1, message: "wait takes milliseconds") }
      steps.append(.wait(ms / 1000))
    case "speed":
      guard let ms = Double(rest) else { throw SceneError(line: number + 1, message: "speed takes milliseconds") }
      steps.append(.speed(ms / 1000))
    case "clear": steps.append(.clear)
    case "clipboard": steps.append(.clipboard(rest))
    default: throw SceneError(line: number + 1, message: "unknown step \(word)")
    }
  }
  return steps
}

struct SceneError: Error, CustomStringConvertible {
  let line: Int
  let message: String
  var description: String { "line \(line): \(message)" }
}

// MARK: - Keys

/// Virtual key codes of the ANSI layout, which the letters, digits and the
/// punctuation used here share with the JIS layout.
let keyCodes: [String: CGKeyCode] = [
  "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9,
  "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "y": 16, "t": 17,
  "1": 18, "2": 19, "3": 20, "4": 21, "6": 22, "5": 23, "9": 25, "7": 26, "-": 27,
  "8": 28, "0": 29, "o": 31, "u": 32, "i": 34, "p": 35, "l": 37, "j": 38,
  "k": 40, ";": 41, ",": 43, "/": 44, "n": 45, "m": 46, ".": 47,
  "return": 36, "tab": 48, "space": 49, "backspace": 51, "escape": 53, "delete": 117,
  "left": 123, "right": 124, "down": 125, "up": 126,
  "f6": 97, "f7": 98, "f8": 100, "f9": 101, "f10": 109,
  "semicolon": 41,
]

let modifierKeys: [String: (code: CGKeyCode, flag: CGEventFlags)] = [
  "shift": (56, .maskShift),
  "ctrl": (59, .maskControl),
  "alt": (58, .maskAlternate),
  "cmd": (55, .maskCommand),
]

func keyCode(of combo: String) -> CGKeyCode? {
  let parts = combo.split(separator: "+").map(String.init)
  guard let last = parts.last, parts.dropLast().allSatisfy({ modifierKeys[$0] != nil }) else { return nil }
  return keyCodes[last]
}

/// What the keycast shows for a key.
func label(of combo: String) -> String {
  let names: [String: String] = [
    "return": "Enter", "tab": "Tab", "space": "Space", "backspace": "Backspace",
    "escape": "Esc", "delete": "Delete", "left": "←", "right": "→", "down": "↓", "up": "↑",
    "semicolon": ";", "shift": "Shift", "ctrl": "Ctrl", "alt": "Option", "cmd": "Cmd",
    "lshift": "左 Shift", "rshift": "右 Shift",
  ]
  let parts = combo.split(separator: "+").map(String.init)
  return parts.map { p in
    if let name = names[p] { return name }
    if p.hasPrefix("f"), p.count > 1 { return p.uppercased() }
    // A letter pressed with a modifier is named as on the key: Ctrl+Y.
    return parts.count > 1 ? p.uppercased() : p
  }.joined(separator: "+")
}

let source = CGEventSource(stateID: .hidSystemState)

func post(_ code: CGKeyCode, down: Bool, flags: CGEventFlags, modifier: Bool = false) {
  guard let event = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: down) else { return }
  if modifier { event.type = .flagsChanged }
  event.flags = flags
  event.post(tap: .cghidEventTap)
}

/// Presses a combination such as `ctrl+semicolon` and releases it.
func press(_ combo: String) {
  let parts = combo.split(separator: "+").map(String.init)
  var flags: CGEventFlags = []
  for name in parts.dropLast() {
    let m = modifierKeys[name]!
    flags.insert(m.flag)
    post(m.code, down: true, flags: flags, modifier: true)
    Thread.sleep(forTimeInterval: 0.02)
  }
  let code = keyCodes[parts.last!]!
  post(code, down: true, flags: flags)
  Thread.sleep(forTimeInterval: 0.03)
  post(code, down: false, flags: flags)
  for name in parts.dropLast().reversed() {
    let m = modifierKeys[name]!
    flags.remove(m.flag)
    Thread.sleep(forTimeInterval: 0.02)
    post(m.code, down: false, flags: flags, modifier: true)
  }
}

/// Presses a Shift alone and lets it go, which Kanaemi reads as a mode switch.
func tapShift(_ side: String) {
  let code: CGKeyCode = side == "lshift" ? 56 : 60
  post(code, down: true, flags: .maskShift, modifier: true)
  Thread.sleep(forTimeInterval: 0.06)
  post(code, down: false, flags: [], modifier: true)
}

/// The combination that types a character: a capital letter is the letter with Shift.
func combo(for character: Character) -> String? {
  let s = String(character)
  if character == " " { return "space" }
  if keyCodes[s] != nil { return s }
  let lower = s.lowercased()
  if lower != s, keyCodes[lower] != nil { return "shift+\(lower)" }
  return nil
}

func click(_ point: CGPoint) {
  for type in [CGEventType.mouseMoved, .leftMouseDown, .leftMouseUp] {
    CGEvent(mouseEventSource: source, mouseType: type, mouseCursorPosition: point, mouseButton: .left)?
      .post(tap: .cghidEventTap)
    Thread.sleep(forTimeInterval: 0.1)
  }
}

// MARK: - Windows on the screen

let cleanShotName = "CleanShot X"

struct WindowInfo {
  let number: Int
  let pid: pid_t
  let owner: String
  let name: String
  let bounds: CGRect
  let alpha: Double

  /// Whether it can show anything: some apps keep transparent or one-pixel windows on screen.
  var visible: Bool { alpha > 0 && bounds.width >= 8 && bounds.height >= 8 }
}

/// The windows on screen, front to back, in the top-left coordinates.
func windows() -> [WindowInfo] {
  let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
    as? [[String: Any]] ?? []
  return list.compactMap { info in
    guard let number = info[kCGWindowNumber as String] as? Int,
      let pid = info[kCGWindowOwnerPID as String] as? pid_t,
      let boundsInfo = info[kCGWindowBounds as String] as? NSDictionary,
      let bounds = CGRect(dictionaryRepresentation: boundsInfo)
    else { return nil }
    return WindowInfo(
      number: number, pid: pid, owner: info[kCGWindowOwnerName as String] as? String ?? "",
      name: info[kCGWindowName as String] as? String ?? "", bounds: bounds,
      alpha: info[kCGWindowAlpha as String] as? Double ?? 1)
  }
}

/// Watches, while a scene plays, for any window in front of the stage that
/// is not the stage's, Kanaemi's or CleanShot's: a dialog or a notification
/// of another app would be recorded with whatever it shows.
final class Watcher {
  unowned let stage: Stage
  private let lock = NSLock()
  private var running = false
  private var found: String?

  init(stage: Stage) { self.stage = stage }

  var intruder: String? {
    lock.lock()
    defer { lock.unlock() }
    return found
  }

  func start() {
    lock.lock()
    running = true
    lock.unlock()
    // By bundle, since the names shown for an app follow its localisation.
    let allowedPids = Set(
      [getpid()] + NSWorkspace.shared.runningApplications
        .filter { [kanaemiBundleID, "pl.maketheweb.cleanshotx"].contains($0.bundleIdentifier) }
        .map(\.processIdentifier))
    let (ownWindow, area) = DispatchQueue.main.sync { (stage.window.windowNumber, stage.frameFromTop) }
    Thread.detachNewThread { [self] in
      while true {
        lock.lock()
        let keepGoing = running && found == nil
        lock.unlock()
        if !keepGoing { break }
        for info in windows() {
          if info.number == ownWindow { break }
          let allowed = allowedPids.contains(info.pid)
          if !allowed && info.visible && info.bounds.intersects(area) {
            lock.lock()
            found = "\(info.owner) \(info.name) \(info.bounds)"
            lock.unlock()
            break
          }
        }
        Thread.sleep(forTimeInterval: 0.1)
      }
    }
  }

  func stop() {
    lock.lock()
    running = false
    lock.unlock()
  }
}

// MARK: - Input source

func inputSources(matching properties: [CFString: Any]) -> [TISInputSource] {
  let list = TISCreateInputSourceList(properties as CFDictionary, false)?.takeRetainedValue()
  return (list as? [TISInputSource]) ?? []
}

func selectKanaemi() -> Bool {
  let modes = inputSources(matching: [kTISPropertyBundleID: kanaemiBundleID]).filter { source in
    let category = TISGetInputSourceProperty(source, kTISPropertyInputSourceCategory)
      .map { Unmanaged<CFString>.fromOpaque($0).takeUnretainedValue() as String }
    let selectable = TISGetInputSourceProperty(source, kTISPropertyInputSourceIsSelectCapable)
      .map { CFBooleanGetValue(Unmanaged<CFBoolean>.fromOpaque($0).takeUnretainedValue()) } ?? false
    return category == (kTISCategoryKeyboardInputSource as String) && selectable
  }
  guard let mode = modes.first else { return false }
  return TISSelectInputSource(mode) == noErr
}

// MARK: - Window

final class KeyCap: NSTextField {
  convenience init(_ text: String) {
    self.init(labelWithString: text)
    font = .systemFont(ofSize: 20, weight: .medium)
    textColor = .black
    alignment = .center
    wantsLayer = true
    layer?.cornerRadius = 7
    layer?.borderWidth = 1
    layer?.borderColor = NSColor(white: 0.78, alpha: 1).cgColor
    layer?.backgroundColor = NSColor(white: 0.97, alpha: 1).cgColor
  }

  override var intrinsicContentSize: NSSize {
    let size = super.intrinsicContentSize
    return NSSize(width: max(size.width + 20, 36), height: size.height + 10)
  }
}

final class Stage: NSObject, NSApplicationDelegate {
  let steps: [Step]
  let output: String
  let window = NSWindow(
    contentRect: NSRect(origin: .zero, size: windowSize),
    styleMask: [.titled], backing: .buffered, defer: false)
  let text = NSTextView()
  let caption = NSTextField(labelWithString: "")
  let keys = NSStackView()
  var startedAt = Date()
  var previousSource: TISInputSource?

  init(steps: [Step], output: String) {
    self.steps = steps
    self.output = output
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    // Light whatever the system is set to, so every recording looks alike.
    NSApp.appearance = NSAppearance(named: .aqua)
    window.appearance = NSAppearance(named: .aqua)
    layOut()
    // On the main display, where the clicks on CleanShot's controls are aimed.
    let screen = NSScreen.screens[0].visibleFrame
    window.setFrameOrigin(NSPoint(
      x: (screen.midX - window.frame.width / 2).rounded(), y: (screen.midY - window.frame.height / 2).rounded()))
    window.makeKeyAndOrderFront(nil)
    window.makeFirstResponder(text)
    NSApp.activate(ignoringOtherApps: true)

    previousSource = TISCopyCurrentKeyboardInputSource()?.takeRetainedValue()
    guard selectKanaemi() else {
      FileHandle.standardError.write("Kanaemi is not among the input sources\n".data(using: .utf8)!)
      exit(1)
    }
    Thread.detachNewThread { [self] in
      Thread.sleep(forTimeInterval: 1.0)
      DispatchQueue.main.sync { startRecording() }
      Thread.sleep(forTimeInterval: 2.0)
      clickStudioMode()
      // Out of the frame, so the pointer does not sit on the text.
      Thread.sleep(forTimeInterval: 0.3)
      CGWarpMouseCursorPosition(CGPoint(x: 0, y: 0))
      // Clicking CleanShot took the keyboard, and the input source with it.
      focus()
      guard waitForRecording() else {
        FileHandle.standardError.write("CleanShot did not start recording\n".data(using: .utf8)!)
        DispatchQueue.main.sync { finish(collected: false) }
        return
      }
      Thread.sleep(forTimeInterval: 0.5)
      let watcher = Watcher(stage: self)
      watcher.start()
      play()
      Thread.sleep(forTimeInterval: 1.2)
      watcher.stop()
      clickStop()
      CGWarpMouseCursorPosition(CGPoint(x: 0, y: 0))
      var collected = collectProject()
      if collected { closeEditor() }
      if let intruder = watcher.intruder {
        // Whatever else showed up may be private, so the take is not kept.
        FileHandle.standardError.write("another window was over the area: \(intruder)\n".data(using: .utf8)!)
        try? FileManager.default.removeItem(atPath: output)
        collected = false
      }
      DispatchQueue.main.sync { finish(collected: collected) }
    }
  }

  func layOut() {
    let content = NSView(frame: NSRect(origin: .zero, size: windowSize))
    content.wantsLayer = true
    content.layer?.backgroundColor = NSColor.white.cgColor

    caption.font = .systemFont(ofSize: 20, weight: .semibold)
    caption.textColor = NSColor(white: 0.35, alpha: 1)
    caption.translatesAutoresizingMaskIntoConstraints = false

    let scroll = NSScrollView()
    scroll.translatesAutoresizingMaskIntoConstraints = false
    scroll.drawsBackground = false
    scroll.hasVerticalScroller = false
    text.font = .systemFont(ofSize: 34)
    text.textColor = .black
    text.insertionPointColor = .black
    text.textContainerInset = NSSize(width: 0, height: 8)
    text.isRichText = false
    text.drawsBackground = false
    text.autoresizingMask = [.width]
    text.isAutomaticQuoteSubstitutionEnabled = false
    text.isAutomaticSpellingCorrectionEnabled = false
    text.isAutomaticTextReplacementEnabled = false
    text.isContinuousSpellCheckingEnabled = false
    scroll.documentView = text

    keys.orientation = .horizontal
    keys.spacing = 8
    keys.translatesAutoresizingMaskIntoConstraints = false

    let rule = NSBox()
    rule.boxType = .separator
    rule.translatesAutoresizingMaskIntoConstraints = false

    for view in [caption, scroll, rule, keys] { content.addSubview(view) }
    NSLayoutConstraint.activate([
      caption.topAnchor.constraint(equalTo: content.topAnchor, constant: 22),
      caption.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 40),
      caption.trailingAnchor.constraint(lessThanOrEqualTo: content.trailingAnchor, constant: -40),
      scroll.topAnchor.constraint(equalTo: caption.bottomAnchor, constant: 48),
      scroll.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 36),
      scroll.trailingAnchor.constraint(equalTo: content.trailingAnchor, constant: -36),
      scroll.bottomAnchor.constraint(equalTo: rule.topAnchor, constant: -12),
      rule.leadingAnchor.constraint(equalTo: content.leadingAnchor),
      rule.trailingAnchor.constraint(equalTo: content.trailingAnchor),
      rule.bottomAnchor.constraint(equalTo: content.bottomAnchor, constant: -76),
      keys.leadingAnchor.constraint(equalTo: content.leadingAnchor, constant: 40),
      keys.centerYAnchor.constraint(equalTo: content.bottomAnchor, constant: -38),
    ])
    window.contentView = content
    window.title = ""
  }

  func show(key: String) {
    DispatchQueue.main.async { [self] in
      if keys.arrangedSubviews.count >= 16 {
        keys.arrangedSubviews.first?.removeFromSuperview()
      }
      keys.addArrangedSubview(KeyCap(label(of: key)))
    }
  }

  /// Takes the keyboard back from CleanShot, whose overlay may hold it.
  func focus() {
    var refocused = false
    DispatchQueue.main.sync {
      if !(NSApp.isActive && window.isKeyWindow && window.firstResponder === text) {
        FileHandle.standardError.write("focus: active=\(NSApp.isActive) key=\(window.isKeyWindow) front=\(NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? "-")\n".data(using: .utf8)!)
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(text)
        refocused = true
      }
    }
    // The input source follows the app in front, so CleanShot took Kanaemi away.
    if refocused {
      Thread.sleep(forTimeInterval: 0.3)
      DispatchQueue.main.sync { _ = selectKanaemi() }
      Thread.sleep(forTimeInterval: 0.5)
      tapShift("rshift")
      Thread.sleep(forTimeInterval: 0.8)
    }
  }

  func play() {
    var interval = defaultKeyInterval
    for step in steps {
      focus()
      switch step {
      case .caption(let s):
        DispatchQueue.main.sync {
          caption.stringValue = s
          keys.arrangedSubviews.forEach { $0.removeFromSuperview() }
        }
        Thread.sleep(forTimeInterval: 0.6)
      case .clear:
        DispatchQueue.main.sync { keys.arrangedSubviews.forEach { $0.removeFromSuperview() } }
      case .type(let s):
        for character in s {
          guard let c = combo(for: character) else { continue }
          show(key: c == "space" ? "space" : (c.hasPrefix("shift+") ? String(character) : c))
          press(c)
          Thread.sleep(forTimeInterval: interval)
        }
      case .key(let c):
        show(key: c)
        press(c)
        Thread.sleep(forTimeInterval: max(interval, 0.5))
      case .tap(let side):
        show(key: side)
        tapShift(side)
        Thread.sleep(forTimeInterval: max(interval, 0.6))
      case .wait(let seconds):
        Thread.sleep(forTimeInterval: seconds)
      case .speed(let seconds):
        interval = seconds
      case .clipboard(let s):
        DispatchQueue.main.sync {
          NSPasteboard.general.clearContents()
          NSPasteboard.general.setString(s, forType: .string)
        }
      }
    }
  }

  /// The window's frame in the global coordinates events use, origin at the
  /// top left of the main screen.
  var frameFromTop: CGRect {
    let frame = window.frame
    let screenHeight = NSScreen.screens[0].frame.height
    return CGRect(x: frame.minX, y: screenHeight - frame.maxY, width: frame.width, height: frame.height)
  }

  /// Records the window as a CleanShot X Studio project, which keeps the
  /// recording editable: zooms, the cursor and the keystrokes can be changed
  /// after it is taken. CleanShot's URL scheme opens the area to record but
  /// cannot pick Studio Mode or stop, so those are clicked: the menu and the
  /// controls CleanShot draws sit centred on the area, the Studio Mode item
  /// 94 points below its centre and the stop button 40 points below the area,
  /// 95 points left of its centre.
  func startRecording() {
    startedAt = Date()
    let frame = window.frame
    let query = "x=\(Int(frame.minX))&y=\(Int(frame.minY))&width=\(Int(frame.width))&height=\(Int(frame.height))"
    NSWorkspace.shared.open(URL(string: "cleanshot://record-screen?\(query)")!)
  }

  func clickStudioMode() {
    let area = frameFromTop
    click(CGPoint(x: area.midX, y: area.midY + 94))
  }

  func clickStop() {
    let area = frameFromTop
    click(CGPoint(x: area.midX - 95, y: area.maxY + 40))
  }

  /// Waits for CleanShot's controls to appear below the area, which they do
  /// once its countdown ends and the recording starts.
  func waitForRecording() -> Bool {
    let area = DispatchQueue.main.sync { frameFromTop }
    let deadline = Date().addingTimeInterval(10)
    while Date() < deadline {
      let controls = windows().contains { info in
        info.owner == cleanShotName && info.bounds.minY >= area.maxY - 1
          && info.bounds.minY < area.maxY + 80 && info.bounds.height < 120
      }
      if controls { return true }
      Thread.sleep(forTimeInterval: 0.05)
    }
    return false
  }

  /// Copies the project CleanShot saved for this recording to the output.
  func collectProject() -> Bool {
    let media = FileManager.default.homeDirectoryForCurrentUser
      .appendingPathComponent("Library/Application Support/CleanShot/media")
    let deadline = Date().addingTimeInterval(20)
    while Date() < deadline {
      let projects = (try? FileManager.default.subpathsOfDirectory(atPath: media.path)) ?? []
      let fresh = projects.filter { $0.hasSuffix(".cleanshotvideo") }.map { media.appendingPathComponent($0) }
        .filter { url in
          let created = (try? url.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? .distantPast
          return created > startedAt && FileManager.default.fileExists(
            atPath: url.appendingPathComponent("document.json").path)
        }
      if let project = fresh.first {
        Thread.sleep(forTimeInterval: 1.0)
        let target = URL(fileURLWithPath: output)
        try? FileManager.default.removeItem(at: target)
        do {
          try FileManager.default.copyItem(at: project, to: target)
          return true
        } catch {
          FileHandle.standardError.write("cannot copy \(project.path): \(error)\n".data(using: .utf8)!)
          return false
        }
      }
      Thread.sleep(forTimeInterval: 0.5)
    }
    FileHandle.standardError.write("CleanShot saved no project\n".data(using: .utf8)!)
    return false
  }

  /// Closes the Studio editor CleanShot opens once a recording stops.
  func closeEditor() {
    NSRunningApplication.runningApplications(withBundleIdentifier: "pl.maketheweb.cleanshotx").first?
      .activate()
    Thread.sleep(forTimeInterval: 0.8)
    press("cmd+w")
  }

  func finish(collected: Bool) {
    if let previousSource { TISSelectInputSource(previousSource) }
    exit(collected ? 0 : 1)
  }
}

// MARK: - Main

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  FileHandle.standardError.write("usage: stage <scene file> <output .cleanshotvideo>\n".data(using: .utf8)!)
  exit(2)
}
let steps: [Step]
do {
  steps = try parseScene(String(contentsOfFile: arguments[1], encoding: .utf8))
} catch {
  FileHandle.standardError.write("\(arguments[1]): \(error)\n".data(using: .utf8)!)
  exit(1)
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let stage = Stage(steps: steps, output: arguments[2])
app.delegate = stage
app.run()
