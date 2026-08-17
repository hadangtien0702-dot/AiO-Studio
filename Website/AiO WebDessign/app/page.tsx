/* =========================================================================
   AiO STUDIO — XAY MOI 100%, 17/08/2026.
   Anh Tien: "khong lay bat ky y tuong cu hoac code cu (ban Gemini)".
   -> Headline moi, hinh ky moi (con tro dang go), font moi (Space Grotesk +
   Inter + JetBrains Mono), copy viet lai tung dong, 8 plugin trinh bay
   kieu DANH SACH HANG (khong phai luoi the cua ban truoc).
   Ban cu doi chieu: git tag `ban-cu-17-08`.

   O lai vi KHONG phai y cua Gemini: gia $0/$17 (anh chot 16/08) · so do
   that (em tu do) · logo + mau cam (thuong hieu tu logo) · cau "Plugins
   cho Premiere Pro · DaVinci Resolve" (anh doc 17/08 — van la loi hua di
   truoc code, xem ghi chu trong tests/).

   Trang la server component. NGOAI LE DUY NHAT: PluginLab.tsx (island
   client) — anh Tien yeu cau 17/08 "bam vao tuong tac duoc voi tinh nang",
   nen rieng section 8 plugin tai JS; phan con lai van tinh.
   ☠️ mailto la duong nhan don DUY NHAT dang co that — co checkout thi thay.
   ========================================================================= */
import { ArrowRight, Check } from "lucide-react";
import PluginLab from "./PluginLab";
import { PLUGINS } from "./plugins";

const MAIL = "dreamtalentmarketing@gmail.com";
const MAILTO_DEMO = `mailto:${MAIL}?subject=AiO%20Studio%20Demo%20-%20Xin%20link%20tai&body=May%20minh%20la%20Windows%2010%2F11%2C%20Premiere%20Pro%20phien%20ban%3A%20`;
const MAILTO_PRO = `mailto:${MAIL}?subject=AiO%20Studio%20-%20Goi%20Pro%20%2417%2Fthang`;

/* [17/08] Du lieu 8 plugin DOI sang app/plugins.ts — nguon duy nhat cho ca
   card Pro (o day) va section demo tuong tac (PluginLab.tsx). */

/* Lop nen hero: timeline Premiere cach dieu — 4 track, moi clip la
   [vi tri trai %, be rong %, tone mau ("cam" = diem nhan)] */
const NEN_TIMELINE: { loai: string; clips: [number, number, string?][] }[] = [
  { loai: "video", clips: [[8, 15], [26, 10], [55, 13, "cam"], [79, 12]] },
  { loai: "video", clips: [[2, 21], [25, 17], [44, 27, "cam"], [73, 22]] },
  { loai: "audio", clips: [[2, 31], [35, 33], [70, 23]] },
  { loai: "audio", clips: [[10, 23], [36, 19, "cam"], [58, 31]] },
];

function Logo({ size = 24 }: { size?: number }) {
  return (
    <img src="/AiO Logo Mark.png" alt="" width={size} height={Math.round(size * 0.91)} aria-hidden="true" />
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#noi-dung">Đi đến nội dung chính</a>

      <header className="dau-trang">
        <div className="khung">
          <a className="thuong-hieu" href="#top" aria-label="AiO Studio - Trang chủ">
            <Logo size={25} />
            <span>AiO Studio</span>
          </a>
          <nav aria-label="Điều hướng chính">
            <a href="#plugin">Plugin</a>
            <a href="#gia">Giá</a>
            <a className="nut-cam" href={MAILTO_DEMO}>Tải Demo</a>
          </nav>
        </div>
      </header>

      <main id="noi-dung">
        {/* ── MO MAN: 2 LOP (anh Tien chi dinh 17/08) ────────────────
            Lop TRUOC: toan bo chu (eyebrow, headline, dan, 2 nut).
            Lop SAU: timeline Premiere cach dieu CHIM MO duoi nen — 4 track
            (2 video + 2 audio dang song), thuoc do khung hinh, playhead cam
            troi cham. Ve moi 100% bang CSS, khong tai dung gi cua ban cu. */}
        <section className="mo-man" id="top">
          {/* [17/08 v3 "tu dien"] Moi clip duoc THA XUONG lan luot theo
              playhead (delay tinh tu vi tri track + thu tu clip) — timeline
              dang tu dung, khong phai hinh tinh. */}
          <div className="nen-timeline" aria-hidden="true">
            <div className="tl-thuoc" />
            {NEN_TIMELINE.map((track, i) => (
              <div className={`tl-track ${track.loai}`} key={i}>
                {track.clips.map(([trai, rong, tone], j) => (
                  <b
                    key={j}
                    className={tone}
                    style={{
                      left: `${trai}%`,
                      width: `${rong}%`,
                      animationDelay: `${(0.35 + i * 0.14 + j * 0.2).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            ))}
            <i className="tl-playhead" />
          </div>
          <div className="khung mo-man-ruot">
            <span className="mo-man-nhan">Plugins cho Premiere Pro · DaVinci Resolve</span>
            {/* Moi dong hien nhu clip duoc dat xuong track — quet mo bang
                clip-path theo nhip playhead (khong scaleY, khong cat chu) */}
            <h1>
              <span className="dong">Cắt.</span>
              <span className="dong">Phụ đề.</span>
              <span className="dong">Multicam.</span>
              <span className="dong">
                <em>Tự động</em>
                <span className="con-tro" aria-hidden="true" />
              </span>
            </h1>
            {/* [17/08] Anh Tien go luon cau dan — hero chi con headline + nut */}
            <div className="mo-man-nut">
              <a className="nut-cam" href={MAILTO_DEMO}>
                Tải Demo miễn phí <ArrowRight size={18} />
              </a>
              <a className="nut-vien" href="#gia">Bảng giá</a>
            </div>
          </div>
        </section>

        {/* [17/08] Anh Tien bo dai 3 con so (cac so da nam trong cot so
            cua danh sach plugin ben duoi — mot thong diep mot noi). */}

        {/* ── 8 PLUGIN: bam hang nao la mo demo TUONG TAC cua tinh nang do
            (anh Tien yeu cau 17/08). PluginLab la "dao" client duy nhat —
            phan con lai cua trang van tinh. */}
        <section className="muc khung" id="plugin">
          {/* [17/08] Anh Tien go cau "Cai mot file. Windows 10/11..." */}
          <div className="muc-dau">
            <h2>Tám plugin, một chỗ.</h2>
            <p>Bấm từng plugin để thử ngay trên trang.</p>
          </div>
          <PluginLab />
        </section>

        {/* ── GIA: 2 goi (anh Tien chot 16/08) ───────────────────────── */}
        <section className="muc khung" id="gia">
          {/* [17/08] Anh Tien go cau "Khong the, khong rang buoc." */}
          <div className="muc-dau">
            <h2>Miễn phí trước. Trả sau.</h2>
          </div>
          <div className="hai-goi">
            <div className="goi">
              <h3>Demo</h3>
              <p className="tien">$0</p>
              <ul>
                <li><Check size={15} /> Asset Manager trọn bộ</li>
                <li><Check size={15} /> Dùng không hạn ngày</li>
                <li><Check size={15} /> Không cần thẻ tín dụng</li>
              </ul>
              <a className="nut-vien" href={MAILTO_DEMO}>Nhận link qua email</a>
            </div>
            <div className="goi chinh">
              <h3>Pro</h3>
              <p className="tien">$17 <small>/ tháng</small></p>
              {/* [17/08] Anh Tien: "Ca 8 plugin" chung chung qua, nguoi dang
                  ky khong biet 8 cai la 8 cai nao — liet ke du ten. Lay thang
                  tu PLUGINS de sau nay them tool la card tu cap nhat. */}
              <ul className="goi-plugins">
                {PLUGINS.map(({ ten }) => (
                  <li key={ten}><Check size={13} /> {ten}</li>
                ))}
              </ul>
              <ul>
                <li><Check size={15} /> Không giới hạn phút xử lý</li>
                <li><Check size={15} /> Hủy lúc nào cũng được</li>
              </ul>
              <a className="nut-cam" href={MAILTO_PRO}>
                Đăng ký Pro <ArrowRight size={18} />
              </a>
            </div>
          </div>
          {/* [17/08] Dong ghi chu duoi bang gia — anh Tien bao go. */}
        </section>
      </main>

      <footer className="chan">
        <div className="khung">
          <a className="thuong-hieu" href="#top">
            <Logo size={22} />
            <span>AiO Studio</span>
          </a>
          <p>Plugin dựng phim cho Premiere Pro · DaVinci</p>
        </div>
      </footer>
    </>
  );
}
