export function AppGlyph({ id, size = 22 }: { id: string; size?: number }) {
  const s = { width: size, height: size }
  switch (id) {
    case 'excel':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <path d="M8 8h3.2l1.3 4.1L14 8h3l-2.6 8h-3.1L8 8z" fill="#0b1a12" />
        </svg>
      )
    case 'word':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <path d="M7 16V8h2.2l1.6 5.4L12.6 8H15v8h-1.8v-5.2L11.6 16h-1.3L8.8 10.8V16H7z" fill="#071018" />
        </svg>
      )
    case 'powerpoint':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <path d="M8 8h4.2a3.2 3.2 0 0 1 0 6.4H9.8V16H8V8zm1.8 1.6v3.2h2.2a1.6 1.6 0 0 0 0-3.2H9.8z" fill="#1a0c07" />
        </svg>
      )
    case 'outlook':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
          <path d="M6.5 8.2 12 12.1l5.5-3.9V16H6.5V8.2zm1.3-.8h8.4L12 10.6 7.8 7.4z" fill="#041018" />
        </svg>
      )
    case 'system':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="3" y="4" width="18" height="13" rx="2" fill="currentColor" />
          <path d="M8 19h8v1.4H8z" fill="currentColor" />
        </svg>
      )
    case 'chrome':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <circle cx="12" cy="12" r="3.4" fill="#140806" />
        </svg>
      )
    case 'files':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <path d="M3.5 7.2A2 2 0 0 1 5.4 6h4.1l1.6 1.6h7.4A2 2 0 0 1 20.5 9.5v8.3a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V7.2z" fill="currentColor" />
        </svg>
      )
    case 'vscode':
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <path d="M4 8.2 9.2 12 4 15.8V8.2zm1.2-2.4L16.6 3l3.6 1.6v14.8L16.6 21 5.2 18.2 20 12 5.2 5.8z" fill="currentColor" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" {...s} aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" />
        </svg>
      )
  }
}
