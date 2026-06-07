<!-- Landing tool-card glyph: scattered dots over launch pads + a bobbing ball. -->
<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  {#each [22, 44, 66, 88, 110, 33, 55, 77, 99, 44, 66, 88] as cx, i (i)}
    {@const cy = i < 5 ? 16 : i < 9 ? 30 : 44}
    <circle {cx} {cy} r="2.2" fill="rgba(205,233,255,0.55)" />
  {/each}
  {#each [22, 46, 70, 94] as x, i (i)}
    <rect
      x={x - 1}
      y="50"
      width="20"
      height="8"
      rx="1.5"
      fill={i === 1 ? 'rgba(255,209,102,0.16)' : 'rgba(147,212,255,0.08)'}
      stroke={i === 1 ? 'rgba(255,209,102,0.5)' : 'rgba(147,212,255,0.25)'}
    />
  {/each}
  <g class="t-bob" style="transform-origin: 66px 8px;">
    <circle cx="66" cy="8" r="4" fill="#fff" />
  </g>
</svg>
