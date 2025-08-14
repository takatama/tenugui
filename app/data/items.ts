export interface Item {
  id: number;
  name: string;
  imageUrl: string;
}

/**
 * すべての手ぬぐいを取得する関数
 */
export async function getItems(kv: KVNamespace): Promise<Item[]> {
  return (await kv.get("items", "json")) || [];
}

/**
 * IDを指定して単一の手ぬぐいを取得する関数
 * @param itemId 手ぬぐいID
 */
export async function getItemById(
  kv: KVNamespace,
  itemId: number
): Promise<Item | undefined> {
  const items = await getItems(kv);
  return items.find((item) => item.id === itemId);
}

/**
 * 新しい手ぬぐいを作成する関数
 * @param data 手ぬぐいのデータ
 * @returns 作成された手ぬぐい
 */
export async function createItem(
  kv: KVNamespace,
  data: { name: string; imageUrl: string }
): Promise<Item> {
  const items = await getItems(kv);

  const newItem: Item = {
    id: items.reduce((maxId, item) => Math.max(item.id, maxId), 0) + 1,
    name: data.name,
    imageUrl: data.imageUrl,
  };
  items.push(newItem);
  await kv.put("items", JSON.stringify(items));
  return newItem;
}
