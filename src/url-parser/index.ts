import type { IncomingMessage } from "node:http";

interface Params {
  [key: string]: string | string[];
}
class BRequest {
  private url: string | URL;
  private _url: URL;
  search: string;
  port: string;
  hash: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  searchParams: URLSearchParams;
  protocol: string;
  username: string;
  password: string;
  get: (name: string) => string | null;
  append: (name: string, value: string) => void;
  delete: (name: string, value: string) => void;
  entries: () => BuiltinIterator<[string, string], BuiltinIteratorReturn>;

  forEach: (
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    thisArg?: any
  ) => void;
  getAll: (name: string) => string[];
  has: (name: string, value: string) => boolean;
  keys: () => BuiltinIterator<string, BuiltinIteratorReturn>;
  set: (name: string, value: string) => void;
  sort: () => void;
  values: () => BuiltinIterator<string, BuiltinIteratorReturn>;
  paramsToString: () => string;
  size: number;
  urlSearch:
    | string
    | {
        (regexp: string | RegExp): number;
        (searcher: { [Symbol.search](string: string): number }): number;
      };
  toJson: () => string;
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  urlValueOf: () => string | Object;
  urlToString: () => string;

  constructor(req: IncomingMessage) {
    this.url = req.url as string | URL;
    this._url = new URL(this.url);
    this.params.bind(this);
    //
    this.urlSearch = this.url.search;
    this.urlValueOf = () => this.url.valueOf();
    this.urlToString = () => this.url.toString();
    //
    this.search = this._url.search;
    this.port = this._url.port;
    this.hash = this._url.hash;
    this.host = this._url.host;
    this.hostname = this._url.hostname;
    this.href = this._url.href;
    this.origin = this._url.origin;
    this.searchParams = this._url.searchParams;
    this.protocol = this._url.protocol;
    this.username = this._url.username;
    this.password = this._url.password;
    this.toJson = () => this._url.toJSON();
    this.toString = () => this._url.toString();
    //
    this.size = this.searchParams.size;
    this.paramsToString = () => this.searchParams.toString();
    this.values = () => this.searchParams.values();
    this.sort = () => this.searchParams.sort();
    this.set = (name: string, value: string) =>
      this.searchParams.set(name, value);
    this.keys = () => this.searchParams.keys();
    this.get = (name: string) => this.searchParams.get(name);
    this.append = (name: string, value: string) =>
      this.searchParams.append(name, value);
    this.delete = (name: string, value: string) =>
      this.searchParams.delete(name, value);
    this.entries = () => this.searchParams.entries();
    this.forEach = (
      callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      thisArg?: any
    ) => this.searchParams.forEach(callbackfn, thisArg);
    this.getAll = (name: string) => this.searchParams.getAll(name);
    this.has = (name: string, value: string) =>
      this.searchParams.has(name, value);
  }
  params(): Params {
    const resultObject = Array.from(this.searchParams.keys()).reduce(
      (acc, key) => {
        const values = this.searchParams.getAll(key);
        acc[key] = values.length > 1 ? values : values[0];
        return acc;
      },
      {}
    );
    return resultObject;
  }
}

export default function (req: IncomingMessage) {
  return new BRequest(req);
}
