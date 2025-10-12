import { Client, Databases, Storage, Account, AppwriteException, InputFile } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const AppwriteIds = {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    sessionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID!,
    filesBucketId: process.env.NEXT_PUBLIC_APPWRITE_FILES_BUCKET_ID!,
};

const appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId);

export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);
export const account = new Account(appwriteClient);

let sessionPromise: Promise<any> | null = null;

export const getAnonymousSession = () => {
  if (!sessionPromise) {
    sessionPromise = account.get().catch((error: AppwriteException) => {
      if (error.code === 401) { // Not logged in
        return account.createAnonymousSession();
      }
      throw error;
    });
  }
  return sessionPromise;
};

export function subscribe(channel: string, callback: (payload: any) => void) {
  return appwriteClient.subscribe(channel, callback);
}

export function getFileView(fileId: string): string {
    return storage.getFileView(AppwriteIds.filesBucketId, fileId).href;
}


export { appwriteClient, InputFile };
