export interface Resource {
  id: string;
  [key: string]: unknown;
}

export interface ResourceStore {
  items: Map<string, Resource>;
  nextId: number;
}

export interface RestRequest {
  method: string;
  path: string;
  body?: unknown;
}

export interface RestResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

export function createStore(): ResourceStore {
  return { items: new Map(), nextId: 1 };
}

const COLLECTION_METHODS = "GET, POST";
const ITEM_METHODS = "GET, PUT, DELETE";

export function restHandler(req: RestRequest, store: ResourceStore): RestResponse {
  const segments = req.path.split("/").filter(Boolean);
  const [collection, id] = segments;

  // Collection endpoint: /widgets
  if (segments.length === 1) {
    switch (req.method) {
      case "GET":
        return { status: 200, headers: {}, body: [...store.items.values()] };
      case "POST": {
        const newId = String(store.nextId++);
        const resource: Resource = { ...(req.body as object), id: newId };
        store.items.set(newId, resource);
        return {
          status: 201,
          headers: { Location: `/${collection}/${newId}` },
          body: resource,
        };
      }
      default:
        return { status: 405, headers: { Allow: COLLECTION_METHODS } };
    }
  }

  // Item endpoint: /widgets/:id
  if (segments.length !== 2 || id === undefined) return { status: 404, headers: {} };
  switch (req.method) {
    case "GET": {
      const item = store.items.get(id);
      return item
        ? { status: 200, headers: {}, body: item }
        : { status: 404, headers: {} };
    }
    case "PUT": {
      const existed = store.items.has(id);
      const resource: Resource = { ...(req.body as object), id };
      store.items.set(id, resource);
      return existed
        ? { status: 200, headers: {}, body: resource }
        : { status: 201, headers: { Location: `/${collection}/${id}` }, body: resource };
    }
    case "DELETE": {
      const existed = store.items.delete(id);
      return existed ? { status: 204, headers: {} } : { status: 404, headers: {} };
    }
    default:
      return { status: 405, headers: { Allow: ITEM_METHODS } };
  }
}
