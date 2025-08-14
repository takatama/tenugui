export interface Item {
  id: number;
  name: string;
  imageUrl: string;
}

export const dummyItems: Item[] = [
  {
    id: 1,
    name: "伝統柄 - 青海波（せいがいは）",
    imageUrl: "https://placehold.co/600x600/3b82f6/ffffff?text=Tenugui+1",
  },
  {
    id: 2,
    name: "動物柄 - 猫と足跡",
    imageUrl: "https://placehold.co/600x600/ef4444/ffffff?text=Tenugui+2",
  },
  {
    id: 3,
    name: "植物柄 - 朝顔",
    imageUrl: "https://placehold.co/600x600/22c55e/ffffff?text=Tenugui+3",
  },
];

/**
 * すべての商品を取得する関数
 */
export function getItems(): Item[] {
  return dummyItems;
}

/**
 * IDを指定して単一の商品を取得する関数
 * @param itemId 商品ID
 */
export function getItemById(itemId: number): Item | undefined {
  return dummyItems.find((item) => item.id === itemId);
}
