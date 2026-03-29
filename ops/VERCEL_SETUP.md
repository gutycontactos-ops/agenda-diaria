# Configuración de Variables de Entorno en Vercel

El deploy está bloqueado porque **faltan las variables de entorno** en Vercel.

## Pasos para arreglarlo:

1. **Abre Vercel:** https://vercel.com/dashboard
2. **Selecciona "agenda-diaria"**
3. **Ve a Settings → Environment Variables**
4. **Agrega estas variables:**

```
NEXT_PUBLIC_SUPABASE_URL = https://fgbanefaxftlzofpbnzg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYmFuZWZheGZ0bHpvZnBibnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NTg1NjEsImV4cCI6MjA5MDMzNDU2MX0.usyyJblRSRjiu4UFj50r1FnUOKLW3R52C-okMQSUqdw
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyDu8QhuAOGbUi6rqJ7TWTXiNvIipDBsi8A
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = agenda-diaria-b2058.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = agenda-diaria-b2058
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = agenda-diaria-b2058.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 1010891805515
NEXT_PUBLIC_FIREBASE_APP_ID = 1:1010891805515:web:9ab84d2d745117e7cb8ece
NEXT_PUBLIC_FIREBASE_VAPID_KEY = BKvpA1m29TmGUeX37rq9lAGX9I2wbY1PqiV3HszaHzhsfUr2OQH8E1SWC0e6XiMw5-OzDH8wbdZyf6hLsnqCEqA
```

5. **Haz clic en "Save"**
6. **Vercel redesplegará automáticamente en ~2 minutos**
7. **Tu web estará lista en:** https://agenda-diaria-sigma.vercel.app
