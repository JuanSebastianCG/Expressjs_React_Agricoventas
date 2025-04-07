# Agricoventas - Authentication and Home Pages

This document provides specific instructions for the Login, Register, and Home page components of the Agricoventas project.

## Overview

The authentication and home pages are built using:

- React 19 with TypeScript
- Vite as the build tool
- Tailwind CSS 4 for styling
- Custom hooks for form handling and validation

## Features

### Home Page
- Responsive hero section with call-to-action buttons
- Feature highlights with interactive cards
- Product showcase with sample items
- User testimonials
- Call-to-action section for user registration

### Login Page
- Email and password form with validation
- "Remember me" functionality
- Form validation for required fields and email format
- Error message display for failed login attempts
- Link to registration page

### Register Page
- Complete registration form (username, email, password)
- Password matching validation
- Terms and conditions acceptance
- Success state feedback
- Link to login page

## Implementation Details

### Form Validation
All forms use the custom `useForm` hook that provides:
- Field validation
- Error message handling
- Form submission logic
- Field touch state tracking

### Responsive Design
All pages are designed to be fully responsive across:
- Mobile devices
- Tablets
- Desktop screens

## Running the Project

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and go to `http://localhost:5173`

## Navigation

- The app implements a simple client-side navigation system
- Links between pages work without full page reloads
- The URL changes to reflect the current page

## Testing Authentication

The authentication system is currently mocked:
- Login will simulate a successful login after 1 second
- Register will show a success message after 1 second
- No actual API calls are made yet

## Next Steps

1. Connect the authentication forms to a real backend API
2. Implement proper token-based authentication
3. Add protected routes for authenticated users
4. Create user profile pages and settings

## File Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx  - Reusable button component
│   │   └── Input.tsx   - Form input component with validation
│   └── layout/
│       ├── Header.tsx  - App header with navigation
│       └── Footer.tsx  - App footer with links
├── pages/
│   ├── Home.tsx        - Landing page component
│   ├── Login.tsx       - User login page
│   └── Register.tsx    - User registration page
├── hooks/
│   └── useForm.ts      - Custom form handling hook
└── context/
    └── AppContext.tsx  - Authentication state context
``` 