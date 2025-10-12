
import { Client, Databases, Storage, Account, AppwriteException } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const AppwriteIds = {
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
    sessionsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID!,
    filesBucketId: '68eb5618003889cb79c5',
};

// Use a singleton pattern to ensure only one client is created.
let appwriteClient: Client;

const getAppwriteClient = () => {
    if (!appwriteClient) {
        appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId);
    }
    return appwriteClient;
}

const client = getAppwriteClient();

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

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
  return client.subscribe(channel, callback);
}

export function getFileView(fileId: string): string {
    return storage.getFileView(AppwriteIds.filesBucketId, fileId).href;
}


export { client as appwriteClient };
