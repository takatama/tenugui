import type { ActionFunctionArgs } from "react-router";
import { requireAuthForAction } from "../lib/auth-guard";

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_IMAGE_SIZE + 64 * 1024;

export function detectImageType(bytes: Uint8Array): string | undefined {
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte,
    )
  )
    return "image/png";
  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return "image/webp";
  if (
    bytes.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.subarray(0, 6)))
  )
    return "image/gif";
  return undefined;
}

const errorResponse = (error: string, status: number) =>
  Response.json({ error }, { status });

async function readLimitedBody(request: Request): Promise<Uint8Array> {
  if (!request.body) throw errorResponse("写真を選んでください。", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_REQUEST_SIZE) {
        await reader.cancel();
        throw errorResponse(
          "保存できる写真は3MBまでです。写真を選び直してください。",
          413,
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function loader() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAuthForAction(request, context);
  if (request.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return errorResponse("このページから写真を保存してください。", 403);
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.startsWith("multipart/form-data"))
    return errorResponse("写真の送信形式を確認してください。", 400);
  if (Number(request.headers.get("Content-Length")) > MAX_REQUEST_SIZE)
    return errorResponse("保存できる写真は3MBまでです。", 413);

  try {
    const body = await readLimitedBody(request);
    const form = await new Response(body.buffer as ArrayBuffer, {
      headers: { "Content-Type": contentType },
    }).formData();
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0)
      return errorResponse("写真を選んでください。", 400);
    if (image.size > MAX_IMAGE_SIZE)
      return errorResponse("保存できる写真は3MBまでです。", 413);
    const buffer = await image.arrayBuffer();
    const mimeType = detectImageType(new Uint8Array(buffer));
    if (!mimeType || image.type !== mimeType)
      return errorResponse("JPEG、PNG、WebP、GIFの写真を選んでください。", 400);

    const imageId = crypto.randomUUID();
    await context.cloudflare.env.TENUGUI_KV.put(`image:${imageId}`, buffer, {
      metadata: {
        mimeType,
        createdAt: new Date().toISOString(),
        size: image.size,
      },
    });
    return Response.json(
      { imageId, imageUrl: `/images/${imageId}` },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(
      "Image upload failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return errorResponse(
      "写真を保存できませんでした。もう一度お試しください。",
      503,
    );
  }
}
