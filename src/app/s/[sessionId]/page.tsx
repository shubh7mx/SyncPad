import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import Header from "@/components/header";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: `Session ${sessionId} | SyncPad`,
  };
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;
  const initialData = await getSession(sessionId);

  return (
    <div className="flex min-h-screen flex-col font-mono bg-[#c0c0c0] text-black">
      <Header sessionId={sessionId} />
      <main className="flex-1">
        <SessionClient sessionId={sessionId} initialData={initialData} />
      </main>
    </div>
  );
}
