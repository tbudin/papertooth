// Rendered in Node by the global setup; the browser then hydrates the same tree.
import { renderToString } from 'react-dom/server';
import { HydrateApp } from './components.jsx';

// with a handler, as an app has on both sides: without one the cells render read-only
export const html = renderToString(<HydrateApp onToggle={() => {}} />);
