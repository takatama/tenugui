import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useLoaderData } from "react-router-dom";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const message =
    context.cloudflare.env.VALUE_FROM_CLOUDFLARE || "メッセージがありません。";
  return new Response(JSON.stringify({ message }), {
    headers: { "Content-Type": "application/json" },
  });
}

interface LoaderData {
  message: string;
}

export default function Home() {
  const { message } = useLoaderData() as LoaderData;
  return <Welcome message={message} />;
}
