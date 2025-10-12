'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotepadText, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Footer } from '@/components/footer';

export default function Home() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');

  const createNewSession = () => {
    const sessionId = sessionName.trim() ? sessionName.trim().replace(/\s+/g, '-') : nanoid(8);
    router.push(`/${sessionId}`);
  };
  
  const createRandomSession = () => {
    const sessionId = nanoid(8);
    router.push(`/${sessionId}`);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      createNewSession();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
            <div className="flex justify-center items-center gap-2 mb-4">
                <NotepadText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-semibold tracking-tight">SyncPad</h1>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <label htmlFor="session-name" className="text-sm font-medium">Create or open a Pad</label>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">syncpad.app/</span>
                    <Input
                        id="session-name"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="my-cool-pad"
                        className="flex-1"
                    />
                </div>
                <Button onClick={createNewSession} className="w-full mt-4">
                    Go
                </Button>
            </div>
            <div className="text-center">
                <Button onClick={createRandomSession} variant="link" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" /> I'm feeling lucky
                </Button>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
