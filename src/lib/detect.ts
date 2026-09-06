import type { Locale, OS } from '../types'
import { LOCALES } from '../types'

export function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() ?? ''
  if (ua.includes('mac') || platform.includes('mac')) return 'mac'
  return 'windows'
}

export function detectLocale(): Locale {
  const raw = (navigator.language || 'it').slice(0, 2).toLowerCase()
  return LOCALES.includes(raw as Locale) ? (raw as Locale) : 'it'
}

export function formatKeys(keys: string[]): string {
  return keys.join(' + ')
}
