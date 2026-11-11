import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo = null
let currentToken = null

export function getChatEcho() {
  const token = localStorage.getItem('gosika_token')
  const key = import.meta.env.VITE_REVERB_APP_KEY

  if (!token) throw new Error('Sign in to connect to chat.')
  if (!key) throw new Error('Realtime chat is not configured. Set the Reverb environment variables and rebuild the frontend.')

  if (echo && currentToken === token) return echo

  echo?.disconnect()
  window.Pusher = Pusher
  currentToken = token
  echo = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || window.location.protocol.slice(0, -1)) === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })

  return echo
}
