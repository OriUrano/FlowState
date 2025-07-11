<script lang="ts">
	import { Check, Calendar, Plus, Trash2, Edit, AlertCircle } from 'lucide-svelte';
	import { deadlines, type Deadline } from '$lib/stores/deadlines';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let showAddForm = false;
	let newDeadlineTitle = '';
	let newDeadlineDescription = '';
	let newDeadlineDueDate = '';
	let newDeadlinePriority: 'high' | 'medium' | 'low' = 'medium';
	let newDeadlineTags = '';
	let errors: { title?: string; dueDate?: string } = {};

	onMount(() => {
		deadlines.load();
		// Refresh statuses when component mounts (in case app was closed and reopened)
		deadlines.refreshStatuses();
	});

	function validateForm(): boolean {
		errors = {};

		if (!newDeadlineTitle.trim()) {
			errors.title = 'Title is required';
		}

		if (!newDeadlineDueDate) {
			errors.dueDate = 'Due date is required';
		} else {
			const today = new Date();
			const selectedDate = new Date(newDeadlineDueDate);
			const todayStr = today.toISOString().split('T')[0];

			if (newDeadlineDueDate < todayStr) {
				errors.dueDate = 'Due date cannot be in the past';
			}
		}

		return Object.keys(errors).length === 0;
	}

	function addDeadline() {
		if (!validateForm()) {
			return;
		}

		const tags = newDeadlineTags
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);

		deadlines.add({
			title: newDeadlineTitle.trim(),
			description: newDeadlineDescription.trim() || undefined,
			dueDate: newDeadlineDueDate,
			priority: newDeadlinePriority,
			tags: tags.length > 0 ? tags : undefined
		});

		// Clear form and close modal
		newDeadlineTitle = '';
		newDeadlineDescription = '';
		newDeadlineDueDate = '';
		newDeadlinePriority = 'medium';
		newDeadlineTags = '';
		errors = {};
		showAddForm = false;
	}

	function toggleComplete(deadline: Deadline) {
		if (deadline.status === 'completed') {
			deadlines.uncomplete(deadline.id);
		} else {
			deadlines.complete(deadline.id);
		}
	}

	function deleteDeadline(id: string) {
		deadlines.delete(id);
	}

	function editDeadline(deadline: Deadline) {
		// TODO: Implement edit functionality
		console.log('Edit deadline:', deadline);
	}

	function closeModal() {
		showAddForm = false;
		// Clear form fields and errors when closing
		newDeadlineTitle = '';
		newDeadlineDescription = '';
		newDeadlineDueDate = '';
		newDeadlinePriority = 'medium';
		newDeadlineTags = '';
		errors = {};
	}

	function formatDueDate(dueDate: string): string {
		const due = new Date(dueDate);
		const now = new Date();
		const diffTime = due.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return 'Due today';
		} else if (diffDays === 1) {
			return 'Due tomorrow';
		} else if (diffDays === -1) {
			return 'Overdue by 1 day';
		} else if (diffDays < 0) {
			return `Overdue by ${Math.abs(diffDays)} days`;
		} else if (diffDays <= 7) {
			return `Due in ${diffDays} days`;
		} else {
			return due.toLocaleDateString();
		}
	}

	function formatShortDate(dueDate: string): string {
		const due = new Date(dueDate);
		return due.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
		switch (priority) {
			case 'high':
				return 'bg-red-500';
			case 'medium':
				return 'bg-yellow-500';
			case 'low':
				return 'bg-gray-400';
		}
	}

	function getStatusColor(status: 'pending' | 'completed' | 'overdue'): string {
		switch (status) {
			case 'overdue':
				return 'text-red-600';
			case 'completed':
				return 'text-green-600';
			case 'pending':
				return 'text-gray-600';
		}
	}

	function getDueDateColor(status: 'pending' | 'completed' | 'overdue', dueDate: string): string {
		if (status === 'completed') return 'text-gray-500';
		if (status === 'overdue') return 'text-red-600';

		const due = new Date(dueDate);
		const now = new Date();
		const diffTime = due.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'text-orange-600'; // Due today
		if (diffDays <= 3) return 'text-yellow-600'; // Due soon
		return 'text-gray-600'; // Future
	}

	// Sort deadlines: overdue first, then by due date ascending
	$: sortedDeadlines = $deadlines.slice().sort((a, b) => {
		// Completed items go to bottom
		if (a.status === 'completed' && b.status !== 'completed') return 1;
		if (b.status === 'completed' && a.status !== 'completed') return -1;

		// Overdue items go to top
		if (a.status === 'overdue' && b.status !== 'overdue') return -1;
		if (b.status === 'overdue' && a.status !== 'overdue') return 1;

		// Sort by due date
		return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
	});
</script>

<div class="flex flex-col" style="max-height: calc(100vh - 200px);">
	<!-- Fixed header -->
	<div class="sticky top-0 z-10 flex-shrink-0 bg-gray-50 px-4 py-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-900">Deadlines</h2>
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
	<div class="flex-1 overflow-y-auto px-4 pb-8">
		<div class="space-y-2">
			{#each sortedDeadlines as deadline (deadline.id)}
				<div class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
					<div class="flex items-start justify-between">
						<div class="flex flex-1 items-start gap-3">
							<button
								on:click={() => toggleComplete(deadline)}
								class="flex items-center justify-center rounded-full border-2 transition-colors {deadline.status ===
								'completed'
									? 'border-green-500 bg-green-500 text-white'
									: 'border-gray-300 hover:border-green-500'} mt-1"
								style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; max-width: 28px; max-height: 28px; flex-shrink: 0;"
							>
								{#if deadline.status === 'completed'}
									<Check size={14} />
								{/if}
							</button>

							<div class="min-w-0 flex-1">
								<div class="mb-1 flex items-center gap-2">
									<!-- Priority indicator -->
									<div
										class="h-2 w-2 rounded-full {getPriorityColor(deadline.priority)} flex-shrink-0"
									></div>
									<h3
										class="font-medium text-gray-900 {deadline.status === 'completed'
											? 'line-through opacity-60'
											: ''}"
									>
										{deadline.title}
									</h3>
								</div>

								{#if deadline.description}
									<p
										class="mb-2 text-sm text-gray-600 {deadline.status === 'completed'
											? 'opacity-60'
											: ''}"
									>
										{deadline.description}
									</p>
								{/if}

								<div class="flex items-center gap-3 text-xs">
									<div
										class="flex items-center gap-1 {getDueDateColor(
											deadline.status,
											deadline.dueDate
										)}"
									>
										<Calendar size={12} />
										<span>{formatDueDate(deadline.dueDate)}</span>
									</div>

									{#if deadline.status === 'overdue'}
										<div class="flex items-center gap-1 text-red-600">
											<AlertCircle size={12} />
											<span class="font-medium">Overdue</span>
										</div>
									{/if}

									<span class="text-gray-500 capitalize">{deadline.priority} priority</span>

									{#if deadline.tags && deadline.tags.length > 0}
										<div class="flex gap-1">
											{#each deadline.tags as tag}
												<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
													>{tag}</span
												>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex items-center gap-1">
							<button
								on:click={() => editDeadline(deadline)}
								class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-blue-500"
							>
								<Edit size={16} />
							</button>
							<button
								on:click={() => deleteDeadline(deadline.id)}
								class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-red-500"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-12">
					<Calendar size={48} class="mx-auto text-gray-300 mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No deadlines yet</h3>
					<p class="text-gray-500 mb-4">Add your first deadline to stay organized</p>
					<button
						on:click={() => (showAddForm = true)}
						class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
					>
						Add Your First Deadline
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
			role="document"
			in:fly={{ y: 300, duration: 300 }}
			out:fly={{ y: 300, duration: 200 }}
		>
			<h3 id="modal-title" class="mb-4 text-lg font-semibold text-gray-900">Add New Deadline</h3>

			<div class="space-y-4">
				<div>
					<label for="deadline-title" class="mb-1 block text-sm font-medium text-gray-700">
						Title
					</label>
					<input
						id="deadline-title"
						type="text"
						bind:value={newDeadlineTitle}
						placeholder="e.g., Submit tax returns"
						class="w-full rounded-md border {errors.title
							? 'border-red-500'
							: 'border-gray-300'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{#if errors.title}
						<p class="mt-1 text-sm text-red-600">{errors.title}</p>
					{/if}
				</div>

				<div>
					<label for="deadline-description" class="mb-1 block text-sm font-medium text-gray-700">
						Description (optional)
					</label>
					<textarea
						id="deadline-description"
						bind:value={newDeadlineDescription}
						placeholder="Additional details..."
						rows="2"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>

				<div>
					<label for="deadline-due-date" class="mb-1 block text-sm font-medium text-gray-700">
						Due Date
					</label>
					<input
						id="deadline-due-date"
						type="date"
						bind:value={newDeadlineDueDate}
						class="w-full rounded-md border {errors.dueDate
							? 'border-red-500'
							: 'border-gray-300'} px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{#if errors.dueDate}
						<p class="mt-1 text-sm text-red-600">{errors.dueDate}</p>
					{/if}
				</div>

				<div>
					<label for="deadline-priority" class="mb-1 block text-sm font-medium text-gray-700">
						Priority
					</label>
					<select
						id="deadline-priority"
						bind:value={newDeadlinePriority}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value="low">Low Priority</option>
						<option value="medium">Medium Priority</option>
						<option value="high">High Priority</option>
					</select>
				</div>

				<div>
					<label for="deadline-tags" class="mb-1 block text-sm font-medium text-gray-700">
						Tags (optional)
					</label>
					<input
						id="deadline-tags"
						type="text"
						bind:value={newDeadlineTags}
						placeholder="work, taxes, personal (comma separated)"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					on:click={addDeadline}
					class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Add Deadline
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
