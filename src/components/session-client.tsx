'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { updateText, uploadFile, getSession, deleteFile } from '@/lib/actions';
import { subscribe, AppwriteIds, getFileView } from '@/lib/appwrite';
import type { SessionData, FileObject } from '@/lib/definitions';
import { File as FileIcon, Upload, Download, Loader2, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
  const [isFilesVisible, setIsFilesVisible] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 768) {
      setIsFilesVisible(false);
    }
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `The maximum file size is ${formatFileSize(MAX_FILE_SIZE)}.`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      const base64File = await fileToBase64(file);
      await uploadFile(sessionId, base64File, file.name);
      
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

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(sessionId, fileId);
      toast({
        title: 'File Deleted',
        description: 'The file has been removed successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Could not delete file.',
      });
    }
  };


  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto] overflow-hidden">
        <div className="flex flex-col h-full">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 w-full h-full p-4 text-base bg-transparent border-0 rounded-none focus-visible:ring-0 resize-none font-mono"
            />
        </div>
        {isFilesVisible && (
            <aside className="w-full md:w-80 border-l flex flex-col h-full">
                <div className="flex items-center justify-between p-2 border-b h-12">
                    <h3 className="font-semibold px-2">Shared Files</h3>
                    <div className="flex items-center gap-1">
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            variant="ghost"
                            size="icon"
                            aria-label="Upload File"
                        >
                            {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                            <Upload className="h-5 w-5" />
                            )}
                        </Button>
                        <Button
                            onClick={() => setIsFilesVisible(false)}
                            variant="ghost"
                            size="icon"
                            aria-label="Close Files Panel"
                            className="md:hidden"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1 p-2">
                    {files.length > 0 ? (
                    <div className="space-y-2">
                        {files.map((file) => (
                        <div
                            key={file.$id}
                            className="flex items-center justify-between rounded-md border p-2 bg-background/50 group"
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
                            <div className="flex flex-shrink-0">
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(file.$id)}
                                aria-label={`Download ${file.name}`}
                                >
                                <Download className="h-5 w-5" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            aria-label={`Delete ${file.name}`}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the file "{file.name}" from this session.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(file.$id)}>
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 px-4">
                        No files have been shared in this pad.
                    </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-xs text-muted-foreground">
                  Files are temporary and will be deleted after 1 hour of inactivity.
                </div>
            </aside>
        )}
        {!isFilesVisible && (
             <div className="absolute bottom-10 right-4 md:hidden">
                 <Button onClick={() => setIsFilesVisible(true)} size="icon">
                     <FileIcon />
                 </Button>
             </div>
        )}
    </div>
  );
}
