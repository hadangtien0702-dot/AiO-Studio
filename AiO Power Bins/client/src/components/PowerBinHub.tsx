/**
 * PowerBinHub.tsx — menu trái của không gian Power Bins (Brand Kit).
 *
 * Cấu trúc 2 tầng:
 *   Brand (Kênh A, Coca-Cola…)
 *     └─ Khay (Logo, Intro, Nhạc nền…)   ← chỉ hiện khay của brand đang mở
 *
 * Khay không thuộc brand nào (dữ liệu cũ, hoặc cố ý) nằm ở mục "Khay chung" —
 * không bao giờ bị ẩn mất.
 */
import { useMemo, useState } from 'react'
import { useLibrary } from '../state/store'
import { IconZap, IconClose, IconFolder, IconPlus } from './Icons'

export default function PowerBinHub() {
  const brands = useLibrary((s) => s.brands)
  const selectedBrandId = useLibrary((s) => s.selectedBrandId)
  const setSelectedBrandId = useLibrary((s) => s.setSelectedBrandId)
  const createBrand = useLibrary((s) => s.createBrand)
  const deleteBrand = useLibrary((s) => s.deleteBrand)

  const powerBinFolders = useLibrary((s) => s.powerBinFolders)
  const selectedPowerBinFolderId = useLibrary((s) => s.selectedPowerBinFolderId)
  const setSelectedPowerBinFolderId = useLibrary((s) => s.setSelectedPowerBinFolderId)
  const createPowerBinFolder = useLibrary((s) => s.createPowerBinFolder)
  const deletePowerBinFolder = useLibrary((s) => s.deletePowerBinFolder)
  const assets = useLibrary((s) => s.assets)

  const [newBrandName, setNewBrandName] = useState('')
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [newBinName, setNewBinName] = useState('')
  const [creatingBin, setCreatingBin] = useState(false)

  /** Số asset trong từng khay — đếm một lượt thay vì lọc lại cho mỗi dòng. */
  const countByBin = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of assets) {
      if (!a.powerBinFolderId) continue
      m.set(a.powerBinFolderId, (m.get(a.powerBinFolderId) ?? 0) + 1)
    }
    return m
  }, [assets])

  const binsOfBrand = (brandId: string) =>
    powerBinFolders.filter((f) => f.brandId === brandId)

  const loneBins = powerBinFolders.filter((f) => !f.brandId)

  const countOfBrand = (brandId: string) =>
    binsOfBrand(brandId).reduce((n, f) => n + (countByBin.get(f.id) ?? 0), 0)

  const submitBrand = () => {
    const name = newBrandName.trim()
    if (!name) return
    createBrand(name)
    setNewBrandName('')
    setCreatingBrand(false)
  }

  const submitBin = () => {
    const name = newBinName.trim()
    if (!name) return
    createPowerBinFolder(name)
    setNewBinName('')
    setCreatingBin(false)
  }

  /** Một dòng khay (dùng cho cả khay trong brand lẫn khay chung). */
  const BinRow = ({ id, name }: { id: string; name: string }) => {
    const active = selectedPowerBinFolderId === id
    const toggle = () => setSelectedPowerBinFolderId(active ? '' : id)
    return (
      <div
        className={`hub__item hub__item--bin ${active ? 'hub__item--active' : ''}`}
        // Không dùng <button> vì bên trong đã có nút Xoá —
        // nút lồng trong nút là HTML không hợp lệ.
        role="button"
        tabIndex={0}
        aria-pressed={active}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
      >
        <IconFolder size={12} />
        <span className="hub__name">{name}</span>
        <span className="hub__count">{countByBin.get(id) ?? 0}</span>
        <button
          className="hub__del"
          title={`Xoá khay ${name}`}
          aria-label={`Xoá khay ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Xoá khay "${name}"? Asset gốc trên đĩa không bị xoá.`)) {
              deletePowerBinFolder(id)
            }
          }}
        >
          <IconClose size={11} />
        </button>
      </div>
    )
  }

  return (
    <div className="hub">
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="hub__header">
        <span
          className="hub__title"
          title="Mỗi brand là một bộ tài nguyên nhận diện dùng lại ở mọi dự án Premiere"
        >
          <IconZap size={11} /> Brand Kit
        </span>
      </div>

      {!creatingBrand && (
        <button
          className="hub__add-main"
          title="Tạo brand mới (bộ nhận diện dùng lại ở mọi dự án)"
          onClick={() => setCreatingBrand(true)}
        >
          <IconPlus size={13} />
          <span>Tạo brand</span>
        </button>
      )}

      {creatingBrand && (
        <form
          className="hub__form"
          onSubmit={(e) => {
            e.preventDefault()
            submitBrand()
          }}
        >
          <input
            type="text"
            className="hub__input"
            placeholder="Tên brand (vd: Kênh A)…"
            aria-label="Tên brand mới"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="hub__submit">
            Lưu
          </button>
        </form>
      )}

      <div className="hub__list">
        {brands.length === 0 ? null : (
          brands.map((b) => {
            const open = selectedBrandId === b.id
            const bins = binsOfBrand(b.id)
            return (
              <div key={b.id} className="hub__brand">
                <div
                  className={`hub__item hub__item--brand ${open ? 'hub__item--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => setSelectedBrandId(open ? '' : b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedBrandId(open ? '' : b.id)
                    }
                  }}
                >
                  <IconZap size={12} />
                  <span className="hub__name">{b.name}</span>
                  <span className="hub__count">{countOfBrand(b.id)}</span>
                  <button
                    className="hub__del"
                    title={`Xoá brand ${b.name}`}
                    aria-label={`Xoá brand ${b.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        confirm(
                          `Xoá brand "${b.name}"?\n\nCác khay bên trong KHÔNG bị xoá — chúng chuyển sang mục "Khay chung".`,
                        )
                      ) {
                        deleteBrand(b.id)
                      }
                    }}
                  >
                    <IconClose size={11} />
                  </button>
                </div>

                {open && (
                  <>
                    {bins.map((f) => (
                      <BinRow key={f.id} id={f.id} name={f.name} />
                    ))}

                    {creatingBin ? (
                      <form
                        className="hub__form hub__form--nested"
                        onSubmit={(e) => {
                          e.preventDefault()
                          submitBin()
                        }}
                      >
                        <input
                          type="text"
                          className="hub__input"
                          placeholder="Tên khay (vd: Logo)…"
                          aria-label="Tên khay mới"
                          value={newBinName}
                          onChange={(e) => setNewBinName(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="hub__submit">
                          Lưu
                        </button>
                      </form>
                    ) : (
                      <button
                        className="hub__add-row"
                        title={`Thêm khay vào brand ${b.name}`}
                        onClick={() => setCreatingBin(true)}
                      >
                        <IconPlus size={11} />
                        <span>Thêm khay</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Khay không thuộc brand nào ────────────────────── */}
      {loneBins.length > 0 && (
        <>
          <div className="hub__header">
            <span className="hub__title">Khay chung</span>
          </div>
          <div className="hub__list">
            {loneBins.map((f) => (
              <BinRow key={f.id} id={f.id} name={f.name} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
