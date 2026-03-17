"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">&#128225;</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-[#A1A1A1] mb-6">
          It looks like you&apos;ve lost your internet connection. Reconnect and
          try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF9F3F] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
