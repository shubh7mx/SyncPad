'use client';
import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import { useEffect, useState, use } from 'react';
import { NotepadText, Copy } from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default function SessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const pathname = usePathname();
  const [initialData, setInitialData] = useState<Awaited<ReturnType<typeof getSession>> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await getSession(sessionId);
        setInitialData(data);
      } catch (error) {
        console.error("Failed to load session", error);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Session link copied to clipboard.',
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy link to clipboard.',
      });
    });
  };

  
  if (loading || !initialData) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex items-center gap-2">
                <NotepadText className="h-6 w-6 animate-pulse text-primary" />
                <p className="text-muted-foreground">Loading Pad...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="flex h-full w-full max-w-7xl flex-col rounded-lg border bg-background font-sans antialiased shadow-lg overflow-hidden">
        <header className="flex h-12 flex-shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight w-[120px]">
            <Link href="/" className="flex items-center gap-2">
              <NotepadText className="h-6 w-6 text-primary" />
              <h1>SyncPad</h1>
            </Link>
          </div>
          <div className="flex-1 text-center">
            <Button variant="ghost" size="sm" onClick={handleCopyLink} className="group">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                {pathname.substring(1)}
              </span>
              <Copy className="ml-2 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Button>
          </div>
          <div className="w-[120px] flex justify-end">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          <SessionClient sessionId={sessionId} initialData={initialData} />
        </main>
      </div>
    </div>
  );
}
