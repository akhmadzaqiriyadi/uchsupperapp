
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center gap-6 p-8">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
        UCH SuperApp
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Platform Terintegrasi Universitas Software House.
        Kelola keuangan, organisasi, dan laporan dalam satu pintu.
      </p>
      
      <div className="flex gap-4 mt-6">
        <Button asChild size="lg">
          <Link href="/login">Masuk ke Portal</Link>
        </Button>
      </div>

      <footer className="mt-20 text-sm text-gray-500">
        &copy; 2026 UCH Tech Team. All rights reserved.
      </footer>
    </div>
  );
}
