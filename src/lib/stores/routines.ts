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
}

function createRoutinesStore() {
	const { subscribe, set, update } = writable<Routine[]>([]);

	return {
		subscribe,

		load: () => {
			if (browser) {
				const stored = localStorage.getItem('flowstate-routines');
				if (stored) {
					set(JSON.parse(stored));
				}
			}
		},

		save: (routines: Routine[]) => {
			if (browser) {
				localStorage.setItem('flowstate-routines', JSON.stringify(routines));
			}
			set(routines);
		},

		add: (routine: Omit<Routine, 'id' | 'createdAt' | 'completed'>) => {
			const newRoutine: Routine = {
				...routine,
				id: crypto.randomUUID(),
				completed: false,
				createdAt: new Date().toISOString()
			};

			update((routines) => {
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
		}
	};
}

export const routines = createRoutinesStore();
