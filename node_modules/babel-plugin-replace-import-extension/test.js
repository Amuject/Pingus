/*
   Copyright 2021 silane

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

const babel = require('@babel/core');
const pluginCommonjs = require('@babel/plugin-transform-modules-commonjs');
const plugin = require('./src/index.js');


function transform(input, options) {
  return babel.transform(input, {
    plugins: [[plugin, options], pluginCommonjs],
  }).code;
}

function assertDynamicImportArgument(code, expected){
  code = code.replace('import(', 'import_(');
  const import_ = jest.fn();
  new Function('import_', code)(import_);
  for(let [idx, e] of expected.entries())
    expect(import_).toHaveBeenNthCalledWith(idx + 1, e);
}

describe('src/index.js', () => {
  test('extension is correctly replaced without CommonJS translation', () => {
    const input = 'import foo from "./foo.js";';
    const options = { extMapping: { '.js': '.cjs', '.sj': '.sjc' } };
    const code = babel.transform(input, { plugins: [[plugin, options]] }).code;
    expect(code).toContain('import foo from "./foo.cjs"');
  });

  test('extension is correctly replaced', () => {
    const input = 'import foo from "./foo.js";';
    const options = { extMapping: { '.js': '.cjs', '.sj': '.sjc' } };
    const code = transform(input, options);
    expect(code).toContain('require("./foo.cjs")');
  });

  test('extension is correctly added', () => {
    const input = 'import foo from "./foo";';
    const options = { extMapping: { '': '.ext', '.foo': '.bar' } };
    const code = transform(input, options);
    expect(code).toContain('require("./foo.ext")');
  });

  test('extension is correctly removed', () => {
    const input = 'import foo from "./foo.abc";';
    const options = { extMapping: { '.abc': '', '.def': '.ghi' } };
    const code = transform(input, options);
    expect(code).toContain('require("./foo")');
  });

  test('extension is not changed when there is no mapping', () => {
    const input = 'import foo from "./module.foo";';
    const options = { extMapping: {
      '.bar': '.foobar', '.fo': '.foba', '.o': '.fb',
    }};
    const code = transform(input, options);
    expect(code).toContain('require("./module.foo")');
  });

  test('extension is not changed when not relative path', () => {
    const input = 'import foo from "package.foo";';
    const options = { extMapping: { '.foo': '.bar' } };
    const code = transform(input, options);
    expect(code).toContain('require("package.foo")');
  });

  test('extension in "named re-export" statement is correctly replaced',
       () => {
    const input = 'export { foo } from "./module.ext";';
    const options = { extMapping: { '.ext': '.mjs' } };
    const code = transform(input, options);
    expect(code).toContain('require("./module.mjs")');
  });

  test('extension in "re-export all" statement is correctly replaced', () => {
    const input = 'export * from "./module.ext";';
    const options = { extMapping: { '.ext': '.mjs' } };
    const code = transform(input, options);
    expect(code).toContain('require("./module.mjs")');
  });

  test('extension in dynamic import is correctly replaced', () => {
    const input = 'import("./module" + ".ext");';
    const options = { extMapping: { '.ext': '.mjs' } };
    let code = transform(input, options);
    assertDynamicImportArgument(code, ['./module.mjs']);
  });

  test('multiple dot extension is correctly replaced', () => {
    const input = 'export * from "./module.zzz.aaa";';
    const options = { extMapping: { '.aaa': '.a', '.zzz.aaa': '.z' } };
    const code = transform(input, options);
    expect(code).toContain('require("./module.z")');
  });
});
