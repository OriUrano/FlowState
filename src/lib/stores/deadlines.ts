import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface Deadline {
	id: string;
	title: string;
	description?: string;
	dueDate: string; // ISO date string
	priority: 'high' | 'medium' | 'low';
	status: 'pending' | 'completed' | 'overdue';
	createdAt: string;
	completedAt?: string;
	tags?: string[];
	order: number;
}

// Helper function to calculate if a deadline is overdue
function calculateStatus(deadline: Deadline): 'pending' | 'completed' | 'overdue' {
	if (deadline.completedAt) {
		return 'completed';
	}

	const now = new Date();
	const due = new Date(deadline.dueDate);

	// Set time to end of day for due date comparison
	due.setHours(23, 59, 59, 999);

	if (now > due) {
		return 'overdue';
	}

	return 'pending';
}

// Helper function to update status for all deadlines
function updateDeadlineStatuses(deadlines: Deadline[]): Deadline[] {
	return deadlines.map((deadline) => ({
		...deadline,
		status: calculateStatus(deadline)
	}));
}

function createDeadlinesStore() {
	const { subscribe, set, update } = writable<Deadline[]>([]);

	return {
		subscribe,

		load: () => {
			if (browser) {
				const stored = localStorage.getItem('flowstate-deadlines');
				if (stored) {
					const deadlines = JSON.parse(stored);
					// Handle legacy data without order field
					const deadlinesWithOrder = deadlines.map((deadline: any, index: number) => ({
						...deadline,
						order: deadline.order !== undefined ? deadline.order : index
					}));
					// Update statuses when loading
					const updatedDeadlines = updateDeadlineStatuses(deadlinesWithOrder);
					set(updatedDeadlines);
				}
			}
		},

		save: (deadlines: Deadline[]) => {
			if (browser) {
				localStorage.setItem('flowstate-deadlines', JSON.stringify(deadlines));
			}
			set(deadlines);
		},

		add: (deadline: Omit<Deadline, 'id' | 'createdAt' | 'status' | 'order'>) => {
			update((deadlines) => {
				const maxOrder = deadlines.length > 0 ? Math.max(...deadlines.map(d => d.order)) : -1;
				const newDeadline: Deadline = {
					...deadline,
					id: crypto.randomUUID(),
					status: 'pending',
					createdAt: new Date().toISOString(),
					order: maxOrder + 1
				};

				// Calculate initial status
				newDeadline.status = calculateStatus(newDeadline);

				const updated = [...deadlines, newDeadline];
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		complete: (id: string) => {
			update((deadlines) => {
				const updated = deadlines.map((deadline) =>
					deadline.id === id
						? { ...deadline, status: 'completed' as const, completedAt: new Date().toISOString() }
						: deadline
				);
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		uncomplete: (id: string) => {
			update((deadlines) => {
				const updated = deadlines.map((deadline) => {
					if (deadline.id === id) {
						const uncompleted = { ...deadline, completedAt: undefined };
						return {
							...uncompleted,
							status: calculateStatus(uncompleted)
						};
					}
					return deadline;
				});
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		delete: (id: string) => {
			update((deadlines) => {
				const updated = deadlines.filter((deadline) => deadline.id !== id);
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		update: (id: string, updates: Partial<Deadline>) => {
			update((deadlines) => {
				const updated = deadlines.map((deadline) => {
					if (deadline.id === id) {
						const updatedDeadline = { ...deadline, ...updates };
						// Recalculate status if due date or completion status changed
						if (updates.dueDate || updates.completedAt !== undefined) {
							updatedDeadline.status = calculateStatus(updatedDeadline);
						}
						return updatedDeadline;
					}
					return deadline;
				});
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		// Utility method to refresh all statuses (useful for when the app is reopened)
		refreshStatuses: () => {
			update((deadlines) => {
				const updated = updateDeadlineStatuses(deadlines);
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		},

		reorder: (fromIndex: number, toIndex: number) => {
			update((deadlines) => {
				const sortedDeadlines = [...deadlines].sort((a, b) => a.order - b.order);
				const item = sortedDeadlines.splice(fromIndex, 1)[0];
				sortedDeadlines.splice(toIndex, 0, item);
				
				// Update order values
				const updated = sortedDeadlines.map((deadline, index) => ({
					...deadline,
					order: index
				}));
				
				if (browser) {
					localStorage.setItem('flowstate-deadlines', JSON.stringify(updated));
				}
				return updated;
			});
		}
	};
}

export const deadlines = createDeadlinesStore();
