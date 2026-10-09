import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ============================================================================
// BLOKIR ZOOM SEPENUHNYA (Pinch-to-zoom, Double-tap, Gesture, Ctrl+Wheel, Keyboard)
// ============================================================================

// 1. Blokir Safari gesture zoom (gesturestart, gesturechange, gestureend)
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// 2. Blokir Multi-touch pinch-to-zoom (2 jari atau lebih)
document.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// 3. Blokir Double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

// 4. Blokir Ctrl/Cmd + Mouse Wheel Zoom
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// 5. Blokir Keyboard Shortcut Zoom (Ctrl/Cmd + '+', '-', '0', '=')
document.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')
  ) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
