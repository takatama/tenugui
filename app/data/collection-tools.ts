import { getAllItems, type Item } from "./items";

export async function changeTag(
  kv: KVNamespace,
  oldTag: string,
  newTag?: string,
) {
  const items = await getAllItems(kv);
  const next = items.map((item) =>
    item.tags.includes(oldTag)
      ? {
          ...item,
          tags: [
            ...new Set(
              item.tags.flatMap((tag) =>
                tag === oldTag ? (newTag ? [newTag] : []) : [tag],
              ),
            ),
          ],
        }
      : item,
  );
  // One read and one write: updating each item in parallel loses tag changes.
  await kv.put("items", JSON.stringify(next));
  return items.filter((item) => item.tags.includes(oldTag)).length;
}

export interface ShelvedRecord {
  key: string;
  item: Item;
  deletedAt: string;
}
function isShelvedRecord(
  key: string,
  value: unknown,
): value is { item: Item; deletedAt: string } {
  const match = /^item-backup:([a-zA-Z0-9-]+):(\d+)$/.exec(key);
  if (!match || !value || typeof value !== "object") return false;
  const record = value as { item?: Partial<Item>; deletedAt?: unknown };
  const item = record.item;
  return (
    !!item &&
    item.id === match[1] &&
    typeof item.name === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.memo === "string" &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === "string") &&
    (item.productUrl === undefined || typeof item.productUrl === "string") &&
    (item.status === undefined ||
      item.status === "purchased" ||
      item.status === "unpurchased") &&
    typeof record.deletedAt === "string" &&
    Number.isFinite(Date.parse(record.deletedAt))
  );
}
export async function getShelvedRecords(
  kv: KVNamespace,
): Promise<ShelvedRecord[]> {
  const items = await getAllItems(kv);
  const present = new Set(items.map((item) => item.id));
  const records: ShelvedRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({
      prefix: "item-backup:",
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    const values = await Promise.all(
      page.keys.map(async (key) => {
        const value = await kv.get<unknown>(key.name, "json");
        return isShelvedRecord(key.name, value) && !present.has(value.item.id)
          ? { key: key.name, item: value.item, deletedAt: value.deletedAt }
          : null;
      }),
    );
    records.push(
      ...values.filter((value): value is ShelvedRecord => value !== null),
    );
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  const latest = new Map<string, ShelvedRecord>();
  records
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
    .forEach((record) => {
      if (!latest.has(record.item.id)) latest.set(record.item.id, record);
    });
  return [...latest.values()];
}

export async function restoreShelvedRecord(
  kv: KVNamespace,
  key: string,
): Promise<boolean> {
  if (!/^item-backup:[a-zA-Z0-9-]+:\d+$/.test(key)) return false;
  const backup = await kv.get<unknown>(key, "json");
  if (!isShelvedRecord(key, backup)) return false;
  const items = await getAllItems(kv);
  if (items.some((item) => item.id === backup.item.id)) return true;
  await kv.put("items", JSON.stringify([backup.item, ...items]));
  return true;
}
