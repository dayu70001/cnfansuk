export const catalogCategories = [
  { value: "outerwear", label: "外套" },
  { value: "tops", label: "上装" },
  { value: "bottoms", label: "下装" },
  { value: "co-ords-sets", label: "套装" },
] as const;

export const catalogSubcategories: Record<string, Array<{ value: string; label: string }>> = {
  outerwear: [
    { value: "jackets", label: "夹克" }, { value: "hooded-jackets", label: "连帽夹克" },
    { value: "varsity-jackets", label: "棒球夹克" }, { value: "puffer-jackets", label: "羽绒夹克" },
    { value: "vests", label: "马甲" }, { value: "coats", label: "大衣" },
  ],
  tops: [
    { value: "t-shirts", label: "T恤" }, { value: "hoodies", label: "连帽卫衣" },
    { value: "sweatshirts", label: "卫衣" }, { value: "zip-hoodies", label: "拉链连帽卫衣" },
    { value: "shirts", label: "衬衫" }, { value: "knitwear", label: "针织衫" },
  ],
  bottoms: [
    { value: "trousers", label: "长裤" }, { value: "joggers", label: "运动裤" },
    { value: "cargo-pants", label: "工装裤" }, { value: "jeans", label: "牛仔裤" },
    { value: "shorts", label: "短裤" }, { value: "skirts", label: "半身裙" },
  ],
  "co-ords-sets": [
    { value: "tracksuits", label: "运动套装" }, { value: "hoodie-sets", label: "连帽卫衣套装" },
    { value: "t-shirt-shorts-sets", label: "T恤短裤套装" }, { value: "knit-sets", label: "针织套装" },
    { value: "casual-sets", label: "休闲套装" }, { value: "jacket-pants-sets", label: "夹克长裤套装" },
  ],
};
