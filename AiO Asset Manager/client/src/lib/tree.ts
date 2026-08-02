/**
 * tree.ts — dựng cây danh mục từ cấu trúc thư mục của asset.
 * Dùng cho menu bên trái (kiểu Film Impact Dashboard).
 */
import type { Asset } from '../types'

export interface TreeNode {
  /** Tên hiển thị (tên thư mục). */
  name: string
  /** Khoá đường dẫn tương đối, dùng để lọc theo tiền tố. */
  key: string
  /** Số asset thuộc nhánh này (gồm cả nhánh con). */
  count: number
  children: TreeNode[]
}

/** Đường dẫn thư mục tương đối của asset so với thư mục gốc đã thêm. */
export function relDirOf(asset: Asset): string {
  const full = asset.path.replace(/\\/g, '/')
  const root = asset.folder.replace(/\\/g, '/').replace(/\/+$/, '')
  let rel = full.startsWith(root) ? full.slice(root.length) : full
  rel = rel.replace(/^\/+/, '')
  const slash = rel.lastIndexOf('/')
  return slash < 0 ? '' : rel.slice(0, slash)
}

/**
 * Dựng cây từ danh sách asset. Giới hạn độ sâu để menu không quá dài.
 */
export function buildTree(assets: Asset[], maxDepth = 3): TreeNode[] {
  const root: TreeNode = { name: '', key: '', count: 0, children: [] }
  const index = new Map<string, TreeNode>([['', root]])

  for (const a of assets) {
    const rel = relDirOf(a)
    root.count++
    if (!rel) continue

    const parts = rel.split('/').filter(Boolean).slice(0, maxDepth)
    let key = ''
    let parent = root

    for (const part of parts) {
      key = key ? `${key}/${part}` : part
      let node = index.get(key)
      if (!node) {
        node = { name: part, key, count: 0, children: [] }
        index.set(key, node)
        parent.children.push(node)
      }
      node.count++
      parent = node
    }
  }

  const sortRec = (n: TreeNode) => {
    n.children.sort((x, y) => x.name.localeCompare(y.name))
    n.children.forEach(sortRec)
  }
  sortRec(root)

  return root.children
}
