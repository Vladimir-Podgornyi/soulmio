'use client'

export function LoginAnimations() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden select-none"
      aria-hidden="true"
      style={{ opacity: 0.3 }}
    >
      <style>{`
        @keyframes sk-draw  { to { stroke-dashoffset: 0 } }
        @keyframes sk-float {
          0%,100% { transform: translateY(0) }
          50%     { transform: translateY(-8px) }
        }
        @keyframes sk-glow {
          0%,100% { opacity: 0.1 }
          50%     { opacity: 0.55 }
        }
        @keyframes sk-lid-open {
          0%   { transform: translateY(0);    opacity: 1 }
          100% { transform: translateY(-34px); opacity: 0 }
        }
        @keyframes sk-sp1 {
          0%   { opacity:0; transform: translate(0,0)      scale(0) }
          100% { opacity:1; transform: translate(-22px,-30px) scale(1) }
        }
        @keyframes sk-sp2 {
          0%   { opacity:0; transform: translate(0,0)      scale(0) }
          100% { opacity:1; transform: translate(14px,-36px) scale(0.85) }
        }
        @keyframes sk-sp3 {
          0%   { opacity:0; transform: translate(0,0)     scale(0) }
          100% { opacity:1; transform: translate(-6px,-46px) scale(0.7) }
        }
        @keyframes sk-car-drive {
          0%   { transform: translateX(0);    opacity: 1 }
          100% { transform: translateX(218px); opacity: 1 }
        }
        @keyframes sk-fadein {
          from { opacity:0 } to { opacity:1 }
        }

        /* Notebook */
        .sk-nb        { animation: sk-float 4.2s ease-in-out infinite 3.2s }
        .sk-nb-cover  { stroke-dasharray:600; stroke-dashoffset:600; animation: sk-draw .9s ease forwards }
        .sk-nb-inner  { stroke-dasharray:400; stroke-dashoffset:400; animation: sk-draw .6s ease forwards .4s }
        .sk-nb-coil   { stroke-dasharray:280; stroke-dashoffset:280; animation: sk-draw .7s ease forwards .8s }
        .sk-nb-l1     { stroke-dasharray:100; stroke-dashoffset:100; animation: sk-draw .35s ease forwards 1.5s }
        .sk-nb-l2     { stroke-dasharray:90;  stroke-dashoffset:90;  animation: sk-draw .35s ease forwards 1.95s }
        .sk-nb-l3     { stroke-dasharray:80;  stroke-dashoffset:80;  animation: sk-draw .35s ease forwards 2.4s }
        .sk-nb-heart  { stroke-dasharray:140; stroke-dashoffset:140; animation: sk-draw .55s ease forwards 2.85s }

        /* Lightbulb */
        .sk-lb        { animation: sk-float 3.6s ease-in-out infinite 3.2s }
        .sk-lb-bulb   { stroke-dasharray:500; stroke-dashoffset:500; animation: sk-draw 1s ease forwards .3s }
        .sk-lb-base1  { stroke-dasharray:120; stroke-dashoffset:120; animation: sk-draw .3s ease forwards 1.3s }
        .sk-lb-base2  { stroke-dasharray:120; stroke-dashoffset:120; animation: sk-draw .3s ease forwards 1.6s }
        .sk-lb-base3  { stroke-dasharray:120; stroke-dashoffset:120; animation: sk-draw .3s ease forwards 1.9s }
        .sk-lb-fil    { stroke-dasharray:100; stroke-dashoffset:100; animation: sk-draw .45s ease forwards 1.3s }
        .sk-lb-r1     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.1s }
        .sk-lb-r2     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.2s }
        .sk-lb-r3     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.3s }
        .sk-lb-r4     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.4s }
        .sk-lb-r5     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.5s }
        .sk-lb-r6     { stroke-dasharray:32; stroke-dashoffset:32; animation: sk-draw .2s ease forwards 2.6s }
        .sk-lb-glow   { opacity:0; animation: sk-glow 2.2s ease-in-out infinite 2.6s }

        /* Gift */
        .sk-gf        { animation: sk-float 4.8s ease-in-out infinite 4.2s }
        .sk-gf-box    { stroke-dasharray:600; stroke-dashoffset:600; animation: sk-draw 1s ease forwards .5s }
        .sk-gf-rib    { stroke-dasharray:250; stroke-dashoffset:250; animation: sk-draw .5s ease forwards 1.5s }
        .sk-gf-bow    { stroke-dasharray:450; stroke-dashoffset:450; animation: sk-draw .9s ease forwards 2s }
        .sk-gf-lid    { stroke-dasharray:500; stroke-dashoffset:500; animation: sk-draw .6s ease forwards .5s }
        .sk-gf-lid-mv { animation: sk-lid-open .55s ease forwards 2.95s }
        .sk-gf-sp1    { opacity:0; animation: sk-sp1 .5s ease forwards 3.5s }
        .sk-gf-sp2    { opacity:0; animation: sk-sp2 .5s ease forwards 3.7s }
        .sk-gf-sp3    { opacity:0; animation: sk-sp3 .4s ease forwards 3.9s }

        /* Car */
        .sk-cr-road   { opacity:0; animation: sk-fadein .8s ease forwards .8s }
        .sk-cr-ptA    { opacity:0; animation: sk-fadein .35s ease forwards 1.6s }
        .sk-cr-rest   { opacity:0; animation: sk-fadein .5s ease forwards 5.1s }
        .sk-cr-car    { animation: sk-car-drive 3.2s cubic-bezier(.4,0,.6,1) forwards 2s }
      `}</style>

      {/* ── NOTEBOOK — top left ── */}
      <div className="absolute left-[3%] top-[7%] scale-90 md:scale-100">
        <svg className="sk-nb" width="148" height="130" viewBox="0 0 148 130" fill="none"
          stroke="#E8735A" strokeLinecap="round" strokeLinejoin="round">
          {/* Cover */}
          <path className="sk-nb-cover"
            d="M28 8 Q26 6 24 8 L24 120 Q24 122 26 122 L122 122 Q124 121 124 119 L124 11 Q123 8 121 8 Z"
            strokeWidth="2.5"/>
          {/* Page */}
          <path className="sk-nb-inner"
            d="M30 13 L120 13 L120 119 L30 119 Z"
            strokeWidth="1" opacity="0.35"/>
          {/* Spiral coil */}
          <path className="sk-nb-coil"
            d="M24 24 Q16 24 16 30 Q16 36 24 36
               M24 46 Q16 46 16 52 Q16 58 24 58
               M24 68 Q16 68 16 74 Q16 80 24 80
               M24 90 Q16 90 16 96 Q16 102 24 102"
            strokeWidth="1.8"/>
          {/* Text lines */}
          <line className="sk-nb-l1" x1="38" y1="40"  x2="112" y2="40"  strokeWidth="1.5"/>
          <line className="sk-nb-l2" x1="38" y1="58"  x2="104" y2="58"  strokeWidth="1.5"/>
          <line className="sk-nb-l3" x1="38" y1="76"  x2="98"  y2="76"  strokeWidth="1.5"/>
          {/* Heart on last line */}
          <path className="sk-nb-heart"
            d="M38 97 C38 92 45 90 50 96 C55 90 62 92 62 97 C62 103 50 112 50 112 C50 112 38 103 38 97"
            strokeWidth="2"/>
        </svg>
      </div>

      {/* ── LIGHTBULB — top right ── */}
      <div className="absolute right-[3%] top-[7%] scale-90 md:scale-100">
        <svg className="sk-lb" width="106" height="138" viewBox="0 0 106 138" fill="none"
          stroke="#E8735A" strokeLinecap="round" strokeLinejoin="round">
          {/* Soft glow fill */}
          <ellipse className="sk-lb-glow" cx="53" cy="56" rx="25" ry="30" fill="#E8735A" stroke="none"/>
          {/* Bulb outline */}
          <path className="sk-lb-bulb"
            d="M53 88 C34 88 22 73 22 58 C22 40 36 26 53 26 C70 26 84 40 84 58 C84 73 72 88 53 88 Z
               M44 88 L44 95 Q44 100 53 100 Q62 100 62 95 L62 88"
            strokeWidth="2"/>
          {/* Screw threads */}
          <line className="sk-lb-base1" x1="44" y1="95" x2="62" y2="95" strokeWidth="1.5"/>
          <line className="sk-lb-base2" x1="45" y1="100" x2="61" y2="100" strokeWidth="1.5"/>
          <line className="sk-lb-base3" x1="46" y1="105" x2="60" y2="105" strokeWidth="1.5"/>
          {/* Filament W */}
          <path className="sk-lb-fil"
            d="M38 68 Q41 59 45 68 Q49 59 53 68 Q57 59 61 68 Q65 59 68 68"
            strokeWidth="1.5"/>
          {/* Rays */}
          <line className="sk-lb-r1" x1="53" y1="20" x2="53" y2="11" strokeWidth="1.5"/>
          <line className="sk-lb-r2" x1="78" y1="32" x2="85" y2="25" strokeWidth="1.5"/>
          <line className="sk-lb-r3" x1="89" y1="58" x2="98" y2="58" strokeWidth="1.5"/>
          <line className="sk-lb-r4" x1="78" y1="84" x2="85" y2="91" strokeWidth="1.5"/>
          <line className="sk-lb-r5" x1="28" y1="32" x2="21" y2="25" strokeWidth="1.5"/>
          <line className="sk-lb-r6" x1="17" y1="58" x2="8"  y2="58" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* ── GIFT BOX — bottom right ── */}
      <div className="absolute right-[3%] bottom-[8%] scale-90 md:scale-100">
        <svg className="sk-gf" width="136" height="148" viewBox="0 0 136 148" fill="none"
          stroke="#E8735A" strokeLinecap="round" strokeLinejoin="round">
          {/* Sparkles (hidden, pop after lid opens) */}
          <g className="sk-gf-sp1">
            <path d="M68 72 L71 63 L74 72 L83 72 L76 78 L79 87 L72 81 L65 87 L68 78 L61 72 Z" strokeWidth="1.5"/>
          </g>
          <g className="sk-gf-sp2">
            <path d="M84 60 L86 54 L88 60 L94 60 L89 64 L91 70 L86 66 L81 70 L83 64 L78 60 Z" strokeWidth="1.2"/>
          </g>
          <g className="sk-gf-sp3">
            {/* Mini starburst */}
            <circle cx="76" cy="52" r="4" strokeWidth="1.5"/>
            <line x1="76" y1="45" x2="76" y2="42" strokeWidth="1.2"/>
            <line x1="83" y1="52" x2="86" y2="52" strokeWidth="1.2"/>
            <line x1="76" y1="59" x2="76" y2="62" strokeWidth="1.2"/>
            <line x1="69" y1="52" x2="66" y2="52" strokeWidth="1.2"/>
            <line x1="81" y1="47" x2="83" y2="45" strokeWidth="1.2"/>
            <line x1="71" y1="47" x2="69" y2="45" strokeWidth="1.2"/>
          </g>
          {/* Box body */}
          <rect className="sk-gf-box" x="16" y="88" width="104" height="56" rx="3" strokeWidth="2"/>
          {/* Ribbons */}
          <line className="sk-gf-rib" x1="68" y1="88"  x2="68"  y2="144" strokeWidth="1.5"/>
          <line className="sk-gf-rib" x1="16" y1="116" x2="120" y2="116" strokeWidth="1.5"/>
          {/* Bow */}
          <path className="sk-gf-bow"
            d="M42 88 Q28 68 42 63 Q56 58 68 78
               Q80 58 94 63 Q108 68 94 88"
            strokeWidth="2"/>
          {/* Lid — draws on, then flies off */}
          <g className="sk-gf-lid-mv">
            <rect className="sk-gf-lid" x="10" y="77" width="116" height="20" rx="3" strokeWidth="2"/>
          </g>
        </svg>
      </div>

      {/* ── CAR A→B — bottom, desktop only ── */}
      <div className="absolute bottom-[5%] left-[6%] hidden md:block">
        <svg width="348" height="74" viewBox="0 0 348 74" fill="none"
          stroke="#E8735A" strokeLinecap="round" strokeLinejoin="round">
          {/* Dashed road */}
          <path className="sk-cr-road"
            d="M8 58 Q174 55 340 58"
            strokeWidth="1.8" strokeDasharray="10 7"/>
          {/* Point A */}
          <g className="sk-cr-ptA">
            <circle cx="22" cy="48" r="11" strokeWidth="1.5"/>
            <text x="16" y="52" fontSize="11" fontWeight="bold"
              fill="#E8735A" stroke="none" fontFamily="sans-serif">A</text>
          </g>
          {/* Restaurant (Point B) */}
          <g className="sk-cr-rest">
            {/* Building */}
            <rect x="306" y="24" width="26" height="34" rx="2" strokeWidth="1.5"/>
            <line x1="306" y1="36" x2="332" y2="36" strokeWidth="1.2"/>
            {/* Fork */}
            <line x1="313" y1="24" x2="313" y2="17" strokeWidth="1.5"/>
            <line x1="318" y1="24" x2="318" y2="14" strokeWidth="1.5"/>
            <line x1="323" y1="24" x2="323" y2="17" strokeWidth="1.5"/>
            {/* Knife */}
            <path d="M318 24 Q320 22 320 19 L320 14" strokeWidth="1.2"/>
            {/* Door */}
            <rect x="314" y="44" width="10" height="14" rx="1" strokeWidth="1.2"/>
            {/* "B" label */}
            <circle cx="319" cy="11" r="9" strokeWidth="1.5"/>
            <text x="314" y="15" fontSize="10" fontWeight="bold"
              fill="#E8735A" stroke="none" fontFamily="sans-serif">B</text>
          </g>
          {/* Car */}
          <g className="sk-cr-car">
            {/* Body */}
            <rect x="8" y="40" width="50" height="18" rx="5" strokeWidth="1.8"/>
            {/* Roof cabin */}
            <path d="M18 40 L23 27 L50 27 L57 40" strokeWidth="1.8"/>
            {/* Window */}
            <path d="M25 40 L29 29 L48 29 L53 40" strokeWidth="1.1" opacity="0.55"/>
            {/* Wheels */}
            <circle cx="22" cy="58" r="8" strokeWidth="1.8"/>
            <circle cx="48" cy="58" r="8" strokeWidth="1.8"/>
            {/* Headlight */}
            <circle cx="57" cy="46" r="2.5" strokeWidth="1.2"/>
            {/* Exhaust smoke puffs */}
            <path d="M8 50 Q2 50 1 47 Q0 44 4 43" strokeWidth="1.2"/>
            <circle cx="0" cy="40" r="2" strokeWidth="1" opacity="0.5"/>
          </g>
        </svg>
      </div>
    </div>
  )
}
