'use client'

import { useEffect } from 'react'
import { initializeNotifications, listenToMessages, saveFCMToken } from '@/lib/notifications'

export function NotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await initializeNotifications()
        if (token) {
          // Guardar token con ID de usuario (en este caso usamos 'anonymous')
          await saveFCMToken('default-user', token)
          listenToMessages()
        }
      } catch (error) {
        console.error('Notification setup failed:', error)
      }
    }

    setupNotifications()
  }, [])

  return null
}
