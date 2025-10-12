'use client';

import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { SynonymIcon } from '@/components/icons';

export default function Home() {
  const router = useRouter();

  const createNewSession = () => {
    const sessionId = nanoid(8);
    router.push(`/s/${sessionId}`);
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <SynonymIcon className="h-16 w-16 text-primary" />
      <h1 className="mt-4 font-headline text-5xl font-bold">SyncPad</h1>
      <p className="mt-2 text-muted-foreground">
        Real-time text and file sharing.
      </p>
      <Button onClick={createNewSession} className="mt-8" size="lg">
        <PlusCircle className="mr-2" />
        Create New Pad
      </Button>
    </div>
  );
}
