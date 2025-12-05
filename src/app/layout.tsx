import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
// src/app/layout.tsx
import { PermitlyProvider } from '@/components/Permitly';

export default function RootLayout({ children }) {
  return (
    <PermitlyProvider 
      project="pk_live_6932d3eb00010f6d62b6" 
      api="https://www.permitly.in"
    >
      {children}
    </PermitlyProvider>
  );
}

export const metadata: Metadata = {
  title: 'SyncPad',
  description: 'Anonymous real-time syncing of text, images, and files.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
