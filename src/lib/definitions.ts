import type { Models } from 'appwrite';

export type FileObject = Models.File;

export type SentimentSummary = {
  summary: string;
  sentiment: string;
};

export type SessionData = {
  textContent: string;
  files: FileObject[];
  sentimentSummary: SentimentSummary | null;
};
