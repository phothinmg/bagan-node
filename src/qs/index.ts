import * as qs from "node:querystring";

/**
 *
 * @param str The URL query string to parse
 * @param sep [sep='&'] The substring used to delimit key and value pairs in the query string.
 * @param eq [eq='='] The substring used to delimit keys and values in the query string.
 * @param options
 * @returns
 */
export function qs_parse(
  str: string,
  sep?: string,
  eq?: string,
  options?: qs.ParseOptions
): qs.ParsedUrlQuery {
  return qs.parse(str, sep, eq, options);
}
