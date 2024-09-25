import './App.css'
import TextEditor, {
  Entity,
  Relationship,
} from './components/TextEditor/TextEditor'
import EntityVisualizer from './components/EntityVisualizer/EntityVisualizer'
import { useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

function App() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen bg-gray-900 overflow-x-hidden"
    >
      <ResizablePanel defaultSize={30}>
        <div className="h-full">
          <TextEditor
            setEntities={setEntities}
            setRelationships={setRelationships}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={70}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={90}>
            <div className="flex h-full items-center justify-center p-6 bg-gray-800">
              <EntityVisualizer
                entities={entities}
                relationships={relationships}
              />
            </div>
          </ResizablePanel>
          {/* <ResizableHandle withHandle />
          <ResizablePanel defaultSize={10} maxSize={10}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">footer</span>
            </div>
          </ResizablePanel> */}
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default App
