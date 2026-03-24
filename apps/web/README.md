# Muse Web Application

A modern web application built with TypeScript, React, Vite, and Tailwind CSS for the Muse AI Art Marketplace.

## Features

- ⚡ **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- ⚛️ **React 18** - Modern React with hooks
- 🚀 **Vite** - Fast development and building
- 🔍 **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## Project Structure

```
apps/web/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── .eslintrc.cjs        # ESLint configuration
```

## Usage

This application provides a foundation for building the Muse AI Art Marketplace web interface. The current implementation includes:

- A responsive layout using Tailwind CSS
- Interactive components demonstrating React hooks
- TypeScript for type safety
- Development hot-reload with Vite

## Development

When making changes:

1. Use TypeScript for all new components
2. Follow Tailwind CSS utility-first approach for styling
3. Run `npm run lint` before committing changes
4. Use `npm run type-check` to verify TypeScript types

## Integration

This web app is part of the Muse monorepo and can be run alongside other applications:

```bash
# Run all applications together
npm run dev

# Run only the web app
npm run dev:web
```
