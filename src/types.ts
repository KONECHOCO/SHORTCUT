export type Locale = 'it' | 'en' | 'es' | 'fr' | 'de'
export type OS = 'windows' | 'mac'
export type ViewId = 'browse' | 'favorites' | 'compare' | 'quiz' | 'formulas' | 'tips'

export type I18nText = Record<Locale, string>

export interface AppInfo {
  id: string
  color: string
  icon: string
}

export interface Shortcut {
  id: string
  appId: string
  categoryId: string
  subcategoryId: string
  keys: { windows: string[]; mac: string[] }
  title: I18nText
  description: I18nText
  example: I18nText
  result: I18nText
}

export interface Formula {
  id: string
  syntax: string
  title: I18nText
  description: I18nText
  example: I18nText
  result: I18nText
}

export interface Tip {
  id: string
  os: OS | 'both'
  title: I18nText
  steps: I18nText
  result: I18nText
}

export const LOCALES: Locale[] = ['it', 'en', 'es', 'fr', 'de']

export function tx(
  it: string,
  en: string,
  es: string,
  fr: string,
  de: string,
): I18nText {
  return { it, en, es, fr, de }
}
