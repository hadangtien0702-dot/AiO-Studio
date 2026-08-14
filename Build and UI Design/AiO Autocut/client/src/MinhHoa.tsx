/**
 * MinhHoa.tsx — hình TĨNH mô phỏng TIMELINE cho người dựng mường tượng ba mức cắt.
 *
 * Anh Tiến 2026-07-29, lần 1: *"khi anh bấm vào giữ nhịp em hãy tạo ra một ảnh
 * tĩnh có thể cho editor mường tượng sẵn (không cần lấy trực tiếp từ clip)...
 * tạo ảnh sẵn cho nhẹ"*.
 * Lần 2, sau khi xem bản đầu: *"chỗ này em vẽ lại giống như trên timeline á em"*.
 *
 * Nên bản này vẽ đúng thứ người dựng nhìn hằng ngày: **track V1 (hình) + track
 * A1 (tiếng có sóng âm)**, chồng lên nhau, màu gần với Premiere. Bản trước chỉ
 * là hai thanh trơn — đúng về ý nhưng không gợi được cảm giác timeline.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ĐÂY LÀ HÌNH MINH HOẠ, KHÔNG PHẢI SỐ ĐO
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Nó hiện NGAY khi bấm mức, chưa chạy gì cả — nên không thể là dữ liệu thật.
 * Mục đích duy nhất: nhìn phát hiểu "mức này cắt thưa hay dày, video ngắn đi
 * cỡ nào".
 *
 * Dải sóng THẬT (đo từ chính clip của người dùng) nằm ở bước xem trước, sau khi
 * tách tiếng xong. Hai thứ khác nhau, đừng lẫn:
 *      hình này  = mường tượng trước, tức thì, số ước lệ
 *      dải sóng  = số đo thật trên file, sau 45 giây
 *
 * Vẽ bằng SVG inline: không tải ảnh, không đọc file, không tính toán gì — nhẹ
 * đúng như anh Tiến dặn *"nhẹ để nhanh, không nặng để đẹp"*.
 */
import { dich } from './ngonngu'

/**
 * Các khoảng SẼ BỎ, tính theo phần trăm chiều dài — số ước lệ cho dễ nhìn.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ LỜI NGƯỜI DÙNG GIẢI THÍCH ≠ LỜI ĐEM LÊN GIAO DIỆN
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Anh Tiến chỉ cách nói: *"các điểm chết âm thanh — dead silent — sẽ được cắt
 * sát hoàn toàn; giữ nhịp thì Dead Silent cắt bỏ ít, vẫn giữ được sự tự
 * nhiên"*. Tôi bê **nguyên văn** lên UI, ra câu "cắt SÁT HOÀN TOÀN mọi điểm
 * chết âm thanh" — viết hoa lộn xộn, dài, đọc vấp. Anh Tiến: *"ngôn ngữ anh
 * giải thích cho em hiểu thì em lại đưa vào 100% vậy em — phải chuốt lại đọc
 * cho nó mượt chứ"*.
 *
 * Người dùng nói để mình HIỂU Ý, không phải để chép. Lấy đúng thuật ngữ nghề
 * (**dead silent**), còn câu chữ thì viết lại: cùng một khuôn, ngắn, song song
 * nhau để đọc lướt là so được ba mức.
 *
 *      [bỏ cái gì]  ·  [nghe ra sao]
 */
const KIEU: Record<number, { bo: [number, number][]; mo: string }> = {
  0: {
    bo: [
      [18, 4],
      [47, 5],
      [76, 4],
    ],
    mo: 'Bỏ dead silent dài · giữ nhịp nói tự nhiên',
  },
  1: {
    bo: [
      [11, 4],
      [25, 5],
      [39, 4],
      [54, 5],
      [70, 4],
      [86, 4],
    ],
    mo: 'Bỏ phần lớn dead silent · vẫn còn khoảng thở',
  },
  2: {
    bo: [
      [7, 4],
      [16, 4],
      [25, 5],
      [35, 4],
      [45, 5],
      [55, 4],
      [64, 5],
      [74, 4],
      [83, 4],
      [92, 4],
    ],
    mo: 'Bỏ sạch dead silent · nhịp dồn liên tục',
  },
}

const W = 320 // đơn vị viewBox theo chiều ngang
const CAO_V = 15 // track hình
const CAO_A = 19 // track tiếng (cao hơn để chứa sóng)
const KHE = 1.5 // khe giữa hai track, như Premiere
const CAO_TL = CAO_V + KHE + CAO_A // một timeline
// Hai dải giờ là hai thẻ SVG riêng (mỗi cái cao đúng `CAO_TL`), khe giữa chúng
// do CSS `gap` lo — không còn cần tính chiều cao tổng nữa.

/**
 * Khoảng cách dọc từ dải "Auto Cut" NGƯỢC LÊN dải "Raw", tính bằng đơn vị
 * viewBox. Dùng làm điểm XUẤT PHÁT của animation: đoạn bắt đầu ở trên rồi rơi
 * xuống, đúng ý anh Tiến *"từ timeline 1 sẽ được đưa xuống"*.
 *
 * = chiều cao một dải (35,5) + nhãn "AUTO CUT TIMELINE" và các khe (~26px thật,
 * mà tỉ lệ Y ở đây xấp xỉ 1:1 vì SVG cao 36px cho viewBox 35,5).
 *
 * ⚠️ Muốn đoạn bay ra ngoài khung mà không bị cắt thì SVG phải có
 * `overflow: visible` — xem `.mh__hinh` trong styles.css.
 */
const DY_LEN = CAO_TL + 26

/**
 * Biên độ sóng âm giả — CỐ ĐỊNH, không random.
 *
 * Random thì mỗi lần React vẽ lại là sóng nhảy một kiểu, nhìn như bị lỗi. Dãy
 * này lặp lại theo chu kỳ, có chỗ to chỗ nhỏ cho giống tiếng nói thật.
 */
const SONG = [
  0.55, 0.8, 0.42, 0.95, 0.62, 0.35, 0.78, 0.5, 0.88, 0.45, 0.7, 0.33, 0.92, 0.58,
  0.4, 0.85, 0.52, 0.75, 0.38, 0.68, 0.9, 0.47, 0.6, 0.82, 0.36, 0.72, 0.55, 0.48,
]

export default function MinhHoa({ muc }: { muc: number }) {
  const k = KIEU[muc] ?? KIEU[1]
  const boDi = k.bo.reduce((a, b) => a + b[1], 0)
  const conLai = 100 - boDi

  // Các đoạn GIỮ trên timeline gốc (phần bù của `bo`)
  const giuGoc: [number, number][] = []
  let moc = 0
  for (const [tu, dai] of k.bo) {
    if (tu > moc) giuGoc.push([moc, tu - moc])
    moc = tu + dai
  }
  if (moc < 100) giuGoc.push([moc, 100 - moc])

  // Cũng các đoạn đó nhưng đã DỒN SÁT — timeline sau khi cắt
  const giuSau: [number, number][] = []
  let dat = 0
  for (const [, dai] of giuGoc) {
    giuSau.push([dat, dai])
    dat += dai
  }

  const px = (phanTram: number) => (phanTram / 100) * W

  /**
   * Một cặp track V + A cho một dãy đoạn.
   *
   * `truotTu` (tuỳ chọn) = dãy vị trí GỐC của từng đoạn. Có nó thì mỗi đoạn
   * xuất phát ở chỗ cũ rồi **trượt** về chỗ dồn sát — người dựng thấy được đoạn
   * nào đi đâu, thay vì hai hình rời nhau không liên quan.
   */
  const veTimeline = (
    doan: [number, number][],
    y0: number,
    khoa: string,
    truotTu?: [number, number][],
  ) => (
    <g key={khoa}>
      {doan.map(([tu, dai], i) => {
        const x = px(tu)
        const w = Math.max(2, px(dai))
        // Quãng đường phải đi = từ chỗ cũ TRÊN dải Raw xuống chỗ mới ở dải dưới.
        //   dx = lệch ngang (chỗ cũ − chỗ dồn sát)
        //   dy = lệch dọc  (nhảy ngược lên đúng dải Raw)
        // Anh Tiến 29/07: *"anh muốn các animation từ timeline 1 sẽ được đưa
        // xuống và sát lại nhau"* — nên phải đi CẢ HAI chiều, không chỉ trượt
        // ngang như bản trước.
        const dx = truotTu ? px(truotTu[i][0]) - x : 0
        const kieu = truotTu
          ? ({
              '--dx': `${dx}px`,
              '--dy': `${-DY_LEN}px`,
              // `--tre` cộng thêm vào độ trễ chung (xem `.mh__truot`): đoạn sau
              // rơi sau đoạn trước, thành một đợt sóng chứ không rụp một cái.
              '--tre': `${i * 55}ms`,
            } as React.CSSProperties)
          : undefined
        return (
          <g key={i} className={truotTu ? 'mh__truot' : undefined} style={kieu}>
            {/* Track hình */}
            <rect x={x} y={y0} width={w} height={CAO_V} rx="2" className="mh__v" />
            {/* Track tiếng + sóng âm bên trong */}
            <rect
              x={x}
              y={y0 + CAO_V + KHE}
              width={w}
              height={CAO_A}
              rx="2"
              className="mh__a"
            />
            {veSong(x, w, y0 + CAO_V + KHE, tu)}
          </g>
        )
      })}
    </g>
  )

  /** Sóng âm: các vạch dọc trong track tiếng, cách nhau 4 đơn vị. */
  const veSong = (x: number, w: number, yA: number, mocPhanTram: number) => {
    const vach = []
    const buoc = 4
    const giua = yA + CAO_A / 2
    // Lấy chỉ số theo vị trí THẬT trên timeline để cùng một đoạn luôn ra cùng
    // hình sóng ở cả dải trước lẫn dải sau — nhìn mới thấy "đúng là đoạn đó".
    let i = Math.round(mocPhanTram)
    for (let dx = 2; dx < w - 1; dx += buoc, i++) {
      const a = (SONG[i % SONG.length] * (CAO_A - 5)) / 2
      vach.push(
        <line
          key={dx}
          x1={x + dx}
          y1={giua - a}
          x2={x + dx}
          y2={giua + a}
          className="mh__song"
        />,
      )
    }
    return <g>{vach}</g>
  }

  return (
    <div className="mh">
      {/* ☠️ `preserveAspectRatio="none"` + chiều cao CỐ ĐỊNH trong CSS.
          Mặc định SVG giữ tỉ lệ: viewBox 320 rộng mà panel kéo tới 1600px thì
          hình phình cao gấp 5 lần — đúng cái khoảng trống khổng lồ anh Tiến
          thấy giữa hai dải (29/07). Timeline vốn giãn NGANG, không cao lên. */}
      {/* HAI khung SVG riêng, mỗi khung một nhãn.
          Vì sao không vẽ chữ trong SVG: `preserveAspectRatio="none"` kéo giãn
          mọi thứ theo bề ngang — chữ sẽ méo dẹt khi panel rộng. Nhãn để ngoài
          bằng HTML thì luôn đúng cỡ.

          `key={muc}` để React DỰNG LẠI khi đổi mức — có vậy animation mới chạy
          lại. Không có key thì React chỉ sửa thuộc tính, keyframes đã chạy xong
          một lần rồi thì thôi. */}

      <span className="mh__nhan">{dich('Bản gốc')}</span>
      <svg
        key={`raw-${muc}`}
        viewBox={`0 0 ${W} ${CAO_TL}`}
        className="mh__hinh"
        preserveAspectRatio="none"
        role="img"
        aria-label={dich('Timeline gốc, chỗ tô đỏ là dead silent sẽ bị bỏ')}
      >
        {veTimeline(giuGoc, 0, 'truoc')}
        {k.bo.map(([tu, dai], i) => (
          <rect
            key={i}
            x={px(tu)}
            y="0"
            width={px(dai)}
            height={CAO_TL}
            rx="2"
            className="mh__bo"
          />
        ))}
      </svg>

      {/* Mũi tên giữa hai dải đã BỎ 29/07 — anh Tiến: *"cái nút mũi tên này ở
          đây cũng không được đẹp nữa á"*. Đúng: đã có animation trượt thì
          chuyển động tự nói đoạn nào đi đâu, vẽ thêm mũi tên là nói lại cùng
          một ý lần thứ hai. */}

      <span className="mh__nhan mh__nhan--sau">
        {dich('Sau khi cắt')}
        <i>{dich('còn')} {conLai}%</i>
      </span>
      {/* Bọc để đặt vệt sáng đè lên dải. Vệt chạy SAU khi đoạn cuối ghép xong:
          1250ms (thời lượng rơi+ghép) + độ trễ của đoạn cuối. */}
      <div
        className="mh__vo"
        key={`vo-${muc}`}
        style={
          {
            '--loe-tre': `${1150 + (giuSau.length - 1) * 55}ms`,
          } as React.CSSProperties
        }
      >
        <svg
          viewBox={`0 0 ${W} ${CAO_TL}`}
          className="mh__hinh"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Timeline sau khi cắt, còn khoảng ${conLai}% độ dài`}
        >
          {veTimeline(giuSau, 0, 'sau', giuGoc)}
        </svg>
        {/* Vệt sáng quét qua khi ghép xong. Anh Tiến 29/07: *"khi ghép xong em
            cho anh một lightwipe cho nó đẹp đẹp"*. Nó là dấu chấm hết của câu
            chuyện — "xong, ngắn đi từng này". Chỉ chạy MỘT lần, không lặp:
            lặp là thành đèn nhấp nháy, mắt bị kéo mãi không thôi. */}
        <span className="mh__khungloe" aria-hidden="true">
          <span className="mh__loe" />
        </span>
      </div>

      {/* Dòng "hình mô phỏng · bấm AUTO CUT để đo trên clip thật" đã BỎ 29/07.
          Tôi thêm nó để ngăn hiểu nhầm, nhưng anh Tiến bảo bỏ — và đúng: chữ
          "còn KHOẢNG 74%" đã ngụ ý ước lượng, nút AUTO CUT lại nằm ngay dưới.
          Nói thêm một lần nữa là bắt mắt đọc hai lần cùng một ý. */}
      {/* Phần "còn khoảng X% độ dài" đã BỎ khỏi đây 29/07 — anh Tiến: *"2 chỗ
          này đang bị trùng thông tin"*. Con số đó đã nằm ngay trên nhãn "AUTO
          CUT TIMELINE · còn X%", sát cạnh dải mà nó nói về. Nhắc lại lần nữa ở
          đây là bắt mắt đọc hai lần cùng một ý.
          Nguyên tắc của anh Tiến: một thông điệp chỉ nói ở MỘT nơi. */}
      {/* ☠️ Dịch Ở ĐÂY, đừng bọc `dich()` vào chính `KIEU`: `KIEU` là const tầng
          module, chạy lúc import — lúc đó `NhaNgonNgu` chưa vẽ nên bảng chữ
          (`_bang`) còn null, `dich()` trả lại nguyên văn tiếng Việt và ĐÓNG CỨNG
          ở đó, đổi ngôn ngữ không ăn. Gọi trong thân component thì mỗi lần vẽ
          lại là dịch lại. Ba câu `mo` đều có trong `chu.ts`. */}
      <p className="mh__chu">{dich(k.mo)}</p>
    </div>
  )
}
