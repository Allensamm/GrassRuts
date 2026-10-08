import { clearOfflineData } from './idb'
import { resetCrypto } from './crypto'
export async function clearPrivateDeviceData() {
  resetCrypto()
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i)
    if (k?.startsWith('gr_key_')) sessionStorage.removeItem(k)
  }
  localStorage.removeItem('gr_salt')
  await clearOfflineData()
  if ('caches' in window)
    for (const key of await caches.keys())
      if (key.startsWith('grassruts-') && key !== 'grassruts-public-v3')
        await caches.delete(key)
}
