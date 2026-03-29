# 🚨 IMPORTANTE: Configurar Vercel AHORA

Tu deploy está listo en Vercel pero **faltan las variables de entorno** que hacen funcionar la app.

## ⚡ Pasos RÁPIDOS (5 minutos):

### 1️⃣ Abre Vercel
https://vercel.com/dashboard

### 2️⃣ Selecciona proyecto "agenda-diaria"
![Dashboard](https://i.imgur.com/placeholder.png)

### 3️⃣ Ve a: Settings → Environment Variables
![Settings](https://i.imgur.com/placeholder.png)

### 4️⃣ Copia y pega CADA una de estas variables:

**NEXT_PUBLIC_SUPABASE_URL**
```
https://fgbanefaxftlzofpbnzg.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYmFuZWZheGZ0bHpvZnBibnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NTg1NjEsImV4cCI6MjA5MDMzNDU2MX0.usyyJblRSRjiu4UFj50r1FnUOKLW3R52C-okMQSUqdw
```

**NEXT_PUBLIC_FIREBASE_API_KEY**
```
AIzaSyDu8QhuAOGbUi6rqJ7TWTXiNvIipDBsi8A
```

**NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
```
agenda-diaria-b2058.firebaseapp.com
```

**NEXT_PUBLIC_FIREBASE_PROJECT_ID**
```
agenda-diaria-b2058
```

**NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
```
agenda-diaria-b2058.firebasestorage.app
```

**NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
```
1010891805515
```

**NEXT_PUBLIC_FIREBASE_APP_ID**
```
1:1010891805515:web:9ab84d2d745117e7cb8ece
```

**NEXT_PUBLIC_FIREBASE_VAPID_KEY**
```
BKvpA1m29TmGUeX37rq9lAGX9I2wbY1PqiV3HszaHzhsfUr2OQH8E1SWC0e6XiMw5-OzDH8wbdZyf6hLsnqCEqA
```

### 5️⃣ Click en "Save"

### 6️⃣ Espera 2 minutos
Vercel redesplegará automáticamente.

### 7️⃣ ¡Listo!
Tu web estará en: **https://agenda-diaria-sigma.vercel.app**

---

## ✅ Verificar que funcionó:
- La página debe cargar sin errores
- Deberías ver "Bem-vindo de volta"
- El formulario de login debe funcionar

## ❌ Si aún ves 404:
1. Recarga la página (Ctrl+Shift+R o Cmd+Shift+R)
2. Espera 5 minutos más
3. Si sigue fallando, revisa que TODAS las variables están agregadas correctamente
