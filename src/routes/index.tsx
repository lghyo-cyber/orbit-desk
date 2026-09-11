import { createFileRoute } from "@tanstack/react-router";
import { PadApp } from "@/components/pad/sheet";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PadApp />;
}
