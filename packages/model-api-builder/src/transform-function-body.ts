// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/rest-crud
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

export function transformFunctionBody(
  fn: Function,
  transformer: (fnBody: string) => string,
) {
  const argNames = parseFunctionArgNames(fn);

  let body = extractFunctionBody(fn);
  body = transformer(body);

  return new Function(...argNames, body);
}

function extractFunctionBody(fn: Function) {
  return fn
    .toString()
    .split('\n')
    .slice(1, -1) // remove the first & the last line
    .join('\n');
}

function parseFunctionArgNames(fn: Function) {
  const src = fn.toString();

  const match = src.match(/\(([^)]*)\) {/);
  if (!match)
    throw new Error(
      'Unsupported function syntax - cannot parse argument names.\n' + src,
    );

  return match[1].split(/,/g).map(a => a.trim());
}
