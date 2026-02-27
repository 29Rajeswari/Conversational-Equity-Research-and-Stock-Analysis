/**
 * src/components/LiveBadge.jsx  ← NEW component
 *
 * Animated "LIVE" indicator dot.
 * Shows green pulsing when connected via WebSocket,
 * grey static when using HTTP polling.
 *
 * Usage:
 *   <LiveBadge live={isLive} />
 */

export default function LiveBadge({ live = false }) {
  return (
    <span className={`live-badge ${live ? 'live-badge--on' : 'live-badge--off'}`}>
      <span className="live-badge__dot" />
      {live ? 'LIVE' : 'DELAYED'}
    </span>
  );
}
