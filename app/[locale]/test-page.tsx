export default async function TestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <div>Test page works! Locale: {locale}</div>;
}
