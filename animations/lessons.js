'use strict';
// Shared math functions are also exercised by the offline validation script.
const CalculusMath = {
  secant: (a,h) => a+h/2,
  taylor: (kind,x,a,n) => {
    let sum=0,power=1,factorial=1;
    for(let k=0;k<=n;k++){
      if(k){power*=x-a;factorial*=k;}
      const derivative=kind==='exp'?Math.exp(a):Math.sin(a+k*Math.PI/2);
      sum+=derivative*power/factorial;
    }
    return sum;
  },
  safeDelta: epsilon => epsilon/(Math.sqrt(1+epsilon)+1),
  deltaWorks: (epsilon,delta) => delta*(2+delta)<=epsilon+1e-12
};
if(typeof module!=='undefined') module.exports=CalculusMath;
if(typeof document!=='undefined') (()=>{
const $=id=>document.getElementById(id),svg=$('plot');
const colors={curve:'#202124',accent:'#7a1838',blue:'#176d9c',green:'#18734d',red:'#b63736',grid:'#e6e6e8',muted:'#666a70'};
let lesson='',state={},frame=0,playing=false,lastAnnouncement='';
const initial={derivatives:{a:1,h:1.5},taylor:{kind:'sin',a:0,n:1,x:2},limits:{example:"smooth",epsilon:.6,delta:.7}};
const content={
 derivatives:{title:'Derivatives: from secant to tangent',intro:'Two points give an average rate of change. Bring them together to see the instantaneous rate at A.',formula:'f(x) = x²/2     •     f′(a) = limₕ→₀ [f(a + h) − f(a)] / h = a',question:'Move A to the bottom of the parabola. Why is its tangent horizontal? Then choose a negative h and approach from the left.',explanation:'<p>The secant joins A = (a, f(a)) and B = (a + h, f(a + h)). Its slope is the vertical change divided by the horizontal change. Here it equals a + h/2 for h ≠ 0.</p><p>As h tends to zero from either side, this slope tends to a, the derivative. At h = 0 the quotient is undefined: the dashed line represents the limiting tangent, not a secant through two distinct points.</p>',legend:'<span><i class="key"></i>Function</span><span><i class="key accent"></i>Secant</span><span><i class="key blue"></i>Tangent at A</span>'},
 taylor:{title:'Taylor polynomials: match a curve locally',intro:'A Taylor polynomial matches a function and its first n derivatives at the centre a. Increase the degree and compare nearby and distant points.',formula:'Pₙ(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(a)(x − a)ᵏ / k!',question:'Choose sin(x), centre a = 0, and animate the degree. Why do some steps leave the curve unchanged? Move the probe away from a and compare the error.',explanation:'<p>Degree 0 matches the function value. Degree 1 adds the tangent slope. Higher degrees also match curvature and higher derivatives at the centre.</p><p>The error shown is |f(x) − Pₙ(x)| at the probe point. A good local approximation need not be good far from the centre, and each increase in degree need not reduce the error at every point.</p><p>For sin(x) at a = 0, even-degree coefficients vanish. The polynomial through order 2 is therefore the same as through order 1. Both examples here, sin(x) and eˣ, have Taylor series converging at every real x; this is not true of every function.</p>',legend:'<span><i class="key"></i>Function</span><span><i class="key accent"></i>Taylor polynomial</span><span><i class="key blue"></i>Error at probe</span>'},
 limits:{title:'Limits: the epsilon–delta promise',intro:'For f(x) = x² as x approaches 1, the limit is 1. Choose an output tolerance ε, then find an input distance δ that keeps every allowed output inside that tolerance.',formula:'For every ε > 0, there exists δ > 0:  0 < |x − 1| < δ  ⇒  |x² − 1| < ε.',question:'Make ε smaller. Does your current δ still work? Try a δ that is too large, then press “Find a working δ”. Notice that x = 1 itself is excluded.',explanation:'<p>The horizontal blue band is the target 1 − ε &lt; y &lt; 1 + ε. The vertical shaded interval is 1 − δ &lt; x &lt; 1 + δ. The condition must hold for every x in that interval except x = 1, not just for one moving point.</p><p>For this example and the positive δ values shown, the supremum of |x² − 1| in the punctured interval is δ(2 + δ). The interval is open, so δ(2 + δ) ≤ ε is sufficient, including equality.</p><p>A working choice for any ε &gt; 0 is δ = √(1 + ε) − 1. The status uses this analytic bound, rather than judging success from sampled graph points. The value at x = 1 does not determine the limit.</p>',legend:'<span><i class="key"></i>Function: y = x²</span><span><i class="key blue"></i>Output tolerance ε</span><span><i class="key accent"></i>Input distance δ</span><span><i class="key green"></i>Allowed outputs inside band</span>'}
};
const fmt=(x,n=3)=>Math.abs(x)<.5*10**-n?(0).toFixed(n):x.toFixed(n);
function slider(key,label,min,max,step){return `<label for="${key}"><span>${label}<output id="${key}-value"></output></span><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}"></label>`;}
function stop(){cancelAnimationFrame(frame);playing=false;$('play').textContent=lesson==='limits'?(state.example==='jump'?'Shrink δ':'Find a working δ'):'Play animation';}
function mount(){
 stop();lesson=Object.hasOwn(content,location.hash.slice(1))?location.hash.slice(1):'derivatives';state={...initial[lesson]};
 const c=content[lesson];['title','intro','formula','question'].forEach(id=>$(id).textContent=c[id]);$('explanation').innerHTML=c.explanation;$('legend').innerHTML=c.legend;
 document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+lesson)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('controls').innerHTML=lesson==='derivatives'?slider('a','Point A: x',-1.5,1.5,.01)+slider('h','Separation h',-1.5,1.5,.01):lesson==='taylor'?'<label for="kind">Function<select id="kind"><option value="sin">sin(x)</option><option value="exp">eˣ</option></select></label>'+slider('a','Centre a',-1,1,.1)+slider('n','Degree n',0,10,1)+slider('x','Probe x',-3,3,.01):'<label for="example">Example<select id="example"><option value="smooth">Limit exists: a smooth curve</option><option value="jump">No limit: a jump</option></select></label>'+slider('epsilon','Band half-width ε',.05,1.5,.01)+slider('delta','Input distance δ',.01,1,.001);
 $('controls').querySelectorAll('input,select').forEach(input=>input.addEventListener('input',()=>{stop();state[input.id]=input.tagName==='SELECT'?input.value:Number(input.value);if(input.id==='example'){state.epsilon=.6;state.delta=.7;}stop();draw();}));
 stop();draw();document.title=c.title+' | Calculus 1 Tutoring';
}
function el(tag,attrs={},parent=svg,text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function draw(){
 svg.replaceChildren();const w=Math.max(260,svg.clientWidth),height=svg.clientHeight||390;
 svg.setAttribute('viewBox',`0 0 ${w} ${height}`);el('title',{},svg,content[lesson].title);
 const range=lesson==='derivatives'?[-3.3,3.3,-.7,5.1]:lesson==='taylor'?[-3.3,3.3,state.kind==='exp'?-2:-2,state.kind==='exp'?22:2]:[-.2,2.2,-.6,4.5];
 const [xmin,xmax,ymin,ymax]=range,L=42,R=w-18,T=18,B=height-32;
 const X=x=>L+(x-xmin)/(xmax-xmin)*(R-L),Y=y=>B-(y-ymin)/(ymax-ymin)*(B-T);
 const defs=el('defs'),clip=el('clipPath',{id:'graph-clip'},defs);el('rect',{x:L,y:T,width:R-L,height:B-T},clip);
 const g=el('g',{'clip-path':'url(#graph-clip)'});
 function line(x1,y1,x2,y2,color,width=1,dash=''){el('line',{x1:X(x1),y1:Y(y1),x2:X(x2),y2:Y(y2),stroke:color,'stroke-width':width,'stroke-dasharray':dash},g);}
 function text(x,y,s,anchor='middle'){el('text',{x,y,'text-anchor':anchor},svg,s);}
 function curve(fn,color,width=2.5,lo=xmin,hi=xmax){let d='';for(let i=0;i<=400;i++){const x=lo+(hi-lo)*i/400,y=fn(x);d+=(i?'L':'M')+X(x)+','+Y(y);}el('path',{d,fill:'none',stroke:color,'stroke-width':width},g);}
 function point(x,y,color,hollow=false){el('circle',{cx:X(x),cy:Y(y),r:5,fill:hollow?'white':color,stroke:color,'stroke-width':2},g);}
 const xstep=lesson==='limits'?.5:w<480?2:1,ystep=lesson==='taylor'&&state.kind==='exp'?5:1;
 for(let x=Math.ceil(xmin/xstep)*xstep;x<=xmax;x+=xstep){line(x,ymin,x,ymax,colors.grid);text(X(x),B+21,Number(x.toFixed(1)));}
 for(let y=Math.ceil(ymin/ystep)*ystep;y<=ymax;y+=ystep){line(xmin,y,xmax,y,colors.grid);text(L-8,Y(y)+4,y,'end');}
 line(xmin,0,xmax,0,colors.muted);line(0,ymin,0,ymax,colors.muted);text(R,B+21,'x','end');text(L-20,12,'y');
 let values='',status='';
 if(lesson==='derivatives'){
  const {a,h}=state,f=x=>x*x/2,m=CalculusMath.secant(a,h);curve(f,colors.curve);
  line(xmin,f(a)+a*(xmin-a),xmax,f(a)+a*(xmax-a),colors.blue,2.5,'7 5');
  if(h!==0){line(xmin,f(a)+m*(xmin-a),xmax,f(a)+m*(xmax-a),colors.accent,2.5);line(a,f(a),a+h,f(a),colors.accent,1.3,'3 4');line(a+h,f(a),a+h,f(a+h),colors.accent,1.3,'3 4');point(a+h,f(a+h),colors.accent,true);if(Math.abs(h)>.3)text(X(a+h)+(h>0?10:-10),Y(f(a+h))-12,'B',h>0?'start':'end');}
  point(a,f(a),colors.curve);text(X(a)-10,Y(f(a))-13,'A','end');
  values=`<span>Secant slope: <b>${h===0?'undefined':fmt(m)}</b></span><span>Derivative at A: <b>${fmt(a)}</b></span>`;
  status=h===0?'At h = 0 the secant quotient is undefined. The dashed line is the limiting tangent.':Math.abs(h)<.1?'The secant slope is approaching the derivative.':'A and B determine the average slope over a horizontal change h.';
 }else if(lesson==='taylor'){
  const {kind,a,n,x}=state,f=kind==='sin'?Math.sin:Math.exp,p=t=>CalculusMath.taylor(kind,t,a,n);
  curve(f,colors.curve);curve(p,colors.accent);line(a,ymin,a,ymax,colors.muted,1,'3 5');text(X(a),T+14,'a');
  line(x,f(x),x,p(x),colors.blue,3,'4 3');point(x,f(x),colors.curve);point(x,p(x),colors.accent,true);
  values=`<span>f(x): <b>${fmt(f(x))}</b></span><span>P${n}(x): <b>${fmt(p(x))}</b></span><span>Absolute error: <b>${Math.abs(f(x)-p(x)).toExponential(3)}</b></span>`;
  status= p(x)<ymin||p(x)>ymax?'The polynomial at the probe is outside the visible vertical range; its value and error are shown below the graph.':`The polynomial matches derivatives through order ${n} at a = ${fmt(a,1)}. The probe compares values at x = ${fmt(x,2)}.`;
 }else{
  const {epsilon:e,delta:d}=state,jump=state.example==='jump',works=jump?e>1:CalculusMath.deltaWorks(e,d);
  $('intro').textContent=jump?'Near x = 1, the left side stays at 0 and the right side stays at 2. They do not approach the same height, so the limit does not exist.':'As x gets close to 1, x² gets close to 1. The blue band shows how close we want the outputs to be. Choose δ small enough to keep them all inside.';
  $('formula').textContent=jump?'f(x) = 0 for x < 1; f(x) = 2 for x ≥ 1. Try a band around height 1.':'0 < |x − 1| < δ  ⇒  |x² − 1| < ε';
  $('question').textContent=jump?'Keep ε = 0.6 and press “Shrink δ”. Do both sides ever enter the blue band? Try ε larger than 1: a wide band works, but a limit must work for every positive ε.':'Make ε smaller, then press “Find a working δ”. Can you keep the whole highlighted curve inside the blue band?';
  $('explanation').innerHTML=jump?'<p>δ tells us how close x must be to 1. ε tells us how close the output must be to our chosen height.</p><p>Here the outputs stay at 0 on the left and 2 on the right. A band centred at 1 with ε = 0.6 misses both. No matter how small δ is, there are points on both sides of 1 inside the input interval.</p><p>Choosing another height cannot fix the problem: the left side would need the limit to be 0, while the right side would need it to be 2. One limit cannot be both.</p><p>The animation stops at a small positive δ. The same problem remains for every positive δ, however small. The value at x = 1 itself does not affect the limit.</p>':'<p>First choose ε: how close you want the outputs to be to 1. Then choose δ: how close x must be to 1.</p><p>Every point with 0 &lt; |x − 1| &lt; δ must give an output inside the blue band. The middle point and the interval endpoints are excluded. Green means inside the band; red means outside.</p><p>For this curve, δ = √(1 + ε) − 1 works for every positive ε. Making the band narrower means choosing a smaller input interval.</p>';
  $('legend').innerHTML='<span><i class="key"></i>'+(jump?'Jump function':'Function: y = x²')+'</span><span><i class="key blue"></i>Output band</span><span><i class="key accent"></i>Input interval</span><span><i class="key green"></i>Inside band</span><span><i class="key" style="border-color:var(--red)"></i>Outside band</span>';
  el('rect',{x:L,y:Y(1+e),width:R-L,height:Y(1-e)-Y(1+e),fill:colors.blue,opacity:.10},g);
  el('rect',{x:X(1-d),y:T,width:X(1+d)-X(1-d),height:B-T,fill:colors.accent,opacity:.09},g);
  line(xmin,1-e,xmax,1-e,colors.blue,1.5,'6 4');line(xmin,1+e,xmax,1+e,colors.blue,1.5,'6 4');
  line(1-d,ymin,1-d,ymax,colors.accent,1.5,'6 4');line(1+d,ymin,1+d,ymax,colors.accent,1.5,'6 4');
  if(jump){
    line(xmin,0,1,0,colors.curve,2.5);line(1,2,xmax,2,colors.curve,2.5);
    line(1-d,0,1,0,works?colors.green:colors.red,4);line(1,2,1+d,2,works?colors.green:colors.red,4);
    point(1,0,colors.curve,true);point(1,2,colors.curve);
    point(1-d/2,0,works?colors.green:colors.red);point(1+d/2,2,works?colors.green:colors.red);
    text(X(.35),Y(0)-12,'Left: 0');text(X(1.7),Y(2)-12,'Right: 2');
  }else{
  curve(x=>x*x,colors.curve);
  // Split at exact band crossings, so red segments show genuine failures.
  const cuts=[1-d,1,1+d,Math.sqrt(1+e)];if(e<1)cuts.push(Math.sqrt(1-e));
  const pts=cuts.filter(x=>x>=1-d&&x<=1+d).sort((a,b)=>a-b);
  for(let i=1;i<pts.length;i++){const mid=(pts[i]+pts[i-1])/2;curve(x=>x*x,Math.abs(mid*mid-1)<e?colors.green:colors.red,4,pts[i-1],pts[i]);}
  point(1,1,colors.curve,true);}
  text(R-4,Y(1+e)-7,'1 + ε','end');text(R-4,Y(1-e)+17,'1 − ε','end');
  values=`<span>ε: <b>${fmt(e)}</b></span><span>δ: <b>${fmt(d,4)}</b></span><span>${jump?'Distance from height 1':'Output error stays below'}: <b>${jump?'1':fmt(d*(2+d),4)}</b></span>`;
  status=jump?(works?'This wide band contains both sides. But a narrower band fails for every δ, so there is still no limit.':'No δ can fix this band: the left stays at 0 and the right stays at 2, however close x gets to 1.'):(works?'This δ works: all nearby outputs are inside the blue band.':'This δ is too large. Some nearby outputs lie outside the blue band. Try making δ smaller.');
 }
 $('values').innerHTML=values;if(status!==lastAnnouncement){$('status').textContent=status;lastAnnouncement=status;}
 for(const [k,v] of Object.entries(state)){if($(k+'-value'))$(k+'-value').textContent=k==='n'?v:fmt(v,k==='delta'?4:2);if($(k)&&$(k).tagName==='INPUT')$(k).value=v;}
}
function play(){
 if(playing){stop();return;}
 playing=true;$('play').textContent='Pause';let start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(lesson==='derivatives'&&Math.abs(state.h)<.02)state.h=1.5;
 if(lesson==='taylor'&&state.n===10)state.n=0;
 if(lesson==='limits'&&state.example==='jump'&&state.delta<=.011)state.delta=.7;
 const from={...state},duration=reduced?0:lesson==='taylor'?7000:5000;
 function tick(now){const t=duration?Math.min(1,(now-start)/duration):1;
  if(lesson==='derivatives')state.h=t===1?0:from.h*(1-t)**2;
  if(lesson==='taylor')state.n=Math.min(10,from.n+Math.floor(t*(11-from.n)));
  if(lesson==='limits'){const target=state.example==='jump'?.01:CalculusMath.safeDelta(state.epsilon);state.delta=from.delta+(target-from.delta)*(1-(1-t)**3);}
  draw();if(t<1)frame=requestAnimationFrame(tick);else stop();
 }frame=requestAnimationFrame(tick);
}
$('play').addEventListener('click',play);$('reset').addEventListener('click',mount);window.addEventListener('hashchange',mount);new ResizeObserver(draw).observe(svg);mount();
})();
