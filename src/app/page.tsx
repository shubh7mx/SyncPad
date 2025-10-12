'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col h-screen w-full bg-black text-foreground font-sans dark">
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-lg space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-wider animate-text-shimmer bg-[linear-gradient(110deg,hsl(var(--primary)),45%,#ffffff,55%,hsl(var(--primary)))] bg-[length:250%_100%] bg-clip-text text-transparent">
                SYNCPAD
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">The simplest way to share text and files online</p>
            <div className="flex items-center gap-2 mt-8 max-w-md mx-auto group">
                <div className="relative flex-1">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/80 rounded-lg blur opacity-0 group-hover:opacity-75 group-focus-within:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="flex-1 flex items-center rounded-md bg-black shadow-sm relative">
                        <span className="text-sm text-muted-foreground px-3 py-2.5">syncpad.com/</span>
                        <Input
                            id="session-name"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="your-secret-page"
                            className="flex-1 border-0 bg-transparent rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-11"
                        />
                    </div>
                </div>
                <Button 
                  onClick={createNewSession} 
                  className={cn(
                    "h-11 bg-primary/90 hover:bg-primary text-primary-foreground font-bold shadow-md",
                    "transition-all duration-300 ease-in-out",
                    "hover:shadow-primary/40",
                    "active:scale-95"
                  )}
                  style={{
                    background: 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.8))'
                  }}
                >
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
