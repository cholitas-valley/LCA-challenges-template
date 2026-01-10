/**
 * DesignerCanvas Component
 *
 * Interactive SVG canvas that renders plants at their stored positions
 * with support for drag-and-drop repositioning in edit mode.
 *
 * @example
 * ```tsx
 * <DesignerCanvas
 *   plants={plants}
 *   editMode={true}
 *   onPositionChange={(id, x, y) => updatePosition(id, x, y)}
 *   onPlantClick={(id) => navigate('/plants/' + id)}
 *   gridSize={16}
 * />
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Plant, PlantPosition } from '../../types/plant';
import { PlantIcon } from './PlantIcon';
import { PlantTooltip } from './PlantTooltip';
import { getPlantStatus, PlantStatusType } from '../../utils/plantStatus';
import { cn } from '../../lib/cn';

export interface DesignerCanvasProps {
  /** Plants with position data to render on canvas */
  plants: Plant[];
  /** Enable drag-and-drop repositioning */
  editMode: boolean;
  /** Callback when plant position changes (after drag ends) */
  onPositionChange?: (plantId: string, x: number, y: number) => void;
  /** Callback when plant is clicked (not dragged) */
  onPlantClick?: (plantId: string) => void;
  /** Callback when plant is dropped from sidebar */
  onDrop?: (plantId: string, x: number, y: number) => void;
  /** Snap-to-grid size in pixels. Set to 0 to disable. */
  gridSize?: number;
  /** Additional CSS classes */
  className?: string;
}

interface PlantMarkerProps {
  plant: Plant;
  editMode: boolean;
  gridSize: number;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

/**
 * Snap a value to the nearest grid point.
 */
function snapToGrid(value: number, gridSize: number): number {
  if (gridSize === 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Convert mouse event coordinates to SVG coordinates.
 */
function getSVGPoint(
  event: MouseEvent | React.MouseEvent,
  svg: SVGSVGElement
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());
  return { x: transformed.x, y: transformed.y };
}

/**
 * Status color map using semantic tokens.
 */
const statusColors: Record<PlantStatusType, string> = {
  online: '#22c55e', // status-success
  warning: '#eab308', // status-warning
  critical: '#ef4444', // status-error
  offline: '#9ca3af', // status-neutral
};

/**
 * StatusDot sub-component for plant health indicator.
 */
interface StatusDotProps {
  status: PlantStatusType;
  x: number;
  y: number;
}

function StatusDot({ status, x, y }: StatusDotProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={5}
      fill={statusColors[status]}
      stroke="white"
      strokeWidth={1.5}
      data-testid="status-dot"
      data-status={status}
    />
  );
}

/**
 * Calculate tooltip position to avoid canvas overflow.
 */
function calculateTooltipPosition(
  plantX: number,
  plantY: number,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): { x: number; y: number } {
  const tooltipWidth = 180;
  const tooltipHeight = 160;

  let x = 30; // Default: right of plant
  let y = -60; // Default: above center

  // Adjust if near right edge
  if (plantX + x + tooltipWidth > canvasWidth - 20) {
    x = -(tooltipWidth + 10); // Show to left
  }

  // Adjust if near top edge
  if (plantY + y < 20) {
    y = 30; // Show below
  }

  // Adjust if near bottom edge
  if (plantY + y + tooltipHeight > canvasHeight - 20) {
    y = -(tooltipHeight + 10);
  }

  return { x, y };
}

/**
 * PlantMarker sub-component for rendering individual plants on the canvas.
 */
function PlantMarker({
  plant,
  editMode,
  gridSize,
  onDragEnd,
  onClick,
  svgRef,
}: PlantMarkerProps) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState<PlantPosition>(
    plant.position ?? { x: 100, y: 100 }
  );
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Get plant status for indicator and styling
  const status = getPlantStatus(plant);
  const isOffline = status === 'offline';

  // Sync position with plant prop when not dragging
  useEffect(() => {
    if (!dragging && plant.position) {
      setPosition(plant.position);
    }
  }, [plant.position, dragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();

      const svg = svgRef.current;
      if (!svg) return;

      const point = getSVGPoint(e, svg);
      dragStartRef.current = {
        x: point.x - position.x,
        y: point.y - position.y,
      };
      hasDraggedRef.current = false;
      setDragging(true);
    },
    [editMode, position, svgRef]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg || !dragStartRef.current) return;

      const point = getSVGPoint(e, svg);
      let newX = point.x - dragStartRef.current.x;
      let newY = point.y - dragStartRef.current.y;

      // Clamp to canvas bounds (800x600 viewBox)
      newX = Math.max(24, Math.min(776, newX));
      newY = Math.max(24, Math.min(576, newY));

      // Apply grid snapping
      newX = snapToGrid(newX, gridSize);
      newY = snapToGrid(newY, gridSize);

      hasDraggedRef.current = true;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDragging(false);
      dragStartRef.current = null;
      if (hasDraggedRef.current) {
        onDragEnd(position.x, position.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, gridSize, onDragEnd, position, svgRef]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasDraggedRef.current) {
        // Was a drag, not a click
        hasDraggedRef.current = false;
        return;
      }
      e.stopPropagation();
      onClick();
    },
    [onClick]
  );

  const cursor = editMode ? (dragging ? 'grabbing' : 'grab') : 'pointer';

  // Calculate tooltip position to avoid overflow
  const tooltipPos = calculateTooltipPosition(position.x, position.y);

  return (
    <g
      transform={'translate(' + position.x + ', ' + position.y + ')'}
      style={{ cursor, opacity: isOffline ? 0.5 : 1 }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      aria-label={plant.name + (editMode ? ' (drag to reposition)' : '')}
      tabIndex={0}
    >
      {/* Plant icon centered at position */}
      <foreignObject x={-24} y={-24} width={48} height={48}>
        <PlantIcon
          species={plant.species ?? 'unknown'}
          size={48}
          className={cn('text-gray-700', isOffline && 'text-gray-400')}
        />
      </foreignObject>

      {/* Status dot (bottom-right of icon) */}
      <StatusDot status={status} x={18} y={18} />

      {/* Name label below icon */}
      <text
        x={0}
        y={36}
        textAnchor="middle"
        className="text-xs fill-gray-600"
        style={{ fontSize: '10px', fontFamily: 'system-ui, sans-serif' }}
      >
        {plant.name}
      </text>

      {/* Tooltip on hover */}
      <PlantTooltip plant={plant} visible={hovered} position={tooltipPos} />
    </g>
  );
}

/**
 * DesignerCanvas component for rendering and managing plant positions.
 */
export function DesignerCanvas({
  plants,
  editMode,
  onPositionChange,
  onPlantClick,
  onDrop,
  gridSize = 16,
  className,
}: DesignerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter plants that have position data
  const positionedPlants = plants.filter((p) => p.position !== null);

  /**
   * Handle drop from sidebar - calculate position relative to SVG.
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const plantId = e.dataTransfer.getData('plantId');
      if (!plantId || !onDrop) return;

      const svg = svgRef.current;
      if (!svg) return;

      // Get SVG coordinates from mouse position
      const rect = svg.getBoundingClientRect();
      const scaleX = 800 / rect.width;
      const scaleY = 600 / rect.height;

      let x = (e.clientX - rect.left) * scaleX;
      let y = (e.clientY - rect.top) * scaleY;

      // Clamp to canvas bounds
      x = Math.max(24, Math.min(776, x));
      y = Math.max(24, Math.min(576, y));

      // Snap to grid
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);

      onDrop(plantId, x, y);
    },
    [onDrop, gridSize]
  );

  /**
   * Allow drop by preventing default on dragover.
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid meet"
      className={'w-full h-auto max-h-[600px] border border-gray-200 bg-white ' + (className ?? '')}
      role="img"
      aria-label="Designer canvas showing plant positions"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid pattern */}
      <defs>
        <pattern
          id="designer-grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={'M ' + gridSize + ' 0 L 0 0 0 ' + gridSize}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#designer-grid)" />

      {/* Render plants */}
      {positionedPlants.map((plant) => (
        <PlantMarker
          key={plant.id}
          plant={plant}
          editMode={editMode}
          gridSize={gridSize}
          onDragEnd={(x, y) => onPositionChange?.(plant.id, x, y)}
          onClick={() => onPlantClick?.(plant.id)}
          svgRef={svgRef}
        />
      ))}
    </svg>
  );
}
