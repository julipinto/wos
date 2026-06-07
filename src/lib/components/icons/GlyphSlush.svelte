<script lang="ts">
  // Landing tool-card glyph: three bobbing slush jars (event tool).
  const jars: { x: number; hex: string; dark: string; delay: number }[] = [
    { x: 2, hex: '#ef4444', dark: '#a83333', delay: 0 },
    { x: 46, hex: '#60a5fa', dark: '#3a78c4', delay: 0.3 },
    { x: 90, hex: '#4ade80', dark: '#2c8a4f', delay: 0.6 }
  ];
</script>

<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  {#each jars as jar, i (i)}
    <g transform="translate({jar.x}, 5)">
      <g class="t-bob" style="animation-delay: {jar.delay}s;">
        <rect x="10" y="2" width="20" height="7" rx="1.5" fill="#2a2f4a" />
        <rect x="10" y="2" width="20" height="2" fill="rgba(255,255,255,0.18)" />
        <rect x="10" y="7" width="20" height="2" fill="rgba(0,0,0,0.25)" />
        <rect x="12" y="9" width="16" height="3" fill={jar.dark} />
        <path
          d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill={jar.hex}
        />
        <path
          d="M 5 16 Q 5 12 10 12 L 30 12 Q 35 12 35 16 L 35 18 L 5 18 Z"
          fill="rgba(0,0,0,0.18)"
        />
        <ellipse cx="13" cy="30" rx="2.5" ry="11" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="13" cy="30" rx="1" ry="9" fill="rgba(255,255,255,0.4)" />
        <rect x="9" y="28" width="22" height="10" fill="rgba(255,255,255,0.08)" />
        <rect x="9" y="28" width="22" height="1" fill="rgba(255,255,255,0.15)" />
        <rect x="9" y="37" width="22" height="1" fill="rgba(0,0,0,0.15)" />
        <path
          d="M 5 44 L 35 44 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
          fill="rgba(0,0,0,0.2)"
        />
      </g>
    </g>
  {/each}
</svg>
