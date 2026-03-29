import { TodayClient } from './TodayClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function TodayPage(props: PageProps) {
  return <TodayClient />
}
