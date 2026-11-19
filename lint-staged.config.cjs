module.exports = {
  "devflow/**/*.{ts,vue,js,json,css,md}":
    "npm --prefix devflow exec -- prettier --write",
  "devflow/**/*.{ts,vue,js}":
    "npm --prefix devflow exec -- eslint --config devflow/eslint.config.js --fix",
};
