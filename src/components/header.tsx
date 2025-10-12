'use client';

import { Button } from '@/components/ui/button';
import { SynonymIcon } from '@/components/icons';
import { ClipboardCopy, Check } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center gap-2">
          <SynonymIcon className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold tracking-tight">Synonym</h1>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
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
