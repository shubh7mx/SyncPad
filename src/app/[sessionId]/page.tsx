'use client';
import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import { useEffect, useState, use } from 'react';
import { NotepadText } from "lucide-react";
import Link from "next/link";
import { usePathname } from 'next/navigation';

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default function SessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const pathname = usePathname();
  const [initialData, setInitialData] = useState<Awaited<ReturnType<typeof getSession>> | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <NotepadText className="h-6 w-6 text-primary" />
            <h1>SyncPad</h1>
          </Link>
          <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
            {pathname.substring(1)}
          </div>
          <div className="w-[120px]"></div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          <SessionClient sessionId={sessionId} initialData={initialData} />
        </main>
      </div>
    </div>
  );
}
