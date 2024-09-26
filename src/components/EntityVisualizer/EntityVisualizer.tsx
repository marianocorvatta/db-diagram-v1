import { useEffect, useRef, useState } from 'react'
import { Entity, Relationship } from '../TextEditor/TextEditor'

function useCanvas(
  entities: Entity[],
  relationships: Relationship[],
  isEditorFocused: boolean
) {
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
      if (!ctx) return
      if (!canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      // Primero dibujamos las relaciones (flechas)
      drawRelationships()

      // Luego dibujamos las entidades (cajas), para que las flechas queden por debajo
      entities.forEach((entity) => {
        // Entity background
        ctx.fillStyle = '#2D2D2D'
        ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

        // Selected entity border
        if (selectedEntity === entity) {
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 2
          ctx.strokeRect(
            entity.x - 2,
            entity.y - 2,
            entity.width + 4,
            entity.height + 4
          )
        }

        // Entity name background
        ctx.fillStyle = '#1E1E1E'
        ctx.fillRect(entity.x, entity.y, entity.width, 30)

        // Entity name
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 16px Arial'
        ctx.fillText(entity.name, entity.x + 10, entity.y + 20)

        // Properties
        ctx.font = '14px Arial'
        entity.properties.forEach((prop, i) => {
          const y = entity.y + 55 + i * 30

          // Hovered property highlight
          if (
            hoveredProperty &&
            hoveredProperty.entity === entity &&
            hoveredProperty.propertyIndex === i
          ) {
            ctx.fillStyle = '#444444'
            ctx.fillRect(entity.x, y - 20, entity.width, 30)
          }

          ctx.fillStyle = '#BBBBBB'
          ctx.fillText(prop.name, entity.x + 10, y)
          ctx.fillStyle = '#888888'
          ctx.fillText(prop.type, entity.x + entity.width / 2 + 10, y)
          if (prop.isPrimaryKey) {
            ctx.fillStyle = '#BBBBBB'
            ctx.font = '12px Arial'
            ctx.fillText('🔑', entity.x + entity.width - 25, y)
          }
        })
      })

      ctx.restore()
    }

    // function drawRelationships() {
    //   const cornerRadius = 4 // Adjust this value for the roundness of corners

    //   relationships.forEach((rel) => {
    //     const fromEntity = entities.find((e) => e.name === rel.from)
    //     const toEntity = entities.find((e) => e.name === rel.to)
    //     if (fromEntity && toEntity) {
    //       const fromPropIndex = fromEntity.properties.findIndex(
    //         (p) => p.name === rel.fromProperty
    //       )
    //       const toPropIndex = toEntity.properties.findIndex(
    //         (p) => p.name === rel.toProperty
    //       )

    //       let startX, startY, endX, endY
    //       const propertyHeight = 30
    //       const centerOffset = propertyHeight / 2

    //       // Calculate centered start and end points
    //       startY =
    //         fromEntity.y + fromPropIndex * propertyHeight + 40 + centerOffset
    //       endY = toEntity.y + toPropIndex * propertyHeight + 40 + centerOffset

    //       const horizontalOverlap =
    //         fromEntity.x < toEntity.x + toEntity.width &&
    //         toEntity.x < fromEntity.x + fromEntity.width

    //       if (horizontalOverlap) {
    //         if (fromEntity.y < toEntity.y) {
    //           startX = fromEntity.x + fromEntity.width / 2
    //           endX = toEntity.x + toEntity.width / 2
    //           startY = fromEntity.y + fromEntity.height
    //           endY = toEntity.y
    //         } else {
    //           startX = fromEntity.x + fromEntity.width / 2
    //           endX = toEntity.x + toEntity.width / 2
    //           startY = fromEntity.y
    //           endY = toEntity.y + toEntity.height
    //         }
    //       } else {
    //         if (fromEntity.x < toEntity.x) {
    //           startX = fromEntity.x + fromEntity.width // Right edge of fromEntity
    //           endX = toEntity.x // Left edge of toEntity
    //         } else {
    //           startX = fromEntity.x // Left edge of fromEntity
    //           endX = toEntity.x + toEntity.width // Right edge of toEntity
    //         }
    //       }

    //       if (!ctx) return

    //       // Set color based on selected entities
    //       ctx.strokeStyle =
    //         selectedEntity === fromEntity || selectedEntity === toEntity
    //           ? '#3B82F6'
    //           : '#888888'

    //       // Drawing lines with smooth rounded corners
    //       ctx.beginPath()
    //       ctx.moveTo(startX, startY)

    //       const midX = (startX + endX) / 2
    //       const midY = (startY + endY) / 2

    //       const curveDirectionY = startY < endY ? 1 : -1
    //       // const curveDirectionX = startX < endX ? 1 : -1

    //       if (curveDirectionY === 1) {
    //         // abajo
    //         // First horizontal segment
    //         ctx.lineTo(midX + 4, startY)

    //         // First curve with bezierCurveTo for smooth transition
    //         ctx.bezierCurveTo(midX, startY + 1, midX, startY, midX, midY)

    //         // Vertical segment
    //         ctx.lineTo(midX, endY - 4)

    //         // Second curve with bezierCurveTo
    //         ctx.bezierCurveTo(
    //           midX - 1,
    //           endY - 1,
    //           midX,
    //           endY + 1,
    //           midX - 40,
    //           endY
    //         )

    //         // Last horizontal segment
    //         ctx.lineTo(endX, endY)
    //         ctx.stroke()
    //       } else {
    //         // arriba
    //         // First horizontal segment
    //         ctx.lineTo(midX + 4, startY)

    //         // First curve with bezierCurveTo for smooth transition
    //         ctx.bezierCurveTo(midX, startY, midX, startY, midX, midY)

    //         // Vertical segment
    //         ctx.lineTo(midX, endY + 4)

    //         // Second curve with bezierCurveTo
    //         ctx.bezierCurveTo(midX, endY, midX, endY, midX - cornerRadius, endY)

    //         // Last horizontal segment
    //         ctx.lineTo(endX, endY)
    //         ctx.stroke()
    //       }

    //       // Draw cardinality symbols (optional, can adjust based on your needs)
    //       if (rel.cardinality === 'one-to-one') {
    //         drawCircle(ctx, startX, startY)
    //         drawCircle(ctx, endX, endY)
    //       } else if (rel.cardinality === 'one-to-many') {
    //         drawCircle(ctx, startX, startY)
    //         drawCrowFoot(ctx, endX, endY)
    //       } else if (rel.cardinality === 'many-to-one') {
    //         drawCrowFoot(ctx, startX, startY)
    //         drawCircle(ctx, endX, endY)
    //       } else if (rel.cardinality === 'many-to-many') {
    //         drawCrowFoot(ctx, startX, startY)
    //         drawCrowFoot(ctx, endX, endY)
    //       }
    //     }
    //   })
    // }

    function drawRelationships() {
      const cornerRadius = 4 // Ajustar este valor para el redondeo de las esquinas

      relationships.forEach((rel) => {
        const fromEntity = entities.find((e) => e.name === rel.from)
        const toEntity = entities.find((e) => e.name === rel.to)

        if (fromEntity && toEntity) {
          const fromPropIndex = fromEntity.properties.findIndex(
            (p) => p.name === rel.fromProperty
          )
          const toPropIndex = toEntity.properties.findIndex(
            (p) => p.name === rel.toProperty
          )

          // Asegurarnos de que fromPropIndex y toPropIndex son válidos
          if (fromPropIndex === -1 || toPropIndex === -1) return

          let startX: number | undefined, startY: number | undefined
          let endX: number | undefined, endY: number | undefined
          const propertyHeight = 30
          const centerOffset = propertyHeight / 2

          // Calcular puntos de inicio y fin centrados
          startY =
            fromEntity.y + fromPropIndex * propertyHeight + 40 + centerOffset
          endY = toEntity.y + toPropIndex * propertyHeight + 40 + centerOffset

          const horizontalOverlap =
            fromEntity.x < toEntity.x + toEntity.width &&
            toEntity.x < fromEntity.x + fromEntity.width

          // Condiciones para verificar si el elemento "to" está a la derecha o izquierda
          const isToRight = fromEntity.x < toEntity.x
          const isToLeft = fromEntity.x > toEntity.x

          if (horizontalOverlap) {
            // Si hay solapamiento horizontal
            if (fromEntity.y < toEntity.y) {
              startX = fromEntity.x + fromEntity.width / 2
              endX = toEntity.x + toEntity.width / 2
              startY = fromEntity.y + fromEntity.height // Parte inferior de fromEntity
              endY = toEntity.y // Parte superior de toEntity
            } else {
              startX = fromEntity.x + fromEntity.width / 2
              endX = toEntity.x + toEntity.width / 2
              startY = fromEntity.y // Parte superior de fromEntity
              endY = toEntity.y + toEntity.height // Parte inferior de toEntity
            }
          } else {
            // Sin solapamiento horizontal
            if (isToRight) {
              startX = fromEntity.x + fromEntity.width // Borde derecho de fromEntity
              endX = toEntity.x // Borde izquierdo de toEntity
            } else if (isToLeft) {
              startX = fromEntity.x // Borde izquierdo de fromEntity
              endX = toEntity.x + toEntity.width // Borde derecho de toEntity
            }
          }

          // Validar que startX, startY, endX y endY son valores definidos
          if (
            startX === undefined ||
            startY === undefined ||
            endX === undefined ||
            endY === undefined
          ) {
            return // Si alguna es undefined, salir de la función
          }

          if (!ctx) return

          // Set color based on selected entities
          ctx.strokeStyle =
            selectedEntity === fromEntity || selectedEntity === toEntity
              ? '#3B82F6'
              : '#888888'

          // Dibujo de líneas con curvas suaves
          ctx.beginPath()
          ctx.moveTo(startX, startY)

          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2

          const curveDirection = startY < endY ? 1 : -1

          if (curveDirection === 1) {
            // Para abajo
            if (isToRight) {
              ctx.lineTo(midX - cornerRadius, startY)
              ctx.bezierCurveTo(midX, startY + 1, midX, startY, midX, midY)
              ctx.lineTo(midX, endY - 4)
              ctx.bezierCurveTo(
                midX + 1,
                endY + 1,
                midX,
                endY - 1,
                midX + cornerRadius,
                endY
              )
            } else {
              ctx.lineTo(midX + cornerRadius, startY)
              ctx.bezierCurveTo(midX, startY + 1, midX, startY, midX, midY)
              ctx.lineTo(midX, endY - 4)
              ctx.bezierCurveTo(
                midX - 1,
                endY - 1,
                midX,
                endY + 1,
                midX - cornerRadius,
                endY
              )
            }
          } else {
            if (isToRight) {
              // Para arriba
              ctx.lineTo(midX + cornerRadius, startY)
              ctx.bezierCurveTo(
                midX + 8,
                startY,
                midX + 10,
                startY,
                midX + 5,
                midY
              )
              ctx.lineTo(midX, endY)
              ctx.bezierCurveTo(midX, endY, midX, endY, midX, endY)
            } else {
              // Para arriba
              ctx.lineTo(midX + cornerRadius, startY)
              ctx.bezierCurveTo(midX, startY, midX, startY, midX, midY)
              ctx.lineTo(midX, endY + 4)
              ctx.bezierCurveTo(
                midX,
                endY,
                midX,
                endY,
                midX - cornerRadius,
                endY
              )
            }
          }

          // Último segmento horizontal
          ctx.lineTo(endX, endY)
          ctx.stroke()

          // Dibujar símbolos de cardinalidad
          if (rel.cardinality === 'one-to-one') {
            drawCircle(ctx, startX, startY)
            drawCircle(ctx, endX, endY)
          } else if (rel.cardinality === 'one-to-many') {
            drawCircle(ctx, startX, startY)
            drawCrowFoot(ctx, endX, endY)
          } else if (rel.cardinality === 'many-to-one') {
            drawCrowFoot(ctx, startX, startY)
            drawCircle(ctx, endX, endY)
          } else if (rel.cardinality === 'many-to-many') {
            drawCrowFoot(ctx, startX, startY)
            drawCrowFoot(ctx, endX, endY)
          }
        }
      })
    }

    function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.stroke()
    }

    function drawCrowFoot(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 10, y - 5)
      ctx.moveTo(x, y)
      ctx.lineTo(x - 10, y + 5)
      ctx.moveTo(x, y)
      ctx.lineTo(x - 10, y)
      ctx.stroke()
    }

    drawEntities()

    // Event listeners remain unchanged
    // Handle mouse down, mouse move, mouse up, etc.

    function handleMouseDown(e: MouseEvent) {
      if (isSpacePressed && !isEditorFocused) {
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
      if (isSpacePressed && !isEditorFocused) {
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
      if (e.code === 'Space' && !isSpacePressed && !isEditorFocused) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (!canvas) return
        canvas.style.cursor = 'grab'
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space' && !isEditorFocused) {
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
    isEditorFocused,
  ])

  return canvasRef
}
interface EntityVisualizerProps {
  entities: Entity[]
  relationships: Relationship[]
  isEditorFocused: boolean
}

export default function EntityVisualizer({
  entities,
  relationships,
  isEditorFocused,
}: EntityVisualizerProps) {
  const canvasRef = useCanvas(entities, relationships, isEditorFocused)

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

  return <canvas ref={canvasRef} width={1492} height={1492} className="" />
}
