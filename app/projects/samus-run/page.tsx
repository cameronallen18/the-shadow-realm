import dynamic from "next/dynamic";

const SamusRunGame = dynamic(
  () => import("@/components/samus-run/SamusRunGame"),
  { ssr: false, loading: () => null }
);

export default function SamusRunPage() {
  return <SamusRunGame />;
}
