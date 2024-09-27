import './App.css'
import TextEditor, {
  Entity,
  Relationship,
} from './components/TextEditor/TextEditor'
import EntityVisualizer from './components/EntityVisualizer/EntityVisualizer'
import { useEffect, useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

function App() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [isEditorFocused, setEditorFocused] = useState(false)
  const [isEditorOpen, setEditorOpen] = useState(true)

  useEffect(() => {
    const handleCloseEditor = (event: KeyboardEvent) => {
      if (event.key === '\\') {
        event.preventDefault()
        setEditorOpen(!isEditorOpen)
      }
    }
    window.addEventListener('keydown', handleCloseEditor)

    return () => {
      window.removeEventListener('keydown', handleCloseEditor)
    }
  }, [isEditorOpen])

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="relative min-h-full bg-gray-900 overflow-hidden"
    >
      <ResizablePanel
        defaultSize={30}
        style={{ flex: !isEditorOpen ? '0.0251 1 0px' : 'initial' }}
      >
        <div className="h-full">
          <TextEditor
            setEntities={setEntities}
            setRelationships={setRelationships}
            setEditorFocused={setEditorFocused}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <div className="flex h-full items-center justify-center p-6 bg-gray-800 overflow-hidden">
          <EntityVisualizer
            entities={entities}
            relationships={relationships}
            isEditorFocused={isEditorFocused}
          />
        </div>
        {/* <ResizablePanelGroup direction="vertical">
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={10} maxSize={10}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">footer</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup> */}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default App
