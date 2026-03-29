import { TodayClient } from './TodayClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function TodayPage(props: PageProps) {
  const searchParams = await props.searchParams
  const today = new Date().toISOString().split('T')[0]
  const currentDate = searchParams.date || today

  return <TodayClient currentDate={currentDate} />
}
