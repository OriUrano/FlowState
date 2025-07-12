<script lang="ts">
	import { Check, Clock, Plus, Trash2, Edit } from 'lucide-svelte';
	import { routines, type Routine } from '$lib/stores/routines';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { dragAndDrop } from './dragAndDrop';
	import ConfirmationDialog from './ConfirmationDialog.svelte';

	let showAddForm = false;
	let newRoutineName = '';
	let newRoutineTime = '';
	let newRoutineFrequency: 'daily' | 'weekly' | 'custom' = 'daily';

	// Edit form state
	let showEditForm = false;
	let editingRoutine: Routine | null = null;
	let editName = '';
	let editTime = '';
	let editFrequency: 'daily' | 'weekly' | 'custom' = 'daily';

	// Delete confirmation state
	let showDeleteConfirmation = false;
	let routineToDelete: Routine | null = null;

	let scrollContainer: HTMLElement;
	let componentHeader: HTMLElement;
	let fadeClass = 'fade-none';
	let scrollContainerHeight = 'calc(100vh - 17rem)'; // fallback

	function calculateScrollHeight() {
		if (typeof window === 'undefined') return;

		const viewportHeight = window.innerHeight;
		const bottomNav = document.querySelector('nav') as HTMLElement;
		const flowStateHeader = document.querySelector('header') as HTMLElement;

		const bottomNavHeight = bottomNav?.offsetHeight || 80;
		const flowStateHeaderHeight = flowStateHeader?.offsetHeight || 60;
		const componentHeaderHeight = componentHeader?.offsetHeight || 96;

		const availableHeight =
			viewportHeight - bottomNavHeight - flowStateHeaderHeight - componentHeaderHeight - 3;
		scrollContainerHeight = `${Math.max(availableHeight, 200)}px`;
	}

	onMount(() => {
		routines.load();
		updateFadeClass();

		// Calculate initial height
		setTimeout(calculateScrollHeight, 0);

		// Recalculate on window resize
		const handleResize = () => calculateScrollHeight();
		window.addEventListener('resize', handleResize);

		// Check for routine resets when the page becomes visible
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				routines.checkAndReset();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Check for routine resets every hour
		const resetInterval = setInterval(
			() => {
				routines.checkAndReset();
			},
			60 * 60 * 1000
		); // 1 hour

		return () => {
			window.removeEventListener('resize', handleResize);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			clearInterval(resetInterval);
		};
	});

	function updateFadeClass() {
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const isAtTop = scrollTop <= 2; // Small threshold for touch scrolling
		const isAtBottom = scrollTop + clientHeight >= scrollHeight - 2;
		const canScroll = scrollHeight > clientHeight;

		if (!canScroll) {
			fadeClass = 'fade-none';
		} else if (isAtTop && isAtBottom) {
			fadeClass = 'fade-none';
		} else if (isAtTop) {
			fadeClass = 'fade-bottom';
		} else if (isAtBottom) {
			fadeClass = 'fade-top';
		} else {
			fadeClass = 'fade-both';
		}
	}

	function handleScroll() {
		updateFadeClass();
	}

	// Update fade class when routines change or height changes
	$: if (sortedRoutines || scrollContainerHeight) {
		setTimeout(updateFadeClass, 0);
	}

	function addRoutine() {
		if (newRoutineName.trim()) {
			routines.add({
				name: newRoutineName.trim(),
				time: newRoutineTime || undefined,
				frequency: newRoutineFrequency
			});

			newRoutineName = '';
			newRoutineTime = '';
			newRoutineFrequency = 'daily';
			showAddForm = false;
		}
	}

	function toggleComplete(routine: Routine) {
		if (routine.completed) {
			routines.uncomplete(routine.id);
		} else {
			routines.complete(routine.id);
		}
	}

	function requestDeleteConfirmation(routine: Routine) {
		routineToDelete = routine;
		showDeleteConfirmation = true;
	}

	function confirmDeleteRoutine() {
		if (routineToDelete) {
			routines.delete(routineToDelete.id);
			routineToDelete = null;
		}
	}

	function cancelDeleteRoutine() {
		routineToDelete = null;
	}

	function editRoutine(routine: Routine) {
		editingRoutine = routine;
		editName = routine.name;
		editTime = routine.time || '';
		editFrequency = routine.frequency;
		showEditForm = true;
	}

	function updateRoutine() {
		if (editName.trim() && editingRoutine) {
			routines.update(editingRoutine.id, {
				name: editName.trim(),
				time: editTime || undefined,
				frequency: editFrequency
			});

			// Clear edit form
			editName = '';
			editTime = '';
			editFrequency = 'daily';
			editingRoutine = null;
			showEditForm = false;
		}
	}

	function closeModal() {
		showAddForm = false;
		showEditForm = false;

		// Clear add form fields
		newRoutineName = '';
		newRoutineTime = '';
		newRoutineFrequency = 'daily';

		// Clear edit form fields
		editName = '';
		editTime = '';
		editFrequency = 'daily';
		editingRoutine = null;
	}

	function formatTime(time?: string) {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}

	function handleReorder(fromIndex: number, toIndex: number) {
		routines.reorder(fromIndex, toIndex);
	}

	// Sort routines by order for display
	$: sortedRoutines = [...$routines].sort((a, b) => a.order - b.order);
</script>

<div class="flex h-full flex-col overflow-hidden">
	<!-- Fixed header -->
	<div bind:this={componentHeader} class="sticky top-0 z-10 flex-shrink-0 bg-gray-50 px-4 py-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-900">Today's Routines</h2>
			<button
				on:click={() => (showAddForm = true)}
				class="flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700"
				style="width: 40px; height: 40px; min-width: 40px; min-height: 40px; max-width: 40px; max-height: 40px; flex-shrink: 0;"
			>
				<Plus size={20} />
			</button>
		</div>
	</div>

	<!-- Scrollable list container -->
	<div
		bind:this={scrollContainer}
		on:scroll={handleScroll}
		class="scrollable-list-container {fadeClass} overflow-y-auto px-4 pb-8"
		style="height: {scrollContainerHeight};"
	>
		<div class="space-y-2">
			{#each sortedRoutines as routine, index (routine.id)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
					use:dragAndDrop={{ onReorder: handleReorder, index }}
				>
					<div class="flex items-center justify-between">
						<div class="flex flex-1 items-center gap-3">
							<button
								on:click={() => toggleComplete(routine)}
								class="flex items-center justify-center rounded-full border-2 transition-colors {routine.completed
									? 'border-green-500 bg-green-500 text-white'
									: 'border-gray-300 hover:border-green-500'}"
								style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; max-width: 28px; max-height: 28px; flex-shrink: 0;"
							>
								{#if routine.completed}
									<Check size={14} />
								{/if}
							</button>

							<div class="flex-1">
								<h3
									class="font-medium text-gray-900 {routine.completed
										? 'line-through opacity-60'
										: ''}"
								>
									{routine.name}
								</h3>
								<div class="mt-1 flex items-center gap-3 text-sm text-gray-500">
									{#if routine.time}
										<div class="flex items-center gap-1">
											<Clock size={14} />
											{formatTime(routine.time)}
										</div>
									{/if}
									<span class="capitalize">{routine.frequency}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-1">
							<button
								on:click={() => editRoutine(routine)}
								class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-blue-500"
							>
								<Edit size={16} />
							</button>
							<button
								on:click={() => requestDeleteConfirmation(routine)}
								class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-red-500"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-12">
					<Clock size={48} class="mx-auto text-gray-300 mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No routines yet</h3>
					<p class="text-gray-500 mb-4">Create your first routine to get started</p>
					<button
						on:click={() => (showAddForm = true)}
						class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
					>
						Add Your First Routine
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Modal Overlay -->
{#if showAddForm}
	<div
		class="fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="relative z-[61] w-full max-w-md rounded-t-xl bg-white p-6 shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			tabindex="-1"
			in:fly={{ y: 300, duration: 300 }}
			out:fly={{ y: 300, duration: 200 }}
		>
			<h3 id="modal-title" class="mb-4 text-lg font-semibold text-gray-900">Add New Routine</h3>

			<div class="space-y-4">
				<div>
					<label for="routine-name" class="mb-1 block text-sm font-medium text-gray-700">
						Routine Name
					</label>
					<input
						id="routine-name"
						type="text"
						bind:value={newRoutineName}
						placeholder="e.g., Morning meditation"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="routine-time" class="mb-1 block text-sm font-medium text-gray-700">
						Time (optional)
					</label>
					<input
						id="routine-time"
						type="time"
						bind:value={newRoutineTime}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="routine-frequency" class="mb-1 block text-sm font-medium text-gray-700">
						Frequency
					</label>
					<select
						id="routine-frequency"
						bind:value={newRoutineFrequency}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="custom">Custom</option>
					</select>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					on:click={addRoutine}
					class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Add Routine
				</button>
				<button
					on:click={() => (showAddForm = false)}
					class="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Modal Overlay -->
{#if showEditForm}
	<div
		class="fixed inset-0 z-[60] flex items-end justify-center bg-black/60"
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="edit-modal-title"
		tabindex="-1"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="relative z-[61] w-full max-w-md rounded-t-xl bg-white p-6 shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			tabindex="-1"
			in:fly={{ y: 300, duration: 300 }}
			out:fly={{ y: 300, duration: 200 }}
		>
			<h3 id="edit-modal-title" class="mb-4 text-lg font-semibold text-gray-900">Edit Routine</h3>

			<div class="space-y-4">
				<div>
					<label for="edit-routine-name" class="mb-1 block text-sm font-medium text-gray-700">
						Routine Name
					</label>
					<input
						id="edit-routine-name"
						type="text"
						bind:value={editName}
						placeholder="e.g., Morning meditation"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="edit-routine-time" class="mb-1 block text-sm font-medium text-gray-700">
						Time (optional)
					</label>
					<input
						id="edit-routine-time"
						type="time"
						bind:value={editTime}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="edit-routine-frequency" class="mb-1 block text-sm font-medium text-gray-700">
						Frequency
					</label>
					<select
						id="edit-routine-frequency"
						bind:value={editFrequency}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="custom">Custom</option>
					</select>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					on:click={updateRoutine}
					class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Save Changes
				</button>
				<button
					on:click={closeModal}
					class="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Dialog -->
<ConfirmationDialog
	bind:isOpen={showDeleteConfirmation}
	title="Delete Routine"
	message={routineToDelete
		? `Are you sure you want to delete "${routineToDelete.name}"? This action cannot be undone.`
		: ''}
	confirmText="Delete"
	cancelText="Cancel"
	variant="danger"
	onConfirm={confirmDeleteRoutine}
	onCancel={cancelDeleteRoutine}
/>
