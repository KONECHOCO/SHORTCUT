/**
 * Screenshot App Store — iPhone 6.5" (1284x2778), iPhone 6.9" (1320x2868), iPad 13" (2064x2752).
 * Cattura in tutte le lingue supportate dall'app (it, en, es, fr, de).
 * Uso: avvia Vite su porta 5188 poi `npm run screenshots:store`
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BASE_URL = process.env.SCREENSHOT_URL || 'http://localhost:5188'
const ONLY = process.env.SCREENSHOT_ONLY
const ONLY_LOCALE = process.env.SCREENSHOT_LOCALE

const LOCALES = ['it', 'en', 'es', 'fr', 'de']

const PROFILES = [
  {
    id: 'iphone-6.5',
    label: 'iPhone 6.5" (1284x2778)',
    expected: { width: 1284, height: 2778 },
    context: {
      viewport: { width: 428, height: 926 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    id: 'iphone-6.9',
    label: 'iPhone 6.9" (1320x2868)',
    expected: { width: 1320, height: 2868 },
    context: {
      viewport: { width: 440, height: 956 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    },
  },
  {
    id: 'ipad-13',
    label: 'iPad 13" (2064x2752)',
    expected: { width: 2064, height: 2752 },
    context: {
      viewport: { width: 1032, height: 1376 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    },
  },
]

const SHOTS = [
  { id: 'browse', file: '01-home.png' },
  { id: 'category', file: '02-categorie.png' },
  { id: 'compare', file: '03-confronta.png' },
  { id: 'quiz', file: '04-quiz.png' },
  { id: 'search', file: '05-cerca.png', search: 'ctrl' },
]

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      html, body, #root, .shell { height: 100% !important; max-height: 100% !important; overflow: hidden !important; }
      main { overflow: auto !important; }
      * { scrollbar-width: none !important; }
      *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    `,
  })
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.waitForTimeout(400)
}

async function goHome(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.shell', { timeout: 20000 })
  await page.waitForSelector('.brand-mark', { timeout: 20000 })
  const title = await page.title()
  if (!title.includes('Shortcut Atlas')) {
    throw new Error(`App errata su ${BASE_URL}: titolo "${title}"`)
  }
}

async function captureShot(page, shot, outDir) {
  await goHome(page)
  await preparePage(page)

  if (shot.id === 'category') {
    const chip = page.locator('.cat-list .chip').nth(1)
    await chip.waitFor({ state: 'visible', timeout: 8000 })
    await chip.click()
    await page.waitForTimeout(300)
  } else if (shot.id === 'compare') {
    await page.locator('.view-nav button').nth(2).click()
    await page.waitForSelector('.compare-table', { timeout: 8000 })
    await page.waitForTimeout(300)
  } else if (shot.id === 'quiz') {
    await page.locator('.view-nav button').nth(3).click()
    await page.waitForSelector('.quiz-card', { timeout: 8000 })
    await page.waitForTimeout(300)
  } else if (shot.search) {
    const search = page.locator('.search input')
    await search.waitFor({ state: 'visible', timeout: 8000 })
    await search.fill(shot.search)
    await page.waitForSelector('.grid', { timeout: 8000 })
    await page.waitForTimeout(300)
  }

  const viewport = page.viewportSize()
  const outPath = path.join(outDir, shot.file)
  await page.screenshot({
    path: outPath,
    type: 'png',
    animations: 'disabled',
    caret: 'hide',
    clip: viewport
      ? { x: 0, y: 0, width: viewport.width, height: viewport.height }
      : undefined,
  })
  return outPath
}

async function captureLocaleProfile(browser, locale, profile) {
  const outDir = path.join(ROOT, 'store', 'screenshots', locale, profile.id)
  await mkdir(outDir, { recursive: true })
  const context = await browser.newContext({
    ...profile.context,
    colorScheme: 'dark',
    locale: `${locale}-${locale.toUpperCase()}`,
  })
  await context.addInitScript(
    ({ locale }) => {
      localStorage.setItem('sa-locale', JSON.stringify(locale))
      localStorage.setItem('sa-theme', JSON.stringify('dark'))
      localStorage.setItem('sa-os', JSON.stringify('windows'))
    },
    { locale },
  )

  for (const shot of SHOTS) {
    const page = await context.newPage()
    const outPath = await captureShot(page, shot, outDir)
    const buffer = await readFile(outPath)
    const size = pngSize(buffer)
    const ok = size.width === profile.expected.width && size.height === profile.expected.height
    console.log(
      `${ok ? 'OK' : 'ERR'} [${locale}] ${profile.label} -> ${shot.file} (${size.width}x${size.height})`,
    )
    if (!ok) {
      throw new Error(
        `Dimensioni errate per ${shot.file}: atteso ${profile.expected.width}x${profile.expected.height}`,
      )
    }
    await page.close()
  }

  await context.close()
  console.log(`Saved ${outDir}`)
}

const launchOptions = { headless: true, channel: process.env.PW_CHANNEL || 'msedge' }

const browser = await chromium.launch(launchOptions)
try {
  const selectedProfiles = ONLY ? PROFILES.filter((p) => p.id === ONLY) : PROFILES
  const selectedLocales = ONLY_LOCALE ? LOCALES.filter((l) => l === ONLY_LOCALE) : LOCALES
  if (!selectedProfiles.length) throw new Error(`Nessun profilo per SCREENSHOT_ONLY=${ONLY}`)
  if (!selectedLocales.length) throw new Error(`Nessuna lingua per SCREENSHOT_LOCALE=${ONLY_LOCALE}`)

  for (const locale of selectedLocales) {
    for (const profile of selectedProfiles) {
      console.log(`\n=== [${locale}] ${profile.label} ===`)
      await captureLocaleProfile(browser, locale, profile)
    }
  }
} finally {
  await browser.close()
}
