import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import Header from "@/components/header";
import type { Metadata } from "next";

type Props = {
  params: { sessionId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Session ${params.sessionId} | SyncPad`,
  };
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = params;
  const initialData = await getSession(sessionId);

  return (
    <div className="flex min-h-screen flex-col">
      <Header sessionId={sessionId} />
      <main className="flex-1">
        <SessionClient sessionId={sessionId} initialData={initialData} />
      </main>
    </div>
  );
}
