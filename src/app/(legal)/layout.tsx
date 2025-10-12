import { NotepadText } from "lucide-react";
import Link from "next/link";

export default function LegalLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex h-12 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <NotepadText className="h-6 w-6 text-primary" />
                        <h1 className="text-lg font-semibold tracking-tight">SyncPad</h1>
                    </Link>
                </div>
            </header>
            <main className="flex-1 py-8 px-4 md:px-6">
                <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
  }