"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { AlertCircle } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-[#f8f7fc] px-6 py-24">
        <div
          className="flex flex-col items-center text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2effc]">
            <AlertCircle className="h-7 w-7 text-[#7257d5]" />
          </div>
          <h1 className="text-2xl font-bold text-[#17151f]">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-[#6f6b7a]">
            The page encountered an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-[#7257d5] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#4f3aa8]"
          >
            Try Again
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
