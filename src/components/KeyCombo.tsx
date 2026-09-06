import { formatKeys } from '../lib/detect'

export function KeyCombo({
  keys,
  size = 'md',
}: {
  keys: string[]
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <span className={`keys keys-${size}`} title={formatKeys(keys)}>
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} className="keycap">
          {key}
        </span>
      ))}
    </span>
  )
}
