<script lang="ts">
	import RoutinesList from '$lib/components/RoutinesList.svelte';
	import DeadlinesList from '$lib/components/DeadlinesList.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let activeTab: 'routines' | 'deadlines' | 'goals' | 'profile' = 'routines';

	function switchTab(tab: 'routines' | 'deadlines' | 'goals' | 'profile') {
		activeTab = tab;
	}
</script>

{#if activeTab === 'routines'}
	<RoutinesList />
{:else if activeTab === 'deadlines'}
	<DeadlinesList />
{:else if activeTab === 'goals'}
	<div class="text-center py-12">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Goals</h2>
		<p class="text-gray-500">Coming soon...</p>
	</div>
{:else if activeTab === 'profile'}
	<div class="text-center py-12">
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
		<p class="text-gray-500">Coming soon...</p>
	</div>
{/if}

<!-- Override the layout's BottomNav with our tab-aware version -->
<BottomNav {activeTab} onTabChange={switchTab} />
