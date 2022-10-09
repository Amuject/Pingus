module.exports = {
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
