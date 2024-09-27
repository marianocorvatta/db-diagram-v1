import CodeMirror from '@uiw/react-codemirror'
import { useCallback, useState, useEffect } from 'react'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Button } from '@/components/ui/button' // Asegúrate de que este import sea correcto o ajusta según tu estructura de carpetas.
// import { dbml } from './dbml-language';

export interface Entity {
  name: string
  properties: Array<{ name: string; type: string; isPrimaryKey?: boolean }>
  x: number
  y: number
  width: number
  height: number
}

export interface Relationship {
  from: string
  to: string
  fromProperty: string
  toProperty: string
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
}

function parseDBML(dbml: string): {
  entities: Entity[]
  relationships: Relationship[]
} {
  const lines = dbml.split('\n').map((line) => line.trim())
  const entities: Entity[] = []
  const relationships: Relationship[] = []

  let currentEntity: Entity | null = null

  lines.forEach((line) => {
    if (line.startsWith('Table')) {
      if (currentEntity) {
        entities.push(currentEntity)
      }
      const tableName = line.split(' ')[1]
      currentEntity = {
        name: tableName,
        properties: [],
        x: 50 + (entities.length % 3) * 280,
        y: 50 + Math.floor(entities.length / 3) * 220,
        width: 260,
        height: 38,
      }
    } else if (
      currentEntity &&
      !line.includes('{') &&
      !line.includes('}') &&
      line !== '' &&
      !line.includes('[ref:')
    ) {
      const [name, type] = line.split(' ').slice(0, 2)
      const isPrimaryKey = line.includes('[pk]')
      if (name && type) {
        currentEntity.properties.push({ name, type, isPrimaryKey })
        currentEntity.height += 30
      }
    } else if (currentEntity && line.includes('[ref:')) {
      const [name, typeAndRef] = line.split(' ').slice(0, 2)
      const [type] = typeAndRef.split('[')

      if (name && type) {
        currentEntity.properties.push({ name, type })
        currentEntity.height += 30
      }

      const refMatch = line.match(/\[ref: > (\w+)\.(\w+)\]/)
      if (refMatch && currentEntity) {
        const toTable = refMatch[1]
        const toProperty = refMatch[2]
        const fromProperty = line.split(' ')[0]

        let cardinality: Relationship['cardinality'] = 'one-to-one'
        if (type.includes('[]')) {
          cardinality = 'many-to-one'
        } else if (name.includes('[]')) {
          cardinality = 'one-to-many'
        }

        relationships.push({
          from: currentEntity.name,
          to: toTable,
          fromProperty: fromProperty,
          toProperty: toProperty,
          cardinality: cardinality,
        })
      }
    }
  })

  if (currentEntity) {
    entities.push(currentEntity)
  }

  return { entities, relationships }
}

const baseCode = `Table User {
  username varchar [pk]
  password varchar
  role integer
}

Table Product {
  id uuid [pk]
  createdAt timestamp
  name varchar
  ip varchar [null]
  detailModule varchar [null]
  data text [null]
  config text [null]
}

Table Token {
  id uuid [pk]
  createdAt timestamp
  validUntil timestamp [null]
  requestLimit integer [null]
  name varchar
  company varchar [null]
  config text [null]
  active bool
  product uuid [ref: > Product.id]
  user varchar [ref: > User.username]
}

Table Request {
  id uuid [pk]
  token uuid [ref: > Token.id]
  createdAt timestamp
  state integer [null]
  extid varchar [null]
}

Table RequestData {
  id integer [pk]
  request uuid [ref: > Request.id]
  createdAt timestamp
  name varchar
  type varchar
  extension varchar
  url varchar [null]
  data binary [null]
}`

interface TextEditorProps {
  setEntities: (entities: Entity[]) => void
  setRelationships: (relationships: Relationship[]) => void
  setEditorFocused: (isEditorFocused: boolean) => void
}

export default function TextEditor({
  setEntities,
  setRelationships,
  setEditorFocused,
}: TextEditorProps) {
  const [value, setValue] = useState<string>(baseCode)

  const onChange = useCallback((val: string) => {
    setValue(val)
  }, [])

  const handleVisualize = () => {
    const { entities, relationships } = parseDBML(value)
    setEntities(entities)
    setRelationships(relationships)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'DIV'
      ) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="relative flex flex-col h-full max-h-screen">
      <div className="flex-1 overflow-y-auto">
        <CodeMirror
          value={value}
          height="100%"
          extensions={[vscodeDark]} // Usar el lenguaje DBML
          onChange={onChange}
          theme={vscodeDark}
          className="w-full h-full"
          onFocus={() => setEditorFocused(true)}
          onBlur={() => setEditorFocused(false)}
          autoFocus={false}
        />
      </div>
      <Button
        className="p-2 bg-gray-800 absolute bottom-0 w-full"
        onClick={handleVisualize}
      >
        Visualize
      </Button>
    </div>
  )
}
