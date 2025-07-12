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

	// Helper function to check if a date is from a previous day
	const isFromPreviousDay = (dateString: string): boolean => {
		const completedDate = new Date(dateString);
		const today = new Date();
		
		// Reset time to midnight for accurate day comparison
		completedDate.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		
		return completedDate < today;
	};

	// Helper function to check if a date is from a previous week (before current Monday)
	const isFromPreviousWeek = (dateString: string): boolean => {
		const completedDate = new Date(dateString);
		const today = new Date();
		
		// Get start of current week (Monday)
		const currentMonday = new Date(today);
		const dayOfWeek = today.getDay();
		const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, Monday is 1
		currentMonday.setDate(today.getDate() - daysToMonday);
		currentMonday.setHours(0, 0, 0, 0);
		
		// Reset completed date to start of day
		completedDate.setHours(0, 0, 0, 0);
		
		return completedDate < currentMonday;
	};

	const resetRoutines = (routines: Routine[]): Routine[] => {
		return routines.map(routine => {
			if (routine.completed && routine.lastCompleted) {
				if (routine.frequency === 'daily' && isFromPreviousDay(routine.lastCompleted)) {
					return { ...routine, completed: false };
				}
				if (routine.frequency === 'weekly' && isFromPreviousWeek(routine.lastCompleted)) {
					return { ...routine, completed: false };
				}
			}
			return routine;
		});
	};

	return {
		subscribe,

		load: () => {
			if (browser) {
				const stored = localStorage.getItem('flowstate-routines');
				if (stored) {
					const routines = JSON.parse(stored);
					// Handle legacy data without order field
					let routinesWithOrder = routines.map((routine: any, index: number) => ({
						...routine,
						order: routine.order !== undefined ? routine.order : index
					}));
					
					// Reset routines that were completed on previous days/weeks
					routinesWithOrder = resetRoutines(routinesWithOrder);
					
					// Save the reset state back to localStorage
					localStorage.setItem('flowstate-routines', JSON.stringify(routinesWithOrder));
					
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
		},

		checkAndReset: () => {
			update((routines) => {
				const resetRoutinesResult = resetRoutines(routines);
				const hasChanges = resetRoutinesResult.some((routine, index) => 
					routine.completed !== routines[index].completed
				);
				
				if (hasChanges && browser) {
					localStorage.setItem('flowstate-routines', JSON.stringify(resetRoutinesResult));
				}
				
				return resetRoutinesResult;
			});
		}
	};
}

export const routines = createRoutinesStore();
