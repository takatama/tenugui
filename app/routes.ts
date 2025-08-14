import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  {
    file: "components/layout.tsx",
    children: [
      index("routes/home.tsx"),
      route("items", "routes/items.tsx"),
      route("items/new", "routes/items.new.tsx"),
      route("items/:itemId", "routes/items.$itemId.tsx"),
    ],
  },
] satisfies RouteConfig;
