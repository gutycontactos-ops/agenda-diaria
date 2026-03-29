# Configurar Notificaciones Push (Firebase Cloud Messaging)

## Pasos para activar notificaciones en tu app:

### 1. Crear proyecto Firebase
- Ve a https://console.firebase.google.com
- Crea un nuevo proyecto
- Nombre: "Agenda Diaria"
- Activa Google Analytics (opcional)

### 2. Obtener credenciales
- En Firebase Console → Settings (⚙️) → Project Settings
- Tab "Service Accounts"
- Copia el contenido de "Private Key" (descarga JSON)

### 3. Configurar variables de entorno
Crea `.env.local` en `/ops` con:

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxxxxxxx
NEXT_PUBLIC_FIREBASE_VAPID_KEY=xxxxxxxxxx
```

### 4. Generar VAPID Key
```bash
npm install -g firebase-tools
firebase login
firebase init messaging
```

### 5. Crear tabla en Supabase
En Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_fcm_user ON fcm_tokens(user_id);
```

### 6. Instalar dependencias
```bash
npm install firebase
```

### 7. Crear Cloud Function para enviar notificaciones
En Firebase → Cloud Functions → Create Function

Trigger: Scheduled (Firestore)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendTaskReminders = functions.pubsub
  .schedule('every 1 hours').onRun(async (context) => {
    const db = admin.firestore();
    const tokens = await db.collection('fcm_tokens').get();

    const message = {
      notification: {
        title: '📋 Recuerda tus tareas',
        body: '¿Completaste las tareas de hoy?',
      },
      webpush: {
        fcmOptions: { link: 'https://tu-app.vercel.app' },
        notification: {
          icon: 'https://tu-app.vercel.app/logo.png',
        },
      },
    };

    for (const doc of tokens.docs) {
      const token = doc.data().token;
      await admin.messaging().send({
        ...message,
        token,
      });
    }

    return null;
  });
```

### 8. En Vercel
Agrega las variables NEXT_PUBLIC_* en Vercel Settings → Environment Variables

---

## Resultado final:
✅ Notificaciones push en celular (Android/iOS)
✅ Funciona incluso con app cerrada
✅ Recordatorios automáticos de tareas
✅ Listo para producción

