export async function getReelIdeas(date: string) {
  const res = await fetch('/api/claude-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  })
  if (!res.ok) return null
  return res.json()
}
