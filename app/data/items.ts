export interface Item {
  id: string;
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
  itemId: string
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
    id: crypto.randomUUID(),
    name: data.name,
    imageUrl: data.imageUrl,
  };
  items.push(newItem);
  await kv.put("items", JSON.stringify(items));
  return newItem;
}

/**
 * 指定されたIDの手ぬぐいを削除する関数
 * @param kv KVNamespace
 * @param itemId 削除する手ぬぐいのID
 * @returns 削除が成功したかどうか
 */
export async function deleteItem(
  kv: KVNamespace,
  itemId: string
): Promise<boolean> {
  const items = await getItems(kv);
  const initialLength = items.length;
  const filteredItems = items.filter((item) => item.id !== itemId);

  if (filteredItems.length === initialLength) {
    // アイテムが見つからなかった場合
    return false;
  }

  await kv.put("items", JSON.stringify(filteredItems));
  return true;
}

/**
 * 指定されたIDの手ぬぐいを更新する関数
 * @param kv KVNamespace
 * @param itemId 更新する手ぬぐいのID
 * @param data 更新するデータ
 * @returns 更新されたアイテム、存在しない場合はundefined
 */
export async function updateItem(
  kv: KVNamespace,
  itemId: string,
  data: { name: string; imageUrl: string }
): Promise<Item | undefined> {
  const items = await getItems(kv);
  const itemIndex = items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    // アイテムが見つからなかった場合
    return undefined;
  }

  const updatedItem: Item = {
    ...items[itemIndex],
    name: data.name,
    imageUrl: data.imageUrl,
  };

  items[itemIndex] = updatedItem;
  await kv.put("items", JSON.stringify(items));
  return updatedItem;
}
