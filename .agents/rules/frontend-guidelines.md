# Reglas de Desarrollo Frontend (React)

## Estilo de Código
- **Componentes:** Utiliza siempre funciones flecha (`const Component = () => {}`) en lugar de `function Component() {}` para los componentes de React.
- **Estilos:** No utilices estilos en línea (`style={{}}`). Utiliza siempre clases CSS o la librería de estilos configurada en el proyecto.
- **Tipado:** Asegúrate de tipar siempre las *props* de los componentes usando interfaces de TypeScript, nunca uses `any`.

## Manejo de Estado
- Para estados simples, usa `useState`. 
- Si el estado requiere lógica compleja o maneja múltiples sub-valores, prefiere `useReducer`.
