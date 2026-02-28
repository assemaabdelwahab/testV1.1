export default function Avatar() {
  return (
    <div className="w-10 h-10 rounded-full border-2 border-accent-blue overflow-hidden bg-bg-card flex items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        className="w-8 h-8"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Hair */}
        <rect x="10" y="4" width="12" height="2" fill="#4A3728" />
        <rect x="8" y="6" width="16" height="2" fill="#4A3728" />
        <rect x="8" y="8" width="4" height="2" fill="#4A3728" />
        <rect x="20" y="8" width="4" height="2" fill="#4A3728" />
        {/* Skin */}
        <rect x="10" y="8" width="12" height="2" fill="#D4A574" />
        <rect x="8" y="10" width="16" height="2" fill="#D4A574" />
        <rect x="8" y="12" width="16" height="2" fill="#D4A574" />
        <rect x="10" y="14" width="12" height="2" fill="#D4A574" />
        <rect x="12" y="16" width="8" height="2" fill="#D4A574" />
        {/* Eyes */}
        <rect x="11" y="10" width="2" height="2" fill="#1E293B" />
        <rect x="19" y="10" width="2" height="2" fill="#1E293B" />
        {/* Mouth */}
        <rect x="13" y="14" width="6" height="1" fill="#B8705A" />
        {/* Shirt */}
        <rect x="8" y="18" width="16" height="2" fill="#3B82F6" />
        <rect x="6" y="20" width="20" height="2" fill="#3B82F6" />
        <rect x="6" y="22" width="20" height="4" fill="#3B82F6" />
        {/* Collar */}
        <rect x="14" y="18" width="4" height="2" fill="#2563EB" />
      </svg>
    </div>
  );
}
