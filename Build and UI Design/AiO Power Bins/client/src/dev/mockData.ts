/**
 * mockData.ts — DỮ LIỆU DEMO chỉ dùng khi mở panel bằng TRÌNH DUYỆT THƯỜNG
 * (npm run dev), KHÔNG chạy trong Premiere và KHÔNG lọt vào bản build production.
 *
 * Mục đích: xem trước giao diện (lưới, thẻ, menu trái, chip, Power Bins, Packs...)
 * mà không cần Premiere. Preview media không phát được (không có máy chủ media),
 * nên thẻ hiện icon + nhãn loại — đủ để rà soát thiết kế.
 */
import type { Asset, AssetType } from '../types'
import { useLibrary } from '../state/store'
// Video demo THẬT (154 KB, 3s) — để đo "rê chuột -> frame đầu" ngay trên
// trình duyệt. Chỉ nằm trong bản dev; mockData không lọt vào production.
import demoPreviewUrl from './preview.mp4'

const FOLDERS = [
  'E:/Assets/Overlay Video',
  'E:/Assets/Titles MOGRT',
  'E:/Assets/SFX Library',
  'E:/Assets/Backgrounds',
]

const SAMPLE: Record<AssetType, { names: string[]; ext: string }> = {
  video: {
    ext: 'mp4',
    names: ['Light Leak 01', 'Smoke Overlay', 'Film Burn 04', 'Dust Particles',
            'Bokeh Loop', 'Glitch Transition', 'Rain Window', 'Neon Flicker'],
  },
  mogrt: {
    ext: 'mogrt',
    names: ['Lower Third — Bold', 'Title Reveal', 'Call To Action', 'Instagram Frame',
            'Subscribe Bell', 'Location Tag', 'Price Tag Pop', 'Social Bar'],
  },
  audio: {
    ext: 'wav',
    names: ['Whoosh Impact', 'Cinematic Boom', 'UI Click', 'Riser Tension',
            'Sub Drop', 'Glitch Hit', 'Ambient Pad', 'Notification'],
  },
  image: {
    ext: 'png',
    names: ['Gradient BG 12', 'Paper Texture', 'Grain Overlay', 'Light Flare',
            'Grid Pattern', 'Noise Map', 'Vignette', 'Color Bars'],
  },
  preset: {
    ext: 'prfpset',
    names: ['Teal & Orange', 'Vintage Film', 'High Contrast', 'Moody Blue'],
  },
  other: { ext: 'txt', names: [] },
}

/** Hash đơn giản cho id ổn định. */
function hid(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

/**
 * Sóng âm GIẢ LẬP cho chế độ demo (SVG nhúng thẳng bằng data: URI).
 * Trong Premiere, sóng âm thật do FFmpeg sinh ra (services/waveform.ts) — hàm này
 * chỉ để rà soát thiết kế trên trình duyệt, KHÔNG lọt vào bản production.
 * Hình dạng ổn định theo tên file (cùng file luôn ra cùng sóng).
 */
function demoWaveform(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rnd = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 1000) / 1000
  }

  const N = 96
  const W = 600
  const H = 120
  const bw = W / N
  let bars = ''
  for (let i = 0; i < N; i++) {
    // Đường bao hình vòm để trông giống một cú SFX có mở đầu và tắt dần
    const env = Math.pow(Math.sin((i / N) * Math.PI), 0.55)
    const amp = Math.max(0.07, env * (0.3 + rnd() * 0.7))
    const bh = amp * H
    bars +=
      `<rect x="${(i * bw).toFixed(1)}" y="${((H - bh) / 2).toFixed(1)}"` +
      ` width="${(bw * 0.6).toFixed(2)}" height="${bh.toFixed(1)}"` +
      ` rx="${(bw * 0.3).toFixed(2)}"/>`
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
    `<g fill="#5b8dff">${bars}</g></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

function build(): Asset[] {
  const out: Asset[] = []
  const now = Date.now()
  const types: AssetType[] = ['video', 'mogrt', 'audio', 'image', 'preset']
  let idx = 0

  // Thư mục CON cấp 1 cho từng loại — giả lập cấu trúc thật kiểu
  // E:\D\Music\Cinematic\..., để menu build được "list như trong folder".
  const SUBDIRS: Record<AssetType, string[]> = {
    video: ['Overlays', 'Transitions'],
    mogrt: ['Titles', 'Lower Thirds'],
    audio: ['SFX', 'Cinematic', 'Ambient'],
    image: ['Textures', 'Backgrounds'],
    preset: [],
    other: [],
  }

  for (const type of types) {
    const { names, ext } = SAMPLE[type]
    names.forEach((name) => {
      // nhân bản mỗi tên vài lần cho lưới đầy
      const copies = type === 'preset' ? 1 : 2
      for (let c = 0; c < copies; c++) {
        const fileName = `${name}${c ? ' ' + (c + 1) : ''}.${ext}`
        // Mỗi LOẠI một thư mục gốc — giống thư viện thật (nhạc nằm chung một
        // gốc kiểu E:\D\Music), menu con mới không bị trùng tên giữa các gốc.
        const folder =
          type === 'video' ? FOLDERS[0]
          : type === 'mogrt' ? FOLDERS[1]
          : type === 'audio' ? FOLDERS[2]
          : FOLDERS[3]
        const subs = SUBDIRS[type]
        const sub = subs.length ? subs[idx % subs.length] : ''
        const path = sub ? `${folder}/${sub}/${fileName}` : `${folder}/${fileName}`
        const a: Asset = {
          id: hid(path),
          name: c ? `${name} ${c + 1}` : name,
          fileName,
          path,
          type,
          ext,
          fileSize: 120_000 + ((idx * 977) % 40) * 250_000,
          dateAdded: now - idx * 3_600_000,
          folder,
        }
        if (type === 'video') {
          a.duration = 3 + (idx % 20)
          a.width = idx % 3 === 0 ? 3840 : 1920
          a.height = idx % 3 === 0 ? 2160 : 1080
          a.fps = 30
          // Gắn video demo thật để hover phát được và ĐO được trên trình duyệt.
          // Vite trả đường dẫn dạng "/src/dev/preview.mp4" — đổi thành URL
          // http đầy đủ để mediaUrl() nhận diện là URL tuyệt đối và cho qua.
          a.previewPath = new URL(demoPreviewUrl, window.location.origin).href
          a.previewKind = 'video'
        }
        if (type === 'audio') {
          a.duration = 1 + (idx % 8)
          a.waveformPath = demoWaveform(fileName)
        }
        if (idx % 7 === 0) a.favorite = true
        if (idx % 5 === 0) a.tags = ['blue']
        if (idx % 6 === 0) a.tags = [...(a.tags ?? []), 'red']
        out.push(a)
        idx++
      }
    })
  }
  return out
}

/** Nạp dữ liệu demo vào store (gọi 1 lần khi chạy ngoài host, ở chế độ dev). */
export function seedMockData(): void {
  const assets = build()

  // Brand Kit demo: 1 brand với 3 khay, để rà soát menu 2 tầng.
  const brandId = 'brand-demo'
  const binLogo = 'pb-logo'
  const binIntro = 'pb-intro'
  const binNhac = 'pb-nhac'

  const assign = (list: typeof assets, binId: string) =>
    list.forEach((a) => {
      a.isPowerBin = true
      a.powerBinFolderId = binId
    })

  assign(assets.slice(0, 3), binLogo)
  assign(assets.slice(3, 6), binIntro)
  assign(assets.filter((a) => a.type === 'audio').slice(0, 4), binNhac)

  const now = Date.now()

  useLibrary.setState({
    assets,
    folders: FOLDERS,
    brands: [{ id: brandId, name: 'Kênh Demo', color: '#5b8dff', dateCreated: now }],
    powerBinFolders: [
      { id: binLogo, name: 'Logo', dateCreated: now, brandId },
      { id: binIntro, name: 'Intro / Outro', dateCreated: now, brandId },
      { id: binNhac, name: 'Nhạc nền', dateCreated: now, brandId },
      // Một khay KHÔNG thuộc brand nào — kiểm mục "Khay chung".
      { id: 'pb-chung', name: 'Hay dùng', dateCreated: now },
    ],
    // true để nhánh video trong AssetCard chạy được với URL demo —
    // nhờ vậy đo hover→frame ngay trên trình duyệt, không cần Premiere.
    mediaReady: true,
  } as any)
}
