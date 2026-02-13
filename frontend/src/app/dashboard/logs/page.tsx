import TransactionsPageClient from "./transactions-page-client";
import { Suspense } from "react";

export default function LogsPage() {
  return (
    <Suspense fallback={<div>Loading financial logs...</div>}>
      <TransactionsPageClient />
    </Suspense>
  );
}
