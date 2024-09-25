import CodeMirror from '@uiw/react-codemirror'
import { useCallback, useState } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { Button } from '@/components/ui/button'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'

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
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
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

        let cardinality: Relationship['cardinality'] = 'one-to-one';
        if (type.includes('[]')) {
          cardinality = 'many-to-one';
        } else if (name.includes('[]')) {
          cardinality = 'one-to-many';
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
  id uuid [pk]
  name varchar
  email varchar
  createdAt timestamp
}

Table Product {
  id uuid [pk]
  name varchar
  price float
  user_id uuid [ref: > User.id]
}

Table Servicio {
  id uuid [pk]
  name varchar
  price float
  productId uuid [ref: > Product.id]
}`

interface TextEditorProps {
  setEntities: (entities: Entity[]) => void
  setRelationships: (relationships: Relationship[]) => void
}

export default function TextEditor({
  setEntities,
  setRelationships,
}: TextEditorProps) {
  const [value, setValue] = useState(baseCode)
  const onChange = useCallback((val: string) => {
    setValue(val)
  }, [])

  const handleVisualize = () => {
    const { entities: parsedEntities, relationships: parsedRelationships } =
      parseDBML(value)
    setEntities(parsedEntities)
    setRelationships(parsedRelationships)
  }
  return (
    <div className="grid grid-cols-1 min-h-screen">
      <CodeMirror
        value={value}
        height="100%"
        extensions={[javascript({ jsx: true })]}
        onChange={onChange}
        theme={vscodeDark}
        className="w-full h-full grid-rows-1"
      />
      <Button
        className="p-2 bg-gray-800 sticky bottom-0 grid-rows-2"
        onClick={handleVisualize}
      >
        Visualize
      </Button>
    </div>
  )
}
