import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  {
    file: "components/layout.tsx",
    children: [
      index("routes/items.tsx"),
      route("items/new", "routes/items.new.tsx"),
      route("items/:itemId", "routes/items.$itemId.tsx"),
      route("items/:itemId/edit", "routes/items.$itemId.edit.tsx"),
      route("settings", "routes/settings.tsx"),
    ],
  },
  route("api/product-analysis", "routes/api.product-analysis.tsx"),
  route("api/tag-analysis", "routes/api.tag-analysis.tsx"),
  route("api/tag-delete", "routes/api.tag-delete.tsx"),
  route("api/item-order", "routes/api.item-order.tsx"),
  route("api/auth/me", "routes/api.auth.me.tsx"),
  route("auth", "routes/auth.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
] satisfies RouteConfig;
