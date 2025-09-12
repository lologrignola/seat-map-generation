# SeatMapBuilder - Editor Visual de Mapas de Asientos

Un editor visual moderno para crear y gestionar mapas de asientos con funcionalidades avanzadas de posicionamiento, rotación y etiquetado masivo.

## 🚀 Setup Breve

### Prerrequisitos
- Node.js 18+ 
- npm o pnpm

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd seat-map-generation

# Instalar dependencias
npm install
# o
pnpm install

# Ejecutar en modo desarrollo
npm run dev
# o
pnpm dev

# Abrir en el navegador
http://localhost:3000
```

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter de código

## 🏗️ Arquitectura y Decisiones Técnicas

### Stack Tecnológico
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript para type safety
- **Estilos**: Tailwind CSS + Radix UI
- **Estado**: React hooks (useState, useCallback, useEffect)
- **Persistencia**: localStorage para sesión
- **Validación**: Esquema JSON personalizado

### Decisiones de Diseño

#### 1. **Arquitectura de Componentes**
```
components/
├── seat-map-builder.tsx     # Componente principal
├── seat-map-canvas.tsx      # Canvas interactivo
├── toolbar.tsx              # Barra de herramientas
├── export-dialog.tsx        # Diálogo de exportación
├── import-dialog.tsx        # Diálogo de importación
├── batch-labeling-dialog.tsx # Etiquetado masivo
└── ui/                      # Componentes base (Radix UI)
```

#### 2. **Modelo de Datos**
```typescript
interface SeatMap {
  name: string
  rows: Row[]
  metadata?: {
    version: string
    createdAt: string
    updatedAt: string
    totalSeats: number
    totalRows: number
    features?: {
      stage: { enabled: boolean; position: {x, y}; size: {width, height} }
      rowPositioning: boolean
      rowRotation: boolean
      zoomSupport: boolean
    }
  }
}

interface Row {
  id: string
  label: string
  seats: Seat[]
  selected: boolean
  x: number        // Posición X
  y: number        // Posición Y
  rotation: number // Rotación en grados
}

interface Seat {
  id: string
  label: string
  x: number
  y: number
  selected: boolean
  type: "regular" | "accessible"
}
```

#### 3. **Interacciones del Usuario**
- **Selección**: Click en cualquier asiento selecciona toda la fila
- **Multi-selección**: Drag para seleccionar múltiples filas
- **Movimiento**: Drag de filas seleccionadas para moverlas
- **Rotación**: Botones de rotación en toolbar (5° incrementos)
- **Zoom/Pan**: Mouse wheel para zoom, Ctrl+Drag para pan
- **Etiquetado**: Editor inline en toolbar + patrones masivos

#### 4. **Sistema de Coordenadas**
- **Origen**: Esquina superior izquierda del canvas
- **Unidades**: Píxeles
- **Transformaciones**: CSS transforms para zoom y pan
- **Cálculos**: Funciones helper para conversión de coordenadas

## 📊 Esquema de Datos

### Estructura JSON de Exportación
```json
{
  "name": "Mi Mapa de Asientos",
  "rows": [
    {
      "id": "row-1234567890-0",
      "label": "Fila A",
      "x": 100,
      "y": 200,
      "rotation": 0,
      "selected": false,
      "seats": [
        {
          "id": "seat-1234567890-0-0",
          "label": "1",
          "x": 100,
          "y": 200,
          "selected": false,
          "type": "regular"
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.1",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "totalSeats": 50,
    "totalRows": 5,
    "features": {
      "stage": {
        "enabled": true,
        "position": { "x": 0, "y": 8 },
        "size": { "width": 600, "height": 120 }
      },
      "rowPositioning": true,
      "rowRotation": true,
      "zoomSupport": true
    }
  }
}
```

### Validación de Esquema
- **Campos obligatorios**: name, rows, row.id, row.label, seat.id, seat.label
- **Tipos validados**: strings, numbers, booleans, arrays
- **Valores por defecto**: x=0, y=0, rotation=0, type="regular"
- **Compatibilidad**: Versión 1.1 con metadata de características

## 🎯 Supuestos y Limitaciones

### Supuestos de Negocio
1. **Asientos por Fila**: Máximo 50 asientos por fila
2. **Filas por Mapa**: Máximo 20 filas por mapa
3. **Espaciado**: 50px fijo entre filas (no configurable)
4. **Rotación**: Incrementos de 5° para precisión
5. **Etiquetas**: Alfabéticas (A-Z) para filas, numéricas (1-N) para asientos
6. **Tipos de Asiento**: Solo "regular" y "accessible"

### Supuestos Técnicos
1. **Navegador**: Soporte para ES6+, Canvas API, localStorage
2. **Resolución**: Optimizado para pantallas 1024px+ de ancho
3. **Memoria**: Mapas con hasta 1000 asientos totales
4. **Persistencia**: Solo localStorage (no base de datos)
5. **Concurrencia**: Aplicación single-user

### Limitaciones Conocidas
1. **Performance**: No optimizado para mapas >1000 asientos
2. **Colisiones**: No detecta superposición de asientos
3. **Undo/Redo**: No implementado
4. **Templates**: No hay plantillas predefinidas
5. **Colaboración**: No hay funcionalidad multi-usuario
6. **Imágenes**: No soporte para importar planos de fondo

### Consideraciones de UX
1. **Responsive**: Toolbar fijo, canvas responsivo
2. **Accesibilidad**: Tooltips, labels semánticos, navegación por teclado
3. **Feedback**: Toast notifications, confirmaciones, estados de carga
4. **Errores**: Validación en tiempo real, mensajes descriptivos

## 🔧 Funcionalidades Implementadas

### MVP (Requerimientos Base)
- ✅ Visualización de filas y asientos
- ✅ Creación de filas (individual y múltiple)
- ✅ Selección simple y múltiple
- ✅ Etiquetado obligatorio (filas y asientos)
- ✅ Etiquetado masivo con patrones
- ✅ Exportación JSON con nombre
- ✅ Importación JSON con validación
- ✅ Flujo completo (nuevo → importar → editar → exportar)

### Funcionalidades Adicionales
- ✅ Posicionamiento libre de filas
- ✅ Rotación de filas
- ✅ Zoom y pan del canvas
- ✅ Área de escenario fija
- ✅ Persistencia de sesión
- ✅ Validación de esquema completa
- ✅ Interfaz moderna y responsiva
- ✅ Patrones de etiquetado avanzados

## 📝 Notas de Desarrollo

### Patrones de Código
- **Hooks personalizados**: Para lógica reutilizable
- **Callbacks optimizados**: useCallback para performance
- **Validación centralizada**: Esquema único para import/export
- **Estado inmutable**: Siempre crear nuevos objetos
- **Error boundaries**: Manejo graceful de errores

### Convenciones
- **Naming**: camelCase para variables, PascalCase para componentes
- **Archivos**: kebab-case para archivos de componentes
- **Tipos**: Interfaces con prefijo descriptivo
- **Props**: Props interface separada por componente

---

**Desarrollado con ❤️ usando Next.js, TypeScript y Tailwind CSS**