'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NotepadText } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');

  const createNewSession = () => {
    const sessionId = sessionName.trim() ? sessionName.trim().replace(/\s+/g, '-') : nanoid(8);
    router.push(`/s/${sessionId}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      createNewSession();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <NotepadText className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">SyncPad</CardTitle>
          </div>
          <CardDescription className="pt-2">Create or open a shared notepad.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <label htmlFor="session-name" className="text-sm font-medium text-muted-foreground">
              Custom Pad Name (optional)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">syncpad.app/s/</span>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="my-cool-pad"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createNewSession} className="w-full">
            Create or Open Pad
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
