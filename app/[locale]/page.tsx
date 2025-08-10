import HomePageClient from '@/components/pages/home-page-client'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  
  return <HomePageClient locale={locale} />
}