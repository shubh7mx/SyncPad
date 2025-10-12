'use client';

import { Button } from '@/components/ui/button';
import { NotepadText, ClipboardCopy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function Header({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setShareUrl(window.location.href);
  }, [sessionId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'You can now share this session with others.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
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
        </div>
      </div>
    </header>
  );
}
