import type { Route } from "./+types/home";
// import { Welcome } from "../welcome/welcome";
// import { useLoaderData } from "react-router-dom";

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

// interface LoaderData {
//   message: string;
// }

export default function Home() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">ようこそ！</h1>
      <p className="text-lg text-gray-600">
        これは私が集めた手ぬぐいを記録する、個人的なギャラリーです。
      </p>
    </div>
  );
}
