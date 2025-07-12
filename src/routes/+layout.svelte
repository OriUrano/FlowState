<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col bg-gray-50">
	<header class="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
		<div class="flex items-center gap-3">
			<img src="/logo.svg" alt="FlowState Logo" class="h-8 w-8" />
			<h1 class="text-xl font-bold text-gray-900">FlowState</h1>
		</div>
	</header>

	<main class="flex-1 overflow-hidden" style="padding-bottom: 5rem;">
		{@render children()}
	</main>
</div>
