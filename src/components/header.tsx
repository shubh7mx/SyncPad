'use client';

import { Button } from '@/components/ui/button';
import { NotepadText, ClipboardCopy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setShareUrl(window.location.href);
  }, [sessionId]);

  const handleCopy = () => {
    if(!navigator.clipboard) {
        toast({
            variant: "destructive",
            title: "Clipboard Error",
            description: "Clipboard API not available. Please copy the link manually.",
        });
        return;
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'You can now share this session with others.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-7xl">
        <div className="container flex h-16 items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-4 shadow-lg backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2">
            <NotepadText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">SyncPad</h1>
            </Link>
            <div className="flex items-center justify-end space-x-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Session: {sessionId}</span>
            <Button onClick={handleCopy} variant="ghost" size="sm">
                {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                <ClipboardCopy className="mr-2 h-4 w-4" />
                )}
                Copy Link
            </Button>
            <ThemeToggle />
            </div>
        </div>
    </header>
  );
}
