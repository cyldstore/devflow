module.exports = {
  'devflow/**/*.{ts,vue,js,json,css,md}': 'cd devflow && npx prettier --write',
  'devflow/**/*.{ts,vue,js}': 'cd devflow && npx eslint --fix',
}