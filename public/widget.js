"use strict";(()=>{var ce,b,$e,wt,L,Ae,Be,Ne,Re,ve,me,be,Ct,ie={},ae=[],St=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,pe=Array.isArray;function z(t,e){for(var n in e)t[n]=e[n];return t}function ye(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function c(t,e,n){var r,i,o,l={};for(o in e)o=="key"?r=e[o]:o=="ref"?i=e[o]:l[o]=e[o];if(arguments.length>2&&(l.children=arguments.length>3?ce.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(o in t.defaultProps)l[o]===void 0&&(l[o]=t.defaultProps[o]);return oe(t,l,r,i,null)}function oe(t,e,n,r,i){var o={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++$e,__i:-1,__u:0};return i==null&&b.vnode!=null&&b.vnode(o),o}function S(t){return t.children}function se(t,e){this.props=t,this.context=e}function O(t,e){if(e==null)return t.__?O(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?O(t):null}function Mt(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],i=[],o=z({},e);o.__v=e.__v+1,b.vnode&&b.vnode(o),ke(t.__P,o,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??O(e),!!(32&e.__u),i),o.__v=e.__v,o.__.__k[o.__i]=o,Fe(r,o,i),e.__e=e.__=null,o.__e!=n&&Ue(o)}}function Ue(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Ue(t)}function He(t){(!t.__d&&(t.__d=!0)&&L.push(t)&&!le.__r++||Ae!=b.debounceRendering)&&((Ae=b.debounceRendering)||Be)(le)}function le(){for(var t,e=1;L.length;)L.length>e&&L.sort(Ne),t=L.shift(),e=L.length,Mt(t);le.__r=0}function Le(t,e,n,r,i,o,l,p,_,a,u){var s,g,f,m,w,x,h,d=r&&r.__k||ae,y=e.length;for(_=Pt(n,e,d,_,y),s=0;s<y;s++)(f=n.__k[s])!=null&&(g=f.__i!=-1&&d[f.__i]||ie,f.__i=s,x=ke(t,f,g,i,o,l,p,_,a,u),m=f.__e,f.ref&&g.ref!=f.ref&&(g.ref&&we(g.ref,null,f),u.push(f.ref,f.__c||m,f)),w==null&&m!=null&&(w=m),(h=!!(4&f.__u))||g.__k===f.__k?_=je(f,_,t,h):typeof f.type=="function"&&x!==void 0?_=x:m&&(_=m.nextSibling),f.__u&=-7);return n.__e=w,_}function Pt(t,e,n,r,i){var o,l,p,_,a,u=n.length,s=u,g=0;for(t.__k=new Array(i),o=0;o<i;o++)(l=e[o])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=t.__k[o]=oe(null,l,null,null,null):pe(l)?l=t.__k[o]=oe(S,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=t.__k[o]=oe(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):t.__k[o]=l,_=o+g,l.__=t,l.__b=t.__b+1,p=null,(a=l.__i=It(l,n,_,s))!=-1&&(s--,(p=n[a])&&(p.__u|=2)),p==null||p.__v==null?(a==-1&&(i>u?g--:i<u&&g++),typeof l.type!="function"&&(l.__u|=4)):a!=_&&(a==_-1?g--:a==_+1?g++:(a>_?g--:g++,l.__u|=4))):t.__k[o]=null;if(s)for(o=0;o<u;o++)(p=n[o])!=null&&(2&p.__u)==0&&(p.__e==r&&(r=O(p)),qe(p,p));return r}function je(t,e,n,r){var i,o;if(typeof t.type=="function"){for(i=t.__k,o=0;i&&o<i.length;o++)i[o]&&(i[o].__=t,e=je(i[o],e,n,r));return e}t.__e!=e&&(r&&(e&&t.type&&!e.parentNode&&(e=O(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function It(t,e,n,r){var i,o,l,p=t.key,_=t.type,a=e[n],u=a!=null&&(2&a.__u)==0;if(a===null&&p==null||u&&p==a.key&&_==a.type)return n;if(r>(u?1:0)){for(i=n-1,o=n+1;i>=0||o<e.length;)if((a=e[l=i>=0?i--:o++])!=null&&(2&a.__u)==0&&p==a.key&&_==a.type)return l}return-1}function ze(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||St.test(e)?n:n+"px"}function re(t,e,n,r,i){var o,l;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||ze(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||ze(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")o=e!=(e=e.replace(Re,"$1")),l=e.toLowerCase(),e=l in t||e=="onFocusOut"||e=="onFocusIn"?l.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+o]=n,n?r?n.u=r.u:(n.u=ve,t.addEventListener(e,o?be:me,o)):t.removeEventListener(e,o?be:me,o);else{if(i=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function We(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=ve++;else if(e.t<n.u)return;return n(b.event?b.event(e):e)}}}function ke(t,e,n,r,i,o,l,p,_,a){var u,s,g,f,m,w,x,h,d,y,E,$,F,A,B,I=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(_=!!(32&n.__u),o=[p=e.__e=n.__e]),(u=b.__b)&&u(e);e:if(typeof I=="function")try{if(h=e.props,d="prototype"in I&&I.prototype.render,y=(u=I.contextType)&&r[u.__c],E=u?y?y.props.value:u.__:r,n.__c?x=(s=e.__c=n.__c).__=s.__E:(d?e.__c=s=new I(h,E):(e.__c=s=new se(h,E),s.constructor=I,s.render=Dt),y&&y.sub(s),s.state||(s.state={}),s.__n=r,g=s.__d=!0,s.__h=[],s._sb=[]),d&&s.__s==null&&(s.__s=s.state),d&&I.getDerivedStateFromProps!=null&&(s.__s==s.state&&(s.__s=z({},s.__s)),z(s.__s,I.getDerivedStateFromProps(h,s.__s))),f=s.props,m=s.state,s.__v=e,g)d&&I.getDerivedStateFromProps==null&&s.componentWillMount!=null&&s.componentWillMount(),d&&s.componentDidMount!=null&&s.__h.push(s.componentDidMount);else{if(d&&I.getDerivedStateFromProps==null&&h!==f&&s.componentWillReceiveProps!=null&&s.componentWillReceiveProps(h,E),e.__v==n.__v||!s.__e&&s.shouldComponentUpdate!=null&&s.shouldComponentUpdate(h,s.__s,E)===!1){e.__v!=n.__v&&(s.props=h,s.state=s.__s,s.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(D){D&&(D.__=e)}),ae.push.apply(s.__h,s._sb),s._sb=[],s.__h.length&&l.push(s);break e}s.componentWillUpdate!=null&&s.componentWillUpdate(h,s.__s,E),d&&s.componentDidUpdate!=null&&s.__h.push(function(){s.componentDidUpdate(f,m,w)})}if(s.context=E,s.props=h,s.__P=t,s.__e=!1,$=b.__r,F=0,d)s.state=s.__s,s.__d=!1,$&&$(e),u=s.render(s.props,s.state,s.context),ae.push.apply(s.__h,s._sb),s._sb=[];else do s.__d=!1,$&&$(e),u=s.render(s.props,s.state,s.context),s.state=s.__s;while(s.__d&&++F<25);s.state=s.__s,s.getChildContext!=null&&(r=z(z({},r),s.getChildContext())),d&&!g&&s.getSnapshotBeforeUpdate!=null&&(w=s.getSnapshotBeforeUpdate(f,m)),A=u!=null&&u.type===S&&u.key==null?Oe(u.props.children):u,p=Le(t,pe(A)?A:[A],e,n,r,i,o,l,p,_,a),s.base=e.__e,e.__u&=-161,s.__h.length&&l.push(s),x&&(s.__E=s.__=null)}catch(D){if(e.__v=null,_||o!=null)if(D.then){for(e.__u|=_?160:128;p&&p.nodeType==8&&p.nextSibling;)p=p.nextSibling;o[o.indexOf(p)]=null,e.__e=p}else{for(B=o.length;B--;)ye(o[B]);xe(e)}else e.__e=n.__e,e.__k=n.__k,D.then||xe(e);b.__e(D,e,n)}else o==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):p=e.__e=Tt(n.__e,e,n,r,i,o,l,_,a);return(u=b.diffed)&&u(e),128&e.__u?void 0:p}function xe(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(xe))}function Fe(t,e,n){for(var r=0;r<n.length;r++)we(n[r],n[++r],n[++r]);b.__c&&b.__c(e,t),t.some(function(i){try{t=i.__h,i.__h=[],t.some(function(o){o.call(i)})}catch(o){b.__e(o,i.__v)}})}function Oe(t){return typeof t!="object"||t==null||t.__b>0?t:pe(t)?t.map(Oe):z({},t)}function Tt(t,e,n,r,i,o,l,p,_){var a,u,s,g,f,m,w,x=n.props||ie,h=e.props,d=e.type;if(d=="svg"?i="http://www.w3.org/2000/svg":d=="math"?i="http://www.w3.org/1998/Math/MathML":i||(i="http://www.w3.org/1999/xhtml"),o!=null){for(a=0;a<o.length;a++)if((f=o[a])&&"setAttribute"in f==!!d&&(d?f.localName==d:f.nodeType==3)){t=f,o[a]=null;break}}if(t==null){if(d==null)return document.createTextNode(h);t=document.createElementNS(i,d,h.is&&h),p&&(b.__m&&b.__m(e,o),p=!1),o=null}if(d==null)x===h||p&&t.data==h||(t.data=h);else{if(o=o&&ce.call(t.childNodes),!p&&o!=null)for(x={},a=0;a<t.attributes.length;a++)x[(f=t.attributes[a]).name]=f.value;for(a in x)f=x[a],a=="dangerouslySetInnerHTML"?s=f:a=="children"||a in h||a=="value"&&"defaultValue"in h||a=="checked"&&"defaultChecked"in h||re(t,a,null,f,i);for(a in h)f=h[a],a=="children"?g=f:a=="dangerouslySetInnerHTML"?u=f:a=="value"?m=f:a=="checked"?w=f:p&&typeof f!="function"||x[a]===f||re(t,a,f,x[a],i);if(u)p||s&&(u.__html==s.__html||u.__html==t.innerHTML)||(t.innerHTML=u.__html),e.__k=[];else if(s&&(t.innerHTML=""),Le(e.type=="template"?t.content:t,pe(g)?g:[g],e,n,r,d=="foreignObject"?"http://www.w3.org/1999/xhtml":i,o,l,o?o[0]:n.__k&&O(n,0),p,_),o!=null)for(a=o.length;a--;)ye(o[a]);p||(a="value",d=="progress"&&m==null?t.removeAttribute("value"):m!=null&&(m!==t[a]||d=="progress"&&!m||d=="option"&&m!=x[a])&&re(t,a,m,x[a],i),a="checked",w!=null&&w!=t[a]&&re(t,a,w,x[a],i))}return t}function we(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(i){b.__e(i,n)}}function qe(t,e,n){var r,i;if(b.unmount&&b.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||we(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){b.__e(o,e)}r.base=r.__P=null}if(r=t.__k)for(i=0;i<r.length;i++)r[i]&&qe(r[i],e,n||typeof t.type!="function");n||ye(t.__e),t.__c=t.__=t.__e=void 0}function Dt(t,e,n){return this.constructor(t,n)}function Ge(t,e,n){var r,i,o,l;e==document&&(e=document.documentElement),b.__&&b.__(t,e),i=(r=typeof n=="function")?null:n&&n.__k||e.__k,o=[],l=[],ke(e,t=(!r&&n||e).__k=c(S,null,[t]),i||ie,ie,e.namespaceURI,!r&&n?[n]:i?null:e.firstChild?ce.call(e.childNodes):null,o,!r&&n?n:i?i.__e:e.firstChild,r,l),Fe(o,t,l)}ce=ae.slice,b={__e:function(t,e,n,r){for(var i,o,l;e=e.__;)if((i=e.__c)&&!i.__)try{if((o=i.constructor)&&o.getDerivedStateFromError!=null&&(i.setState(o.getDerivedStateFromError(t)),l=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(t,r||{}),l=i.__d),l)return i.__E=i}catch(p){t=p}throw t}},$e=0,wt=function(t){return t!=null&&t.constructor===void 0},se.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=z({},this.state),typeof t=="function"&&(t=t(z({},n),this.props)),t&&z(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),He(this))},se.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),He(this))},se.prototype.render=S,L=[],Be=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ne=function(t,e){return t.__v.__b-e.__v.__b},le.__r=0,Re=/(PointerCapture)$|Capture$/i,ve=0,me=We(!1),be=We(!0),Ct=0;var Q,k,Ce,Ve,ee=0,tt=[],C=b,Ye=C.__b,Je=C.__r,Ke=C.diffed,Xe=C.__c,Ze=C.unmount,Qe=C.__;function Me(t,e){C.__h&&C.__h(k,t,ee||e),ee=0;var n=k.__H||(k.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function P(t){return ee=1,Et(ot,t)}function Et(t,e,n){var r=Me(Q++,2);if(r.t=t,!r.__c&&(r.__=[n?n(e):ot(void 0,e),function(p){var _=r.__N?r.__N[0]:r.__[0],a=r.t(_,p);_!==a&&(r.__N=[a,r.__[1]],r.__c.setState({}))}],r.__c=k,!k.__f)){var i=function(p,_,a){if(!r.__c.__H)return!0;var u=r.__c.__H.__.filter(function(g){return g.__c});if(u.every(function(g){return!g.__N}))return!o||o.call(this,p,_,a);var s=r.__c.props!==p;return u.some(function(g){if(g.__N){var f=g.__[0];g.__=g.__N,g.__N=void 0,f!==g.__[0]&&(s=!0)}}),o&&o.call(this,p,_,a)||s};k.__f=!0;var o=k.shouldComponentUpdate,l=k.componentWillUpdate;k.componentWillUpdate=function(p,_,a){if(this.__e){var u=o;o=void 0,i(p,_,a),o=u}l&&l.call(this,p,_,a)},k.shouldComponentUpdate=i}return r.__N||r.__}function W(t,e){var n=Me(Q++,3);!C.__s&&rt(n.__H,e)&&(n.__=t,n.u=e,k.__H.__h.push(n))}function j(t){return ee=5,nt(function(){return{current:t}},[])}function nt(t,e){var n=Me(Q++,7);return rt(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function ue(t,e){return ee=8,nt(function(){return t},e)}function At(){for(var t;t=tt.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(_e),e.__h.some(Se),e.__h=[]}catch(n){e.__h=[],C.__e(n,t.__v)}}}C.__b=function(t){k=null,Ye&&Ye(t)},C.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Qe&&Qe(t,e)},C.__r=function(t){Je&&Je(t),Q=0;var e=(k=t.__c).__H;e&&(Ce===k?(e.__h=[],k.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(_e),e.__h.some(Se),e.__h=[],Q=0)),Ce=k},C.diffed=function(t){Ke&&Ke(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(tt.push(e)!==1&&Ve===C.requestAnimationFrame||((Ve=C.requestAnimationFrame)||Ht)(At)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),Ce=k=null},C.__c=function(t,e){e.some(function(n){try{n.__h.some(_e),n.__h=n.__h.filter(function(r){return!r.__||Se(r)})}catch(r){e.some(function(i){i.__h&&(i.__h=[])}),e=[],C.__e(r,n.__v)}}),Xe&&Xe(t,e)},C.unmount=function(t){Ze&&Ze(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{_e(r)}catch(i){e=i}}),n.__H=void 0,e&&C.__e(e,n.__v))};var et=typeof requestAnimationFrame=="function";function Ht(t){var e,n=function(){clearTimeout(r),et&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);et&&(e=requestAnimationFrame(n))}function _e(t){var e=k,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),k=e}function Se(t){var e=k;t.__c=t.__(),k=e}function rt(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function ot(t,e){return typeof e=="function"?e(t):e}function q(t){let e=t.replace("#","");if(e.length===3&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),e.length!==6)return"#ffffff";let n=parseInt(e.slice(0,2),16),r=parseInt(e.slice(2,4),16),i=parseInt(e.slice(4,6),16);return(n*299+r*587+i*114)/1e3>150?"#1a1a1a":"#ffffff"}function st({config:t,isOpen:e,onClick:n,size:r=56}){let i=t.primaryColor||"#6366f1",o=q(i),l=t.launcherIcon,p=l?.startsWith("http"),_=l&&!p&&l.length<=4,a=r/56,u=Math.round(24*a),s=Math.round(20*a),g=Math.round(28*a);return c("button",{class:"lp-launcher",onClick:n,style:{backgroundColor:i,color:o,width:`${r}px`,height:`${r}px`},"aria-label":e?"Close chat":"Open chat"},e?c("svg",{width:s,height:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},c("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),c("line",{x1:"6",y1:"6",x2:"18",y2:"18"})):p?c("img",{src:l,alt:"Chat",style:{width:`${g}px`,height:`${g}px`,objectFit:"contain"}}):_?c("span",{style:{fontSize:`${Math.round(24*a)}px`,lineHeight:1}},l):c("svg",{width:u,height:u,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},c("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})))}function zt(t){let e=[],n=/(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g,r=0,i;for(;(i=n.exec(t))!==null;)i.index>r&&e.push(t.slice(r,i.index)),i[1]?e.push(c("strong",null,i[2])):i[3]&&e.push(c("a",{href:i[3],target:"_blank",rel:"noopener noreferrer"},i[3])),r=i.index+i[0].length;return r<t.length&&e.push(t.slice(r)),e}function Wt(t){let e=t.split(`
`);return e.map((n,r)=>c("span",{key:r},zt(n),r<e.length-1&&c("br",null)))}function it({message:t,primaryColor:e}){let n=t.role==="user",r=q(e);return c("div",{class:`lp-msg ${n?"lp-msg-user":"lp-msg-assistant"}`,style:n?{backgroundColor:e,color:r}:void 0},Wt(t.content))}function at(){return c("div",{class:"lp-typing"},c("span",null),c("span",null),c("span",null))}function G(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}function $t(t){let e=`lp_session_${t}`,n=localStorage.getItem(e);return n||(n=G(),localStorage.setItem(e,n)),n}function Bt(t){try{let e=localStorage.getItem(`lp_history_${t}`);if(e)return JSON.parse(e).slice(-50)}catch{}return[]}function Nt(t,e){try{localStorage.setItem(`lp_history_${t}`,JSON.stringify(e.slice(-50)))}catch{}}function Rt({status:t}){return t==="human_takeover"?c("div",{style:{padding:"8px 16px",backgroundColor:"rgba(59,130,246,0.08)",borderBottom:"1px solid rgba(59,130,246,0.12)",textAlign:"center",fontSize:"12px",color:"#3b82f6",fontWeight:500}},"A team member is responding to this conversation"):t==="paused"?c("div",{style:{padding:"8px 16px",backgroundColor:"rgba(245,158,11,0.08)",borderBottom:"1px solid rgba(245,158,11,0.12)",textAlign:"center",fontSize:"12px",color:"#d97706",fontWeight:500}},"This conversation is paused"):t==="closed"?c("div",{style:{padding:"8px 16px",backgroundColor:"rgba(113,113,122,0.08)",borderBottom:"1px solid rgba(113,113,122,0.12)",textAlign:"center",fontSize:"12px",color:"#71717a",fontWeight:500}},"This conversation has been closed"):null}function lt({config:t,token:e,agentId:n,channelId:r,apiOrigin:i,onClose:o,size:l}){let p=l?.panelW??380,_=l?.panelH??520,a=l?.fontSize??14,[u,s]=P(()=>Bt(r)),[g,f]=P(""),[m,w]=P(!1),[x,h]=P(!1),[d,y]=P("active"),E=j(null),$=j(null),F=j($t(r)),A=j(null),B=j(0),I=j(!1),D=t.primaryColor||"#6366f1",V=q(D),Pe=V==="#ffffff"?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)",fe=t.agentName||"AI Assistant",dt=t.welcomeMessage||"Hi! How can I help you today?",Ie=t.conversationStarters??[],gt=t.theme==="dark",ht=t.borderRadius==="sharp",mt=t.showBranding!==!1;W(()=>{E.current?.scrollIntoView({behavior:"smooth"})},[u,x]),W(()=>{$.current?.focus()},[]),W(()=>{if(!I.current||d==="closed")return;let v=d==="human_takeover"?3e3:1e4,N=async()=>{try{let M=await fetch(`${i}/api/widget/${r}/status?sessionId=${F.current}&since=0`);if(M.ok){let T=await M.json();B.current=T.totalMessages??0,T.status&&T.status!==d&&y(T.status)}}catch{}};return B.current===0&&N(),A.current=setInterval(async()=>{try{let M=await fetch(`${i}/api/widget/${r}/status?sessionId=${F.current}&since=${B.current}`);if(!M.ok)return;let T=await M.json();if(T.status&&T.status!==d&&y(T.status),T.newMessages&&T.newMessages.length>0){let te=T.newMessages.filter(Y=>Y.role==="human_agent");te.length>0&&s(Y=>[...Y,...te.map(J=>({id:G(),role:"assistant",content:J.content,timestamp:Date.now(),isHumanAgent:!0}))]),B.current=T.totalMessages}}catch{}},v),()=>{A.current&&(clearInterval(A.current),A.current=null)}},[d,i,r]);let de=ue(async v=>{if(!v.trim()||m||d==="closed")return;I.current=!0;let N={id:G(),role:"user",content:v.trim(),timestamp:Date.now()};s(M=>[...M,N]),f(""),w(!0),h(!0);try{let M=await fetch(`${i}/api/channels/${n}/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({userMessage:v.trim(),sessionId:F.current})});if((M.headers.get("content-type")??"").includes("application/json")){let R=await M.json();if(R.status==="human_takeover"){y("human_takeover"),s(he=>[...he,{id:G(),role:"assistant",content:R.message||"A team member will respond shortly.",timestamp:Date.now()}]),w(!1),h(!1);return}if(R.error==="conversation_paused"){y("paused"),w(!1),h(!1);return}if(R.error==="conversation_closed"){y("closed"),w(!1),h(!1);return}if(!M.ok)throw new Error(R.message||"Chat request failed")}if(!M.ok||!M.body)throw new Error("Chat request failed");let te=M.body.getReader(),Y=new TextDecoder,J="",K="",ne=!1,X={id:G(),role:"assistant",content:"",isStreaming:!0,timestamp:Date.now()};for(;;){let{value:R,done:he}=await te.read();if(he)break;J+=Y.decode(R,{stream:!0});let De=J.split(`

`);J=De.pop()??"";for(let Ee of De)if(Ee.startsWith("data: "))try{let Z=JSON.parse(Ee.slice(6));Z.type==="text-delta"?(ne||(s(H=>[...H,X]),ne=!0,h(!1)),K+=Z.delta,s(H=>H.map(U=>U.id===X.id?{...U,content:K}:U))):Z.type==="done"?!ne&&K===""?(K=Z.assistantContent||"I processed your request.",s(H=>[...H,{...X,content:K,isStreaming:!1}])):s(H=>H.map(U=>U.id===X.id?{...U,isStreaming:!1}:U)):Z.type==="error"&&(ne||s(H=>[...H,{...X,content:"Sorry, something went wrong. Please try again.",isStreaming:!1}]))}catch{}}}catch{h(!1),s(M=>[...M,{id:G(),role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again.",timestamp:Date.now()}])}finally{w(!1),h(!1)}},[n,i,e,m,d]);W(()=>{u.length>0&&Nt(r,u.filter(v=>!v.isStreaming))},[u,r]);function bt(v){v.key==="Enter"&&!v.shiftKey&&(v.preventDefault(),de(g))}function xt(v){let N=v.target;f(N.value),N.style.height="38px",N.style.height=Math.min(N.scrollHeight,100)+"px"}let vt=Ie.length>0&&u.filter(v=>v.role==="user").length===0,ge=t.agentAvatar,yt=ge?.startsWith("http"),kt=["lp-chat-panel",gt?"lp-dark":"",ht?"lp-sharp":""].filter(Boolean).join(" "),Te=m||d==="closed"||d==="paused";return c("div",{class:kt,style:{width:`${p}px`,height:`${_}px`,fontSize:`${a}px`}},c("div",{class:"lp-header",style:{backgroundColor:D}},c("div",{class:"lp-header-avatar",style:{backgroundColor:V==="#ffffff"?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.1)"}},yt?c("img",{src:ge,alt:fe}):c("span",{style:{color:V}},ge||fe.charAt(0))),c("div",{class:"lp-header-info"},c("div",{class:"lp-header-name",style:{color:V}},fe),c("div",{class:"lp-header-status",style:{color:Pe}},c("span",{style:{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",backgroundColor:d==="closed"?"#71717a":d==="human_takeover"?"#3b82f6":"#22c55e",marginRight:"4px",verticalAlign:"middle"}}),d==="human_takeover"?"Team member connected":d==="closed"?"Closed":"Online")),c("button",{class:"lp-close-btn",onClick:o,"aria-label":"Close chat",style:{color:Pe}},c("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},c("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),c("line",{x1:"6",y1:"6",x2:"18",y2:"18"})))),c(Rt,{status:d}),c("div",{class:"lp-messages"},u.length===0&&c("div",{class:"lp-welcome"},dt),u.map(v=>c(it,{key:v.id,message:v,primaryColor:D})),x&&c(at,null),c("div",{ref:E})),vt&&c("div",{class:"lp-starters"},Ie.slice(0,4).map(v=>c("button",{key:v,class:"lp-starter-btn",onClick:()=>de(v),disabled:m},v))),c("div",{class:"lp-input-area"},c("textarea",{ref:$,class:"lp-input",value:g,onInput:xt,onKeyDown:bt,placeholder:d==="closed"?"This conversation has ended":d==="paused"?"Conversation paused...":"Type a message...",rows:1,disabled:Te}),c("button",{class:"lp-send-btn",style:{backgroundColor:D,color:V},onClick:()=>de(g),disabled:!g.trim()||Te,"aria-label":"Send message"},c("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},c("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),c("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})))),mt&&c("div",{class:"lp-powered"},c("a",{href:"https://launchpath.io",target:"_blank",rel:"noopener noreferrer"},"Powered by LaunchPath")))}function ct({message:t,delay:e,position:n,isDark:r,isSharp:i,onDismiss:o,onClick:l}){let[p,_]=P(!1);return W(()=>{let a=setTimeout(()=>_(!0),e*1e3);return()=>clearTimeout(a)},[e]),p?c("div",{class:`lp-greeting lp-greeting-${n}`,onClick:l},c("button",{class:`lp-greeting-close lp-greeting-close-${n}`,onClick:a=>{a.stopPropagation(),o()},"aria-label":"Dismiss"},c("svg",{width:"8",height:"8",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"round"},c("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),c("line",{x1:"6",y1:"6",x2:"18",y2:"18"}))),t,c("div",{class:`lp-greeting-tail lp-greeting-tail-${n}`})):null}var pt={compact:{launcher:48,panelW:340,panelH:460,fontSize:13},default:{launcher:56,panelW:380,panelH:520,fontSize:14},large:{launcher:64,panelW:420,panelH:580,fontSize:15}};function _t({channelId:t,apiOrigin:e}){let[n,r]=P(null),[i,o]=P(null),[l,p]=P(null),[_,a]=P(!1),[u,s]=P(!1),[g,f]=P(!1);W(()=>{fetch(`${e}/api/widget/${t}/config`).then(y=>{if(!y.ok)throw new Error("Config fetch failed");return y.json()}).then(y=>{r(y.config),o(y.token),p(y.agentId)}).catch(()=>f(!0))},[t,e]);let m=ue(()=>{a(!0),s(!0)},[]);if(g||!n)return null;let w=n.position||"right",x=pt[n.widgetSize||"default"],d=!!n.greetingMessage?.trim()&&!_&&!u;return c("div",{class:`lp-position-${w}`},_&&i&&l?c(lt,{config:n,token:i,agentId:l,channelId:t,apiOrigin:e,onClose:()=>a(!1),size:x}):null,d&&c(ct,{message:n.greetingMessage,delay:n.greetingDelay??3,position:w,isDark:n.theme==="dark",isSharp:n.borderRadius==="sharp",onDismiss:()=>s(!0),onClick:m}),c(st,{config:n,isOpen:_,onClick:()=>_?a(!1):m(),size:x.launcher}))}var ut=`
/* ===== Reset ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== Base ===== */
:host {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a2e;
  -webkit-font-smoothing: antialiased;
}

/* ===== Animations ===== */
@keyframes lp-spring-in {
  0% { transform: scale(0) translateY(20px); opacity: 0; }
  60% { transform: scale(1.08) translateY(-4px); opacity: 1; }
  80% { transform: scale(0.97) translateY(1px); }
  100% { transform: scale(1) translateY(0); }
}

@keyframes lp-panel-in {
  0% { transform: translateY(16px) scale(0.96); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes lp-fade-in {
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes lp-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ===== Launcher ===== */
.lp-launcher {
  position: fixed;
  bottom: 20px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.08);
  animation: lp-spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 2147483646;
}

.lp-launcher:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1);
}

.lp-launcher:active {
  transform: scale(0.95);
}

.lp-position-right .lp-launcher {
  right: 20px;
}

.lp-position-left .lp-launcher {
  left: 20px;
}

/* ===== Chat Panel (Desktop) ===== */
.lp-chat-panel {
  position: fixed;
  bottom: 88px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: lp-panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  z-index: 2147483646;
}

.lp-chat-panel.lp-sharp {
  border-radius: 8px;
}

.lp-chat-panel.lp-dark {
  background: #111827;
}

.lp-position-right .lp-chat-panel {
  right: 20px;
}

.lp-position-left .lp-chat-panel {
  left: 20px;
}

/* ===== Chat Panel (Mobile) ===== */
@media (max-width: 639px) {
  .lp-chat-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    bottom: 0;
  }
}

/* ===== Header ===== */
.lp-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.lp-header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}

.lp-header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lp-header-info {
  flex: 1;
  min-width: 0;
}

.lp-header-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.lp-header-status {
  font-size: 11px;
  color: #22c55e;
  line-height: 1.2;
}

.lp-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.lp-close-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

/* ===== Messages ===== */
.lp-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-behavior: smooth;
}

.lp-messages::-webkit-scrollbar {
  width: 4px;
}

.lp-messages::-webkit-scrollbar-track {
  background: transparent;
}

.lp-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* ===== Message Bubbles ===== */
.lp-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  animation: lp-fade-in 0.2s ease forwards;
  word-wrap: break-word;
}

.lp-msg-user {
  align-self: flex-end;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.lp-msg-assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1a1a2e;
  border-bottom-left-radius: 4px;
}

.lp-msg a {
  text-decoration: underline;
  color: inherit;
}

.lp-msg strong {
  font-weight: 600;
}

/* ===== Welcome Message ===== */
.lp-welcome {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1a1a2e;
  padding: 10px 14px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

/* ===== Typing Indicator ===== */
.lp-typing {
  align-self: flex-start;
  background: #f3f4f6;
  padding: 10px 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.lp-typing span {
  width: 7px;
  height: 7px;
  background: #9ca3af;
  border-radius: 50%;
  animation: lp-bounce 1.4s ease-in-out infinite;
}

.lp-typing span:nth-child(2) {
  animation-delay: 0.16s;
}

.lp-typing span:nth-child(3) {
  animation-delay: 0.32s;
}

/* ===== Conversation Starters ===== */
.lp-starters {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
}

.lp-starter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.lp-starter-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* ===== Input Area ===== */
.lp-input-area {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}

.lp-input {
  flex: 1;
  resize: none;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  max-height: 100px;
  min-height: 38px;
  transition: border-color 0.15s;
  color: #1a1a2e;
  background: #fff;
}

.lp-input::placeholder {
  color: #9ca3af;
}

.lp-input:focus {
  border-color: #6366f1;
}

.lp-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.lp-send-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.lp-send-btn:not(:disabled):hover {
  opacity: 0.9;
}

/* ===== Powered By ===== */
.lp-powered {
  text-align: center;
  padding: 6px;
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
}

.lp-powered a {
  color: #9ca3af;
  text-decoration: none;
}

.lp-powered a:hover {
  color: #6b7280;
}

/* ===== Dark Mode ===== */
.lp-dark .lp-messages::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.lp-dark .lp-msg-assistant,
.lp-dark .lp-welcome {
  background: #1f2937;
  color: #e5e7eb;
}

.lp-dark .lp-typing {
  background: #1f2937;
}

.lp-dark .lp-typing span {
  background: #6b7280;
}

.lp-dark .lp-starter-btn {
  border-color: #374151;
  background: #1f2937;
  color: #d1d5db;
}

.lp-dark .lp-starter-btn:hover {
  background: #374151;
  border-color: #4b5563;
}

.lp-dark .lp-input-area {
  border-top-color: #374151;
}

.lp-dark .lp-input {
  border-color: #374151;
  background: #1f2937;
  color: #f3f4f6;
}

.lp-dark .lp-input::placeholder {
  color: #6b7280;
}

.lp-dark .lp-input:focus {
  border-color: #818cf8;
}

.lp-dark .lp-powered,
.lp-dark .lp-powered a {
  color: #4b5563;
}

.lp-dark .lp-powered a:hover {
  color: #6b7280;
}

/* ===== Greeting Bubble ===== */
@keyframes lp-greeting-in {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.lp-greeting {
  position: fixed;
  bottom: 88px;
  max-width: 240px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
  color: #1a1a2e;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  animation: lp-greeting-in 0.3s ease forwards;
  z-index: 2147483646;
  transition: transform 0.15s ease;
}

.lp-greeting:hover {
  transform: scale(1.02);
}

.lp-greeting-right {
  right: 20px;
}

.lp-greeting-left {
  left: 20px;
}

.lp-greeting-close {
  position: absolute;
  top: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.lp-greeting-close:hover {
  background: #e5e7eb;
  color: #4b5563;
}

.lp-greeting-close-right {
  left: -6px;
}

.lp-greeting-close-left {
  right: -6px;
}

.lp-greeting-tail {
  position: absolute;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
}

.lp-greeting-tail-right {
  right: 24px;
}

.lp-greeting-tail-left {
  left: 24px;
}

/* Dark greeting */
.lp-dark .lp-greeting,
.lp-position-right .lp-dark .lp-greeting,
.lp-position-left .lp-dark .lp-greeting {
  background: #1f2937;
  color: #e5e7eb;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

.lp-dark .lp-greeting-close {
  background: #374151;
  color: #6b7280;
}

.lp-dark .lp-greeting-close:hover {
  background: #4b5563;
  color: #d1d5db;
}

.lp-dark .lp-greeting-tail {
  background: #1f2937;
}
`;function ft(){let t=document.querySelectorAll("script[data-channel]"),e=t[t.length-1];if(!e)return;let n=e.getAttribute("data-channel");if(!n)return;let r=e.getAttribute("src")||"",i;try{i=new URL(r,window.location.href).origin}catch{i=window.location.origin}let o=document.createElement("div");o.id="lp-widget-host",o.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;",document.body.appendChild(o);let l=o.attachShadow({mode:"open"}),p=document.createElement("style");p.textContent=ut,l.appendChild(p);let _=document.createElement("div");_.id="lp-widget-root",_.style.cssText="pointer-events:auto;",l.appendChild(_),Ge(c(_t,{channelId:n,apiOrigin:i}),_)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ft):ft();})();
