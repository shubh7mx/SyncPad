'use server';

import { databases, storage, AppwriteIds, getAnonymousSession, getFileView as appwriteGetFileView } from './appwrite';
import { ID, Query, InputFile } from 'appwrite';
import type { SessionData, FileObject } from './definitions';
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
        fileIds.map(id => storage.getFile(AppwriteIds.filesBucketId, id).catch(() => null))
    ).then(results => results.filter(f => f !== null) as FileObject[]);

    return {
      textContent: document.textContent as string,
      files: fileObjects,
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
      return { textContent: '', files: [] };
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

export async function uploadFile(sessionId: string, base64File: string, fileName: string): Promise<FileObject | null> {
    await getAnonymousSession();

    if (!base64File) {
        throw new Error('No file provided');
    }

    try {
        // Convert base64 to Blob and then to an InputFile
        const fileBlob = await fetch(base64File).then(res => res.blob());
        const inputFile = InputFile.fromBlob(fileBlob, fileName);

        const uploadedFile = await storage.createFile(
            AppwriteIds.filesBucketId,
            ID.unique(),
            inputFile,
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
        throw new Error('File upload failed. Check file size, type limits, and bucket permissions.');
    }
}


export async function getFileView(fileId: string): Promise<string> {
    await getAnonymousSession();
    const url = appwriteGetFileView(fileId);
    return url;
}
