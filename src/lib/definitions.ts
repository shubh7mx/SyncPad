import type { Models } from 'appwrite';

export type FileObject = Models.File;

export type SessionData = {
  textContent: string;
  files: FileObject[];
};
