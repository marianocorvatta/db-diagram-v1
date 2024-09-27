// dbml-language.ts

import { parser } from './dbml.parser' // Asegúrate de que el archivo dbml.parser.ts esté en TS
import { LRLanguage, LanguageSupport } from '@codemirror/language'
import { styleTags, tags as t } from '@lezer/highlight'

console.log('parser', parser)
console.log('nodeSet', parser.nodeSet.types)
// const nodeNames = parser.nodeSet.types.map((type) => type.name);
// console.log(nodeNames);

console.log(
  styleTags({
    Identifier: t.variableName,
    // "Table": t.keyword,
    // "int varchar uuid float timestamp": t.typeName,
  })
)

const dbmlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        // "Table": t.keyword,
        // "int varchar uuid float timestamp": t.typeName,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: '--' },
  },
})

export function dbml(): LanguageSupport {
  return new LanguageSupport(dbmlLanguage)
}
