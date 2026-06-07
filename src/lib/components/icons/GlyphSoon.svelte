<!-- Landing ghost tool-card glyph: dashed placeholder jars ("more coming"). -->
<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  {#each [2, 46, 90] as x, i (i)}
    <g transform="translate({x}, 5)" opacity="0.35">
      <rect
        x="11"
        y="3"
        width="18"
        height="6"
        rx="1.5"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        stroke-width="1"
        stroke-dasharray="2 2"
      />
      <path
        d="M 5 16 Q 5 11 10 11 L 30 11 Q 35 11 35 16 L 35 46 Q 35 50 31 50 L 9 50 Q 5 50 5 46 Z"
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
    </g>
  {/each}
</svg>
