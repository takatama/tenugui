export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  productUrl?: string;
  tags: string[];
  memo: string;
  order?: number;
}

export interface TagAnalysis {
  tags: string[];
  description: string;
  colors: string[];
  patterns: string[];
  confidence: number;
  analyzedAt: string;
}

/**
 * すべての手ぬぐいを取得する関数（内部使用専用）
 * @param kv KVNamespace
 * @returns すべての手ぬぐいの配列
 */
async function getAllItemsFromKV(kv: KVNamespace): Promise<Item[]> {
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
  const items = await getAllItemsFromKV(kv);
  return items.find((item) => item.id === itemId);
}

/**
 * すべてのアイテムを配列として取得する関数（シンプル版）
 * @param kv KVNamespace
 * @returns すべてのアイテムの配列
 */
export async function getAllItems(kv: KVNamespace): Promise<Item[]> {
  return await getAllItemsFromKV(kv);
}

/**
 * 新しい手ぬぐいを作成する関数
 * @param data 手ぬぐいのデータ
 * @returns 作成された手ぬぐい
 */
export async function createItem(
  kv: KVNamespace,
  data: {
    name: string;
    imageUrl: string;
    productUrl?: string;
    tags: string[];
    memo: string;
  }
): Promise<Item> {
  const items = await getAllItemsFromKV(kv);

  const newItem: Item = {
    id: crypto.randomUUID(),
    name: data.name,
    imageUrl: data.imageUrl,
    productUrl: data.productUrl,
    tags: data.tags,
    memo: data.memo,
  };
  // 新しいアイテムを配列の先頭に追加
  items.unshift(newItem);
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
  const items = await getAllItemsFromKV(kv);
  const initialLength = items.length;
  const filteredItems = items.filter((item) => item.id !== itemId);

  if (filteredItems.length === initialLength) {
    // アイテムが見つからなかった場合
    return false;
  }

  // itemsから削除
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
  data: {
    name: string;
    imageUrl: string;
    productUrl?: string;
    tags: string[];
    memo: string;
  }
): Promise<Item | undefined> {
  const items = await getAllItemsFromKV(kv);
  const itemIndex = items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    // アイテムが見つからなかった場合
    return undefined;
  }

  const updatedItem: Item = {
    ...items[itemIndex],
    name: data.name,
    imageUrl: data.imageUrl,
    productUrl: data.productUrl,
    tags: data.tags,
    memo: data.memo,
  };

  items[itemIndex] = updatedItem;
  await kv.put("items", JSON.stringify(items));
  return updatedItem;
}

/**
 * アイテム一覧を取得する関数（メインの取得関数）
 * @param kv KVNamespace
 * @param tagFilter 絞り込むタグ（オプション）
 * @returns アイテム、全タグ、件数情報を含むオブジェクト
 */
export async function getItems(
  kv: KVNamespace,
  tagFilter?: string | null
): Promise<{
  items: Item[];
  allTags: string[];
  totalCount: number;
  filteredCount: number;
  selectedTag: string | null;
}> {
  // 1回のKVアクセスですべてのアイテムを取得
  const allItems = await getAllItemsFromKV(kv);

  // 全タグを抽出
  const allTags = [
    ...new Set(allItems.flatMap((item) => item.tags || [])),
  ].sort();

  // フィルタリング
  const filteredItems = tagFilter
    ? allItems.filter((item) => item.tags?.includes(tagFilter))
    : allItems;

  return {
    items: filteredItems,
    allTags,
    totalCount: allItems.length,
    filteredCount: filteredItems.length,
    selectedTag: tagFilter || null,
  };
}

/**
 * すべての既存タグを取得する関数
 * @param kv KVNamespace
 * @returns ユニークなタグの配列（アルファベット順）
 */
export async function getAllTags(kv: KVNamespace): Promise<string[]> {
  const allItems = await getAllItemsFromKV(kv);
  const allTags = [
    ...new Set(allItems.flatMap((item) => item.tags || [])),
  ].sort();
  return allTags;
}

/**
 * 配列の順序でアイテムを並び替える関数
 * @param kv KVNamespace
 * @param itemIds 新しい順序のアイテムIDの配列
 */
export async function reorderItems(
  kv: KVNamespace,
  itemIds: string[]
): Promise<void> {
  const items = await getAllItemsFromKV(kv);

  // アイテムIDでマップを作成
  const itemMap = new Map(items.map((item) => [item.id, item]));

  // 新しい順序でアイテムを並び替え
  const reorderedItems: Item[] = [];

  // 指定された順序でアイテムを追加
  for (const itemId of itemIds) {
    const item = itemMap.get(itemId);
    if (item) {
      reorderedItems.push(item);
      itemMap.delete(itemId);
    }
  }

  // 残ったアイテム（順序指定されなかった）を末尾に追加
  for (const remainingItem of itemMap.values()) {
    reorderedItems.push(remainingItem);
  }

  await kv.put("items", JSON.stringify(reorderedItems));
}
