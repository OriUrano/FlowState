<script lang="ts">
	import { Calendar, Clock, Target, User } from 'lucide-svelte';

	export let activeTab = 'routines';
</script>

<nav
	class="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white px-4 py-2"
>
	<div class="mx-auto flex max-w-sm items-center justify-around">
		<button
			class="flex flex-col items-center rounded-lg px-3 py-2 transition-colors {activeTab ===
			'routines'
				? 'bg-blue-50 text-blue-600'
				: 'text-gray-600'}"
			on:click={() => (activeTab = 'routines')}
		>
			<Clock size={24} />
			<span class="mt-1 text-xs font-medium">Routines</span>
		</button>

		<button
			class="flex flex-col items-center rounded-lg px-3 py-2 transition-colors {activeTab ===
			'deadlines'
				? 'bg-blue-50 text-blue-600'
				: 'text-gray-400'}"
			disabled
		>
			<Calendar size={24} />
			<span class="mt-1 text-xs font-medium">Deadlines</span>
		</button>

		<button
			class="flex flex-col items-center rounded-lg px-3 py-2 transition-colors {activeTab ===
			'goals'
				? 'bg-blue-50 text-blue-600'
				: 'text-gray-400'}"
			disabled
		>
			<Target size={24} />
			<span class="mt-1 text-xs font-medium">Goals</span>
		</button>

		<button
			class="flex flex-col items-center rounded-lg px-3 py-2 transition-colors {activeTab ===
			'profile'
				? 'bg-blue-50 text-blue-600'
				: 'text-gray-400'}"
			disabled
		>
			<User size={24} />
			<span class="mt-1 text-xs font-medium">Profile</span>
		</button>
	</div>
</nav>
