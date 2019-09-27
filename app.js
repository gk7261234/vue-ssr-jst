require('@babel/register')({
    plugins: ["@babel/plugin-syntax-dynamic-import","@babel/plugin-transform-runtime"],
    presets: ["@babel/preset-env"]
});
require("./server/server");
