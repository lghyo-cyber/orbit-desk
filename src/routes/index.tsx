import { createFileRoute } from "@tanstack/react-router";
import { OrbitApp } from "@/components/orbit/orbit-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OrbitApp />;
}
