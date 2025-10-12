'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Loader2 } from 'lucide-react';
import { SynonymIcon } from '@/components/icons';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Generate a short, 8-character unique ID for the session
    const sessionId = nanoid(8);
    router.replace(`/s/${sessionId}`);
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <SynonymIcon className="h-16 w-16 text-primary" />
      <h1 className="mt-4 font-headline text-4xl font-bold">Synonym</h1>
      <Loader2 className="mt-8 h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Creating a new session...</p>
    </div>
  );
}
