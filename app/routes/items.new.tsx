import { createItem } from "../data/items";
import { Form, redirect, type ActionFunctionArgs } from "react-router-dom";

export async function action({ context, request }: ActionFunctionArgs) {
  const kv = context.cloudflare.env.TENUGUI_KV;
  const formData = await request.formData();
  const name = formData.get("name");
  const imageUrl = formData.get("imageUrl");

  if (typeof name !== "string" || typeof imageUrl !== "string") {
    throw new Error("Invalid form data");
  }

  const newItem = await createItem(kv, { name, imageUrl });
  return redirect(`/items/${newItem.id}`);
}

export default function NewItem() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新しい手ぬぐいを追加</h1>
      {/* react-router-domの<Form>コンポーネントを使う */}
      <Form method="post" className="space-y-4">
        <div>
          <label htmlFor="name" className="block font-medium text-gray-700">
            名前
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block font-medium text-gray-700">
            画像URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
        >
          追加する
        </button>
      </Form>
    </div>
  );
}
