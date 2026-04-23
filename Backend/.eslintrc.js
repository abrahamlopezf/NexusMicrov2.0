module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 'off', // backend often uses console or logger
    'camelcase': 'off', // DB uses snake_case in places
    'import/no-extraneous-dependencies': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
  },
};
