<!-- Landing tool-card glyph: rising bars + a sparkle (upgrade calculator). -->
<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  {#each [10, 38, 66, 94] as x, i (i)}
    {@const h = 10 + i * 9}
    <rect
      {x}
      y={50 - h}
      width="22"
      height={h}
      rx="2"
      fill={i === 3 ? 'rgba(255,209,102,0.18)' : 'rgba(147,212,255,0.10)'}
      stroke={i === 3 ? 'rgba(255,209,102,0.55)' : 'rgba(147,212,255,0.3)'}
    />
  {/each}
  <g class="t-bob" style="transform-origin: 105px 6px;">
    <path
      d="M105 0.5 L106.5 4.9 L111.2 5 L107.5 7.8 L108.8 12.3 L105 9.6 L101.2 12.3 L102.5 7.8 L98.8 5 L103.5 4.9 Z"
      fill="rgba(255,209,102,0.7)"
    />
  </g>
</svg>
