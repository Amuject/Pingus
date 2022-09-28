module.exports = {
  presets: [
    [
      'babel-preset-minify',
      {
        builtIns: false,
        evaluate: false,
        mangle: false,
      },
    ],
  ],
  plugins: [
    ['babel-plugin-transform-import-meta'],
    [
      'replace-import-extension',
      {
        extMapping: {
          '.mjs': '.js',
        },
      },
    ],
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        allowTopLevelThis: true,
      },
    ],
  ],
  comments: false,
};
