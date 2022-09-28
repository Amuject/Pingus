# babel-plugin-replace-import-extension

Babel plugin to replace extension of file name written in import statement and
dynamic import.

## Installation
```shell
npm install --save-dev babel-plugin-replace-import-extension
```

## Example
With the option:
```json
{ "extMapping": { ".js": ".mjs" }}
```

### In
```javascript
import { foo } from './module1.js';
export { bar } from './module2.js'; // Works for re-exporting
const promise = import('./module3' + '.js'); // Also works for dynamic import!
```

### Out
```javascript
import { foo } from './module1.mjs';
export { bar } from './module2.mjs';

// In dynamic import, function to replace extension is inserted.
// Note the actual code is not exactly the same.
const promise = import(transformExtension('./module3' + '.js'));
```

## Why We Need This Plugin?
When you develop a npm package that includes both ESModule and CommonJS version
of the code, there is two ways to tell Node which file is which version.

- Distinguish files by their extension, `mjs` for ESModule and `cjs` for
  CommonJS.
- If two versions are located in separate directories, put a `package.json`
  with a `type` field specified to the directory.

If you choose the former and you write your code in ESModule and transpile it
to CommonJS, you have to change the extension of the files while transpiling. 

In Babel CLI, extension of the output file name can be changed with
`--out-file-extension` option. But the file name referenced inside the code
is not changed. In this case, this plugin comes into play.

Note that the conversion is performed only on relative file name
(starts with `./` or `../`), because built-in packages or packages importing
from `node_modules` should not be converted.

## Usage
If project root `package.json` has `type` field of `module`, Babel config of
```json
{
  "plugins": [
    ["replace-import-extension", { "extMapping": { ".js": ".cjs" }}],
    ["@babel/transform-modules-commonjs"]
  ]
}
```
will convert the file extension from `.js` to `.cjs` and convert ESModule to
CommonJS, allowing both version's code exist together while Node can handle
each versions correctly. (`@babel/plugin-transform-modules-commonjs` must be
installed.) Or if you also need other translations, `@babel/env` preset can be
used together like,
```json
{
  "presets": [["@babel/env"]],
  "plugins": [
    ["replace-import-extension", { "extMapping": { ".js": ".cjs" }}]
  ]
}
```


If project root `package.json` has no `type` field or has `type` field of
`cjs`, ESModule files must be explicitly marked by `mjs` extension, which can
be done by Babel config of
```json
{
  "plugins": [
    ["replace-import-extension", { "extMapping": { ".js": ".mjs" }}]
  ]
}
```
Once again, `--out-file-extension` option must be used together to change the
output file extension.

## Options
### `extMapping`
`Object`, defaults to `{}`.

Mapping of original extension to converted extension.
Leading `.` is mandatory.

Both the original and the converted extensions can be empty string `''`, which means
no extension. You can use this feature to add or remove extension.
