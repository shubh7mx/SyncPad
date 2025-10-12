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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    if (debouncedText !== initialData.textContent) {
      updateText(sessionId, debouncedText);
    }
  }, [debouncedText, sessionId, initialData.textContent]);
  
  useEffect(() => {
    const channel = `databases.${AppwriteIds.databaseId}.collections.${AppwriteIds.sessionsCollectionId}.documents.${sessionId}`;

    const unsubscribe = subscribe(channel, (response) => {
      const payload = response.payload as SessionData & { files: string[] };
      
      if (payload.textContent !== undefined && payload.textContent !== text) {
        setText(payload.textContent);
      }

      const currentFileIds = files.map(f => f.$id).sort().join(',');
      const newFileIds = (payload.files || []).sort().join(',');

      if (newFileIds !== currentFileIds) {
        getSession(sessionId).then(newData => {
          setFiles(newData.files);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, text, files]);


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
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-card font-mono">
      <div className="flex-1 flex flex-col min-h-0">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Untitled"
          className="flex-1 w-full h-full p-4 text-base bg-card border-0 rounded-none focus-visible:ring-0 resize-none"
        />
      </div>
      <div className="w-full border-t bg-background">
        <div className="container flex items-center h-16 gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">Shared Files</h3>
            <p className="text-sm text-muted-foreground">Files are available for 1 hour.</p>
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
          >
            {uploading ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Upload className="mr-2" />
            )}
            Upload File
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-48">
          <div className="container py-4">
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.$id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="max-w-[200px] truncate text-sm font-medium">
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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
