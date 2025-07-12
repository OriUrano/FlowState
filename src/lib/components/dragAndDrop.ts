interface DragState {
	isDragging: boolean;
	startY: number;
	currentY: number;
	dragIndex: number;
	dropIndex: number;
	longPressTimer: number | null;
	element: HTMLElement | null;
	shiftedElements: Map<HTMLElement, { transform: string; zIndex: string; position: string }>;
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
		shiftedElements: new Map()
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
		node.style.transform = 'scale(1.05) translateZ(100px)';
		node.style.position = 'relative';
		node.style.zIndex = '10000';
		node.style.opacity = '1.0';
		node.style.transition = 'none';
		node.style.pointerEvents = 'none';

		// Enable smooth transitions for all container elements
		const container = node.parentElement;
		if (container) {
			const items = Array.from(container.children) as HTMLElement[];
			items.forEach((item) => {
				if (item !== node) {
					item.style.transition = 'transform 200ms ease-out';
				}
			});
		}

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
			state.element.style.transform = `translateY(${deltaY}px) scale(1.05) translateZ(100px)`;
		}

		// Calculate drop position and shift elements
		const container = node.parentElement;
		if (container) {
			const items = Array.from(container.children).filter(
				(child) => child !== state.element
			) as HTMLElement[];

			let newDropIndex = 0;

			// Find the best drop position
			let found = false;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const rect = item.getBoundingClientRect();
				const midY = rect.top + rect.height / 2;

				if (clientY < midY) {
					newDropIndex = i;
					found = true;
					break;
				}
			}

			// If not found, drop at the end
			if (!found) {
				newDropIndex = items.length;
			}

			// Reset previous shifts
			state.shiftedElements.forEach((originalStyles, element) => {
				element.style.transform = originalStyles.transform;
				element.style.zIndex = originalStyles.zIndex;
				element.style.position = originalStyles.position;
			});
			state.shiftedElements.clear();

			// Apply new shifts
			const draggedElementHeight = state.element?.getBoundingClientRect().height || 0;
			const gap = draggedElementHeight + 8; // Add 8px for spacing

			// Shift elements to create a visual gap
			if (state.dragIndex < newDropIndex) {
				// Moving down: shift elements between original and new position up
				for (let i = state.dragIndex; i < newDropIndex; i++) {
					if (i < items.length) {
						const element = items[i];
						const currentTransform = element.style.transform || '';
						const currentZIndex = element.style.zIndex || '';
						const currentPosition = element.style.position || '';
						state.shiftedElements.set(element, {
							transform: currentTransform,
							zIndex: currentZIndex,
							position: currentPosition
						});
						element.style.transform = `translateY(-${gap}px) ${currentTransform}`.trim();
						element.style.position = 'relative';
						element.style.zIndex = '500';
					}
				}
			} else if (state.dragIndex > newDropIndex) {
				// Moving up: shift elements between new and original position down
				for (let i = newDropIndex; i < state.dragIndex; i++) {
					if (i < items.length) {
						const element = items[i];
						const currentTransform = element.style.transform || '';
						const currentZIndex = element.style.zIndex || '';
						const currentPosition = element.style.position || '';
						state.shiftedElements.set(element, {
							transform: currentTransform,
							zIndex: currentZIndex,
							position: currentPosition
						});
						element.style.transform = `translateY(${gap}px) ${currentTransform}`.trim();
						element.style.position = 'relative';
						element.style.zIndex = '500';
					}
				}
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
			state.element.style.position = '';
			state.element.style.zIndex = '';
			state.element.style.opacity = '';
			state.element.style.transition = '';
			state.element.style.pointerEvents = '';
		}

		// Reset all shifted elements
		state.shiftedElements.forEach((originalStyles, element) => {
			element.style.transform = originalStyles.transform;
			element.style.zIndex = originalStyles.zIndex;
			element.style.position = originalStyles.position;
			element.style.transition = '';
		});
		state.shiftedElements.clear();

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
