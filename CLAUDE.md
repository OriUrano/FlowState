# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowState is a mobile-first Progressive Web App (PWA) designed for people with ADHD to manage routines, deadlines, events, and goals. The app prioritizes simplicity, reduced cognitive load, and mobile accessibility.

## Development Commands

- `npm run dev` - Start development server (should already be running - notify user if not)
- `npm run build` - Build for production (static site)
- `npm run preview` - Preview production build locally
- `npm run check` - Run TypeScript and Svelte checks
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting with Prettier

## Architecture Overview

### PWA Configuration

- Uses `@sveltejs/adapter-static` for static deployment
- All routes prerendered (`+layout.ts`: `prerender = true`, `ssr = false`)
- PWA manifest at `static/manifest.json` with mobile app configuration
- Designed for offline-first usage with localStorage persistence

### State Management Pattern

The app uses a custom Svelte store pattern for data persistence:

- Stores are located in `src/lib/stores/`
- Each store handles its own localStorage synchronization
- Store methods automatically persist data when browser environment is available
- Uses `browser` check from `$app/environment` to prevent SSR issues

### Data Storage

- **Current**: localStorage with key prefix `flowstate-*`
- **Future**: Backend integration planned (stores designed for easy migration)
- All data operations are wrapped in browser checks for SSR compatibility

### UI Architecture

- **Mobile-first design** with bottom navigation pattern
- **Component structure**:
  - `src/lib/components/` - Reusable UI components
  - `src/routes/+layout.svelte` - App shell with header and bottom nav
  - Individual route pages import specific feature components
- **Styling**: Tailwind CSS with ADHD-friendly optimizations in `src/app.css`
- **Icons**: Lucide Svelte for consistency
- **Navigation**: Bottom tab bar (currently only Routines implemented, others planned)

### ADHD-Specific Design Considerations

- Large touch targets (44px minimum)
- High contrast colors and clear visual hierarchy
- Reduced motion support via CSS media queries
- Simple, card-based layouts to minimize cognitive load
- Clear focus states for accessibility

### Current Feature Implementation

**Routines Module** (fully implemented):

- CRUD operations with localStorage persistence
- Time scheduling and frequency settings
- Completion tracking with timestamps
- Visual feedback and intuitive mobile interactions

**Planned Features** (bottom nav placeholders exist):

- Deadlines management
- Goals tracking
- Profile/settings

## Key Technical Details

### Store Pattern Example

```typescript
// Each store follows this pattern:
function createDataStore() {
	const { subscribe, set, update } = writable<Data[]>([]);
	return {
		subscribe,
		load: () => {
			/* Load from localStorage */
		},
		add: (item) => {
			/* Add and persist */
		}
		// ... other methods that auto-persist
	};
}
```

### PWA Requirements

- Manifest linked in `src/app.html`
- Icons must be 192x192 and 512x512 PNG
- Static adapter requires all routes to be prerenderable
- Mobile meta tags configured for iOS and Android compatibility
