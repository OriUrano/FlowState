import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Routine {
	id: string;
	name: string;
	time?: string;
	frequency: 'daily' | 'weekly' | 'custom';
	completed: boolean;
	lastCompleted?: string;
	createdAt: string;
	order: number;
}

function createRoutinesStore() {
	const { subscribe, set, update } = writable<Routine[]>([]);

	return {
		subscribe,

		load: () => {
			if (browser) {
				const stored = localStorage.getItem('flowstate-routines');
				if (stored) {
					const routines = JSON.parse(stored);
					// Handle legacy data without order field
					const routinesWithOrder = routines.map((routine: any, index: number) => ({
						...routine,
						order: routine.order !== undefined ? routine.order : index
					}));
					set(routinesWithOrder);
				}
			}
		},

		save: (routines: Routine[]) => {
			if (browser) {
				localStorage.setItem('flowstate-routines', JSON.stringify(routines));
			}
			set(routines);
		},

		add: (routine: Omit<Routine, 'id' | 'createdAt' | 'completed' | 'order'>) => {
			update((routines) => {
				const maxOrder = routines.length > 0 ? Math.max(...routines.map((r) => r.order)) : -1;
				const newRoutine: Routine = {
					...routine,
					id: crypto.randomUUID(),
					completed: false,
					createdAt: new Date().toISOString(),
					order: maxOrder + 1
				};

				const updated = [...routines, newRoutine];
				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		complete: (id: string) => {
			update((routines) => {
				const updated = routines.map((routine) =>
					routine.id === id
						? { ...routine, completed: true, lastCompleted: new Date().toISOString() }
						: routine
				);
				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		uncomplete: (id: string) => {
			update((routines) => {
				const updated = routines.map((routine) =>
					routine.id === id ? { ...routine, completed: false } : routine
				);
				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		delete: (id: string) => {
			update((routines) => {
				const updated = routines.filter((routine) => routine.id !== id);
				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		update: (id: string, updates: Partial<Routine>) => {
			update((routines) => {
				const updated = routines.map((routine) =>
					routine.id === id ? { ...routine, ...updates } : routine
				);
				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		reorder: (fromIndex: number, toIndex: number) => {
			update((routines) => {
				const sortedRoutines = [...routines].sort((a, b) => a.order - b.order);
				const item = sortedRoutines.splice(fromIndex, 1)[0];
				sortedRoutines.splice(toIndex, 0, item);

				// Update order values
				const updated = sortedRoutines.map((routine, index) => ({
					...routine,
					order: index
				}));

				if (browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(updated));
				}
				return updated;
			});
		}
	};
}

export const routines = createRoutinesStore();
