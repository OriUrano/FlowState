<script lang="ts">
	import { Check, Clock, Plus, Trash2, Edit } from 'lucide-svelte';
	import { routines, type Routine } from '$lib/stores/routines';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { dragAndDrop } from './dragAndDrop';

	let showAddForm = false;
	let newRoutineName = '';
	let newRoutineTime = '';
	let newRoutineFrequency: 'daily' | 'weekly' | 'custom' = 'daily';

	let scrollContainer: HTMLElement;
	let fadeClass = 'fade-none';

	onMount(() => {
		routines.load();
		updateFadeClass();
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

	// Update fade class when routines change
	$: if (sortedRoutines) {
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

	function deleteRoutine(id: string) {
		routines.delete(id);
	}

	function editRoutine(routine: Routine) {
		// TODO: Implement edit functionality
		console.log('Edit routine:', routine);
	}

	function closeModal() {
		showAddForm = false;
		// Clear form fields when closing
		newRoutineName = '';
		newRoutineTime = '';
		newRoutineFrequency = 'daily';
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

<div class="flex flex-col" style="max-height: calc(100vh - 136px);">
	<!-- Fixed header -->
	<div class="sticky top-0 z-10 flex-shrink-0 bg-gray-50 px-4 py-6">
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
		class="scrollable-list-container {fadeClass} flex-1 overflow-y-auto px-4 pb-8"
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
								on:click={() => deleteRoutine(routine.id)}
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
