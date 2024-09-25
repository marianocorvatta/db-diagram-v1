import { useEffect, useRef, useState } from 'react'
import { Entity, Relationship } from '../TextEditor/TextEditor'

function useCanvas(entities: Entity[], relationships: Relationship[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggedEntity, setDraggedEntity] = useState<Entity | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [hoveredProperty, setHoveredProperty] = useState<{
    entity: Entity
    propertyIndex: number
  } | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function drawEntities() {
      if (!ctx) return;
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
    
      entities.forEach((entity) => {
        // Entity background
        ctx.fillStyle = '#2D2D2D';
        ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    
        // Selected entity border
        if (selectedEntity === entity) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.strokeRect(entity.x - 2, entity.y - 2, entity.width + 4, entity.height + 4);
        }
    
        // Entity name background
        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(entity.x, entity.y, entity.width, 30);
    
        // Entity name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(entity.name, entity.x + 10, entity.y + 20);
    
        // Properties
        ctx.font = '14px Arial';
        entity.properties.forEach((prop, i) => {
          const y = entity.y + 55 + i * 30;
    
          // Hovered property highlight
          if (hoveredProperty && hoveredProperty.entity === entity && hoveredProperty.propertyIndex === i) {
            ctx.fillStyle = '#444444';
            ctx.fillRect(entity.x, y - 20, entity.width, 30);
          }
    
          ctx.fillStyle = '#BBBBBB';
          ctx.fillText(prop.name, entity.x + 10, y);
          ctx.fillStyle = '#888888';
          ctx.fillText(prop.type, entity.x + entity.width / 2 + 10, y);
          if (prop.isPrimaryKey) {
            ctx.fillStyle = '#BBBBBB';
            ctx.font = '12px Arial';
            ctx.fillText('🔑', entity.x + entity.width - 25, y);
          }
        });
      });
    
      // Draw relationships
      relationships.forEach((rel) => {
        const fromEntity = entities.find((e) => e.name === rel.from);
        const toEntity = entities.find((e) => e.name === rel.to);
        if (fromEntity && toEntity) {
          const fromPropIndex = fromEntity.properties.findIndex((p) => p.name === rel.fromProperty);
          const toPropIndex = toEntity.properties.findIndex((p) => p.name === rel.toProperty);
    
          const startX = fromEntity.x + fromEntity.width;
          const startY = fromEntity.y + 40 + fromPropIndex * 30 + 10;
          const endX = toEntity.x;
          const endY = toEntity.y + 40 + toPropIndex * 30 + 10;
    
          // Aquí cambiamos el color dependiendo de si la entidad está seleccionada
          if (selectedEntity === fromEntity || selectedEntity === toEntity) {
            ctx.strokeStyle = '#3B82F6'; // Azul si una de las entidades está seleccionada
          } else {
            ctx.strokeStyle = '#888888'; // Gris si ninguna entidad está seleccionada
          }
    
          // Dibujo de la línea
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
    
          // Dibujo de la flecha
          const angle = Math.atan2(endY - startY, endX - startX);
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-10, -5);
          ctx.lineTo(-10, 5);
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle; // Usamos el mismo color de la línea para la flecha
          ctx.fill();
          ctx.restore();
        }
      });
    
      ctx.restore();
    }

    drawEntities()

    function handleMouseDown(e: MouseEvent) {
      if (isSpacePressed) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        if (!canvas) return
        canvas.style.cursor = 'grabbing'
        return
      }

      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      const clickedEntity = entities.find(
        (entity) =>
          x >= entity.x &&
          x <= entity.x + entity.width &&
          y >= entity.y &&
          y <= entity.y + entity.height
      )

      if (clickedEntity) {
        setSelectedEntity(clickedEntity)
        setDraggedEntity(clickedEntity)
        setDragOffset({ x: x - clickedEntity.x, y: y - clickedEntity.y })
      } else {
        setSelectedEntity(null)
      }

      drawEntities()
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      if (isPanning) {
        const newPan = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }
        setPan(newPan)
        drawEntities()
        return
      }

      if (draggedEntity) {
        draggedEntity.x = x - dragOffset.x
        draggedEntity.y = y - dragOffset.y
        drawEntities()
        return
      }

      // Check for property hover
      let found = false
      for (const entity of entities) {
        if (
          x >= entity.x &&
          x <= entity.x + entity.width &&
          y >= entity.y + 30 &&
          y <= entity.y + entity.height
        ) {
          const propertyIndex = Math.floor((y - entity.y - 30) / 30)
          if (propertyIndex >= 0 && propertyIndex < entity.properties.length) {
            setHoveredProperty({ entity, propertyIndex })
            found = true
            break
          }
        }
      }

      if (!found && hoveredProperty) {
        setHoveredProperty(null)
      }

      drawEntities()
    }

    function handleMouseUp() {
      setDraggedEntity(null)
      setIsPanning(false)
      if (!canvas) return
      if (isSpacePressed) {
        canvas.style.cursor = 'grab'
      } else {
        canvas.style.cursor = 'default'
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = zoom * zoomFactor

        if (newZoom >= 0.1 && newZoom <= 5) {
          const zoomPoint = {
            x: (mouseX - pan.x) / zoom,
            y: (mouseY - pan.y) / zoom,
          }

          setPan({
            x: mouseX - zoomPoint.x * newZoom,
            y: mouseY - zoomPoint.y * newZoom,
          })

          setZoom(newZoom)
        }
      } else {
        setPan({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        })
      }

      drawEntities()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (!canvas) return
        canvas.style.cursor = 'grab'
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
        if (!canvas) return
        canvas.style.cursor = 'default'
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    entities,
    relationships,
    draggedEntity,
    zoom,
    pan,
    isSpacePressed,
    isPanning,
    hoveredProperty,
    selectedEntity,
  ])

  return canvasRef
}

function useCanvasT(entities: Entity[], relationships: Relationship[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedEntity, setDraggedEntity] = useState<Entity | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredProperty, setHoveredProperty] = useState<{
    entity: Entity;
    propertyIndex: number;
  } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawEntities() {
      if (!ctx) return;
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Primero dibujamos las relaciones (flechas)
      drawRelationships();

      // Luego dibujamos las entidades (cajas), para que las flechas queden por debajo
      entities.forEach((entity) => {
        // Entity background
        ctx.fillStyle = '#2D2D2D';
        ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

        // Selected entity border
        if (selectedEntity === entity) {
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.strokeRect(entity.x - 2, entity.y - 2, entity.width + 4, entity.height + 4);
        }

        // Entity name background
        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(entity.x, entity.y, entity.width, 30);

        // Entity name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(entity.name, entity.x + 10, entity.y + 20);

        // Properties
        ctx.font = '14px Arial';
        entity.properties.forEach((prop, i) => {
          const y = entity.y + 55 + i * 30;

          // Hovered property highlight
          if (hoveredProperty && hoveredProperty.entity === entity && hoveredProperty.propertyIndex === i) {
            ctx.fillStyle = '#444444';
            ctx.fillRect(entity.x, y - 20, entity.width, 30);
          }

          ctx.fillStyle = '#BBBBBB';
          ctx.fillText(prop.name, entity.x + 10, y);
          ctx.fillStyle = '#888888';
          ctx.fillText(prop.type, entity.x + entity.width / 2 + 10, y);
          if (prop.isPrimaryKey) {
            ctx.fillStyle = '#BBBBBB';
            ctx.font = '12px Arial';
            ctx.fillText('🔑', entity.x + entity.width - 25, y);
          }
        });
      });

      ctx.restore();
    }

    function drawRelationships() {
      relationships.forEach((rel) => {
        const fromEntity = entities.find((e) => e.name === rel.from);
        const toEntity = entities.find((e) => e.name === rel.to);
        if (fromEntity && toEntity) {
          const fromPropIndex = fromEntity.properties.findIndex((p) => p.name === rel.fromProperty);
          const toPropIndex = toEntity.properties.findIndex((p) => p.name === rel.toProperty);

          // Determinar la posición de inicio y fin de la flecha según la posición relativa de las entidades
          let startX, startY, endX, endY;

          if (fromEntity.x < toEntity.x) {
            // Si la entidad de origen está a la izquierda de la de destino
            startX = fromEntity.x + fromEntity.width; // Borde derecho de la entidad de origen
            startY = fromEntity.y + fromPropIndex * 30 + 40; // Alineado con la propiedad
            endX = toEntity.x; // Borde izquierdo de la entidad de destino
            endY = toEntity.y + toPropIndex * 30 + 40; // Alineado con la propiedad
          } else {
            // Si la entidad de origen está a la derecha de la de destino
            startX = fromEntity.x; // Borde izquierdo de la entidad de origen
            startY = fromEntity.y + fromPropIndex * 30 + 40; // Alineado con la propiedad
            endX = toEntity.x + toEntity.width; // Borde derecho de la entidad de destino
            endY = toEntity.y + toPropIndex * 30 + 40; // Alineado con la propiedad
          }
          if (!ctx) return;

          // Aquí cambiamos el color dependiendo de si la entidad está seleccionada
          if (selectedEntity === fromEntity || selectedEntity === toEntity) {
            ctx.strokeStyle = '#3B82F6'; // Azul si una de las entidades está seleccionada
          } else {
            ctx.strokeStyle = '#888888'; // Gris si ninguna entidad está seleccionada
          }

          // Dibujo de la línea
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Dibujo de la flecha
          const angle = Math.atan2(endY - startY, endX - startX);
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-10, -5);
          ctx.lineTo(-10, 5);
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle; // Usamos el mismo color de la línea para la flecha
          ctx.fill();
          ctx.restore();
        }
      });
    }

    drawEntities();

    // Event listeners remain unchanged
    // Handle mouse down, mouse move, mouse up, etc.


    function handleMouseDown(e: MouseEvent) {
      if (isSpacePressed) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        if (!canvas) return
        canvas.style.cursor = 'grabbing'
        return
      }

      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      const clickedEntity = entities.find(
        (entity) =>
          x >= entity.x &&
          x <= entity.x + entity.width &&
          y >= entity.y &&
          y <= entity.y + entity.height
      )

      if (clickedEntity) {
        setSelectedEntity(clickedEntity)
        setDraggedEntity(clickedEntity)
        setDragOffset({ x: x - clickedEntity.x, y: y - clickedEntity.y })
      } else {
        setSelectedEntity(null)
      }

      drawEntities()
    }

    function handleMouseMove(e: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      if (isPanning) {
        const newPan = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }
        setPan(newPan)
        drawEntities()
        return
      }

      if (draggedEntity) {
        draggedEntity.x = x - dragOffset.x
        draggedEntity.y = y - dragOffset.y
        drawEntities()
        return
      }

      // Check for property hover
      let found = false
      for (const entity of entities) {
        if (
          x >= entity.x &&
          x <= entity.x + entity.width &&
          y >= entity.y + 30 &&
          y <= entity.y + entity.height
        ) {
          const propertyIndex = Math.floor((y - entity.y - 30) / 30)
          if (propertyIndex >= 0 && propertyIndex < entity.properties.length) {
            setHoveredProperty({ entity, propertyIndex })
            found = true
            break
          }
        }
      }

      if (!found && hoveredProperty) {
        setHoveredProperty(null)
      }

      drawEntities()
    }

    function handleMouseUp() {
      setDraggedEntity(null)
      setIsPanning(false)
      if (!canvas) return
      if (isSpacePressed) {
        canvas.style.cursor = 'grab'
      } else {
        canvas.style.cursor = 'default'
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = zoom * zoomFactor

        if (newZoom >= 0.1 && newZoom <= 5) {
          const zoomPoint = {
            x: (mouseX - pan.x) / zoom,
            y: (mouseY - pan.y) / zoom,
          }

          setPan({
            x: mouseX - zoomPoint.x * newZoom,
            y: mouseY - zoomPoint.y * newZoom,
          })

          setZoom(newZoom)
        }
      } else {
        setPan({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        })
      }

      drawEntities()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (!canvas) return
        canvas.style.cursor = 'grab'
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
        if (!canvas) return
        canvas.style.cursor = 'default'
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
    
  }, [
    entities,
    relationships,
    draggedEntity,
    zoom,
    pan,
    isSpacePressed,
    isPanning,
    hoveredProperty,
    selectedEntity,
  ]);

  return canvasRef;
}
interface EntityVisualizerProps {
  entities: Entity[]
  relationships: Relationship[]
}

export default function EntityVisualizer({
  entities,
  relationships,
}: EntityVisualizerProps) {
  const canvasRef = useCanvasT(entities, relationships)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      // Ajustar el tamaño del canvas al tamaño del contenedor
      const resizeCanvas = () => {
        const parent = canvas.parentElement
        if (parent) {
          canvas.width = parent.clientWidth
          canvas.height = parent.clientHeight
        }
      }

      // Ajustar el tamaño al cargar la página y cuando cambie el tamaño de la ventana
      window.addEventListener('resize', resizeCanvas)
      resizeCanvas()

      return () => {
        window.removeEventListener('resize', resizeCanvas)
      }
    }
  }, [canvasRef])

  return <canvas ref={canvasRef} width={1492} height={506} className="" />
}
