# Project Context and Coding Standards

This document provides the context and coding standards for the project. As a developer, you are expected to adhere to best practices, write code and documentation in English, and create modular, responsive, and reusable components. We are using Tailwind CSS version 4 to ensure a consistent and efficient styling framework.

## Coding Standards

- **Language:**  
  All code and documentation must be written in English.

- **Modularity:**  
  Write code in a modular fashion. Break down features into small, reusable components or modules that can be easily maintained and extended.

- **Responsiveness:**  
  Ensure that the application is fully responsive. Use Tailwind CSS utilities to build layouts that adapt seamlessly across different devices and screen sizes.

- **Reusability:**  
  Prioritize code reusability. Create generic components and functions that can be used in various parts of the application to reduce redundancy.

- **Documentation:**  
  Document your code thoroughly. Provide clear and concise comments and maintain a well-structured README or additional documentation as needed.

## Technology Stack

- **Frontend:**  
  - HTML, CSS, and JavaScript (or frameworks like React/Vue as applicable)  
  - Tailwind CSS 4 for styling and responsive design

- **Backend:**  
  - Node.js with Express (if applicable)

- **Version Control:**  
  - Git for source control and collaboration

## Guidelines

1. **Code Quality:**  
   - Write clean, maintainable, and well-documented code.
   - Follow industry best practices and design patterns.

2. **Modular Design:**  
   - Create components that encapsulate functionality.
   - Use component-based architectures to ensure easy maintenance and scalability.

3. **Responsive Design:**  
   - Utilize Tailwind CSS to design responsive UIs.
   - Test the application across multiple devices and browsers.

4. **Reusability:**  
   - Develop generic components that can be reused across different parts of the application.
   - Avoid code duplication by creating utility functions and shared modules.

5. **Commit Messages:**  
   - Use clear, descriptive commit messages that explain the changes and why they were made.

## Example Reusable Component (Button)

Below is an example of a reusable button component using Tailwind CSS 4:

```html
<!-- Reusable Button Component -->
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300">
  Click Me
</button>


project-root/
├── node_modules/
├── public/
│   ├── index.html           # HTML principal
│   └── assets/              # Recursos públicos (imágenes, íconos, etc.)
│       ├── images/
│       └── icons/
├── src/
│   ├── assets/              # Recursos propios del proyecto (imágenes, fuentes, etc.)
│   │   ├── images/
│   │   └── icons/
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # Componentes comunes (botones, inputs, etc.)
│   │   │   ├── Button.jsx
│   │   │   └── Input.jsx
│   │   ├── layout/          # Componentes de layout (Header, Footer, Sidebar)
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/              # Componentes de UI específicos (Card, Modal, etc.)
│   │       ├── Card.jsx
│   │       └── Modal.jsx
│   ├── hooks/               # Custom hooks para encapsular lógica reutilizable
│   │   └── useAuth.js
│   ├── pages/               # Vistas o páginas de la aplicación
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── routes/              # Definición de rutas y navegación
│   │   └── AppRoutes.jsx
│   ├── services/            # Servicios para interactuar con APIs (peticiones HTTP)
│   │   └── api.js
│   ├── utils/               # Funciones y utilidades generales (helpers, validaciones, etc.)
│   │   └── helpers.js
│   ├── App.jsx              # Componente raíz de la aplicación
│   ├── main.jsx             # Punto de entrada de React (renderizado en el DOM)
│   └── index.css            # Archivo CSS principal, incluyendo las directivas de Tailwind
├── tailwind.config.js       # Configuración de Tailwind CSS 4
├── vite.config.js           # Configuración de Vite
├── package.json             # Dependencias y scripts del proyecto
└── README.md                # Documentación del proyecto
