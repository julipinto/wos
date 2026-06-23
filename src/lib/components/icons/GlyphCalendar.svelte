<!-- Landing tool-card glyph: a calendar grid with one highlighted event day. -->
<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  <rect
    x="34"
    y="10"
    width="64"
    height="44"
    rx="6"
    fill="rgba(255,255,255,0.04)"
    stroke="rgba(255,255,255,0.18)"
  />
  <rect x="34" y="10" width="64" height="11" rx="6" fill="rgba(255,255,255,0.10)" />
  <line
    x1="46"
    y1="6"
    x2="46"
    y2="15"
    stroke="rgba(255,255,255,0.4)"
    stroke-width="2"
    stroke-linecap="round"
  />
  <line
    x1="86"
    y1="6"
    x2="86"
    y2="15"
    stroke="rgba(255,255,255,0.4)"
    stroke-width="2"
    stroke-linecap="round"
  />
  {#each [0, 1, 2, 3] as c (c)}
    {#each [0, 1] as r (r)}
      <rect
        x={42 + c * 13}
        y={28 + r * 12}
        width="7"
        height="7"
        rx="1.5"
        fill="rgba(255,255,255,0.12)"
      />
    {/each}
  {/each}
  <rect x="55" y="28" width="7" height="7" rx="1.5" fill="#fb923c">
    <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
  </rect>
  <rect x="68" y="40" width="7" height="7" rx="1.5" fill="#4ade80" />
</svg>
