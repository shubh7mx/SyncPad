'use server';

import { databases, storage, AppwriteIds, getAnonymousSession } from './appwrite';
import { ID, Query } from 'appwrite';
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

export async function linkFileToSession(sessionId: string, fileId: string): Promise<void> {
    await getAnonymousSession();
    try {
        const document = await databases.getDocument(AppwriteIds.databaseId, AppwriteIds.sessionsCollectionId, sessionId);
        const currentFiles = (document.files || []) as string[];
        
        await databases.updateDocument(AppwriteIds.databaseId, AppwriteIds.sessionsCollectionId, sessionId, {
            files: [...currentFiles, fileId]
        });

        revalidatePath(`/${sessionId}`);
    } catch (error) {
        console.error('Failed to link file to session:', error);
        // If linking fails, try to clean up the orphaned file from storage
        try {
            await storage.deleteFile(AppwriteIds.filesBucketId, fileId);
        } catch (cleanupError) {
            console.error('Failed to clean up orphaned file:', cleanupError);
        }
        throw new Error('Could not link file to session.');
    }
}


export async function getFileView(fileId: string): Promise<string> {
    await getAnonymousSession();
    const url = storage.getFileView(AppwriteIds.filesBucketId, fileId).href;
    return url;
}

export async function deleteFile(sessionId: string, fileId: string) {
  await getAnonymousSession();
  try {
    // Delete file from storage
    await storage.deleteFile(AppwriteIds.filesBucketId, fileId);

    // Get the document to update the files array
    const document = await databases.getDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId
    );
    const currentFiles = (document.files || []) as string[];

    // Remove the file ID from the array
    const updatedFiles = currentFiles.filter((id) => id !== fileId);

    // Update the document with the new file list
    await databases.updateDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId,
      { files: updatedFiles }
    );

    revalidatePath(`/${sessionId}`);
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw new Error('Could not delete file.');
  }
}

export async function deleteAllFiles(sessionId: string) {
  await getAnonymousSession();
  try {
    const document = await databases.getDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId
    );
    const fileIds = (document.files || []) as string[];

    // Concurrently delete all files from storage
    await Promise.all(
      fileIds.map((fileId) =>
        storage.deleteFile(AppwriteIds.filesBucketId, fileId)
      )
    );

    // Update the document with an empty file list
    await databases.updateDocument(
      AppwriteIds.databaseId,
      AppwriteIds.sessionsCollectionId,
      sessionId,
      { files: [] }
    );

    revalidatePath(`/${sessionId}`);
  } catch (error) {
    console.error('Failed to delete all files:', error);
    throw new Error('Could not delete all files.');
  }
}
