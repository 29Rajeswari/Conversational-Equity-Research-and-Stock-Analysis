/**
 * src/components/ConnectionStatus.jsx  ← NEW component
 *
 * Shows WebSocket connection status in the navbar / header.
 * Drop alongside existing Navbar.jsx — do not modify it.
 *
 * Usage (add inside your existing Navbar.jsx if desired, or standalone):
 *   <ConnectionStatus />
 */

import { useWebSocket } from '@/hooks/useWebSocket';

const STATES = {
  connected:    { dot: '#3DD9D0', label: 'Live',        pulse: true  },
  connecting:   { dot: '#F59E0B', label: 'Connecting…', pulse: true  },
  disconnected: { dot: '#EF4444', label: 'Offline',     pulse: false },
};

export default function ConnectionStatus() {
  const { status } = useWebSocket();
  const { dot, label, pulse } = STATES[status] ?? STATES.disconnected;

  return (
    <div className="conn-status" title={`WebSocket: ${status}`}>
      <span
        className={`conn-status__dot ${pulse ? 'conn-status__dot--pulse' : ''}`}
        style={{ background: dot }}
      />
      <span className="conn-status__label">{label}</span>
    </div>
  );
}
