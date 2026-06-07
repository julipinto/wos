<!-- Landing tool-card glyph: a grid with a highlighted cell + banner dot. -->
<svg viewBox="0 0 132 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="hg" width="13" height="13" patternUnits="userSpaceOnUse">
      <rect width="13" height="13" fill="none" stroke="rgba(147,212,255,0.12)" />
    </pattern>
  </defs>
  <rect x="9" y="5" width="104" height="52" fill="url(#hg)" />
  {#each [22, 35, 48] as x, i (i)}
    <rect {x} y="18" width="13" height="13" fill="rgba(147,212,255,0.16)" />
    <rect {x} y="31" width="13" height="13" fill="rgba(147,212,255,0.16)" />
  {/each}
  <rect x="35" y="18" width="13" height="13" fill="rgba(147,212,255,0.5)" />
  <g class="t-bob" style="transform-origin: 54.5px 37.5px;">
    <circle cx="54.5" cy="37.5" r="2.6" fill="#ffd166" />
  </g>
</svg>
