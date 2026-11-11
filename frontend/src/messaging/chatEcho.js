import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo = null
let currentToken = null

export function getChatEcho() {
  const token = localStorage.getItem('gosika_token')
  const key = import.meta.env.VITE_REVERB_APP_KEY
  const pageHost = window.location.hostname
  const configuredHost = import.meta.env.VITE_REVERB_HOST
  const isLocalHost = (host) => ['localhost', '127.0.0.1', '::1'].includes(host?.replace(/^\[|\]$/g, ''))
  const usePageHost = isLocalHost(configuredHost) && !isLocalHost(pageHost)
  const scheme = import.meta.env.VITE_REVERB_SCHEME
  const forceTLS = scheme === 'https' || window.location.protocol === 'https:'
  const configuredPort = Number(import.meta.env.VITE_REVERB_PORT || 0)

  if (!token) throw new Error('Sign in to connect to chat.')
  if (!key) throw new Error('Realtime chat is not configured. Set the Reverb environment variables and rebuild the frontend.')

  if (echo && currentToken === token) return echo

  echo?.disconnect()
  window.Pusher = Pusher
  currentToken = token
  echo = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: usePageHost ? pageHost : configuredHost || pageHost,
    wsPort: Number(import.meta.env.VITE_REVERB_WS_PORT || (usePageHost ? 8080 : configuredPort || 8080)),
    wssPort: Number(import.meta.env.VITE_REVERB_WSS_PORT || (usePageHost ? 443 : configuredPort || 443)),
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })

  return echo
}
