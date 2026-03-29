import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { date } = await req.json()

  const { data: existing } = await supabase
    .from('reel_ideas')
    .select('*')
    .eq('date', date)
    .single()

  if (existing) return NextResponse.json(existing)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Eres asistente de contenido para dos canales de un creador chileno.
Guty_GG: gaming, streams, rankeo competitivo, entretenimiento.
0alBillon: emprendimiento, mentalidad, desarrollo personal, finanzas.
Genera UNA idea de reel de 60 segundos para cada canal.
Formato idea: gancho inicial potente + 3 bullets de desarrollo.
Responde SOLO con JSON válido sin markdown: {"guty_gg":"...","zero_albillon":"..."}`,
      messages: [{ role: 'user', content: `Genera ideas para el ${date}` }],
    }),
  })

  const data = await response.json()
  const text = data.content[0].text.trim()
  const parsed = JSON.parse(text)

  const { data: saved } = await supabase
    .from('reel_ideas')
    .insert({
      date,
      guty_gg_idea: parsed.guty_gg,
      zero_albillon_idea: parsed.zero_albillon,
    })
    .select()
    .single()

  return NextResponse.json(saved)
}
