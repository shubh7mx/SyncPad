import { getSession } from "@/lib/actions";
import SessionClient from "@/components/session-client";
import Header from "@/components/header";
import type { Metadata } from "next";

type Props = {
  params: { sessionId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = params;
  return {
    title: `Session ${sessionId} | SyncPad`,
  };
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = params;
  const initialData = await getSession(sessionId);

  return (
    <div className="flex min-h-screen flex-col">
      <Header sessionId={sessionId} />
      <main className="flex-1 -mt-16 pt-16">
        <SessionClient sessionId={sessionId} initialData={initialData} />
      </main>
    </div>
  );
}
