// Hacky way of putting `react-rnd` into a dragging or resizing state right
// after it's been mounted in the DOM. Ideally, we'll replace this with props
// controlled in React but, for now, this is the best solution.
//
// We simply re-trigger the original `onMouseDown` event after the `react-rnd`
// is mounted in the DOM and allow the event to bubble upwards into the RND.
export interface MouseEventHackData {
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
}

// Where to trigger the event:
// 1. `top` - The top resizer.
// 2. `middle` - The middle of the RND (to start dragging).
// 3. `bottom` - The bottom resizer.
export type MouseEventHackTarget = 'top' | 'middle' | 'bottom';
