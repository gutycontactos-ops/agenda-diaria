#!/bin/bash

# Script para configurar variables de entorno en Vercel
# Necesita: VERCEL_TOKEN (obtener en https://vercel.com/account/tokens)

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ ERROR: VERCEL_TOKEN no está configurado"
  echo "Obtén tu token en: https://vercel.com/account/tokens"
  echo "Luego ejecuta: export VERCEL_TOKEN='tu_token' && bash setup-vercel-env.sh"
  exit 1
fi

PROJECT_ID="agenda-diaria"

# Variables de entorno requeridas
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL:https://fgbanefaxftlzofpbnzg.supabase.co"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYmFuZWZheGZ0bHpvZnBibnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NTg1NjEsImV4cCI6MjA5MDMzNDU2MX0.usyyJblRSRjiu4UFj50r1FnUOKLW3R52C-okMQSUqdw"
  "NEXT_PUBLIC_FIREBASE_API_KEY:AIzaSyDu8QhuAOGbUi6rqJ7TWTXiNvIipDBsi8A"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:agenda-diaria-b2058.firebaseapp.com"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID:agenda-diaria-b2058"
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:agenda-diaria-b2058.firebasestorage.app"
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:1010891805515"
  "NEXT_PUBLIC_FIREBASE_APP_ID:1:1010891805515:web:9ab84d2d745117e7cb8ece"
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY:BKvpA1m29TmGUeX37rq9lAGX9I2wbY1PqiV3HszaHzhsfUr2OQH8E1SWC0e6XiMw5-OzDH8wbdZyf6hLsnqCEqA"
)

echo "📝 Agregando variables de entorno a Vercel..."

for var in "${ENV_VARS[@]}"; do
  IFS=':' read -r key value <<< "$var"
  echo -n "  → $key... "

  RESPONSE=$(curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"target\":[\"production\",\"preview\",\"development\"]}")

  if echo "$RESPONSE" | grep -q "\"key\":\"$key\""; then
    echo "✅"
  else
    echo "❌"
    echo "    $RESPONSE"
  fi
done

echo ""
echo "✅ Variables configuradas. Vercel redesplegará automáticamente."
