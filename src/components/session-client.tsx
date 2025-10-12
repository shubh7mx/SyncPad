'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import {
  updateText,
  uploadFile,
  getFileView,
  getSession,
} from '@/lib/actions';
import { appwriteClient, subscribe, AppwriteIds } from '@/lib/appwrite';
import type { SessionData, FileObject } from '@/lib/definitions';
import {
  File as FileIcon,
  UploadCloud,
  Download,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, formatFileSize } from '@/lib/utils';

export default function SessionClient({
  sessionId,
  initialData,
}: {
  sessionId: string;
  initialData: SessionData;
}) {
  const [text, setText] = useState(initialData.textContent);
  const [files, setFiles] = useState<FileObject[]>(initialData.files);
  const [uploading, setUploading] = useState<
    { name: string; progress: number } | false
  >(false);

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
        
        // Update text content
        if (payload.textContent !== undefined && payload.textContent !== text) {
            setText(payload.textContent);
        }

        // Check if file list has changed
        if (payload.files && payload.files.length !== files.length) {
            // Refetch the entire session data to get full file details
            getSession(sessionId).then(newData => {
                setFiles(newData.files);
            });
        }
    });

    return () => {
        unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading({ name: file.name, progress: 0 });
    const formData = new FormData();
    formData.append('file', file);

    try {
      // The `uploadFile` action will now handle the Appwrite SDK call
      const newFile = await uploadFile(
        sessionId,
        formData,
        (progress) => {
          setUploading({ name: file.name, progress: progress.progress });
        }
      );
      if (newFile) {
        // The subscription will handle updating the file list for all clients
        toast({
          title: 'File Uploaded',
          description: `${file.name} is now available.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description:
          error instanceof Error ? error.message : 'Could not upload file.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDownload = async (fileId: string) => {
    const url = await getFileView(fileId);
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-2">
        {/* Text Area */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Synced Pad</CardTitle>
            <CardDescription>
              Text entered here syncs in real-time with anyone using this session link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing here..."
              className="h-full min-h-[300px] resize-none font-body text-base"
            />
          </CardContent>
        </Card>

        {/* Files Area */}
        <div className="flex flex-col gap-8">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline">Shared Files</CardTitle>
              <CardDescription>
                Files uploaded here are available for 1 hour.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-full max-h-[250px] pr-4">
                <div className="space-y-3">
                  {files.length > 0 ? (
                    files.map((file) => (
                      <div
                        key={file.$id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
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
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground">
                      No files shared yet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="border-t p-4">
              {uploading ? (
                <div>
                  <div className="flex justify-between text-sm">
                    <p className="truncate">{uploading.name}</p>
                    <p>{Math.round(uploading.progress)}%</p>
                  </div>
                  <Progress value={uploading.progress} className="mt-1 h-2" />
                </div>
              ) : (
                <>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
