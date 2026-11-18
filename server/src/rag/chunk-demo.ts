import { chunkText } from "./chunk.js";

const sample = `# 前端开发简历

## 技能
熟悉 Vue 3、TypeScript、Vite，了解浏览器渲染流程和性能优化。

## 项目
DevFlow 是一个本地优先的个人工作台，包含任务、知识库、求职和复盘模块。

## 经历
在上一份工作中负责中后台系统的前端架构，主导了组件库建设和构建性能优化。
`;

const chunks = chunkText(sample, { maxChars: 120, overlapChars: 20 });

for (const chunk of chunks) {
  console.log(`#${chunk.index} (${chunk.content.length} chars)`);
  console.log(chunk.content);
  console.log("---");
}

const long = "这是一段很长的文字。".repeat(500);
const longChunks = chunkText(long, { maxChars: 100, overlapChars: 10 });
const maxLength = Math.max(...longChunks.map((chunk) => chunk.content.length));

console.log("long chunks:", longChunks.length);
console.log("max chunk length:", maxLength);
