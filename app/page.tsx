import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>AI Personal Trainer v2</h1>
      <p style={{ marginBottom: '2rem' }}>
        Welcome! Use the API endpoints to create workout plans or visit the workouts dashboard to explore future UI work.
      </p>
      <Link href="/workouts/plans" style={{ color: '#2563eb', fontWeight: 600 }}>
        Go to workout plans
      </Link>
    </main>
  );
}
