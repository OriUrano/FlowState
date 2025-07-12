<script lang="ts">
	import RoutinesList from '$lib/components/RoutinesList.svelte';
	import DeadlinesList from '$lib/components/DeadlinesList.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { fly } from 'svelte/transition';

	let activeTab: 'routines' | 'deadlines' | 'goals' | 'profile' = 'routines';
	let previousTab: 'routines' | 'deadlines' | 'goals' | 'profile' = 'routines';

	// Map tabs to their positions for direction calculation
	const tabPositions = {
		routines: 0,
		deadlines: 1,
		goals: 2,
		profile: 3
	};

	function getSlideDirection(from: string, to: string): number {
		const fromPos = tabPositions[from as keyof typeof tabPositions];
		const toPos = tabPositions[to as keyof typeof tabPositions];

		// If moving right (higher index), slide in from right (positive x)
		// If moving left (lower index), slide in from left (negative x)
		return fromPos < toPos ? 300 : -300;
	}

	function switchTab(tab: 'routines' | 'deadlines' | 'goals' | 'profile') {
		if (tab !== activeTab) {
			previousTab = activeTab;
			activeTab = tab;
		}
	}

	// Calculate slide direction for current transition
	$: slideDirection = getSlideDirection(previousTab, activeTab);

	// Check for reduced motion preference
	$: reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	$: transitionDuration = reducedMotion ? 0 : 250;
</script>

<div class="tab-wrapper h-full overflow-hidden">
	<div class="tab-container h-full overflow-hidden">
		{#key activeTab}
			<div
				class="tab-content h-full overflow-hidden"
				in:fly={{ x: slideDirection, duration: transitionDuration, delay: 0 }}
				out:fly={{ x: -slideDirection, duration: transitionDuration * 0.8, delay: 0 }}
			>
				{#if activeTab === 'routines'}
					<RoutinesList />
				{:else if activeTab === 'deadlines'}
					<DeadlinesList />
				{:else if activeTab === 'goals'}
					<div class="py-12 text-center">
						<h2 class="mb-2 text-2xl font-bold text-gray-900">Goals</h2>
						<p class="text-gray-500">Coming soon...</p>
					</div>
				{:else if activeTab === 'profile'}
					<div class="py-12 text-center">
						<h2 class="mb-2 text-2xl font-bold text-gray-900">Profile</h2>
						<p class="text-gray-500">Coming soon...</p>
					</div>
				{/if}
			</div>
		{/key}
	</div>
</div>

<!-- Bottom nav outside transition container to prevent layout issues -->
<BottomNav {activeTab} onTabChange={switchTab} />

<style>
	/* Outer wrapper to contain horizontal overflow without affecting layout */
	.tab-wrapper {
		overflow: hidden;
		position: relative;
		width: 100%;
		max-width: 100%;
	}

	/* Container for tab transitions using CSS Grid */
	.tab-container {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		width: 100%;
		position: relative;
	}

	.tab-content {
		grid-row: 1;
		grid-column: 1;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.tab-content {
			transition: none !important;
		}
	}
</style>
