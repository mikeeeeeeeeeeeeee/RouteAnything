import katex from 'katex';

const MACROS = {
  '\\E': '\\mathbb{E}',
  '\\cS': '\\mathcal{S}',
  '\\1': '\\mathbf{1}',
  '\\argmax': '\\operatorname*{arg\\,max}',
  '\\Upd': '\\operatorname{Upd}',
};

const cache = new Map<string, string>();

/** Render TeX to an HTML string (memoised; KaTeX is synchronous and pure). */
export function tex(src: string, display = false): string {
  const key = (display ? 'D|' : 'I|') + src;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      // \htmlData{sym=KEY}{...} tags a symbol for the notation hover cards; \htmlClass styles a term
      trust: (ctx) => ctx.command === '\\htmlData' || ctx.command === '\\htmlClass',
      output: 'htmlAndMathml',
      macros: { ...MACROS },
    });
    cache.set(key, html);
  }
  return html;
}
