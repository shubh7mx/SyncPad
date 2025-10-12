'use client';

import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { updateText, uploadFile, getSession, deleteFile } from '@/lib/actions';
import { subscribe, AppwriteIds, getFileView } from '@/lib/appwrite';
import type { SessionData, FileObject } from '@/lib/definitions';
import { File as FileIcon, Upload, Download, Loader2, X, Trash2, PlusCircle, PanelRightOpen, PanelRightClose, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize, cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Progress } from './ui/progress';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const FILE_EXPIRATION_HOURS = 1;

const isFileExpired = (createdAt: string) => {
  const expirationTime = new Date(createdAt).getTime() + FILE_EXPIRATION_HOURS * 60 * 60 * 1000;
  return new Date().getTime() > expirationTime;
}

const FileExpirationTimer = ({ createdAt }: { createdAt: string }) => {
    const [timeLeft, setTimeLeft] = useState(100);
    const expirationTime = new Date(createdAt).getTime() + FILE_EXPIRATION_HOURS * 60 * 60 * 1000;

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const totalDuration = FILE_EXPIRATION_HOURS * 60 * 60 * 1000;
            const remaining = expirationTime - now;
            
            if (remaining <= 0) {
                return 0;
            }

            return (remaining / totalDuration) * 100;
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt, expirationTime]);

    const isExpiringSoon = (expirationTime - new Date().getTime()) < 5 * 60 * 1000;

    return (
        <Progress 
            value={timeLeft} 
            className={cn(
                "h-1 transition-colors duration-500",
                isExpiringSoon ? "text-destructive" : "text-primary"
            )}
        />
    );
};


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
  const [isMobileFilesOpen, setIsMobileFilesOpen] = useState(true);
  const [charCount, setCharCount] = useState(initialData.textContent.length);
  const remoteUpdate = useRef(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const cleanupExpiredFiles = (filesToCheck: FileObject[]) => {
    const activeFiles: FileObject[] = [];
    let wasFileDeleted = false;
    
    filesToCheck.forEach(file => {
      if (isFileExpired(file.$createdAt)) {
        // No need to await, let it run in the background
        deleteFile(sessionId, file.$id);
        wasFileDeleted = true;
      } else {
        activeFiles.push(file);
      }
    });

    if (wasFileDeleted) {
        setFiles(activeFiles);
    }
    
    return activeFiles;
  };
  
  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 768) {
      setIsFilesVisible(false);
    }
    setFiles(cleanupExpiredFiles(initialData.files));
  }, []);

  useEffect(() => {
    if (remoteUpdate.current) {
        remoteUpdate.current = false;
        return;
    }
    if (isMounted) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        updateText(sessionId, text);
      }, 500); // 500ms debounce delay
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    }
  }, [text, sessionId, isMounted]);

  useEffect(() => {
    setCharCount(text.length);
  }, [text]);
  
  useEffect(() => {
    const channel = `databases.${AppwriteIds.databaseId}.collections.${AppwriteIds.sessionsCollectionId}.documents.${sessionId}`;
    
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      return subscribe(channel, (response) => {
        const payload = response.payload as SessionData & { files: string[] };
        
        if (payload.textContent !== undefined && payload.textContent !== text) {
            remoteUpdate.current = true;
            setText(payload.textContent);
        }

        const currentFileIds = files.map(f => f.$id).sort().join(',');
        const newFileIds = (payload.files || []).sort().join(',');

        if (newFileIds !== currentFileIds) {
          getSession(sessionId).then(newData => {
            const activeFiles = cleanupExpiredFiles(newData.files);
            setFiles(activeFiles);
          });
        }
      });
    };

    if (isMounted) {
      unsubscribe = setupSubscription();
    }
    
    // Periodically check for expired files
    const cleanupInterval = setInterval(() => {
        setFiles(cleanupExpiredFiles(files));
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(cleanupInterval);
    };
  }, [sessionId, files, isMounted, text]);

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
      setFiles((currentFiles) => currentFiles.filter(f => f.$id !== fileId));
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
    <div className="flex-1 grid md:grid-cols-[1fr_auto] overflow-hidden">
      <div className="flex flex-col h-full relative">
        <div className='flex-1 relative'>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type Here..."
            className="w-full h-full p-4 pb-10 text-base bg-transparent border-0 rounded-none focus-visible:ring-0 resize-none font-mono"
          />
          <div className={cn(
              "absolute bottom-2 right-4 text-xs text-muted-foreground transition-all duration-300 ease-in-out",
              isFilesVisible && "md:right-[21rem]"
          )}>
              Count: {charCount}
          </div>
        </div>
        <div className="md:hidden">
            <aside className={cn("border-t bg-card flex flex-col")}>
                <div 
                    className="flex items-center justify-between p-2 border-b h-12 flex-shrink-0"
                    onClick={() => setIsMobileFilesOpen(!isMobileFilesOpen)}
                >
                    <Button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        disabled={uploading}
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-8 w-8 p-0"
                    >
                        {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                        <PlusCircle className="h-6 w-6" />
                        )}
                    </Button>

                    <h3 className="font-semibold text-sm whitespace-nowrap">Files</h3>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown className={cn("h-5 w-5 transition-transform", isMobileFilesOpen && "rotate-180")} />
                    </Button>
                    
                    <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
                <div className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isMobileFilesOpen ? 'max-h-[260px]' : 'max-h-0'
                )}>
                    <ScrollArea className={cn("flex-1 p-2", files.length > 2 ? "h-[250px]" : "h-auto")}>
                        {files.length > 0 ? (
                        <div className="space-y-2">
                            {files.map((file) => (
                            <div
                                key={file.$id}
                                className="flex flex-col rounded-md border bg-background/50 group"
                            >
                                <div className="flex items-center justify-between p-2">
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
                                        className="h-8 w-8"
                                        >
                                        <Download className="h-5 w-5" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
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
                                <div className="px-2 pb-2">
                                    <FileExpirationTimer createdAt={file.$createdAt} />
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
                    <footer className="h-8 border-t flex items-center justify-center px-4 text-xs text-muted-foreground flex-shrink-0">
                        <p className='whitespace-nowrap'>Files expire in 1 hour | 50mb max</p>
                    </footer>
                </div>
            </aside>
        </div>
      </div>
      <div className='relative hidden md:block'>
        <aside className={cn(
            "border-l bg-card flex-col h-full transition-all duration-300 ease-in-out overflow-hidden",
            isFilesVisible ? 'w-80 flex' : 'w-0 p-0 border-none'
        )}>
            <div className="flex items-center justify-between p-2 border-b h-12 flex-shrink-0">
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 w-8 p-0"
                >
                    {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                    <PlusCircle className="h-6 w-6" />
                    )}
                </Button>

                <h3 className="font-semibold text-sm whitespace-nowrap">Files</h3>
                
                <Button
                    onClick={() => setIsFilesVisible(false)}
                    variant="ghost"
                    size="icon"
                    aria-label="Close Files Panel"
                    className="h-8 w-8"
                >
                    <X className="h-5 w-5" />
                </Button>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            <ScrollArea className="flex-1 p-2">
                {files.length > 0 ? (
                <div className="space-y-2">
                    {files.map((file) => (
                    <div
                        key={file.$id}
                        className="flex flex-col rounded-md border bg-background/50 group"
                    >
                        <div className="flex items-center justify-between p-2">
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
                                className="h-8 w-8"
                                >
                                <Download className="h-5 w-5" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-8 w-8"
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
                        <div className="px-2 pb-2">
                            <FileExpirationTimer createdAt={file.$createdAt} />
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
            <footer className="h-8 border-t flex items-center justify-center px-4 text-xs text-muted-foreground flex-shrink-0">
                <p className='whitespace-nowrap'>Files expire in 1 hour | 50mb max</p>
            </footer>
        </aside>

        <Button 
            onClick={() => setIsFilesVisible(!isFilesVisible)} 
            variant="ghost"
            size="icon"
            className={cn(
                "absolute top-1/2 -translate-y-1/2 z-20 bg-background hover:bg-muted rounded-full shadow-md border transition-all duration-300 ease-in-out",
                 isFilesVisible ? 'right-[19rem]' : 'right-4'
            )}
            aria-label={isFilesVisible ? "Collapse file panel" : "Expand file panel"}
        >
            {isFilesVisible ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
