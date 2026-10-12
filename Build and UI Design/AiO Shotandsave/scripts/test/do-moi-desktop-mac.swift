// Do tren macOS: moi cua so cua app dang nam o MAY desktop (Space).
// Hoi thang may chu cua so cua macOS, khong hoi Electron -> khong phai "app tu khai".
// Chi DOC, khong bam, khong doi desktop, khong hien cua so nao.
//
//   swift scripts/test/do-moi-desktop-mac.swift ["AiO Shot"]
//
// Cach doc: cot "o" = so desktop cua so do co mat. Bang tong so desktop = di theo moi desktop.
// Bang 1 = chi nam o desktop luc no duoc mo (loi anh bao 12/10: "mo o desktop nao thi khong xem duoc o desktop khac").
// Doi chung: cua so cua app khac (Finder...) phai ra 1.
import Cocoa

@_silgen_name("CGSMainConnectionID") func CGSMainConnectionID() -> Int32
@_silgen_name("CGSCopySpacesForWindows") func CGSCopySpacesForWindows(_ cid: Int32, _ mask: Int32, _ wids: CFArray) -> CFArray?
@_silgen_name("CGSCopyManagedDisplaySpaces") func CGSCopyManagedDisplaySpaces(_ cid: Int32) -> CFArray?

let ten = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AiO Shot"
let cid = CGSMainConnectionID()

// Tong so desktop thuong (type 0) tren moi man; desktop toan man hinh (type 4) dem rieng
var desktopThuong = 0, desktopToanMan = 0, soMan = 0
var dangDung: [UInt64] = []
if let ds = CGSCopyManagedDisplaySpaces(cid) as? [[String: Any]] {
  for d in ds {
    soMan += 1
    if let cur = d["Current Space"] as? [String: Any], let id = cur["id64"] as? UInt64 { dangDung.append(id) }
    for s in (d["Spaces"] as? [[String: Any]]) ?? [] {
      if (s["type"] as? Int ?? 0) == 0 { desktopThuong += 1 } else { desktopToanMan += 1 }
    }
  }
}
print("man hinh: \(soMan) | desktop thuong: \(desktopThuong) | desktop toan man hinh: \(desktopToanMan) | dang dung: \(dangDung)")

// --doi-chung: tu mo HAI cua so thu 4x4 diem anh, gan nhu trong suot, khong nhan chuot, khong cuop tieu diem, song 1 giay.
// Mot cai khai "di theo moi desktop", mot cai de mac dinh. Thuoc phai ra: cai dau = tong so desktop, cai sau = 1.
if ten == "--doi-chung" {
  let app = NSApplication.shared
  app.setActivationPolicy(.accessory)
  func taoThu(_ moiDesktop: Bool, _ x: CGFloat) -> NSWindow {
    let w = NSWindow(contentRect: NSRect(x: x, y: 2, width: 4, height: 4), styleMask: .borderless, backing: .buffered, defer: false)
    w.alphaValue = 0.02; w.ignoresMouseEvents = true; w.level = .floating; w.isReleasedWhenClosed = false
    if moiDesktop { w.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary] }
    w.orderFrontRegardless()
    return w
  }
  let a = taoThu(true, 2), b = taoThu(false, 10)
  RunLoop.current.run(until: Date().addingTimeInterval(1.0))
  let sa = (CGSCopySpacesForWindows(cid, 7, [a.windowNumber] as CFArray) as? [UInt64]) ?? []
  let sb = (CGSCopySpacesForWindows(cid, 7, [b.windowNumber] as CFArray) as? [UInt64]) ?? []
  print("doi chung | cua so KHAI moi desktop: o \(sa.count) desktop \(sa) | cua so mac dinh: o \(sb.count) desktop \(sb)")
  let dat = sa.count == desktopThuong + desktopToanMan && sb.count == 1 && desktopThuong > 1
  print(dat ? "THUOC DAT: phan biet duoc hai loai" : "THUOC KHONG PHAN BIET DUOC (hoac may chi co 1 desktop)")
  a.close(); b.close()
  exit(dat ? 0 : 1)
}

let ds = (CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]]) ?? []
var dem = 0
for w in ds {
  guard let chu = w[kCGWindowOwnerName as String] as? String, chu.contains(ten) else { continue }
  let id = w[kCGWindowNumber as String] as? Int ?? 0
  let lop = w[kCGWindowLayer as String] as? Int ?? 0
  let mo = w[kCGWindowAlpha as String] as? Double ?? 0
  let tren = (w[kCGWindowIsOnscreen as String] as? Bool) ?? false
  let b = w[kCGWindowBounds as String] as? [String: Any] ?? [:]
  let bw = Int((b["Width"] as? Double) ?? 0), bh = Int((b["Height"] as? Double) ?? 0)
  let bx = Int((b["X"] as? Double) ?? 0), by = Int((b["Y"] as? Double) ?? 0)
  let sp = (CGSCopySpacesForWindows(cid, 7, [id] as CFArray) as? [UInt64]) ?? []
  dem += 1
  print("cua so \(id) | \(chu) | \(bw)x\(bh) @\(bx),\(by) | lop \(lop) | mo \(mo) | dang hien tren man: \(tren ? "co" : "khong") | o \(sp.count) desktop \(sp)")
}
print("tong: \(dem) cua so cua \"\(ten)\"")
