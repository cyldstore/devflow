import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

/*
 * html: boolean 在源代码中启用HTML标签。
 * linkify: boolean 自动将类似网址的文本转换为链接。
 * breaks: boolean  将段落中的“\n”转换为句点<br>。
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

// 默认渲染函数
const defaultLinkOpen = md.renderer.rules.link_open

/**
 * 自定义 Markdown 链接渲染规则
 *
 * 为所有生成的 <a> 标签添加以下属性：
 * - target="_blank"：点击链接时在新标签页打开
 * - rel="noopener noreferrer"：防止新页面通过 window.opener 操作原页面，
 *   同时避免通过 Referer 泄露来源信息
 *
 * 保留 markdown-it 默认的链接渲染逻辑，避免影响原有渲染行为。
 *
 * @param tokens 当前渲染的 Token 数组
 * @param idx 当前 Token 在数组中的索引
 * @param options markdown-it 配置选项
 * @param env 外部传入的环境数据
 * @param self 当前 Renderer 渲染器实例
 * @returns 渲染后的 HTML 字符串
 */
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')

  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

/**
 * 将 Markdown 文本转换为经过安全过滤的 HTML 字符串
 *
 * 执行流程：
 * 1. 使用 markdown-it 将 Markdown 文本解析并转换为 HTML
 * 2. 使用 DOMPurify 对生成的 HTML 进行安全过滤，防止 XSS 攻击
 * 3. 返回过滤后的 HTML 字符串
 *
 * @param source 原始 Markdown 文本
 * @returns 经过安全过滤的 HTML 字符串
 */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(md.render(source), {
    USE_PROFILES: { html: true },
  })
}
