export type ModeType = 'draw' | 'pan-zoom';
export type ShapeType = 'rectangle' | 'circle';
export type Severity = 'error' | 'success' | 'info' | 'warning' | undefined
export type ShapeDef = { type: ShapeType; x: number; y: number; width?: number; height?: number; radius?: number }
export type AnnotationDef = { shape: ShapeDef, organismClass: string, color: string, description: string, selected: false }
