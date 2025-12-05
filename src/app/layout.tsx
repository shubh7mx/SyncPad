import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { PermitlyProvider } from '@permitly/react';

export default function RootLayout({ children }) {
  return (
    <PermitlyProvider 
      project="pk_live_6932434400033d7e6977" 
      api="http://localhost:3000"
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
