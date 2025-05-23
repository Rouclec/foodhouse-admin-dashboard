# FoodHouse Mobile App

This is the mobile application for FoodHouse, built with Expo and React Native.

## Project Architecture

### Directory Structure

```
mobile/
├── app/                    # Main application screens and navigation
├── assets/                 # Static assets (images, fonts, etc.)
├── components/            # Reusable UI components
├── styles/               # Styling files
│   ├── components/      # Component-specific styles
│   ├── (auth)/         # Authentication screen styles
│   ├── (buyer)/        # Buyer-specific screen styles
│   ├── (farmer)/       # Farmer-specific screen styles
│   └── defaultStyles.ts # Reusable styles across the app
├── locales/             # Internationalization files
│   ├── en.json         # English translations
│   └── fr.json         # French translations
├── client/             # API clients (TanStack Query)
└── utils/              # Utility functions
    ├── interceptor.ts  # API request interceptor
    └── storage.ts      # Local storage utilities
```

## Development Guidelines

### Styling Convention

The project follows a strict styling convention where each component or screen has its corresponding style file:

- For a component/screen file: `ComponentName.tsx`
- Its corresponding style file: `ComponentName.styles.ts`

Example:
```
app/
├── signup.tsx
└── styles/
    └── (auth)/
        └── signup.styles.ts
```

### Reusable Styles

Common styles that are used across multiple components should be placed in `styles/defaultStyles.ts`. This includes:
- Common colors
- Typography styles
- Layout constants
- Reusable style objects

### Internationalization

The app supports multiple languages through the `locales` directory:
- `en.json`: English translations
- `fr.json`: French translations

When adding new text to the app:
1. Add the translation key and value to both language files
2. Use the i18n utility to access translations in your components

### API Communication

API communication is handled through TanStack Query clients located in the `client` directory. Each client should:
- Be properly typed with TypeScript
- Handle its own error states
- Implement proper caching strategies

### Utility Functions

Common utility functions are stored in the `utils` directory:
- `interceptor.ts`: Handles API request/response interception
- `storage.ts`: Manages local storage operations
- Add other utility functions as needed

## Getting Started

1. Install dependencies:
```bash
make install
```

2. Start the development server:
```bash
make run
```

3. Run on iOS:
```bash
make run-ios
```

4. Run on Android:
```bash
make run-android
```

## Available Make Commands

- `make install` - Install project dependencies
- `make run` - Start the development server
- `make run-ios` - Run the app on iOS simulator
- `make run-android` - Run the app on Android emulator
- `make lint` - Run ESLint to check code quality
- `make fix-lint` - Fix ESLint issues automatically
- `make test` - Run unit tests
- `make e2e-test` - Run end-to-end tests
- `make dev-build` - Create a development build (requires PLATFORM parameter)
- `make build-and-test-android` - Build and test Android app

## Building for Production

Use the following commands to build for production:

```bash
# For development builds
make dev-build PLATFORM=ios
make dev-build PLATFORM=android

# For Android build with testing
make build-and-test-android
```

## Contributing

1. Follow the established directory structure
2. Create corresponding style files for new components/screens
3. Add translations for new text in both `en.json` and `fr.json`
4. Place reusable styles in `defaultStyles.ts`
5. Use TypeScript for all new code
6. Follow the existing code style and patterns

Use the following commands to build for production:

```bash
# For iOS
yarn build:ios

# For Android
yarn build:android
``` 