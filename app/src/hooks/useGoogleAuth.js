import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isGoogleConfigured,
  requestGoogleToken,
  revokeGoogleToken,
  getCachedToken,
  fetchGoogleUserInfo,
} from '../services/googleAuth'

// =====================================================================
// useGoogleAuth — state login OAuth Google untuk satu halaman/layanan.
// =====================================================================
// Dipakai halaman Drive / Google Calendar / YouTube. Menggantikan logika
// yang sebelumnya diduplikasi di GmailPage & BloggerPage.
//
// Perbedaan penting dari pola lama:
//  - Auto-login memeriksa cache untuk SET SCOPE halaman ini saja
//    (getCachedToken), bukan sekadar keberadaan key sessionStorage.
//    Jadi membuka halaman Drive tidak memicu popup gara-gara token
//    Gmail yang tersimpan.
//  - logout() memakai revokeGoogleToken(scopes) sehingga hanya mencabut
//    izin layanan ini; token layanan Google lain tetap hidup.
//
// Pemakaian:
//   const auth = useGoogleAuth(DRIVE_PAGE_SCOPES)
//   if (!auth.configured || !auth.ready) return <GoogleLoginGate ... />
// =====================================================================

export default function useGoogleAuth(scopes) {
  const [state, setState] = useState('idle') // idle | busy | ok | error
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  // scopes adalah array literal baru setiap render di pemanggil; simpan di
  // ref supaya useCallback tidak ikut berubah tiap render.
  const scopesRef = useRef(scopes)
  scopesRef.current = scopes

  const login = useCallback(async () => {
    setState('busy')
    setError('')
    try {
      const entry = await requestGoogleToken({ scopes: scopesRef.current })
      const info = await fetchGoogleUserInfo(scopesRef.current).catch(() => null)
      setEmail(info?.email || entry.email || '')
      setName(info?.name || '')
      setState('ok')
      return true
    } catch (e) {
      setError(
        e.code === 'NOT_CONFIGURED'
          ? 'Client ID Google belum diatur. Isi VITE_GOOGLE_CLIENT_ID di file .env aplikasi lalu build ulang.'
          : e.code === 'popup_closed'
            ? 'Popup Google ditutup sebelum selesai. Coba lagi.'
            : (e.message || 'Login Google gagal.'),
      )
      setState('error')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    await revokeGoogleToken(scopesRef.current).catch(() => {})
    setEmail('')
    setName('')
    setError('')
    setState('idle')
  }, [])

  // Bila token untuk scope set ini masih hidup di cache, langsung masuk
  // tanpa popup (Google mengembalikan token dari cache).
  useEffect(() => {
    if (!isGoogleConfigured()) return
    if (!getCachedToken(scopesRef.current)) return
    login()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    state,
    email,
    name,
    error,
    login,
    logout,
    busy: state === 'busy',
    ready: state === 'ok',
    configured: isGoogleConfigured(),
  }
}
