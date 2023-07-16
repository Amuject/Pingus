export default {
  plugins: [
    ['babel-plugin-transform-import-meta'],
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        allowTopLevelThis: true,
      },
    ],
    ['add-module-exports'],
  ],
  comments: false,
};
