import { useLibrary } from '../state/store'
import { IconCheck } from './Icons'

export default function Toast() {
  const toast = useLibrary((s) => s.toast)

  if (!toast) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast-box">
        <span className="toast-icon">
          <IconCheck size={12} />
        </span>
        <span className="toast-message">{toast}</span>
      </div>
    </div>
  )
}
