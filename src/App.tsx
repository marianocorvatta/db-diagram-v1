// import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import TextEditor, { Entity, Relationship } from "./components/TextEditor/TextEditor";
import EntityVisualizer from "./components/EntityVisualizer/EntityVisualizer";
import { useState } from "react";

function App() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  return (
    <div className="flex h-screen bg-gray-900">
      <div className="w-1/4 p-4">
        <TextEditor setEntities={setEntities} setRelationships={setRelationships} />
      </div>
      <div className="w-3/4 p-4 bg-gray-800 h-full">
        <EntityVisualizer entities={entities} relationships={relationships} />
      </div>
    </div>
  );
}

export default App;
