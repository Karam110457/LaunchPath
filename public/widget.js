"use strict";(()=>{var te,b,Me,ht,R,ke,Pe,Ie,De,ue,ce,_e,mt,Z={},Q=[],bt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ne=Array.isArray;function T(t,e){for(var n in e)t[n]=e[n];return t}function de(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function p(t,e,n){var r,s,o,l={};for(o in e)o=="key"?r=e[o]:o=="ref"?s=e[o]:l[o]=e[o];if(arguments.length>2&&(l.children=arguments.length>3?te.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(o in t.defaultProps)l[o]===void 0&&(l[o]=t.defaultProps[o]);return K(t,l,r,s,null)}function K(t,e,n,r,s){var o={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:s??++Me,__i:-1,__u:0};return s==null&&b.vnode!=null&&b.vnode(o),o}function S(t){return t.children}function X(t,e){this.props=t,this.context=e}function L(t,e){if(e==null)return t.__?L(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?L(t):null}function xt(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],s=[],o=T({},e);o.__v=e.__v+1,b.vnode&&b.vnode(o),ge(t.__P,o,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??L(e),!!(32&e.__u),s),o.__v=e.__v,o.__.__k[o.__i]=o,Ae(r,o,s),e.__e=e.__=null,o.__e!=n&&Ee(o)}}function Ee(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Ee(t)}function we(t){(!t.__d&&(t.__d=!0)&&R.push(t)&&!ee.__r++||ke!=b.debounceRendering)&&((ke=b.debounceRendering)||Pe)(ee)}function ee(){for(var t,e=1;R.length;)R.length>e&&R.sort(Ie),t=R.shift(),e=R.length,xt(t);ee.__r=0}function He(t,e,n,r,s,o,l,c,_,a,f){var i,d,u,m,C,x,g,h=r&&r.__k||Q,w=e.length;for(_=yt(n,e,h,_,w),i=0;i<w;i++)(u=n.__k[i])!=null&&(d=u.__i!=-1&&h[u.__i]||Z,u.__i=i,x=ge(t,u,d,s,o,l,c,_,a,f),m=u.__e,u.ref&&d.ref!=u.ref&&(d.ref&&he(d.ref,null,u),f.push(u.ref,u.__c||m,u)),C==null&&m!=null&&(C=m),(g=!!(4&u.__u))||d.__k===u.__k?_=Te(u,_,t,g):typeof u.type=="function"&&x!==void 0?_=x:m&&(_=m.nextSibling),u.__u&=-7);return n.__e=C,_}function yt(t,e,n,r,s){var o,l,c,_,a,f=n.length,i=f,d=0;for(t.__k=new Array(s),o=0;o<s;o++)(l=e[o])!=null&&typeof l!="boolean"&&typeof l!="function"?(typeof l=="string"||typeof l=="number"||typeof l=="bigint"||l.constructor==String?l=t.__k[o]=K(null,l,null,null,null):ne(l)?l=t.__k[o]=K(S,{children:l},null,null,null):l.constructor===void 0&&l.__b>0?l=t.__k[o]=K(l.type,l.props,l.key,l.ref?l.ref:null,l.__v):t.__k[o]=l,_=o+d,l.__=t,l.__b=t.__b+1,c=null,(a=l.__i=vt(l,n,_,i))!=-1&&(i--,(c=n[a])&&(c.__u|=2)),c==null||c.__v==null?(a==-1&&(s>f?d--:s<f&&d++),typeof l.type!="function"&&(l.__u|=4)):a!=_&&(a==_-1?d--:a==_+1?d++:(a>_?d--:d++,l.__u|=4))):t.__k[o]=null;if(i)for(o=0;o<f;o++)(c=n[o])!=null&&(2&c.__u)==0&&(c.__e==r&&(r=L(c)),We(c,c));return r}function Te(t,e,n,r){var s,o;if(typeof t.type=="function"){for(s=t.__k,o=0;s&&o<s.length;o++)s[o]&&(s[o].__=t,e=Te(s[o],e,n,r));return e}t.__e!=e&&(r&&(e&&t.type&&!e.parentNode&&(e=L(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function vt(t,e,n,r){var s,o,l,c=t.key,_=t.type,a=e[n],f=a!=null&&(2&a.__u)==0;if(a===null&&c==null||f&&c==a.key&&_==a.type)return n;if(r>(f?1:0)){for(s=n-1,o=n+1;s>=0||o<e.length;)if((a=e[l=s>=0?s--:o++])!=null&&(2&a.__u)==0&&c==a.key&&_==a.type)return l}return-1}function Ce(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||bt.test(e)?n:n+"px"}function J(t,e,n,r,s){var o,l;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||Ce(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||Ce(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")o=e!=(e=e.replace(De,"$1")),l=e.toLowerCase(),e=l in t||e=="onFocusOut"||e=="onFocusIn"?l.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+o]=n,n?r?n.u=r.u:(n.u=ue,t.addEventListener(e,o?_e:ce,o)):t.removeEventListener(e,o?_e:ce,o);else{if(s=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function Se(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=ue++;else if(e.t<n.u)return;return n(b.event?b.event(e):e)}}}function ge(t,e,n,r,s,o,l,c,_,a){var f,i,d,u,m,C,x,g,h,w,D,I,A,W,B,P=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(_=!!(32&n.__u),o=[c=e.__e=n.__e]),(f=b.__b)&&f(e);e:if(typeof P=="function")try{if(g=e.props,h="prototype"in P&&P.prototype.render,w=(f=P.contextType)&&r[f.__c],D=f?w?w.props.value:f.__:r,n.__c?x=(i=e.__c=n.__c).__=i.__E:(h?e.__c=i=new P(g,D):(e.__c=i=new X(g,D),i.constructor=P,i.render=wt),w&&w.sub(i),i.state||(i.state={}),i.__n=r,d=i.__d=!0,i.__h=[],i._sb=[]),h&&i.__s==null&&(i.__s=i.state),h&&P.getDerivedStateFromProps!=null&&(i.__s==i.state&&(i.__s=T({},i.__s)),T(i.__s,P.getDerivedStateFromProps(g,i.__s))),u=i.props,m=i.state,i.__v=e,d)h&&P.getDerivedStateFromProps==null&&i.componentWillMount!=null&&i.componentWillMount(),h&&i.componentDidMount!=null&&i.__h.push(i.componentDidMount);else{if(h&&P.getDerivedStateFromProps==null&&g!==u&&i.componentWillReceiveProps!=null&&i.componentWillReceiveProps(g,D),e.__v==n.__v||!i.__e&&i.shouldComponentUpdate!=null&&i.shouldComponentUpdate(g,i.__s,D)===!1){e.__v!=n.__v&&(i.props=g,i.state=i.__s,i.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(E){E&&(E.__=e)}),Q.push.apply(i.__h,i._sb),i._sb=[],i.__h.length&&l.push(i);break e}i.componentWillUpdate!=null&&i.componentWillUpdate(g,i.__s,D),h&&i.componentDidUpdate!=null&&i.__h.push(function(){i.componentDidUpdate(u,m,C)})}if(i.context=D,i.props=g,i.__P=t,i.__e=!1,I=b.__r,A=0,h)i.state=i.__s,i.__d=!1,I&&I(e),f=i.render(i.props,i.state,i.context),Q.push.apply(i.__h,i._sb),i._sb=[];else do i.__d=!1,I&&I(e),f=i.render(i.props,i.state,i.context),i.state=i.__s;while(i.__d&&++A<25);i.state=i.__s,i.getChildContext!=null&&(r=T(T({},r),i.getChildContext())),h&&!d&&i.getSnapshotBeforeUpdate!=null&&(C=i.getSnapshotBeforeUpdate(u,m)),W=f!=null&&f.type===S&&f.key==null?ze(f.props.children):f,c=He(t,ne(W)?W:[W],e,n,r,s,o,l,c,_,a),i.base=e.__e,e.__u&=-161,i.__h.length&&l.push(i),x&&(i.__E=i.__=null)}catch(E){if(e.__v=null,_||o!=null)if(E.then){for(e.__u|=_?160:128;c&&c.nodeType==8&&c.nextSibling;)c=c.nextSibling;o[o.indexOf(c)]=null,e.__e=c}else{for(B=o.length;B--;)de(o[B]);fe(e)}else e.__e=n.__e,e.__k=n.__k,E.then||fe(e);b.__e(E,e,n)}else o==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):c=e.__e=kt(n.__e,e,n,r,s,o,l,_,a);return(f=b.diffed)&&f(e),128&e.__u?void 0:c}function fe(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(fe))}function Ae(t,e,n){for(var r=0;r<n.length;r++)he(n[r],n[++r],n[++r]);b.__c&&b.__c(e,t),t.some(function(s){try{t=s.__h,s.__h=[],t.some(function(o){o.call(s)})}catch(o){b.__e(o,s.__v)}})}function ze(t){return typeof t!="object"||t==null||t.__b>0?t:ne(t)?t.map(ze):T({},t)}function kt(t,e,n,r,s,o,l,c,_){var a,f,i,d,u,m,C,x=n.props||Z,g=e.props,h=e.type;if(h=="svg"?s="http://www.w3.org/2000/svg":h=="math"?s="http://www.w3.org/1998/Math/MathML":s||(s="http://www.w3.org/1999/xhtml"),o!=null){for(a=0;a<o.length;a++)if((u=o[a])&&"setAttribute"in u==!!h&&(h?u.localName==h:u.nodeType==3)){t=u,o[a]=null;break}}if(t==null){if(h==null)return document.createTextNode(g);t=document.createElementNS(s,h,g.is&&g),c&&(b.__m&&b.__m(e,o),c=!1),o=null}if(h==null)x===g||c&&t.data==g||(t.data=g);else{if(o=o&&te.call(t.childNodes),!c&&o!=null)for(x={},a=0;a<t.attributes.length;a++)x[(u=t.attributes[a]).name]=u.value;for(a in x)u=x[a],a=="dangerouslySetInnerHTML"?i=u:a=="children"||a in g||a=="value"&&"defaultValue"in g||a=="checked"&&"defaultChecked"in g||J(t,a,null,u,s);for(a in g)u=g[a],a=="children"?d=u:a=="dangerouslySetInnerHTML"?f=u:a=="value"?m=u:a=="checked"?C=u:c&&typeof u!="function"||x[a]===u||J(t,a,u,x[a],s);if(f)c||i&&(f.__html==i.__html||f.__html==t.innerHTML)||(t.innerHTML=f.__html),e.__k=[];else if(i&&(t.innerHTML=""),He(e.type=="template"?t.content:t,ne(d)?d:[d],e,n,r,h=="foreignObject"?"http://www.w3.org/1999/xhtml":s,o,l,o?o[0]:n.__k&&L(n,0),c,_),o!=null)for(a=o.length;a--;)de(o[a]);c||(a="value",h=="progress"&&m==null?t.removeAttribute("value"):m!=null&&(m!==t[a]||h=="progress"&&!m||h=="option"&&m!=x[a])&&J(t,a,m,x[a],s),a="checked",C!=null&&C!=t[a]&&J(t,a,C,x[a],s))}return t}function he(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(s){b.__e(s,n)}}function We(t,e,n){var r,s;if(b.unmount&&b.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||he(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){b.__e(o,e)}r.base=r.__P=null}if(r=t.__k)for(s=0;s<r.length;s++)r[s]&&We(r[s],e,n||typeof t.type!="function");n||de(t.__e),t.__c=t.__=t.__e=void 0}function wt(t,e,n){return this.constructor(t,n)}function Be(t,e,n){var r,s,o,l;e==document&&(e=document.documentElement),b.__&&b.__(t,e),s=(r=typeof n=="function")?null:n&&n.__k||e.__k,o=[],l=[],ge(e,t=(!r&&n||e).__k=p(S,null,[t]),s||Z,Z,e.namespaceURI,!r&&n?[n]:s?null:e.firstChild?te.call(e.childNodes):null,o,!r&&n?n:s?s.__e:e.firstChild,r,l),Ae(o,t,l)}te=Q.slice,b={__e:function(t,e,n,r){for(var s,o,l;e=e.__;)if((s=e.__c)&&!s.__)try{if((o=s.constructor)&&o.getDerivedStateFromError!=null&&(s.setState(o.getDerivedStateFromError(t)),l=s.__d),s.componentDidCatch!=null&&(s.componentDidCatch(t,r||{}),l=s.__d),l)return s.__E=s}catch(c){t=c}throw t}},Me=0,ht=function(t){return t!=null&&t.constructor===void 0},X.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=T({},this.state),typeof t=="function"&&(t=t(T({},n),this.props)),t&&T(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),we(this))},X.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),we(this))},X.prototype.render=S,R=[],Pe=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ie=function(t,e){return t.__v.__b-e.__v.__b},ee.__r=0,De=/(PointerCapture)$|Capture$/i,ue=0,ce=Se(!1),_e=Se(!0),mt=0;var q,y,me,Ne,V=0,Ge=[],k=b,$e=k.__b,Re=k.__r,Ue=k.diffed,Le=k.__c,Fe=k.unmount,Oe=k.__;function xe(t,e){k.__h&&k.__h(y,t,V||e),V=0;var n=y.__H||(y.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function M(t){return V=1,Ct(Ye,t)}function Ct(t,e,n){var r=xe(q++,2);if(r.t=t,!r.__c&&(r.__=[n?n(e):Ye(void 0,e),function(c){var _=r.__N?r.__N[0]:r.__[0],a=r.t(_,c);_!==a&&(r.__N=[a,r.__[1]],r.__c.setState({}))}],r.__c=y,!y.__f)){var s=function(c,_,a){if(!r.__c.__H)return!0;var f=r.__c.__H.__.filter(function(d){return d.__c});if(f.every(function(d){return!d.__N}))return!o||o.call(this,c,_,a);var i=r.__c.props!==c;return f.some(function(d){if(d.__N){var u=d.__[0];d.__=d.__N,d.__N=void 0,u!==d.__[0]&&(i=!0)}}),o&&o.call(this,c,_,a)||i};y.__f=!0;var o=y.shouldComponentUpdate,l=y.componentWillUpdate;y.componentWillUpdate=function(c,_,a){if(this.__e){var f=o;o=void 0,s(c,_,a),o=f}l&&l.call(this,c,_,a)},y.shouldComponentUpdate=s}return r.__N||r.__}function z(t,e){var n=xe(q++,3);!k.__s&&Ve(n.__H,e)&&(n.__=t,n.u=e,y.__H.__h.push(n))}function oe(t){return V=5,qe(function(){return{current:t}},[])}function qe(t,e){var n=xe(q++,7);return Ve(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function ie(t,e){return V=8,qe(function(){return t},e)}function St(){for(var t;t=Ge.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(re),e.__h.some(be),e.__h=[]}catch(n){e.__h=[],k.__e(n,t.__v)}}}k.__b=function(t){y=null,$e&&$e(t)},k.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Oe&&Oe(t,e)},k.__r=function(t){Re&&Re(t),q=0;var e=(y=t.__c).__H;e&&(me===y?(e.__h=[],y.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(re),e.__h.some(be),e.__h=[],q=0)),me=y},k.diffed=function(t){Ue&&Ue(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(Ge.push(e)!==1&&Ne===k.requestAnimationFrame||((Ne=k.requestAnimationFrame)||Mt)(St)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),me=y=null},k.__c=function(t,e){e.some(function(n){try{n.__h.some(re),n.__h=n.__h.filter(function(r){return!r.__||be(r)})}catch(r){e.some(function(s){s.__h&&(s.__h=[])}),e=[],k.__e(r,n.__v)}}),Le&&Le(t,e)},k.unmount=function(t){Fe&&Fe(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{re(r)}catch(s){e=s}}),n.__H=void 0,e&&k.__e(e,n.__v))};var je=typeof requestAnimationFrame=="function";function Mt(t){var e,n=function(){clearTimeout(r),je&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);je&&(e=requestAnimationFrame(n))}function re(t){var e=y,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),y=e}function be(t){var e=y;t.__c=t.__(),y=e}function Ve(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function Ye(t,e){return typeof e=="function"?e(t):e}function F(t){let e=t.replace("#","");if(e.length===3&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),e.length!==6)return"#ffffff";let n=parseInt(e.slice(0,2),16),r=parseInt(e.slice(2,4),16),s=parseInt(e.slice(4,6),16);return(n*299+r*587+s*114)/1e3>150?"#1a1a1a":"#ffffff"}function Je({config:t,isOpen:e,onClick:n,size:r=56}){let s=t.primaryColor||"#6366f1",o=F(s),l=t.launcherIcon,c=l?.startsWith("http"),_=l&&!c&&l.length<=4,a=r/56,f=Math.round(24*a),i=Math.round(20*a),d=Math.round(28*a);return p("button",{class:"lp-launcher",onClick:n,style:{backgroundColor:s,color:o,width:`${r}px`,height:`${r}px`},"aria-label":e?"Close chat":"Open chat"},e?p("svg",{width:i,height:i,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},p("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),p("line",{x1:"6",y1:"6",x2:"18",y2:"18"})):c?p("img",{src:l,alt:"Chat",style:{width:`${d}px`,height:`${d}px`,objectFit:"contain"}}):_?p("span",{style:{fontSize:`${Math.round(24*a)}px`,lineHeight:1}},l):p("svg",{width:f,height:f,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},p("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})))}function Pt(t){let e=[],n=/(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g,r=0,s;for(;(s=n.exec(t))!==null;)s.index>r&&e.push(t.slice(r,s.index)),s[1]?e.push(p("strong",null,s[2])):s[3]&&e.push(p("a",{href:s[3],target:"_blank",rel:"noopener noreferrer"},s[3])),r=s.index+s[0].length;return r<t.length&&e.push(t.slice(r)),e}function It(t){let e=t.split(`
`);return e.map((n,r)=>p("span",{key:r},Pt(n),r<e.length-1&&p("br",null)))}function Ke({message:t,primaryColor:e}){let n=t.role==="user",r=F(e);return p("div",{class:`lp-msg ${n?"lp-msg-user":"lp-msg-assistant"}`,style:n?{backgroundColor:e,color:r}:void 0},It(t.content))}function Xe(){return p("div",{class:"lp-typing"},p("span",null),p("span",null),p("span",null))}function se(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}function Dt(t){let e=`lp_session_${t}`,n=localStorage.getItem(e);return n||(n=se(),localStorage.setItem(e,n)),n}function Et(t){try{let e=localStorage.getItem(`lp_history_${t}`);if(e)return JSON.parse(e).slice(-50)}catch{}return[]}function Ht(t,e){try{localStorage.setItem(`lp_history_${t}`,JSON.stringify(e.slice(-50)))}catch{}}function Ze({config:t,token:e,agentId:n,channelId:r,apiOrigin:s,onClose:o,size:l}){let c=l?.panelW??380,_=l?.panelH??520,a=l?.fontSize??14,[f,i]=M(()=>Et(r)),[d,u]=M(""),[m,C]=M(!1),[x,g]=M(!1),[convSt,setConvSt]=M("active"),h=oe(null),w=oe(null),D=oe(Dt(r)),pollRef=oe(null),I=t.primaryColor||"#6366f1",A=F(I),W=A==="#ffffff"?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)",B=t.agentName||"AI Assistant",P=t.welcomeMessage||"Hi! How can I help you today?",E=t.conversationStarters??[],ot=t.theme==="dark",it=t.borderRadius==="sharp",st=t.showBranding!==!1;z(()=>{h.current?.scrollIntoView({behavior:"smooth"})},[f,x]),z(()=>{w.current?.focus()},[]);let ae=ie(async v=>{if(!v.trim()||m)return;let U={id:se(),role:"user",content:v.trim(),timestamp:Date.now()},O={id:se(),role:"assistant",content:"",isStreaming:!0,timestamp:Date.now()};i(N=>[...N,U]),u(""),C(!0),g(!0);try{let N=await fetch(`${s}/api/channels/${n}/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({userMessage:v.trim(),sessionId:D.current})});if(N.status===423){i(zz=>[...zz,{id:se(),role:"assistant",content:"This conversation is currently paused. Please wait for a team member to resume it.",timestamp:Date.now()}]);C(!1);g(!1);return}if(N.status===410){i(zz=>[...zz,{id:se(),role:"assistant",content:"This conversation has been closed.",timestamp:Date.now()}]);C(!1);g(!1);return}let ctype=N.headers.get("content-type")||"";if(ctype.includes("application/json")){let jr=await N.json();if(jr.status==="human_takeover"){setConvSt("human_takeover");i(zz=>[...zz,{id:se(),role:"assistant",content:jr.message||"A team member will respond shortly.",timestamp:Date.now()}]);C(!1);g(!1);return}if(!N.ok)throw new Error("Chat request failed");return}if(!N.ok||!N.body)throw new Error("Chat request failed");let ft=N.body.getReader(),ut=new TextDecoder,pe="",j="",Y=!1;for(;;){let{value:dt,done:gt}=await ft.read();if(gt)break;pe+=ut.decode(dt,{stream:!0});let ye=pe.split(`

`);pe=ye.pop()??"";for(let ve of ye)if(ve.startsWith("data: "))try{let G=JSON.parse(ve.slice(6));G.type==="text-delta"?(Y||(i(H=>[...H,O]),Y=!0,g(!1)),j+=G.delta,i(H=>H.map($=>$.id===O.id?{...$,content:j}:$))):G.type==="done"?!Y&&j===""?(j=G.assistantContent||"I processed your request.",i(H=>[...H,{...O,content:j,isStreaming:!1}])):i(H=>H.map($=>$.id===O.id?{...$,isStreaming:!1}:$)):G.type==="error"&&(Y||i(H=>[...H,{...O,content:"Sorry, something went wrong. Please try again.",isStreaming:!1}]))}catch{}}}catch{g(!1),i(N=>[...N,{id:se(),role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again.",timestamp:Date.now()}])}finally{C(!1),g(!1)}},[n,s,e,m]);z(()=>{f.length>0&&Ht(r,f.filter(v=>!v.isStreaming))},[f,r]);z(()=>{if(convSt!=="human_takeover"){if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null}return}let sinceIdx=0;let initPoll=async()=>{try{let r2=await fetch(`${s}/api/widget/${r}/status?sessionId=${D.current}&since=0`);if(r2.ok){let d2=await r2.json();sinceIdx=d2.totalMessages}}catch{}};initPoll();pollRef.current=setInterval(async()=>{try{let r2=await fetch(`${s}/api/widget/${r}/status?sessionId=${D.current}&since=${sinceIdx}`);if(!r2.ok)return;let d2=await r2.json();if(d2.newMessages&&d2.newMessages.length>0){let hm=d2.newMessages.filter(mm=>mm.role==="human_agent");if(hm.length>0){i(pr=>[...pr,...hm.map(mm=>({id:se(),role:"assistant",content:mm.content,timestamp:Date.now()}))])}sinceIdx=d2.totalMessages}if(d2.status!=="human_takeover"){setConvSt(d2.status)}}catch{}},3000);return()=>{if(pollRef.current){clearInterval(pollRef.current);pollRef.current=null}}},[convSt,s,r]);function at(v){v.key==="Enter"&&!v.shiftKey&&(v.preventDefault(),ae(d))}function lt(v){let U=v.target;u(U.value),U.style.height="38px",U.style.height=Math.min(U.scrollHeight,100)+"px"}let pt=E.length>0&&f.filter(v=>v.role==="user").length===0,le=t.agentAvatar,ct=le?.startsWith("http"),_t=["lp-chat-panel",ot?"lp-dark":"",it?"lp-sharp":""].filter(Boolean).join(" ");return p("div",{class:_t,style:{width:`${c}px`,height:`${_}px`,fontSize:`${a}px`}},p("div",{class:"lp-header",style:{backgroundColor:I}},p("div",{class:"lp-header-avatar",style:{backgroundColor:A==="#ffffff"?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.1)"}},ct?p("img",{src:le,alt:B}):p("span",{style:{color:A}},le||B.charAt(0))),p("div",{class:"lp-header-info"},p("div",{class:"lp-header-name",style:{color:A}},B),p("div",{class:"lp-header-status",style:{color:W}},p("span",{style:{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#22c55e",marginRight:"4px",verticalAlign:"middle"}}),"Online")),p("button",{class:"lp-close-btn",onClick:o,"aria-label":"Close chat",style:{color:W}},p("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},p("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),p("line",{x1:"6",y1:"6",x2:"18",y2:"18"})))),p("div",{class:"lp-messages"},f.length===0&&p("div",{class:"lp-welcome"},P),f.map(v=>p(Ke,{key:v.id,message:v,primaryColor:I})),x&&p(Xe,null),p("div",{ref:h})),pt&&p("div",{class:"lp-starters"},E.slice(0,4).map(v=>p("button",{key:v,class:"lp-starter-btn",onClick:()=>ae(v),disabled:m},v))),p("div",{class:"lp-input-area"},p("textarea",{ref:w,class:"lp-input",value:d,onInput:lt,onKeyDown:at,placeholder:"Type a message...",rows:1,disabled:m}),p("button",{class:"lp-send-btn",style:{backgroundColor:I,color:A},onClick:()=>ae(d),disabled:!d.trim()||m,"aria-label":"Send message"},p("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},p("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),p("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})))),st&&p("div",{class:"lp-powered"},p("a",{href:"https://launchpath.io",target:"_blank",rel:"noopener noreferrer"},"Powered by LaunchPath")))}function Qe({message:t,delay:e,position:n,isDark:r,isSharp:s,onDismiss:o,onClick:l}){let[c,_]=M(!1);return z(()=>{let a=setTimeout(()=>_(!0),e*1e3);return()=>clearTimeout(a)},[e]),c?p("div",{class:`lp-greeting lp-greeting-${n}`,onClick:l},p("button",{class:`lp-greeting-close lp-greeting-close-${n}`,onClick:a=>{a.stopPropagation(),o()},"aria-label":"Dismiss"},p("svg",{width:"8",height:"8",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"round"},p("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),p("line",{x1:"6",y1:"6",x2:"18",y2:"18"}))),t,p("div",{class:`lp-greeting-tail lp-greeting-tail-${n}`})):null}var et={compact:{launcher:48,panelW:340,panelH:460,fontSize:13},default:{launcher:56,panelW:380,panelH:520,fontSize:14},large:{launcher:64,panelW:420,panelH:580,fontSize:15}};function tt({channelId:t,apiOrigin:e}){let[n,r]=M(null),[s,o]=M(null),[l,c]=M(null),[_,a]=M(!1),[f,i]=M(!1),[d,u]=M(!1);z(()=>{fetch(`${e}/api/widget/${t}/config`).then(w=>{if(!w.ok)throw new Error("Config fetch failed");return w.json()}).then(w=>{r(w.config),o(w.token),c(w.agentId)}).catch(()=>u(!0))},[t,e]);let m=ie(()=>{a(!0),i(!0)},[]);if(d||!n)return null;let C=n.position||"right",x=et[n.widgetSize||"default"],h=!!n.greetingMessage?.trim()&&!_&&!f;return p("div",{class:`lp-position-${C}`},_&&s&&l?p(Ze,{config:n,token:s,agentId:l,channelId:t,apiOrigin:e,onClose:()=>a(!1),size:x}):null,h&&p(Qe,{message:n.greetingMessage,delay:n.greetingDelay??3,position:C,isDark:n.theme==="dark",isSharp:n.borderRadius==="sharp",onDismiss:()=>i(!0),onClick:m}),p(Je,{config:n,isOpen:_,onClick:()=>_?a(!1):m(),size:x.launcher}))}var nt=`
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
`;function rt(){let t=document.querySelectorAll("script[data-channel]"),e=t[t.length-1];if(!e)return;let n=e.getAttribute("data-channel");if(!n)return;let r=e.getAttribute("src")||"",s;try{s=new URL(r,window.location.href).origin}catch{s=window.location.origin}let o=document.createElement("div");o.id="lp-widget-host",o.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;",document.body.appendChild(o);let l=o.attachShadow({mode:"open"}),c=document.createElement("style");c.textContent=nt,l.appendChild(c);let _=document.createElement("div");_.id="lp-widget-root",_.style.cssText="pointer-events:auto;",l.appendChild(_),Be(p(tt,{channelId:n,apiOrigin:s}),_)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",rt):rt();})();
