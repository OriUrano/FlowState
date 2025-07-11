<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
		<div class="flex items-center gap-3">
			<img src="/logo.svg" alt="FlowState Logo" class="w-8 h-8" />
			<h1 class="text-xl font-bold text-gray-900">FlowState</h1>
		</div>
	</header>

	<main class="px-4 py-6">
		{@render children()}
	</main>
</div>
