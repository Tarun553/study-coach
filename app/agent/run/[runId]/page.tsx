import RunPageClient from "./runClient";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  return <RunPageClient runId={runId} />;
}
