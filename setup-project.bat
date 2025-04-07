@echo off
REM ============================================================
REM Script para crear un proyecto Vite "tracty" con Tailwind CSS 4
REM ============================================================

REM 1. Crear el proyecto Vite con plantilla React (usando el nombre "frontend")
npm create vite@latest frontend --template react

cd frontend

REM 2. Instalar dependencias del proyecto
npm install

REM 3. Instalar Tailwind CSS y sus dependencias (usa @latest para forzar la versión v4 si está disponible)
npm install -D tailwindcss@latest postcss autoprefixer

REM 4. Inicializar la configuración de Tailwind (genera tailwind.config.js y postcss.config.js)
npx tailwindcss init -p

REM 5. Crear la estructura de directorios requerida

REM Directorios en public
mkdir public\assets\images
mkdir public\assets\icons

REM Directorios en src
mkdir src\assets\images
mkdir src\assets\icons

mkdir src\components\common
mkdir src\components\layout
mkdir src\components\ui

mkdir src\hooks
mkdir src\pages
mkdir src\routes
mkdir src\services
mkdir src\utils

REM 6. Crear archivos de ejemplo con contenido básico

REM Archivo: src\components\common\Button.jsx
echo import React from "react"; > src\components\common\Button.jsx
echo. >> src\components\common\Button.jsx
echo const Button = ({children, ...props}) => { >> src\components\common\Button.jsx
echo    return <button {...props}>{children}</button>; >> src\components\common\Button.jsx
echo }; >> src\components\common\Button.jsx
echo export default Button; >> src\components\common\Button.jsx

REM Archivo: src\components\common\Input.jsx
echo import React from "react"; > src\components\common\Input.jsx
echo const Input = (props) => <input {...props} />; >> src\components\common\Input.jsx
echo export default Input; >> src\components\common\Input.jsx

REM Archivo: src\components\layout\Header.jsx
echo import React from "react"; > src\components\layout\Header.jsx
echo const Header = () => <header>Header</header>; >> src\components\layout\Header.jsx
echo export default Header; >> src\components\layout\Header.jsx

REM Archivo: src\components\layout\Footer.jsx
echo import React from "react"; > src\components\layout\Footer.jsx
echo const Footer = () => <footer>Footer</footer>; >> src\components\layout\Footer.jsx
echo export default Footer; >> src\components\layout\Footer.jsx

REM Archivo: src\components\layout\Sidebar.jsx
echo import React from "react"; > src\components\layout\Sidebar.jsx
echo const Sidebar = () => <aside>Sidebar</aside>; >> src\components\layout\Sidebar.jsx
echo export default Sidebar; >> src\components\layout\Sidebar.jsx

REM Archivo: src\components\ui\Card.jsx
echo import React from "react"; > src\components\ui\Card.jsx
echo const Card = ({children}) => <div className="card">{children}</div>; >> src\components\ui\Card.jsx
echo export default Card; >> src\components\ui\Card.jsx

REM Archivo: src\components\ui\Modal.jsx
echo import React from "react"; > src\components\ui\Modal.jsx
echo const Modal = ({isOpen, children}) => { >> src\components\ui\Modal.jsx
echo    if (!isOpen) return null; >> src\components\ui\Modal.jsx
echo    return <div className="modal">{children}</div>; >> src\components\ui\Modal.jsx
echo }; >> src\components\ui\Modal.jsx
echo export default Modal; >> src\components\ui\Modal.jsx

REM Archivo: src\hooks\useAuth.js
echo // Custom hook for authentication > src\hooks\useAuth.js

REM Archivo: src\pages\Home.jsx
echo import React from "react"; > src\pages\Home.jsx
echo const Home = () => <div>Home Page</div>; >> src\pages\Home.jsx
echo export default Home; >> src\pages\Home.jsx

REM Archivo: src\pages\Login.jsx
echo import React from "react"; > src\pages\Login.jsx
echo const Login = () => <div>Login Page</div>; >> src\pages\Login.jsx
echo export default Login; >> src\pages\Login.jsx

REM Archivo: src\pages\Dashboard.jsx
echo import React from "react"; > src\pages\Dashboard.jsx
echo const Dashboard = () => <div>Dashboard</div>; >> src\pages\Dashboard.jsx
echo export default Dashboard; >> src\pages\Dashboard.jsx

REM Archivo: src\routes\AppRoutes.jsx
echo import React from "react"; > src\routes\AppRoutes.jsx
echo const AppRoutes = () => <div>Routes</div>; >> src\routes\AppRoutes.jsx
echo export default AppRoutes; >> src\routes\AppRoutes.jsx

REM Archivo: src\services\api.js
echo // API service configuration > src\services\api.js

REM Archivo: src\utils\helpers.js
echo // Helper functions > src\utils\helpers.js

REM 7. Incluir directivas de Tailwind en src/index.css (asegúrate de que no dupliquen contenido importante)
echo @tailwind base; >> src\index.css
echo @tailwind components; >> src\index.css
echo @tailwind utilities; >> src\index.css

REM Mensaje final (para que el CMD no se cierre de inmediato)
echo.
echo Proyecto "frontend" creado con exito. ¡Ahora a codear sin rodeos y con humor ágil!
pause
