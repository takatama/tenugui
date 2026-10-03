import type { Item } from "./items";

export interface Exhibition {
  id: string;
  title: string;
  description: string;
  itemIds: string[];
  public: boolean;
  createdAt: string;
}

// The projection is deliberate: exhibitions never include personal memories or
// product links, even in serialized route data visible to a shared visitor.
export type ExhibitionItem = Pick<Item, "id" | "name" | "imageUrl" | "tags">;

const PREFIX = "exhibition:";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ExhibitionValidationError extends Error {}

export function isExhibitionId(id: string): boolean {
  return UUID.test(id);
}

export async function getExhibition(
  kv: KVNamespace,
  id: string,
): Promise<Exhibition | null> {
  if (!isExhibitionId(id)) return null;
  return kv.get<Exhibition>(`${PREFIX}${id}`, "json");
}

export async function listExhibitions(kv: KVNamespace): Promise<Exhibition[]> {
  const exhibitions: Exhibition[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({
      prefix: PREFIX,
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    const records = await Promise.all(
      page.keys.map((key) => kv.get<Exhibition>(key.name, "json")),
    );
    exhibitions.push(
      ...records.filter((record): record is Exhibition => record !== null),
    );
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return exhibitions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createExhibition(
  kv: KVNamespace,
  input: {
    title: string;
    description: string;
    itemIds: string[];
    public: boolean;
  },
  items: Item[],
): Promise<Exhibition> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || title.length > 80)
    throw new ExhibitionValidationError(
      "展示の名前を80文字以内で入力してください。",
    );
  if (description.length > 280)
    throw new ExhibitionValidationError(
      "紹介は280文字以内で入力してください。",
    );
  const itemIds = [...new Set(input.itemIds)];
  const knownIds = new Set(items.map((item) => item.id));
  if (!itemIds.length)
    throw new ExhibitionValidationError(
      "飾りたい手ぬぐいを1枚以上選んでください。",
    );
  if (itemIds.some((id) => !knownIds.has(id)))
    throw new ExhibitionValidationError(
      "選んだ手ぬぐいが見つかりません。ページを更新して選び直してください。",
    );
  const exhibition: Exhibition = {
    id: crypto.randomUUID(),
    title,
    description,
    itemIds,
    public: input.public,
    createdAt: new Date().toISOString(),
  };
  await kv.put(`${PREFIX}${exhibition.id}`, JSON.stringify(exhibition));
  return exhibition;
}

export async function setExhibitionVisibility(
  kv: KVNamespace,
  id: string,
  isPublic: boolean,
): Promise<Exhibition | null> {
  const exhibition = await getExhibition(kv, id);
  if (!exhibition) return null;
  const updated = { ...exhibition, public: isPublic };
  await kv.put(`${PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export function getExhibitionItems(
  exhibition: Exhibition,
  items: Item[],
): ExhibitionItem[] {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return exhibition.itemIds.flatMap((id) => {
    const item = itemMap.get(id);
    return item
      ? [
          {
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            tags: item.tags ?? [],
          },
        ]
      : [];
  });
}
