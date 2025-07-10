<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
		<h1 class="text-xl font-semibold text-gray-900">FlowState</h1>
	</header>

	<main class="px-4 py-6">
		{@render children()}
	</main>

	<BottomNav />
</div>
