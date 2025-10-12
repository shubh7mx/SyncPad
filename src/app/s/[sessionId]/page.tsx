'use client';
import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import { useEffect, useState } from 'react';
import { NotepadText, Link as LinkIcon, Home, Check, ClipboardCopy, HardDriveDownload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";
import Link from "next/link";

type Props = {
  params: { sessionId: string };
};

export default function SessionPage({ params: { sessionId } }: Props) {
  const [initialData, setInitialData] = useState<Awaited<ReturnType<typeof getSession>> | null>(null);
  const [loading, setLoading] = useState(true);

  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await getSession(sessionId);
        setInitialData(data);
        if (typeof window !== 'undefined') {
          setShareUrl(window.location.href);
        }
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

  const handleCopy = () => {
    if (!navigator.clipboard) {
      toast({
        variant: 'destructive',
        title: 'Clipboard Error',
        description: 'Clipboard API not available.',
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
    <div className="flex h-screen flex-col font-sans">
      <header className="flex h-12 items-center justify-between border-b px-2 md:px-4">
        <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-md hover:bg-accent hidden md:flex items-center gap-2">
                <NotepadText className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-semibold tracking-tight">SyncPad</h1>
            </Link>
            <Menubar className="border-0 shadow-none bg-transparent">
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        <Link href="/">
                            <MenubarItem>
                                <Home className="mr-2 h-4 w-4" /> New Pad
                            </MenubarItem>
                        </Link>
                        <MenubarItem onClick={handleCopy}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Share Link
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem disabled>
                            <HardDriveDownload className="mr-2 h-4 w-4" /> Save as...
                            <MenubarShortcut>soon</MenubarShortcut>
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Edit</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem disabled>Undo</MenubarItem>
                        <MenubarItem disabled>Redo</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>View</MenubarTrigger>
                    <MenubarContent>
                         <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <ThemeToggle />
                            <span className="ml-2">Toggle Theme</span>
                         </div>
                    </MenubarContent>
                </MenubarMenu>
                 <MenubarMenu>
                    <MenubarTrigger>Help</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem disabled>About SyncPad</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCopy} variant="ghost" size="sm" className="hidden md:flex">
                {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                <ClipboardCopy className="mr-2 h-4 w-4" />
                )}
                Share
            </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        <SessionClient sessionId={sessionId} initialData={initialData} />
      </main>
      <footer className="h-8 border-t flex items-center px-4 text-xs text-muted-foreground">
        <p>Session ID: {sessionId}</p>
        <div className="flex-1" />
        <p>{initialData.textContent.length} characters</p>
      </footer>
    </div>
  );
}
