import { createServer } from "node:http";

const shops = [
  {
    id: "shop-1",
    name: "Плов в парке Сомони",
  },
  {
    id: "shop-2",
    name: "Бобоча самбуса",
  },
];

const productsByShopId = {
  "shop-1": [
    {
      id: "product-1",
      shopId: "shop-1",
      name: "Плов зарвода",
      priceMinor: 4500,
    },
    {
      id: "product-2",
      shopId: "shop-1",
      name: "Плов обычный",
      priceMinor: 3800,
    },
  ],
  "shop-2": [
    {
      id: "product-3",
      shopId: "shop-2",
      name: "Самбуса рубленная говядина",
      priceMinor: 1200,
    },
    {
      id: "product-4",
      shopId: "shop-2",
      name: "Самбуса фарш",
      priceMinor: 700,
    },
  ],
};

const json = (statusCode, payload) => {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: JSON.stringify(payload),
  };
};

const notFound = () => json(404, { error: { code: "NOT_FOUND", message: "Route not found." } });

const server = createServer((request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1:3001");

  if (method === "OPTIONS") {
    const result = json(204, null);
    response.writeHead(result.statusCode, result.headers);
    response.end();
    return;
  }

  let result;

  if (method === "GET" && url.pathname === "/api/v1/shops") {
    result = json(200, shops);
  } else {
    const productsMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)\/products$/u);

    if (method === "GET" && productsMatch !== null) {
      const shopId = decodeURIComponent(productsMatch[1]);
      result = json(200, productsByShopId[shopId] ?? []);
    } else {
      result = notFound();
    }
  }

  response.writeHead(result.statusCode, result.headers);
  response.end(result.body);
});

server.listen(3001, "127.0.0.1", () => {
  process.stdout.write("Demo API listening on http://127.0.0.1:3001\n");
});
