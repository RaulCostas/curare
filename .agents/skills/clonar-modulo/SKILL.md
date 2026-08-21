---
name: clonar-modulo
description: >-
  Utiliza este skill cuando el usuario te pida crear un nuevo módulo, pantalla o componente basándose en otro existente (ej. "crea el módulo X igual al módulo Y").
---

# Procedimiento para Clonar Módulos (UI y Arquitectura)

Sigue estrictamente estos pasos cuando el usuario te pida crear un nuevo módulo basándose en uno existente para garantizar consistencia visual y de código:

## 1. Fase de Análisis (¡Obligatorio antes de escribir código!)
1. Localiza los archivos del módulo base indicado por el usuario (componentes de lista, modales, formularios, servicios, etc.).
2. **Lee cuidadosamente** el código fuente de esos archivos usando tus herramientas.
3. Identifica obligatoriamente:
   - Los componentes visuales exactos que se utilizan para las tablas, paginación, formularios, inputs y modales.
   - Las clases CSS específicas aplicadas a los contenedores principales.
   - La estructura del estado de React (cómo abre/cierra el modal, cómo carga la data).
   - Los "imports" ubicados en la parte superior del archivo.

## 2. Fase de Construcción
1. Crea los nuevos archivos manteniendo **exactamente** la misma estructura que el módulo base.
2. Construye los nuevos componentes como un espejo del módulo base, reemplazando únicamente la lógica de negocio y las variables (por ejemplo, cambiar `Paciente` por `Doctor`, o `fetchPacientes` por `fetchDoctores`).
3. **Regla de Oro de UI:** Tu código final debe garantizar que el nuevo modal, la tabla, los botones y la paginación se vean **idénticos** al módulo de referencia. NO utilices etiquetas HTML genéricas (`<table>`, `<input>`) si el módulo base utiliza componentes personalizados.

## 3. Verificación
1. Revisa tu propio código para asegurar que no omitiste clases CSS importantes del molde original.
2. Notifica al usuario indicando que el módulo se clonó manteniendo estrictamente la interfaz del módulo base.
