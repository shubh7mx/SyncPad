'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/footer';

export default function Home() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');

  const createNewSession = () => {
    const sessionId = sessionName.trim() ? sessionName.trim().replace(/\s+/g, '-') : 'your-secret-page';
    router.push(`/${sessionId}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      createNewSession();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-lg space-y-4">
            <h1 className="text-6xl font-bold tracking-wider">SyncPad</h1>
            <p className="text-xl text-muted-foreground">The simplest way to share text online</p>
            <div className="flex items-center gap-2 mt-8 max-w-md mx-auto">
                <div className="flex-1 flex items-center border rounded-md bg-card">
                    <span className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-l-md border-r">syncpad.com/</span>
                    <Input
                        id="session-name"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="your-secret-page"
                        className="flex-1 border-0 rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                    />
                </div>
                <Button onClick={createNewSession} className="h-10">
                    Go!
                </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">No login required</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
