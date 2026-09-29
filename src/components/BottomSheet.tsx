import type { PropsWithChildren } from 'react'
export function BottomSheet({ open, title, onClose, children }: PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>) {
  if (!open) return null
  return <div className="sheet-layer" role="presentation" onMouseDown={onClose}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" /><header className="sheet-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭设置">×</button></header>{children}</section></div>
}
