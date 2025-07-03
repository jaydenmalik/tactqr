# Tact - Secure Notes Vault

A complete Svelte 5 monorepo for a privacy-first, offline notes application with encrypted QR code export/import functionality.

## 🏗️ Architecture Overview

This is a **completely offline** notes application where:
- **No backend required** - All data stored in localStorage
- **Privacy-first** - Your notes never leave your device
- **Encrypted backups** - Export your data as password-protected QR codes
- **Modular design** - Clean separation between UI, business logic, and data layers

## 📁 Project Structure

```
tact/
├── apps/
│   └── web/                 # SvelteKit 5 main application
├── packages/
│   ├── core/               # Pure TypeScript domain logic & types
│   ├── data/               # Data layer with localStorage + crypto
│   ├── ui/                 # Headless Svelte components
│   └── design/             # Tailwind theme + design tokens
└── pnpm-workspace.yaml     # Monorepo configuration
```

## 🎯 Key Features

### ✅ Core Domain Layer (`packages/core`)
- **Type-safe domain models**: User, Note, Tag
- **Pure business logic**: Note management, tag filtering, search
- **Fully tested**: Unit tests with Vitest
- **Zero dependencies**: Pure TypeScript, no external libs

### ✅ Data Layer (`packages/data`)
- **localStorage repositories**: Full CRUD operations for notes and tags
- **Encryption utilities**: AES-GCM encryption with PBKDF2 key derivation
- **Compression**: Gzip compression for efficient QR codes
- **QR code generation**: Export data as encrypted QR images
- **Import/Export**: Complete data portability system

### ✅ Design System (`packages/design`)
- **Tailwind configuration**: CSS variables for seamless theming
- **Design tokens**: Comprehensive color, spacing, and typography scales
- **Dark/light themes**: Smooth theme switching with persistence
- **Animations**: Subtle motion design with CSS keyframes

### ✅ UI Components (`packages/ui`)
- **Svelte 5 components**: Modern components with runes
- **Accessibility-first**: ARIA attributes, focus management, keyboard navigation
- **Type-safe**: Full TypeScript support with proper prop interfaces
- **Headless design**: Flexible styling with Tailwind classes

### ✅ Web Application (`apps/web`)
- **SvelteKit 5**: Latest Svelte with runes and modern patterns
- **Notes management**: Complete note creation, editing, and organization
- **Tag system**: Powerful tagging and filtering capabilities
- **Theme integration**: Seamless dark/light mode throughout the app
- **Responsive design**: Mobile-first approach with beautiful UI
- **QR Export/Import**: Encrypted backup and restore functionality

## 🔐 Privacy & Security

### Encryption Details
- **Algorithm**: AES-GCM with 256-bit keys
- **Key derivation**: PBKDF2 with 100,000 iterations
- **Random salts**: Unique salt per encryption
- **No key storage**: Keys derived from user passwords only

### Data Flow
1. **Create**: User creates notes → Stored in localStorage
2. **Export**: Data → JSON → Compress → Encrypt → QR Code
3. **Import**: QR Code → Decrypt → Decompress → JSON → Merge into localStorage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

```bash
# Clone and install dependencies
git clone <your-repo>
cd tact
pnpm install

# Start development server
pnpm dev
```

### First Run
1. Visit `http://localhost:5173`
2. Start creating notes immediately
3. Use tags to organize your notes
4. Try the "Export" feature to generate encrypted QR codes
5. Toggle between light/dark themes

**Note**: This is a fully functional app! All features work completely offline.

## 📦 Package Details

### `@tact/core` - Domain Logic
- **Types**: All domain interfaces and types
- **Services**: Pure functions for note management and filtering
- **Testing**: Comprehensive unit test suite
- **Usage**: `import { Note, Tag } from '@tact/core'`

### `@tact/data` - Data & Crypto Layer
- **Repositories**: CRUD operations for notes and tags
- **Encryption**: Password-based encryption utilities
- **Export/Import**: QR code generation and parsing
- **Usage**: `import { createNote, exportUserData } from '@tact/data'`

### `@tact/web` - SvelteKit App
- **Framework**: SvelteKit 5 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Features**: Complete notes management interface

## 🛠️ Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript checking

# Package-specific
pnpm --filter @tact/core test
pnpm --filter @tact/web dev
```

## 🎨 Features

### ✅ **COMPLETED** - Core Application
- [x] Complete monorepo structure
- [x] Note creation and editing
- [x] Tag system with filtering
- [x] Search functionality
- [x] Grid layout with customizable columns
- [x] Sorting (by date created/updated)
- [x] Word count tracking
- [x] Emoji support for notes
- [x] Dark/light theme switching
- [x] QR code export/import
- [x] Print functionality for QR codes
- [x] PNG export for QR codes
- [x] Individual note pages
- [x] Auto-save functionality
- [x] Responsive design

## 🔄 Data Export/Import Flow

### Export Process
```typescript
import { exportUserData } from '@tact/data/export';

// Creates encrypted QR code
const qrCodeDataURL = await exportUserData(userId, 'your-password');
// Use qrCodeDataURL as src for an <img> tag
```

### Import Process
```typescript
import { importUserData, mergeImportedData } from '@tact/data/export';

// Decrypt QR code data
const exportData = await importUserData(encryptedData, 'your-password');
// Merge into local storage
mergeImportedData(exportData);
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the architecture**: Keep domain logic pure, UI components headless
4. **Add tests**: Especially for core business logic
5. **Update documentation**: Keep README current

## 📄 License

MIT License - Build amazing note-taking apps! 

## 🎯 Philosophy

This application demonstrates:
- **Privacy by design**: No data ever leaves the user's device
- **Progressive enhancement**: Works offline, enhances with features
- **Modular architecture**: Easy to understand, test, and extend
- **User ownership**: Users fully control their data with encryption keys

---

## 🏆 **What We've Built**

A **complete, production-ready** secure notes application:

✨ **Fully Functional Features**
- Complete note management system that works offline
- Beautiful, accessible UI with dark/light themes  
- Encrypted QR code export/import system
- Professional monorepo architecture
- Type-safe throughout with comprehensive features

🚀 **Ready for Use**
- Clean, intuitive interface for note-taking
- Powerful tag-based organization
- Secure backup and restore via QR codes
- Modern Svelte 5 with the latest patterns

🎯 **Getting Started**
```bash
# Install and start the app
pnpm install
pnpm dev

# Open http://localhost:5173 and start taking notes!
```

Your **offline-first, privacy-focused notes vault** with encrypted QR backups is ready to use! 

*Secure note-taking, your way! 🔐* 