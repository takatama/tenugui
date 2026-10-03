import type { Item } from "./items";

/** Local development only. Reading an empty production KV never creates data. */
export function getDemoItems(): Item[] {
  return [
    {
      id: "demo-seigaiha",
      name: "藍の青海波",
      imageUrl: "/images/seigaiha.svg",
      tags: ["藍色", "和柄", "夏"],
      memo: "海の近くの小さなお店で。穏やかな波を眺めていると、あの日の潮の香りを思い出す。",
      status: "purchased",
    },
    {
      id: "demo-tsubaki",
      name: "冬の椿",
      imageUrl: "/images/tsubaki.svg",
      tags: ["植物", "冬", "和柄"],
      memo: "寒い朝に見つけた、凛と咲く椿。季節が巡ったら、また飾りたい一枚。",
      status: "purchased",
    },
    {
      id: "demo-mimosa",
      name: "ミモザの小枝",
      imageUrl: "/images/mimosa.svg",
      tags: ["植物", "春"],
      memo: "春の散歩の帰りに。部屋に小さな光が差すような、やさしい黄色に惹かれて。",
      status: "purchased",
    },
    {
      id: "demo-mameshibori",
      name: "豆しぼり",
      imageUrl: "/images/mameshibori.svg",
      tags: ["藍色", "和柄"],
      memo: "ずっとそばに置いておきたい定番。何気ない日にも心地よく馴染んでくれる。",
      status: "purchased",
    },
    {
      id: "demo-yamayama",
      name: "山の稜線",
      imageUrl: "/images/yamayama.svg",
      tags: ["秋", "和柄"],
      memo: "旅先の山々を思い出して。遠くの景色を、暮らしの中にもひとつ。",
      status: "purchased",
    },
    {
      id: "demo-kingyo",
      name: "夏の金魚",
      imageUrl: "/images/kingyo.svg",
      tags: ["夏", "藍色", "和柄"],
      memo: "夏祭りの記憶。水の中をゆっくり泳ぐ姿が、涼しい風を連れてきてくれる。",
      status: "purchased",
    },
    {
      id: "demo-nami",
      name: "波の向こう",
      imageUrl: "/images/seigaiha.svg",
      tags: ["藍色", "夏"],
      memo: "青い柄を並べてみたくて迎えた一枚。光の当たり方で、少しずつ表情が変わる。",
      status: "purchased",
    },
    {
      id: "demo-haru",
      name: "春を待つ庭",
      imageUrl: "/images/mimosa.svg",
      tags: ["植物", "春"],
      memo: "お気に入りの棚に飾る日のことを考えながら。次の春に迎えたい一枚。",
      status: "unpurchased",
    },
  ];
}
