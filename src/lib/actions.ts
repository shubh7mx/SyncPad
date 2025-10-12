'use server';

import { databases, storage, AppwriteIds, getAnonymousSession, getFileView as appwriteGetFileView } from './appwrite';
import { ID, Query } from 'appwrite';
import type { SessionData, FileObject, SentimentSummary } from './definitions';
import { summarizeContentSentiment } from '@/ai/flows/summarize-content-sentiment';
import { revalidatePath } from 'next/cache';

export async function getSession(sessionId: string): Promise<SessionData> {
  await getAnonymousSession();
  try {
    const document = await databases.getDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId
    );

    const fileIds = (document.files || []) as string[];
    const fileObjects: FileObject[] = await Promise.all(
        fileIds.map(id => storage.getFile(AppwriteIds.filesBucketId, id))
    );

    const sentimentSummary = document.summary && document.sentiment ? { summary: document.summary, sentiment: document.sentiment } : null;

    return {
      textContent: document.textContent as string,
      files: fileObjects,
      sentimentSummary: sentimentSummary
    };

  } catch (error) {
    // If document doesn't exist, create it
    try {
      await databases.createDocument(
        AppwriteIds.databaseId,
        AppwriteIds.sessionsCollectionId,
        sessionId,
        { textContent: '', files: [] }
      );
      return { textContent: '', files: [], sentimentSummary: null };
    } catch (createError) {
      console.error('Failed to create session document:', createError);
      throw new Error('Could not create or retrieve session.');
    }
  }
}

export async function updateText(sessionId: string, text: string) {
  await getAnonymousSession();
  try {
    await databases.updateDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId,
      { textContent: text }
    );
  } catch (error) {
    console.error('Failed to update text:', error);
  }
}

export async function uploadFile(sessionId: string, formData: FormData, onProgress: (progress: { progress: number }) => void): Promise<FileObject | null> {
    const session = await getAnonymousSession();
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        const uploadedFile = await storage.createFile(
            AppwriteIds.filesBucketId,
            ID.unique(),
            file,
            undefined, // permissions
            (progress) => {
                // This callback runs client-side. We pass a server action reference for progress.
                // However, Appwrite SDK v11+ progress is client-side only. This will require a client-side upload approach.
                // The prompt assumes a server action based upload. A client-side upload is better for progress.
                // For this implementation, we'll do the upload client side.
                // The provided code in `session-client` will handle this. This server action is a workaround to fit the model.
                // In a real app, the client would call storage.createFile directly.
            }
        );

        const document = await databases.getDocument(AppwriteIds.databaseId, AppwriteIds.sessionsCollectionId, sessionId);
        const currentFiles = (document.files || []) as string[];
        
        await databases.updateDocument(AppwriteIds.databaseId, AppwriteIds.sessionsCollectionId, sessionId, {
            files: [...currentFiles, uploadedFile.$id]
        });

        revalidatePath(`/s/${sessionId}`);
        
        return uploadedFile as FileObject;

    } catch (error) {
        console.error('Failed to upload file:', error);
        throw new Error('File upload failed. Check file size and type limits.');
    }
}

export async function analyzeSentiment(sessionId: string, text: string): Promise<SentimentSummary | null> {
    await getAnonymousSession();
    try {
        const { summary, sentiment } = await summarizeContentSentiment({ text });
        
        await databases.updateDocument(
            AppwriteIds.databaseId,
            AppwriteIds.sessionsCollectionId,
            sessionId,
            { summary, sentiment }
        );
        
        revalidatePath(`/s/${sessionId}`);
        return { summary, sentiment };

    } catch (error) {
        console.error('Failed to analyze sentiment:', error);
        throw new Error('AI analysis failed.');
    }
}

export function getFileView(fileId: string): string {
    return appwriteGetFileView(fileId);
}
