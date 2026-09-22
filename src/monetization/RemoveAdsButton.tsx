import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { rewardedEnabled, showRewardedForAdFree } from './ads'
import { monetizationConfig } from './config'
import {
  getAdFreeUntil,
  getRemoveAdsPrice,
  isPurchased,
  purchaseRemoveAds,
  purchasesEnabled,
  refreshEntitlement,
  restoreRemoveAds,
  subscribePremium,
} from './premium'

const STRINGS = {
  it: {
    buy: 'Rimuovi pubblicità',
    watch: 'Guarda un video: 30 min senza pubblicità',
    until: 'Senza pubblicità fino alle {time}',
    restore: 'Ripristina acquisti',
    owned: 'Senza pubblicità — grazie!',
    notFound: 'Nessun acquisto da ripristinare.',
    failed: 'Acquisto non riuscito. Riprova.',
    noVideo: 'Nessun video disponibile ora, riprova tra poco.',
  },
  en: {
    buy: 'Remove ads',
    watch: 'Watch a video: 30 min ad-free',
    until: 'Ad-free until {time}',
    restore: 'Restore purchases',
    owned: 'Ad-free — thank you!',
    notFound: 'No purchase to restore.',
    failed: 'Purchase failed. Please try again.',
    noVideo: 'No video available right now, try again shortly.',
  },
  fr: {
    buy: 'Supprimer les pubs',
    watch: 'Regarder une vidéo : 30 min sans pub',
    until: 'Sans publicité jusqu’à {time}',
    restore: 'Restaurer les achats',
    owned: 'Sans publicité — merci !',
    notFound: 'Aucun achat à restaurer.',
    failed: 'Achat échoué. Réessayez.',
    noVideo: 'Aucune vidéo disponible, réessayez bientôt.',
  },
  es: {
    buy: 'Quitar anuncios',
    watch: 'Ver un vídeo: 30 min sin anuncios',
    until: 'Sin anuncios hasta las {time}',
    restore: 'Restaurar compras',
    owned: 'Sin anuncios — ¡gracias!',
    notFound: 'No hay compras que restaurar.',
    failed: 'La compra no se completó. Inténtalo de nuevo.',
    noVideo: 'No hay vídeos disponibles, inténtalo en un momento.',
  },
  de: {
    buy: 'Werbung entfernen',
    watch: 'Video ansehen: 30 Min. werbefrei',
    until: 'Werbefrei bis {time}',
    restore: 'Käufe wiederherstellen',
    owned: 'Werbefrei — danke!',
    notFound: 'Kein Kauf zum Wiederherstellen.',
    failed: 'Kauf fehlgeschlagen. Bitte erneut versuchen.',
    noVideo: 'Gerade kein Video verfügbar, bitte gleich erneut versuchen.',
  },
  pt: {
    buy: 'Remover anúncios',
    watch: 'Ver um vídeo: 30 min sem anúncios',
    until: 'Sem anúncios até {time}',
    restore: 'Restaurar compras',
    owned: 'Sem anúncios — obrigado!',
    notFound: 'Nenhuma compra para restaurar.',
    failed: 'A compra falhou. Tente novamente.',
    noVideo: 'Nenhum vídeo disponível agora, tente novamente em breve.',
  },
}

type Lang = keyof typeof STRINGS

function strings(locale?: string) {
  const lang = (locale || navigator.language || 'en').slice(0, 2).toLowerCase()
  return { lang, t: STRINGS[(lang in STRINGS ? lang : 'en') as Lang] }
}

/**
 * "Remove ads" purchase, "Restore purchases" (required by App Review) and the
 * opt-in rewarded video for a temporary ad-free window.
 */
export function RemoveAdsButton({ locale, compact = false }: { locale?: string; compact?: boolean }) {
  const purchased = useSyncExternalStore(subscribePremium, isPurchased)
  const adFreeUntil = useSyncExternalStore(subscribePremium, getAdFreeUntil)
  const price = useSyncExternalStore(subscribePremium, getRemoveAdsPrice)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const { lang, t } = strings(locale)

  useEffect(() => {
    void refreshEntitlement()
  }, [])

  if (!purchasesEnabled) return null

  const margin = compact ? 0 : '8px 0'
  if (purchased) {
    return <p style={{ ...styles.note, margin }}>✓ {t.owned}</p>
  }

  async function run(action: () => Promise<boolean>, failure: string) {
    setBusy(true)
    setMessage(undefined)
    try {
      if (!(await action())) setMessage(failure)
    } catch (error) {
      // User cancellation lands here too; don't shout about it.
      const text = String((error as Error)?.message ?? error)
      if (!/cancel/i.test(text)) setMessage(t.failed)
    } finally {
      setBusy(false)
    }
  }

  const untilLabel = adFreeUntil
    ? t.until.replace(
        '{time}',
        new Date(adFreeUntil).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }),
      )
    : undefined

  return (
    <div style={{ ...styles.wrap, margin }}>
      <button
        type="button"
        disabled={busy}
        style={styles.buy}
        onClick={() => run(purchaseRemoveAds, t.failed)}
      >
        {t.buy}
        {price ? ` · ${price}` : ''}
      </button>
      {untilLabel ? (
        <p style={styles.note}>✓ {untilLabel}</p>
      ) : rewardedEnabled ? (
        <button
          type="button"
          disabled={busy}
          style={styles.watch}
          onClick={() => run(showRewardedForAdFree, t.noVideo)}
        >
          ▶ {t.watch}
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        style={styles.restore}
        onClick={() => run(restoreRemoveAds, t.notFound)}
      >
        {t.restore}
      </button>
      {message ? <p style={styles.note}>{message}</p> : null}
    </div>
  )
}

const button: CSSProperties = {
  appearance: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
}

const styles: Record<string, CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  buy: {
    ...button,
    border: 0,
    color: monetizationConfig.accentTextColor,
    background: monetizationConfig.accentColor,
  },
  watch: {
    ...button,
    fontWeight: 600,
    fontSize: '0.9em',
    color: 'inherit',
    background: 'transparent',
    border: `1px solid ${monetizationConfig.accentColor}`,
  },
  restore: {
    appearance: 'none',
    border: 0,
    background: 'transparent',
    padding: 4,
    font: 'inherit',
    fontSize: '0.85em',
    textDecoration: 'underline',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.75,
  },
  note: { fontSize: '0.85em', opacity: 0.8, textAlign: 'center', margin: 0 },
}
