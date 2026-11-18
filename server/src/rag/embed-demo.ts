import { cosineSimilarity } from './embed.js'
import { createEmbeddingProvider } from './embedding-provider.js'

async function main(): Promise<void> {
  const provider = await createEmbeddingProvider()
  console.log('provider:', provider.name, 'dimensions:', provider.dimensions)

  const pairs = [
    ['Vue 3 响应式原理', 'Vue 的 ref 和 reactive'],
    ['Vue 3 响应式原理', '今天天气很好'],
    ['TypeScript 类型系统', 'TS 的泛型和类型收窄'],
  ]

  for (const [a, b] of pairs) {
    const [va, vb] = await provider.embed([a, b])
    console.log(`${a} <-> ${b}: ${cosineSimilarity(va, vb).toFixed(3)}`)
  }

  const [vector] = await provider.embed(['Vue 3 响应式原理'])
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  console.log('norm:', norm.toFixed(3))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})