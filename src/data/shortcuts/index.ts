import type { Shortcut } from '../../types'
import { excelShortcuts } from './excel'
import { wordShortcuts } from './word'
import { powerpointShortcuts } from './powerpoint'
import { outlookShortcuts } from './outlook'
import { systemShortcuts } from './system'
import { chromeShortcuts } from './chrome'
import { filesShortcuts } from './files'
import { vscodeShortcuts } from './vscode'

export const shortcuts: Shortcut[] = [
  ...excelShortcuts,
  ...wordShortcuts,
  ...powerpointShortcuts,
  ...outlookShortcuts,
  ...systemShortcuts,
  ...chromeShortcuts,
  ...filesShortcuts,
  ...vscodeShortcuts,
]

export function shortcutsByApp(appId: string): Shortcut[] {
  return shortcuts.filter((item) => item.appId === appId)
}

export function uniqueCategories(list: Shortcut[]): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const item of list) {
    if (!seen.has(item.categoryId)) {
      seen.add(item.categoryId)
      order.push(item.categoryId)
    }
  }
  return order
}

export function uniqueSubcategories(list: Shortcut[], categoryId: string): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const item of list) {
    if (item.categoryId !== categoryId) continue
    if (!seen.has(item.subcategoryId)) {
      seen.add(item.subcategoryId)
      order.push(item.subcategoryId)
    }
  }
  return order
}
