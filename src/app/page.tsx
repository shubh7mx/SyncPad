'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NotepadText, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');

  const createNewSession = () => {
    const sessionId = sessionName.trim() ? sessionName.trim().replace(/\s+/g, '-') : nanoid(8);
    router.push(`/s/${sessionId}`);
  };
  
  const createRandomSession = () => {
    const sessionId = nanoid(8);
    router.push(`/s/${sessionId}`);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      createNewSession();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
        <header className="absolute top-4 right-4 z-50">
            <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border-border/60">
                <CardHeader className="items-center text-center">
                    <NotepadText className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-3xl font-bold">SyncPad</CardTitle>
                    <CardDescription className="pt-2">
                        Create a shared notepad instantly.
                        <br />
                        No accounts, no hassle.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 rounded-md border border-input bg-background/50 pr-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                        <span className="pl-3 text-sm text-muted-foreground hidden sm:inline">syncpad.app/s/</span>
                        <Input
                            id="session-name"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="my-cool-pad (or leave blank)"
                            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button onClick={createNewSession} className="w-full" size="lg">
                        Create or Open Pad
                    </Button>
                    <Button onClick={createRandomSession} className="w-full" variant="ghost" size="sm">
                        <Sparkles className="mr-2 h-4 w-4" /> I'm feeling lucky
                    </Button>
                </CardFooter>
            </Card>
        </main>
    </div>
  );
}
