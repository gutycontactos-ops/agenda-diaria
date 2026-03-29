import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Reemplaza con tus credenciales de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let messaging: any = null

export const initializeNotifications = async () => {
  try {
    if (!messaging) {
      const app = initializeApp(firebaseConfig)
      messaging = getMessaging(app)
    }

    // Solicitar permisos al usuario
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      })
      console.log('FCM Token:', token)
      return token
    }
  } catch (error) {
    console.error('Error initializing notifications:', error)
  }
}

export const listenToMessages = () => {
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload)

      if ('notification' in payload && payload.notification) {
        const { title, body, image } = payload.notification
        new Notification(title || 'Nueva notificación', {
          body: body || '',
          icon: image || '/logo.png',
          badge: '/logo-badge.png',
        })
      }
    })
  }
}

export const saveFCMToken = async (userId: string, token: string) => {
  try {
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    })
    return response.ok
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}
