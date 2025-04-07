# React + Vite + Tailwind CSS 4 Project

This project is a modern frontend application built with React, Vite, and Tailwind CSS 4. It follows best practices for code organization, component reusability, and responsive design.

## Features

- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS 4** for utility-first styling
- Modular architecture with reusable components
- Responsive design that works across devices
- Custom hooks for common functionality
- Context API for global state management
- Consistent styling using a custom color palette

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Project-specific assets (images, fonts)
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Basic UI components (Button, Input, etc.)
│   │   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   │   └── ui/              # Complex UI components
│   ├── context/             # React Context for global state
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Full page components
│   ├── services/            # API and external service integrations
│   ├── utils/               # Utility functions and helpers
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles and Tailwind directives
├── .gitignore
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm 8.x or newer

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production-ready app
- `npm run lint` - Run ESLint to check for issues
- `npm run preview` - Preview the production build locally

## Component Examples

### Button Component

The Button component demonstrates several key principles:

- Variants based on the global color palette
- Multiple size options
- Full-width capability
- Accessibility support

```tsx
<Button variant="primary" size="md">Click Me</Button>
<Button variant="success" size="lg" fullWidth>Submit</Button>
```

### Layout Components

The layout system uses a combination of:

- `Header` for the top navigation bar
- `Footer` for the page footer
- `Sidebar` for navigation (collapsible)
- `MainLayout` which combines these components

```tsx
<MainLayout title="Dashboard" showSidebar>
  {/* Page content */}
</MainLayout>
```

## Customization

### Tailwind Theme

The Tailwind configuration is in `tailwind.config.js` and includes custom colors that can be used throughout the application.

### Adding New Components

1. Create a new file in the appropriate directory
2. Use the existing components as a pattern
3. Follow the project's TypeScript and styling conventions

## Contributing

1. Ensure you follow the code style of the project
2. Write meaningful commit messages
3. Document new components and features
4. Test across different screen sizes for responsive design

## License

This project is licensed under the MIT License.
