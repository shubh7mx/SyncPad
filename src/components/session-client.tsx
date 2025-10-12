'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import {
  updateText,
  uploadFile,
  analyzeSentiment,
  getFileView,
} from '@/lib/actions';
import { appwriteClient, subscribe, AppwriteIds } from '@/lib/appwrite';
import type { SessionData, FileObject, SentimentSummary } from '@/lib/definitions';
import {
  Loader2,
  File as FileIcon,
  UploadCloud,
  Download,
  BrainCircuit,
  Smile,
  Frown,
  Meh,
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
  const [sentimentResult, setSentimentResult] = useState<SentimentSummary | null>(initialData.sentimentSummary);
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false);
  const [isAnalyzing, startAnalyzing] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const debouncedText = useDebounce(text, 500);

  useEffect(() => {
    if (debouncedText !== initialData.textContent) {
      updateText(sessionId, debouncedText);
    }
  }, [debouncedText, sessionId, initialData.textContent]);

  useEffect(() => {
    const unsubscribe = subscribe(
      `databases.${AppwriteIds.databaseId}.collections.${AppwriteIds.sessionsCollectionId}.documents.${sessionId}`,
      (response) => {
        const payload = response.payload as {
          textContent: string;
          files: string[];
          summary?: string;
          sentiment?: string;
        };

        setText(payload.textContent);

        const newFiles = payload.files
          .map((fileId) => {
            const existingFile = files.find((f) => f.$id === fileId);
            if (existingFile) return existingFile;
            // A new file was added, we need to fetch its details.
            // This is a simplified approach. A more robust solution might fetch details here.
            // For now, we rely on the uploader's client to have the full file object.
            return null;
          })
          .filter(Boolean) as FileObject[];
        
        // This logic is imperfect because non-uploading clients won't have file details.
        // A full implementation would involve another action to get file details.
        if (newFiles.length !== files.length) {
            // A simple refresh might be the easiest way to get full file data
            window.location.reload();
        }

        if (payload.summary && payload.sentiment) {
          setSentimentResult({ summary: payload.summary, sentiment: payload.sentiment });
        }
      }
    );
    return () => unsubscribe();
  }, [sessionId, files]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading({ name: file.name, progress: 0 });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const newFile = await uploadFile(sessionId, formData, (progress) => {
        setUploading({ name: file.name, progress: progress.progress });
      });
      if (newFile) {
        setFiles((prevFiles) => [...prevFiles, newFile]);
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

  const handleAnalyze = () => {
    startAnalyzing(async () => {
      if (!text.trim()) {
        toast({
          variant: 'destructive',
          title: 'Nothing to analyze',
          description: 'Please enter some text first.',
        });
        return;
      }
      try {
        const result = await analyzeSentiment(sessionId, text);
        if (result) {
          setSentimentResult(result);
          setIsSentimentModalOpen(true);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not analyze sentiment at this time.',
        });
      }
    });
  };

  const getSentimentIcon = (sentiment: string | undefined) => {
    const lowerSentiment = sentiment?.toLowerCase() || '';
    if (lowerSentiment.includes('positive')) return <Smile className="h-5 w-5 text-green-500" />;
    if (lowerSentiment.includes('negative')) return <Frown className="h-5 w-5 text-red-500" />;
    return <Meh className="h-5 w-5 text-yellow-500" />;
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
          <div className="p-4 pt-0">
             <Button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="bg-accent hover:bg-accent/90">
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Analyze Sentiment
            </Button>
          </div>
        </Card>

        {/* Files Area */}
        <div className="flex flex-col gap-8">
            {sentimentResult && (
                <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            {getSentimentIcon(sentimentResult.sentiment)}
                            Sentiment Analysis
                        </CardTitle>
                        <CardDescription>
                            AI-powered summary of the text content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="font-body text-sm italic">"{sentimentResult.summary}"</p>
                        <Badge variant="outline" className="mt-2 capitalize">{sentimentResult.sentiment}</Badge>
                    </CardContent>
                </Card>
            )}
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
                          asChild
                          aria-label={`Download ${file.name}`}
                        >
                          <a href={getFileView(file.$id)} target="_blank" rel="noopener noreferrer">
                            <Download className="h-5 w-5" />
                          </a>
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

      <Dialog open={isSentimentModalOpen} onOpenChange={setIsSentimentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              {getSentimentIcon(sentimentResult?.sentiment)}
              Sentiment Analysis Complete
            </DialogTitle>
            <DialogDescription>
              Here's the AI-powered analysis of the text content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 font-body">
            <div>
              <h3 className="font-semibold">Sentiment</h3>
               <Badge variant="outline" className="mt-1 capitalize">{sentimentResult?.sentiment}</Badge>
            </div>
            <div>
              <h3 className="font-semibold">Summary</h3>
              <p className="mt-1 text-sm text-muted-foreground italic">
                "{sentimentResult?.summary}"
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
