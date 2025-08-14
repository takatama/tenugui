import { type Item, dummyItems } from "./items";

export function createItem(data: { name: string; imageUrl: string }): Item {
  const newItem: Item = {
    id: dummyItems.reduce((maxId, item) => Math.max(item.id, maxId), 0) + 1,
    name: data.name,
    imageUrl: data.imageUrl,
  };
  dummyItems.push(newItem);
  return newItem;
}
