import type { LoaderFunctionArgs } from "react-router";
import { detectImageType, MAX_IMAGE_SIZE } from "./api.images";

interface ImageMetadata {
  mimeType: string;
  createdAt: string;
  size: number;
}

export async function loader({ context, params, request }: LoaderFunctionArgs) {
  const imageId = params.imageId;
  if (
    !imageId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      imageId,
    )
  ) {
    return new Response("Image not found", { status: 404 });
  }
  const kv: KVNamespace = context.cloudflare.env.TENUGUI_KV;
  const image = await kv.getWithMetadata<ImageMetadata>(
    `image:${imageId}`,
    "arrayBuffer",
  );
  if (!image.value || image.value.byteLength > MAX_IMAGE_SIZE)
    return new Response("Image not found", { status: 404 });
  const mimeType = detectImageType(new Uint8Array(image.value));
  if (!mimeType || mimeType !== image.metadata?.mimeType)
    return new Response("Image not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    ETag: `"image-${imageId}"`,
  };
  if (request.headers.get("If-None-Match") === headers.ETag)
    return new Response(null, { status: 304, headers });
  return new Response(image.value, { headers });
}
