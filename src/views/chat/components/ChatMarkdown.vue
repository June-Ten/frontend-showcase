<script setup lang="ts">
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { marked } from 'marked'
import { computed } from 'vue'
import '../styles/hljs-atom-one-dark.css'

const props = defineProps<{
  content: string
  streaming?: boolean
}>()

function highlightCode(text: string, lang?: string) {
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(text, { language: lang }).value
  }
  return hljs.highlightAuto(text).value
}

marked.setOptions({
  gfm: true,
  breaks: true,
})

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      const highlighted = highlightCode(text, language === 'plaintext' ? undefined : language)
      return `<pre class="hljs-code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`
    },
  },
})

const html = computed(() => {
  if (!props.content) return ''
  const raw = marked.parse(props.content, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['class'],
  })
})
</script>

<template>
  <div class="chat-markdown" v-html="html" />
  <span v-if="streaming" class="chat-markdown__cursor" aria-hidden="true" />
</template>

<style lang="scss" scoped>
.chat-markdown {
  font-size: 15px;
  line-height: 1.7;
  word-break: break-word;
  color: #0d0d0d;

  :deep(p) {
    margin: 0 0 0.75em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 1em 0 0.5em;
    font-weight: 600;
    line-height: 1.35;

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) {
    font-size: 1.35em;
  }

  :deep(h2) {
    font-size: 1.2em;
  }

  :deep(h3) {
    font-size: 1.08em;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.5em 0;
    padding-left: 1.4em;
  }

  :deep(li + li) {
    margin-top: 0.25em;
  }

  :deep(blockquote) {
    margin: 0.75em 0;
    padding: 0.25em 0 0.25em 1em;
    border-left: 3px solid #d0d0d0;
    color: #555;
  }

  :deep(:not(pre) > code) {
    padding: 0.15em 0.4em;
    border-radius: 4px;
    background: #f4f4f4;
    color: #c7254e;
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
    font-size: 0.9em;
  }

  :deep(pre.hljs-code-block) {
    margin: 0.75em 0;
    border-radius: 10px;
    overflow: hidden;
  }

  :deep(pre.hljs-code-block code.hljs) {
    display: block;
    padding: 14px 16px;
    overflow-x: auto;
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
    font-size: 13px;
    line-height: 1.55;
    tab-size: 2;
  }

  :deep(a) {
    color: #10a37f;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :deep(table) {
    width: 100%;
    margin: 0.75em 0;
    border-collapse: collapse;
    font-size: 14px;
  }

  :deep(th),
  :deep(td) {
    padding: 8px 10px;
    border: 1px solid #e5e5e5;
    text-align: left;
  }

  :deep(th) {
    background: #f7f7f7;
    font-weight: 600;
  }

  :deep(hr) {
    margin: 1em 0;
    border: none;
    border-top: 1px solid #e5e5e5;
  }
}

.chat-markdown__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: #0d0d0d;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
