# Coloretto - Juego de Cartas Multijugador en Tiempo Real

> **Estrategia, riesgo y colección.** Reúne cartas de colores estratégicamente para sumar la mayor cantidad de puntos. ¡Compite, planea y gana!

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Bundler-purple?logo=vite)
![Socket.io](https://img.shields.io/badge/Socket.io-RealTime-black?logo=socket.io)
![Zustand](https://img.shields.io/badge/State-Zustand-orange)

---

## Demo en Vivo y Acceso Rápido

Prueba la aplicación directamente en producción sin instalar nada:

👉 **[Jugar ahora](https://coloretto.vercel.app)**

### Credenciales de Prueba

Para facilitar el acceso, se habilita una cuenta de test:

| Campo          | Valor      |
| :------------- | :--------- |
| **Usuario**    | `Prueba`   |
| **Contraseña** | `Prueba1.` |

---

## Stack Tecnológico

Este proyecto ha sido desarrollado utilizando las últimas tecnologías del ecosistema React, priorizando el rendimiento y la experiencia de usuario en tiempo real.

### Core & Arquitectura

- **React & React DOM**: Última versión estable para renderizado eficiente.
- **TypeScript**: Tipado estático para un código robusto y escalable.
- **Vite (Rolldown)**: Entorno de desarrollo rápido y optimización de build.

### Estado & Comunicación

- **Zustand**: Gestión de estado global ligero y escalable.
- **Socket.io-client**: Comunicación bidireccional en tiempo real para el sistema de juego y chat.
- **Axios**: Cliente HTTP para peticiones a la API REST.

### UI & UX

- **React Router DOM v7**: Enrutamiento dinámico y protegido.
- **Swiper**: Carruseles táctiles para la interfaz de juego.
- **React Hook Form**: Gestión eficiente de formularios y validaciones.
- **Driver.js**: Guías interactivas para el tutorial de usuario.
- **Notificaciones**: Feedback visual mediante `react-hot-toast`.

### Calidad & Testing

- **Playwright**: Tests End-to-End (E2E) para asegurar flujos críticos.
- **ESLint & TypeScript-ESLint**: Linter para mantener la calidad del código.

---

## Mapa de la Aplicación

Una vez iniciada la sesión, tendrás acceso a las siguientes secciones:

- **Inicio**: Dashboard principal y bienvenida.
- **Jugar**: El núcleo de la aplicación.
  - Unirse a partidas existentes o crear salas privadas.
  - **Chat In-Game**: Comunicación exclusiva con tus rivales de mesa.
- **Chat Global**: Sala común para hablar con todos los usuarios conectados.
- **Mi Perfil**: Gestión de datos personales y estadísticas.
- **Tutorial**: Guía interactiva de una partida como ejemplo.
- **Logout**: Cierre de sesión seguro.

---

## 💻 Instalación y Despliegue Local

Si deseas correr el proyecto en tu máquina local:

1. **Clonar el repositorio**

```bash
   git clone [https://github.com/TU_USUARIO/coloretto-frontend.git](https://github.com/TU_USUARIO/coloretto-frontend.git)
   cd coloretto-frontend
```

2. **Instalar dependencias**

```bash
  pnpm install
```

3. **Variables de Entorno**
   Crea un archivo .env en la raíz (puedes basarte en .env.example si existe) y configura la URL del backend:

4. **Ejecutar en desarrollo: build de producción y previsualización:**

```bash
pnpm dev
pnpm run build
pnpm run preview
```
