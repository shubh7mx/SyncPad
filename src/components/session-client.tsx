'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { updateText, uploadFile, getSession } from '@/lib/actions';
import { subscribe, AppwriteIds, getFileView } from '@/lib/appwrite';
import type { SessionData, FileObject } from '@/lib/definitions';
import { File as FileIcon, Upload, Download, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize } from '@/lib/utils';
import { Separator } from './ui/separator';

export default function SessionClient({
  sessionId,
  initialData,
}: {
  sessionId: string;
  initialData: SessionData;
}) {
  const [text, setText] = useState(initialData.textContent);
  const [files, setFiles] = useState<FileObject[]>(initialData.files);
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && debouncedText !== initialData.textContent) {
      updateText(sessionId, debouncedText);
    }
  }, [debouncedText, sessionId, initialData.textContent, isMounted]);
  
  useEffect(() => {
    const channel = `databases.${AppwriteIds.databaseId}.collections.${AppwriteIds.sessionsCollectionId}.documents.${sessionId}`;
    
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      return subscribe(channel, (response) => {
        const payload = response.payload as SessionData & { files: string[] };
        
        // Use a functional update for `setText` to avoid stale state issues.
        setText(currentText => {
            if (payload.textContent !== undefined && payload.textContent !== currentText) {
                return payload.textContent;
            }
            return currentText;
        });

        const currentFileIds = files.map(f => f.$id).sort().join(',');
        const newFileIds = (payload.files || []).sort().join(',');

        if (newFileIds !== currentFileIds) {
          getSession(sessionId).then(newData => {
            setFiles(newData.files);
          });
        }
      });
    };

    if (isMounted) {
      unsubscribe = setupSubscription();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, files, isMounted]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadFile(sessionId, formData);
      toast({
        title: 'File Uploaded',
        description: `${file.name} is now available.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload file.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDownload = (fileId: string) => {
    const url = getFileView(fileId);
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto max-w-7xl h-full flex flex-col md:grid md:grid-cols-3 gap-6 py-6">
        <div className="h-full w-full md:col-span-2 flex flex-col rounded-xl border bg-card/60 backdrop-blur-xl shadow-lg min-h-[calc(100vh-10rem)] md:min-h-0">
            <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing..."
            className="flex-1 w-full h-full p-4 text-base bg-transparent border-0 rounded-t-xl focus-visible:ring-0 resize-none"
            />
        </div>
        <div className="flex flex-col gap-4 rounded-xl border bg-card/60 backdrop-blur-xl shadow-lg p-4 h-fit md:h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Shared Files</h3>
                    <p className="text-sm text-muted-foreground">Files expire after 1 hour.</p>
                </div>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                    size="sm"
                >
                    {uploading ? (
                    <Loader2 className="mr-2 animate-spin" />
                    ) : (
                    <Upload className="mr-2" />
                    )}
                    Upload
                </Button>
            </div>
            <Separator />
            <ScrollArea className="flex-1 -mr-4 pr-3">
                {files.length > 0 ? (
                <div className="space-y-2">
                    {files.map((file) => (
                    <div
                        key={file.$id}
                        className="flex items-center justify-between rounded-md border p-2 bg-background/50"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="truncate">
                            <p className="truncate text-sm font-medium">
                            {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.sizeOriginal)} &middot;{' '}
                            {formatDistanceToNow(new Date(file.$createdAt), {
                                addSuffix: true,
                            })}
                            </p>
                        </div>
                        </div>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file.$id)}
                        aria-label={`Download ${file.name}`}
                        className="flex-shrink-0"
                        >
                        <Download className="h-5 w-5" />
                        </Button>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="text-center text-sm text-muted-foreground py-10">
                    No files shared yet.
                </div>
                )}
            </ScrollArea>
        </div>
    </div>
  );
}
