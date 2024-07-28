import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import { checkOptionalParameter } from "./copp.js";
export type ParamIndexMap = Record<string, number>;
export type H = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) => void;
export type ParamStash = string[];
export type Result<T> = [[T, ParamIndexMap][], ParamStash] | [[T, Params][]];
export type SUPPORTED_METHODS =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "patch";

export const METHOD_NAME_ALL = "ALL" as const;
export interface Router<T> {
  name: string;
  add(method: SUPPORTED_METHODS, path: string, handler: T): void;
  match(method: SUPPORTED_METHODS, path: string): Result<T>;
  get(path: string, handler: T): this;
  post(path: string, handler: T): this;
  put(path: string, handler: T): this;
  delete(path: string, handler: T): this;
}

export type Params = Record<string, string>;
export class UnsupportedPathError extends Error {}

type RegExpMatchArrayWithIndices = RegExpMatchArray & {
  indices: [number, number][];
};

const emptyParams = Object.create(null);

const splitPathRe = /\/(:\w+(?:{(?:(?:{[\d,]+})|[^}])+})?)|\/[^\/\?]+|(\?)/g;
const splitByStarRe = /\*/;
class BaganRouter<T> implements Router<T> {
  name = "BaganRouter";
  routes: [string, string, T][] = [];
  listner: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void;

  add(method: SUPPORTED_METHODS, path: string, handler: T) {
    // biome-ignore lint/complexity/noForEach: <explanation>
    (checkOptionalParameter(path) || [path]).forEach((p) => {
      this.routes.push([method, p, handler]);
    });
  }
  get(path: string, handler: T): this {
    this.add("get", path, handler);
    return this;
  }
  post(path: string, handler: T) {
    this.add("post", path, handler);
    return this;
  }
  put(path: string, handler: T) {
    this.add("put", path, handler);
    return this;
  }
  delete(path: string, handler: T) {
    this.add("delete", path, handler);
    return this;
  }
  
  match(method: SUPPORTED_METHODS, path: string): Result<T> {
    const handlers: [T, Params][] = [];
    ROUTES_LOOP: for (let i = 0, len = this.routes.length; i < len; i++) {
      const [routeMethod, routePath, handler] = this.routes[i];
      if (routeMethod !== method && routeMethod !== METHOD_NAME_ALL) {
        continue;
      }
      if (routePath === "*" || routePath === "/*") {
        handlers.push([handler, emptyParams]);
        continue;
      }

      const hasStar = routePath.indexOf("*") !== -1;
      const hasLabel = routePath.indexOf(":") !== -1;
      if (!hasStar && !hasLabel) {
        if (routePath === path || `${routePath}/` === path) {
          handlers.push([handler, emptyParams]);
        }
      } else if (hasStar && !hasLabel) {
        const endsWithStar = routePath.charCodeAt(routePath.length - 1) === 42;
        const parts = (endsWithStar ? routePath.slice(0, -2) : routePath).split(
          splitByStarRe
        );

        const lastIndex = parts.length - 1;
        for (let j = 0, pos = 0, len = parts.length; j < len; j++) {
          const part = parts[j];
          const index = path.indexOf(part, pos);
          if (index !== pos) {
            continue ROUTES_LOOP;
          }
          pos += part.length;
          if (j === lastIndex) {
            if (
              !endsWithStar &&
              pos !== path.length &&
              !(pos === path.length - 1 && path.charCodeAt(pos) === 47)
            ) {
              continue ROUTES_LOOP;
            }
          } else {
            const index = path.indexOf("/", pos);
            if (index === -1) {
              continue ROUTES_LOOP;
            }
            pos = index;
          }
        }
        handlers.push([handler, emptyParams]);
      } else if (hasLabel && !hasStar) {
        const params: Record<string, string> = Object.create(null);
        const parts = routePath.match(splitPathRe) as string[];

        const lastIndex = parts.length - 1;
        for (let j = 0, pos = 0, len = parts.length; j < len; j++) {
          if (pos === -1 || pos >= path.length) {
            continue ROUTES_LOOP;
          }

          const part = parts[j];
          if (part.charCodeAt(1) === 58) {
            // /:label
            let name = part.slice(2);
            let value: string;

            if (name.charCodeAt(name.length - 1) === 125) {
              // :label{pattern}
              const openBracePos = name.indexOf("{");
              const pattern = name.slice(openBracePos + 1, -1);
              const restPath = path.slice(pos + 1);
              const match = new RegExp(pattern, "d").exec(
                restPath
              ) as RegExpMatchArrayWithIndices;
              if (
                !match ||
                match.indices[0][0] !== 0 ||
                match.indices[0][1] === 0
              ) {
                continue ROUTES_LOOP;
              }
              name = name.slice(0, openBracePos);
              value = restPath.slice(...match.indices[0]);
              pos += match.indices[0][1] + 1;
            } else {
              let endValuePos = path.indexOf("/", pos + 1);
              if (endValuePos === -1) {
                if (pos + 1 === path.length) {
                  continue ROUTES_LOOP;
                }
                endValuePos = path.length;
              }
              value = path.slice(pos + 1, endValuePos);
              pos = endValuePos;
            }

            params[name] ||= value as string;
          } else {
            const index = path.indexOf(part, pos);
            if (index !== pos) {
              continue ROUTES_LOOP;
            }
            pos += part.length;
          }

          if (j === lastIndex) {
            if (
              pos !== path.length &&
              !(pos === path.length - 1 && path.charCodeAt(pos) === 47)
            ) {
              continue ROUTES_LOOP;
            }
          }
        }

        handlers.push([handler, params]);
      } else if (hasLabel && hasStar) {
        throw new UnsupportedPathError();
      }
    }

    return [handlers];
  }
}

export default function router() {
  return new BaganRouter();
}
