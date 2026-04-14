export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-lg">
        <h1 className="heading-gradient lowercase tracking-tight leading-none">
          the shadow realm
        </h1>
        <p className="text-[#ededed]/60 text-sm tracking-wide">
          {/* Blurb placeholder — finalized in plan 02-02 after checkpoint */}
          a place for things to land.
        </p>
      </div>
    </main>
  );
}
