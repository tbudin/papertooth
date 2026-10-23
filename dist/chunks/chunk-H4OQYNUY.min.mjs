/*! papertooth v0.4.0 | (c) 2026 Thomas Budin | MIT License | github.com/tbudin/papertooth */
import{j as m,k as v}from"./chunk-TR2LLKBK.min.mjs";var $={text:{density:.7},head:{rough:1,density:.8},graphite:{tooth:2.4,rough:.9},stamp:{wear:.55,rough:1.3,edge:.5,mottle:.5},smudge:{drag:4.2,blur:3.4,strength:.78},smear:{drag:7,blur:4.5,strength:.7},typewriter:{spread:.6,rough:1.2,uneven:.7,speckle:.5},colors:{ribbon:"#24262c",pen:"#213c6b",highlighter:"#fff04a"}},t=i=>(+i).toFixed(2);function p(i,e="#fff04a"){let r=m(e),n=m(i);return v(n.map((u,l)=>(u*.45+255*.55)*r[l]/255))}var b=(i,e)=>`<feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${t(i)} 0 0 0 ${t(e)}" result="density"/>`;function d(i,e,r,n){return`<filter id="${i}" x="-5%" y="-40%" width="${n?150:130}%" height="180%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.012 0.85" numOctaves="2" seed="${n?13:6}" result="streak"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="${t(e.blur)} 0.5" result="drag"/>
<feOffset in="drag" dx="${t(e.drag)}" dy="0" result="dragged"/>
<feDisplacementMap in="dragged" in2="streak" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="streaky"/>
<feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.75 0 0 0 -0.32" result="streakA"/>
<feComposite in="streaky" in2="streakA" operator="in" result="shape"/>
<feFlood flood-color="${r}" flood-opacity="${t(e.strength)}"/>
<feComposite in2="shape" operator="in" result="smear"/>`+(n?"":`<feComponentTransfer in="SourceGraphic" result="lifted"><feFuncA type="linear" slope="0.86"/></feComponentTransfer>
<feMerge><feMergeNode in="smear"/><feMergeNode in="lifted"/></feMerge>`)+"</filter>"}function M(i,e){e={...$.typewriter,...e};let r=.8-.16*e.speckle;return`<filter id="${i}" x="-4%" y="-20%" width="108%" height="140%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceGraphic" stdDeviation="${t(.12+e.spread*.6)}" result="soft"/>
<feComponentTransfer in="soft" result="spread"><feFuncA type="linear" slope="3.2" intercept="${t(-.35+e.spread*.1)}"/></feComponentTransfer>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="2" result="grain"/>
<feDisplacementMap in="spread" in2="grain" scale="${t(e.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="9" result="blot"/>
${b(1.4*e.uneven,1-.72*e.uneven)}
<feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="5" result="wear"/>
<feColorMatrix in="wear" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 ${t(1+14*r)}" result="holes"/>
<feComposite in="rough" in2="density" operator="in" result="inked"/>
<feComposite in="inked" in2="holes" operator="in"/>
</filter>`}function G(i,e){let r=e.contrast,n=e.grain,u=(o,a)=>`<feTurbulence type="fractalNoise" baseFrequency="${t(e.size)}" numOctaves="3" seed="${a}" result="${o}0"/>
<feColorMatrix in="${o}0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="${o}"/>`,l=(o,a,s,f,h=0,g=0)=>`<feComponentTransfer in="${o}" result="${f}a"><feFuncA type="linear" slope="22" intercept="${t(-22*a)}"/></feComponentTransfer>
<feFlood flood-color="${s}"/><feComposite in2="${f}a" operator="in" result="${f}i"/>
<feOffset in="${f}i" dx="${t(h)}" dy="${t(g)}" result="${f}"/>`,c=(o,a,s)=>`<feComposite in="${o}" in2="${a}" operator="arithmetic" k2="1" k3="${t(n)}" k4="${t(-n/2)}" result="${s}"/>`,x=`<filter id="${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`;if(e.mode==="tri"){let o=(s,f,h,g,C,k)=>`<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${f} 0 ${t(.5*r+.5+e.darken)}" result="${s}d"/>
${u(s+"n",h)}
${c(s+"d",s+"n",s+"v")}
${l(s+"v",.56,g,s,C,k)}`,a=e.offset;return x+`
${o("pb",`${t(-r)} 0 0`,e.seed,e.blue,a,0)}
${o("pr",`0 ${t(-r)} 0`,e.seed+7,e.red,0,a*.7)}
${o("py",`0 0 ${t(-r)}`,e.seed+13,e.yellow,-a*.6,-a*.4)}
<feBlend in="pr" in2="py" mode="multiply" result="pry"/>
<feBlend in="pb" in2="pry" mode="multiply"/>
</filter>`}return x+`
<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${t(-.2126*r)} ${t(-.7152*r)} ${t(-.0722*r)} 0 ${t(.5*r+.5+e.darken)}" result="dark"/>
${u("n",e.seed)}
${c("dark","n","v")}
${e.mode==="duo"&&e.ink2?l("v",.66,e.ink,"t1")+`
`+l("v",.4,e.ink2,"t2",e.offset,e.offset*.6)+'<feMerge><feMergeNode in="t2"/><feMergeNode in="t1"/></feMerge>':l("v",.5,e.ink,"t1")}
</filter>`}function F(i={}){let e={};for(let n in $)e[n]={...$[n],...i[n]||{}};let r=e.colors;return`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false" id="pt-filters">
<filter id="pt-ink-text" x="-4%" y="-12%" width="108%" height="124%">
<feTurbulence type="fractalNoise" baseFrequency="0.035 0.08" numOctaves="2" seed="11" result="blot"/>
${b(e.text.density,1-.64*e.text.density)}
<feComposite in="SourceGraphic" in2="density" operator="in"/>
</filter>
<filter id="pt-ink-head" x="-6%" y="-20%" width="112%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="4" result="grain"/>
<feDisplacementMap in="SourceGraphic" in2="grain" scale="${t(e.head.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="7" result="blot"/>
${b(e.head.density,1-.62*e.head.density)}
<feComposite in="rough" in2="density" operator="in"/>
</filter>
<filter id="pt-graphite" x="-5%" y="-20%" width="110%" height="140%">
<feTurbulence type="fractalNoise" baseFrequency="1.6 1.1" numOctaves="2" seed="3" result="tooth"/>
<feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${t(e.graphite.tooth)} 0 0 0 -0.5" result="toothA"/>
<feComposite in="SourceGraphic" in2="toothA" operator="in" result="lead"/>
<feDisplacementMap in="lead" in2="tooth" scale="${t(e.graphite.rough)}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="pt-stamp" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="21" result="fine"/>
<feDisplacementMap in="SourceGraphic" in2="fine" scale="${t(e.stamp.rough)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
<feGaussianBlur in="rough" stdDeviation="1.6" result="soft"/>
<feComposite in="rough" in2="soft" operator="arithmetic" k2="${t(1+e.stamp.edge)}" k3="${t(-e.stamp.edge*1.1)}" result="rim"/>
<feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="3" seed="4" result="mot"/>
<feColorMatrix in="mot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${t(e.stamp.mottle*2)} 0 0 0 ${t(1-e.stamp.mottle*1.1)}" result="mottle"/>
<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="paper"/>
<feColorMatrix in="paper" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -12 0 0 0 ${t(1+12*(.76-.22*e.stamp.wear))}" result="tooth"/>
<feComposite in="rim" in2="mottle" operator="in" result="inked"/>
<feComposite in="inked" in2="tooth" operator="in" result="pressed"/>
<feGaussianBlur in="pressed" stdDeviation="0.35" result="bleed"/>
<feMerge><feMergeNode in="bleed"/><feMergeNode in="pressed"/></feMerge>
</filter>
${d("pt-smudge-ribbon",e.smudge,p(r.ribbon,r.highlighter))}
${d("pt-smudge-pen",e.smudge,p(r.pen,r.highlighter))}
${d("pt-smear-ribbon",e.smear,p(r.ribbon,r.highlighter),!0)}
${d("pt-smear-pen",e.smear,p(r.pen,r.highlighter),!0)}
${M("pt-typewriter",e.typewriter)}
</svg>`}var y={};function T(i={},e=document){for(let c in i)y[c]={...y[c]||{},...i[c]};let r=F(y),n=e.getElementById("pt-filters"),u=e.createElement("div");u.innerHTML=r;let l=u.firstElementChild;return n?n.replaceWith(l):e.body.prepend(l),e.documentElement.dataset.ptFilters="",l}export{$ as a,p as b,M as c,G as d,F as e,T as f};
