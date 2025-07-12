interface DragState {
	isDragging: boolean;
	startY: number;
	currentY: number;
	dragIndex: number;
	dropIndex: number;
	longPressTimer: number | null;
	element: HTMLElement | null;
	dropIndicator: HTMLElement | null;
}

const LONG_PRESS_DURATION = 500; // 500ms for long press
const DRAG_THRESHOLD = 10; // Minimum pixels to move before starting drag

export function dragAndDrop(
	node: HTMLElement,
	{ onReorder, index }: { onReorder: (fromIndex: number, toIndex: number) => void; index: number }
) {
	let state: DragState = {
		isDragging: false,
		startY: 0,
		currentY: 0,
		dragIndex: -1,
		dropIndex: -1,
		longPressTimer: null,
		element: null,
		dropIndicator: null
	};

	function startLongPress(event: TouchEvent | MouseEvent) {
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		state.startY = clientY;
		state.currentY = clientY;
		state.dragIndex = index;

		state.longPressTimer = window.setTimeout(() => {
			startDrag();
		}, LONG_PRESS_DURATION);
	}

	function endLongPress() {
		if (state.longPressTimer) {
			clearTimeout(state.longPressTimer);
			state.longPressTimer = null;
		}
	}

	function startDrag() {
		if (state.isDragging) return;

		state.isDragging = true;
		state.element = node;

		// Create visual feedback for dragged element
		node.style.transform = 'scale(1.05)';
		node.style.zIndex = '1000';
		node.style.opacity = '0.9';
		node.style.transition = 'none';
		node.style.pointerEvents = 'none';

		// Create drop indicator - a thin line to show where item will be dropped
		state.dropIndicator = document.createElement('div');
		state.dropIndicator.style.cssText = `
			position: absolute;
			left: 12px;
			right: 12px;
			height: 3px;
			background: #3b82f6;
			border-radius: 2px;
			z-index: 999;
			opacity: 0.8;
			pointer-events: none;
			box-shadow: 0 1px 3px rgba(59, 130, 246, 0.5);
			margin: -2px 0;
		`;

		// Add global listeners
		document.addEventListener('mousemove', handleMove);
		document.addEventListener('touchmove', handleMove, { passive: false });
		document.addEventListener('mouseup', endDrag);
		document.addEventListener('touchend', endDrag);

		// Prevent scrolling during drag
		document.body.style.overflowY = 'hidden';
	}

	function handleMove(event: TouchEvent | MouseEvent) {
		if (!state.isDragging) {
			const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
			const deltaY = Math.abs(clientY - state.startY);

			if (deltaY > DRAG_THRESHOLD) {
				endLongPress();
			}
			return;
		}

		event.preventDefault();

		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		const deltaY = clientY - state.startY;

		// Update drag element position
		if (state.element) {
			state.element.style.transform = `translateY(${deltaY}px) scale(1.05)`;
		}

		// Calculate and update drop position
		const container = node.parentElement;
		if (container && state.dropIndicator) {
			const items = Array.from(container.children).filter(
				(child) => child !== state.element && child !== state.dropIndicator
			) as HTMLElement[];

			let newDropIndex = 0;
			let dropY = 0;

			// Find the best drop position
			let found = false;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const rect = item.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				const midY = rect.top + rect.height / 2;

				if (clientY < midY) {
					newDropIndex = i;
					dropY = rect.top - containerRect.top;
					found = true;
					break;
				}
			}

			// If not found, drop at the end
			if (!found && items.length > 0) {
				newDropIndex = items.length;
				const lastItem = items[items.length - 1];
				const lastRect = lastItem.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				dropY = lastRect.bottom - containerRect.top;
			} else if (!found && items.length === 0) {
				newDropIndex = 0;
				dropY = 0;
			}

			// Update drop indicator position
			state.dropIndicator.style.top = `${dropY}px`;

			// Add to container if not already there
			if (!state.dropIndicator.parentNode) {
				container.appendChild(state.dropIndicator);
			}

			state.dropIndex = newDropIndex;
		}
	}

	function endDrag() {
		endLongPress();

		if (!state.isDragging) return;

		// Remove global listeners
		document.removeEventListener('mousemove', handleMove);
		document.removeEventListener('touchmove', handleMove);
		document.removeEventListener('mouseup', endDrag);
		document.removeEventListener('touchend', endDrag);

		// Reset styles
		if (state.element) {
			state.element.style.transform = '';
			state.element.style.zIndex = '';
			state.element.style.opacity = '';
			state.element.style.transition = '';
			state.element.style.pointerEvents = '';
		}

		// Remove drop indicator
		if (state.dropIndicator) {
			state.dropIndicator.remove();
		}

		// Restore scrolling
		document.body.style.overflowY = '';

		// Execute reorder if position changed
		if (state.dragIndex !== state.dropIndex && state.dropIndex >= 0) {
			onReorder(state.dragIndex, state.dropIndex);
		}

		// Reset state
		state.isDragging = false;
		state.dragIndex = -1;
		state.dropIndex = -1;
		state.element = null;
		state.dropIndicator = null;
	}

	function handleTouchStart(event: TouchEvent) {
		startLongPress(event);
	}

	function handleMouseDown(event: MouseEvent) {
		startLongPress(event);
	}

	function handleTouchMove(event: TouchEvent) {
		handleMove(event);
	}

	function handleTouchEnd() {
		endDrag();
	}

	function handleMouseUp() {
		endDrag();
	}

	// Add event listeners
	node.addEventListener('touchstart', handleTouchStart, { passive: true });
	node.addEventListener('mousedown', handleMouseDown);
	node.addEventListener('touchmove', handleTouchMove);
	node.addEventListener('touchend', handleTouchEnd);
	node.addEventListener('mouseup', handleMouseUp);

	return {
		update({
			onReorder: newOnReorder,
			index: newIndex
		}: {
			onReorder: (fromIndex: number, toIndex: number) => void;
			index: number;
		}) {
			onReorder = newOnReorder;
			index = newIndex;
			state.dragIndex = newIndex;
		},

		destroy() {
			endLongPress();
			endDrag();

			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('mousedown', handleMouseDown);
			node.removeEventListener('touchmove', handleTouchMove);
			node.removeEventListener('touchend', handleTouchEnd);
			node.removeEventListener('mouseup', handleMouseUp);
		}
	};
}
