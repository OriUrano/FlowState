<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';

	export let isOpen = false;
	export let title = 'Confirm Action';
	export let message = 'Are you sure you want to proceed?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let onConfirm: () => void;
	export let onCancel: () => void;
	export let variant: 'danger' | 'warning' | 'info' = 'warning';

	function handleConfirm() {
		onConfirm();
		isOpen = false;
	}

	function handleCancel() {
		onCancel();
		isOpen = false;
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}

	function getVariantStyles() {
		switch (variant) {
			case 'danger':
				return {
					iconColor: 'text-red-600',
					confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
					cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
				};
			case 'warning':
				return {
					iconColor: 'text-yellow-600',
					confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
					cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
				};
			case 'info':
				return {
					iconColor: 'text-blue-600',
					confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
					cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
				};
		}
	}

	$: styles = getVariantStyles();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-[70] flex items-end justify-center bg-black/60"
		on:click={handleCancel}
		on:keydown={handleEscape}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirmation-title"
		tabindex="-1"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<div
			class="relative z-[71] w-full max-w-md rounded-t-xl bg-white p-6 shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			tabindex="-1"
			in:fly={{ y: 300, duration: 300 }}
			out:fly={{ y: 300, duration: 200 }}
		>
			<!-- Icon and Title -->
			<div class="mb-4 flex items-center gap-3">
				<div class="flex-shrink-0">
					<AlertTriangle size={24} class={styles.iconColor} />
				</div>
				<h3 id="confirmation-title" class="text-lg font-semibold text-gray-900">{title}</h3>
			</div>

			<!-- Message -->
			<p class="mb-6 text-gray-700">{message}</p>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<button
					on:click={handleConfirm}
					class="flex-1 rounded-md px-4 py-3 font-medium transition-colors {styles.confirmButton}"
					style="min-height: 44px;"
					type="button"
				>
					{confirmText}
				</button>
				<button
					on:click={handleCancel}
					class="flex-1 rounded-md px-4 py-3 font-medium transition-colors {styles.cancelButton}"
					style="min-height: 44px;"
					type="button"
				>
					{cancelText}
				</button>
			</div>
		</div>
	</div>
{/if}
