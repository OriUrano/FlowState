<script lang="ts">
	import { Check, Clock, Plus, Trash2 } from 'lucide-svelte';
	import { routines, type Routine } from '$lib/stores/routines';
	import { onMount } from 'svelte';

	let showAddForm = false;
	let newRoutineName = '';
	let newRoutineTime = '';
	let newRoutineFrequency: 'daily' | 'weekly' | 'custom' = 'daily';

	onMount(() => {
		routines.load();
	});

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

	function formatTime(time?: string) {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-gray-900">Today's Routines</h2>
		<button
			on:click={() => (showAddForm = true)}
			class="rounded-full bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-700"
		>
			<Plus size={20} />
		</button>
	</div>

	{#if showAddForm}
		<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			<h3 class="mb-3 font-medium text-gray-900">Add New Routine</h3>

			<div class="space-y-3">
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

			<div class="mt-4 flex gap-2">
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
	{/if}

	<div class="space-y-3">
		{#each $routines as routine (routine.id)}
			<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex flex-1 items-center gap-3">
						<button
							on:click={() => toggleComplete(routine)}
							class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors {routine.completed
								? 'border-green-500 bg-green-500 text-white'
								: 'border-gray-300 hover:border-green-500'}"
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

					<button
						on:click={() => deleteRoutine(routine.id)}
						class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-red-500"
					>
						<Trash2 size={16} />
					</button>
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
