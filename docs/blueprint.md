# **App Name**: Synonym

## Core Features:

- Session Generation: Generates a unique random code (UUID) for each session.
- Text Synchronization: Allows users to enter/paste text that is synced in real-time across devices in the same session.
- Text Storage: Permanently stores text messages in an Appwrite Database collection, keyed by the session code, to make this text available as context for the LLM tool.
- File Upload and Sharing: Enables users to upload images/files to an Appwrite Storage Bucket, linked to the session code.
- File Expiration: Sets a file expiration (e.g., 1 hour) using metadata and scheduled cleanup.
- Real-time Data Sync: Uses Appwrite's realtime API to sync text between devices — changes made on one device reflect instantly elsewhere in the session.
- Content Sentiment Summary: AI tool to summarize user text inputs for sentiment. Will identify personally identifying information for removal. After which it stores this context in Appwrite. Uses reasoning and available document understanding to appropriately remove potentially unwanted data to generate better text based summaries and other AI feature functions.

## Style Guidelines:

- Primary color: Muted pink (#E91E63) to align with a modern aesthetic.
- Background color: Very light pink (#FCE4EC), providing a soft contrast to the primary color.
- Accent color: Deep purple (#673AB7) used for interactive elements.
- Headline font: 'Belleza' sans-serif for titles and headers.
- Body font: 'Alegreya' serif for the main text content.
- Simple line icons to represent file types and actions.
- Clean and minimal layout with a central area for text input and file display.