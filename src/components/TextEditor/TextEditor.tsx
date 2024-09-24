import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useState } from 'react';
import { javascript } from '@codemirror/lang-javascript';
import { Button } from "@/components/ui/button"

export interface Entity {
    name: string
    properties: Array<{ name: string; type: string }>
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
}

function parseEntities(code: string): { entities: Entity[], relationships: Relationship[] } {
    const interfaces = code.split('interface')
    const entities: Entity[] = interfaces
        .slice(1)
        .map((interfaceStr, index) => {
            const [name, ...rest] = interfaceStr.split('{')
            const properties = rest.join('{').split('}')[0].split(';')
                .map(prop => {
                    const [propName, propType] = prop.split(':').map(p => p.trim())
                    return { name: propName, type: propType }
                })
                .filter(prop => prop.name && prop.type)
            return {
                name: name.trim(),
                properties,
                x: 50 + (index % 3) * 280,
                y: 50 + Math.floor(index / 3) * 220,
                width: 260,
                height: 40 + properties.length * 30
            }
        })

    const relationships: Relationship[] = []
    entities.forEach(entity => {
        entity.properties.forEach(prop => {
            const relatedEntity = entities.find(e => e.name === prop.type.replace('[]', ''))
            if (relatedEntity) {
                relationships.push({
                    from: entity.name,
                    to: relatedEntity.name,
                    fromProperty: prop.name,
                    toProperty: 'id'
                })
            }
        })
    })

    return { entities, relationships }
}

const baseCode = `
interface User {
  id: number;
  name: string;
  email: string;
  products: Product[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  owner: User;
}
`

interface TextEditorProps {
    setEntities: (entities: Entity[]) => void
    setRelationships: (relationships: Relationship[]) => void
}

export default function TextEditor({ setEntities, setRelationships }: TextEditorProps) {
    const [value, setValue] = useState(baseCode);
    const onChange = useCallback((val: string) => {
        console.log('val:', val);
        setValue(val);
    }, []);

    const handleVisualize = () => {
        const { entities: parsedEntities, relationships: parsedRelationships } = parseEntities(value)
        setEntities(parsedEntities)
        setRelationships(parsedRelationships)
    }
    return (
        <div className="flex flex-col min-h-[600px]">
            <CodeMirror
                value={value}
                height="100%"
                extensions={[javascript({ jsx: true })]}
                onChange={onChange}
                className="min-h-[564px]"
            />
            <Button onClick={handleVisualize}>Visualize</Button>
        </div>
    );
}
