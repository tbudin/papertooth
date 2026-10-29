/*! papertooth v0.5.1 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
var s=t=>String(Math.round(t*10)/10),O=t=>'url("data:image/svg+xml,'+encodeURIComponent(t)+'")',R=(t,e,r)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${s(t)}" height="${s(e)}" viewBox="0 0 ${s(t)} ${s(e)}" preserveAspectRatio="none">${r}</svg>`;function q(t){let e=t|0;return function(){e=e+1831565813|0;let r=Math.imul(e^e>>>15,1|e);return r=r+Math.imul(r^r>>>7,61|r)^r,((r^r>>>14)>>>0)/4294967296}}var C=null,w=0;function B(t){C=t==null?null:t|0,w=0}function D(t){return t.dataset.seed||(t.dataset.seed=String(C==null?Math.random()*1e9|0:C*7919+ ++w)),t.dataset.seed|0}function A(t,e){let r=e?`M${s(t[0][0])} ${s(t[0][1])}`:"";for(let i=0;i<t.length-1;i++){let f=t[i-1]||t[i],o=t[i],a=t[i+1],d=t[i+2]||a;r+=` C${s(o[0]+(a[0]-f[0])/6)} ${s(o[1]+(a[1]-f[1])/6)} ${s(a[0]-(d[0]-o[0])/6)} ${s(a[1]-(d[1]-o[1])/6)} ${s(a[0])} ${s(a[1])}`}return r}var E=(t,e,r)=>[t[0]+(e()-.5)*r,t[1]+(e()-.5)*r];function j(t,e,r,i,f){let o=e[0]-t[0],a=e[1]-t[1],d=Math.hypot(o,a)||1,u=o/d,c=a/d,l=[t[0]-u*i*r(),t[1]-c*i*r()],p=[e[0]+u*i*(.4+r()),e[1]+c*i*(.4+r())],g=[(l[0]+p[0])/2-c*(r()-.5)*f,(l[1]+p[1])/2+u*(r()-.5)*f];return`M${s(l[0])} ${s(l[1])} Q${s(g[0])} ${s(g[1])} ${s(p[0])} ${s(p[1])}`}var h=null;function m(t){if(t=String(t).trim(),/^#[\da-f]{3,8}$/i.test(t)){let e=t.length<7?Array.from(t.slice(1,4),r=>r+r).join(""):t.slice(1,7);return[0,2,4].map(r=>parseInt(e.slice(r,r+2),16))}return/^rgba?\([^%]*\)$/i.test(t)?t.match(/[\d.]+/g).slice(0,3).map(Number):(h=h||document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),h.clearRect(0,0,1,1),h.fillStyle="#000",h.fillStyle=t,h.fillRect(0,0,1,1),Array.from(h.getImageData(0,0,1,1).data.subarray(0,3)))}var M=t=>"#"+t.map(e=>Math.max(0,Math.min(255,Math.round(e))).toString(16).padStart(2,"0")).join(""),H=t=>M(m(t)),I=t=>t.dataset.hover||(t.classList.contains("pt-btn")&&!t.classList.contains("pt-btn--outline")?"underline":""),L=(t,e)=>getComputedStyle(t).getPropertyValue(e).trim();var x={text:{density:.7},head:{rough:1,density:.8},graphite:{tooth:2.4,rough:.9},brush:{dry:.5,rough:1.2},stamp:{wear:.55,rough:1.3,edge:.5,mottle:.5},smudge:{drag:4.2,blur:3.4,strength:.78},smear:{drag:7,blur:4.5,strength:.7},typewriter:{spread:.6,rough:1.2,uneven:.7,speckle:.5},colors:{ribbon:"#24262c",pen:"#213c6b",highlighter:"#fff04a"}},n=t=>(+t).toFixed(2);function y(t,e="#fff04a"){let r=m(e),i=m(t);return M(i.map((f,o)=>(f*.45+255*.55)*r[o]/255))}var b=(t,e)=>`<feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n(t)} 0 0 0 ${n(e)}" result="density"/>`;function $(t,e,r,i){return`<filter id="${t}" x="-5%" y="-40%" width="${i?150:130}%" height="180%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.012 0.85" numOctaves="2" seed="${i?13:6}" result="streak"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="${n(e.blur)} 0.5" result="drag"/>
<feOffset in="drag" dx="${n(e.drag)}" dy="0" result="dragged"/>
<feDisplacementMap in="dragged" in2="streak" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="streaky"/>
<feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.75 0 0 0 -0.32" result="streakA"/>
<feComposite in="streaky" in2="streakA" operator="in" result="shape"/>
<feFlood flood-color="${r}" flood-opacity="${n(e.strength)}"/>
<feComposite in2="shape" operator="in" result="smear"/>`+(i?"":`<feComponentTransfer in="SourceGraphic" result="lifted"><feFuncA type="linear" slope="0.86"/></feComponentTransfer>
<feMerge><feMergeNode in="smear"/><feMergeNode in="lifted"/></feMerge>`)+"</filter>"}function G(t,e){e={...x.brush,...e};let r=.74-.18*e.dry;return`<filter id="${t}" x="-10%" y="-30%" width="120%" height="160%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="5" result="grain"/>
<feDisplacementMap in="SourceGraphic" in2="grain" scale="${n(e.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.04 0.85" numOctaves="2" seed="8" result="hair"/>
<feColorMatrix in="hair" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 ${n(1+10*r)}" result="dry"/>
<feComposite in="rough" in2="dry" operator="in" result="kasure"/>
<feTurbulence type="fractalNoise" baseFrequency="0.025 0.04" numOctaves="2" seed="2" result="blot"/>
${b(.9,.45)}
<feComposite in="kasure" in2="density" operator="in"/>
</filter>`}function T(t,e){e={...x.typewriter,...e};let r=.8-.16*e.speckle;return`<filter id="${t}" x="-4%" y="-20%" width="108%" height="140%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="${n(.12+e.spread*.6)}" result="soft"/>
<feComponentTransfer in="soft" result="spread"><feFuncA type="linear" slope="3.2" intercept="${n(-.35+e.spread*.1)}"/></feComponentTransfer>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2" result="grain"/>
<feDisplacementMap in="spread" in2="grain" scale="${n(e.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="9" result="blot"/>
${b(1.4*e.uneven,1-.72*e.uneven)}
<feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="5" result="wear"/>
<feColorMatrix in="wear" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 ${n(1+14*r)}" result="holes"/>
<feComposite in="rough" in2="density" operator="in" result="inked"/>
<feComposite in="inked" in2="holes" operator="in"/>
</filter>`}function V(t,e){let r=e.contrast,i=e.grain,f=(u,c)=>`<feTurbulence type="fractalNoise" baseFrequency="${n(e.size)}" numOctaves="3" seed="${c}" result="${u}0"/>
<feColorMatrix in="${u}0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="${u}"/>`,o=(u,c,l,p,g=0,v=0)=>`<feComponentTransfer in="${u}" result="${p}a"><feFuncA type="linear" slope="22" intercept="${n(-22*c)}"/></feComponentTransfer>
<feFlood flood-color="${l}"/><feComposite in2="${p}a" operator="in" result="${p}i"/>
<feOffset in="${p}i" dx="${n(g)}" dy="${n(v)}" result="${p}"/>`,a=(u,c,l)=>`<feComposite in="${u}" in2="${c}" operator="arithmetic" k2="1" k3="${n(i)}" k4="${n(-i/2)}" result="${l}"/>`,d=`<filter id="${t}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`;if(e.mode==="tri"){let u=(l,p,g,v,S,F)=>`<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${p} 0 ${n(.5*r+.5+e.darken)}" result="${l}d"/>
${f(l+"n",g)}
${a(l+"d",l+"n",l+"v")}
${o(l+"v",.56,v,l,S,F)}`,c=e.offset;return d+`
${u("pb",`${n(-r)} 0 0`,e.seed,e.blue,c,0)}
${u("pr",`0 ${n(-r)} 0`,e.seed+7,e.red,0,c*.7)}
${u("py",`0 0 ${n(-r)}`,e.seed+13,e.yellow,-c*.6,-c*.4)}
<feBlend in="pr" in2="py" mode="multiply" result="pry"/>
<feBlend in="pb" in2="pry" mode="multiply"/>
</filter>`}return d+`
<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n(-.2126*r)} ${n(-.7152*r)} ${n(-.0722*r)} 0 ${n(.5*r+.5+e.darken)}" result="dark"/>
${f("n",e.seed)}
${a("dark","n","v")}
${e.mode==="duo"&&e.ink2?o("v",.66,e.ink,"t1")+`
`+o("v",.4,e.ink2,"t2",e.offset,e.offset*.6)+'<feMerge><feMergeNode in="t2"/><feMergeNode in="t1"/></feMerge>':o("v",.5,e.ink,"t1")}
</filter>`}function N(t={}){let e={};for(let i in x)e[i]={...x[i],...t[i]};let r=e.colors;return`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false" id="pt-filters">
<filter id="pt-ink-text" x="-4%" y="-12%" width="108%" height="124%">
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.08" numOctaves="2" seed="11" result="blot"/>
${b(e.text.density,1-.64*e.text.density)}
<feComposite in="SourceGraphic" in2="density" operator="in"/>
</filter>
<filter id="pt-ink-head" x="-6%" y="-20%" width="112%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="4" result="grain"/>
<feDisplacementMap in="SourceGraphic" in2="grain" scale="${n(e.head.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="7" result="blot"/>
${b(e.head.density,1-.62*e.head.density)}
<feComposite in="rough" in2="density" operator="in"/>
</filter>
<filter id="pt-graphite" x="-5%" y="-20%" width="110%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.6 1.1" numOctaves="2" seed="3" result="tooth"/>
<feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n(e.graphite.tooth)} 0 0 0 -0.5" result="toothA"/>
<feComposite in="SourceGraphic" in2="toothA" operator="in" result="lead"/>
<feDisplacementMap in="lead" in2="tooth" scale="${n(e.graphite.rough)}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="pt-stamp" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="21" result="fine"/>
<feDisplacementMap in="SourceGraphic" in2="fine" scale="${n(e.stamp.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feGaussianBlur in="rough" stdDeviation="1.6" result="soft"/>
<feComposite in="rough" in2="soft" operator="arithmetic" k2="${n(1+e.stamp.edge)}" k3="${n(-e.stamp.edge*1.1)}" result="rim"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="3" seed="4" result="mot"/>
<feColorMatrix in="mot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n(e.stamp.mottle*2)} 0 0 0 ${n(1-e.stamp.mottle*1.1)}" result="mottle"/>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="paper"/>
<feColorMatrix in="paper" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 ${n(1+12*(.76-.22*e.stamp.wear))}" result="tooth"/>
<feComposite in="rim" in2="mottle" operator="in" result="inked"/>
<feComposite in="inked" in2="tooth" operator="in" result="pressed"/>
<feGaussianBlur in="pressed" stdDeviation="0.35" result="bleed"/>
<feMerge><feMergeNode in="bleed"/><feMergeNode in="pressed"/></feMerge>
</filter>
${$("pt-smudge-ribbon",e.smudge,y(r.ribbon,r.highlighter))}
${$("pt-smudge-pen",e.smudge,y(r.pen,r.highlighter))}
${$("pt-smear-ribbon",e.smear,y(r.ribbon,r.highlighter),!0)}
${$("pt-smear-pen",e.smear,y(r.pen,r.highlighter),!0)}
${T("pt-typewriter",e.typewriter)}
${G("pt-brush",e.brush)}
</svg>`}var k={};function z(t={},e=document){for(let a in t)k[a]={...k[a],...t[a]};let r=N(k),i=e.getElementById("pt-filters"),f=e.createElement("div");f.innerHTML=r;let o=f.firstElementChild;return i?i.replaceWith(o):e.body.prepend(o),e.documentElement.dataset.ptFilters="",o}export{s as a,O as b,R as c,q as d,B as e,D as f,A as g,E as h,j as i,m as j,H as k,I as l,L as m,x as n,y as o,G as p,T as q,V as r,N as s,z as t};
