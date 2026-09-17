import Image from "next/image";

export function LionLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex w-full items-center justify-center py-12">
      <Image
        src="/lion-green-long.svg"
        alt=""
        width={177}
        height={60}
        priority
        className="lion-loader h-auto w-40"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
