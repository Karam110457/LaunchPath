"use strict";(()=>{var te,m,Ce,ct,U,ve,Se,Me,Pe,pe,le,_e,pt,Q={},Z=[],ft=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ne=Array.isArray;function H(t,e){for(var n in e)t[n]=e[n];return t}function fe(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function c(t,e,n){var o,i,r,a={};for(r in e)r=="key"?o=e[r]:r=="ref"?i=e[r]:a[r]=e[r];if(arguments.length>2&&(a.children=arguments.length>3?te.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(r in t.defaultProps)a[r]===void 0&&(a[r]=t.defaultProps[r]);return G(t,a,o,i,null)}function G(t,e,n,o,i){var r={type:t,props:e,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Ce,__i:-1,__u:0};return i==null&&m.vnode!=null&&m.vnode(r),r}function w(t){return t.children}function X(t,e){this.props=t,this.context=e}function R(t,e){if(e==null)return t.__?R(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?R(t):null}function ut(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,o=[],i=[],r=H({},e);r.__v=e.__v+1,m.vnode&&m.vnode(r),ue(t.__P,r,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,o,n??R(e),!!(32&e.__u),i),r.__v=e.__v,r.__.__k[r.__i]=r,He(o,r,i),e.__e=e.__=null,r.__e!=n&&Ee(r)}}function Ee(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Ee(t)}function xe(t){(!t.__d&&(t.__d=!0)&&U.push(t)&&!ee.__r++||ve!=m.debounceRendering)&&((ve=m.debounceRendering)||Se)(ee)}function ee(){for(var t,e=1;U.length;)U.length>e&&U.sort(Me),t=U.shift(),e=U.length,ut(t);ee.__r=0}function Ie(t,e,n,o,i,r,a,_,f,l,u){var s,d,p,b,C,k,g,h=o&&o.__k||Z,M=e.length;for(f=dt(n,e,h,f,M),s=0;s<M;s++)(p=n.__k[s])!=null&&(d=p.__i!=-1&&h[p.__i]||Q,p.__i=s,k=ue(t,p,d,i,r,a,_,f,l,u),b=p.__e,p.ref&&d.ref!=p.ref&&(d.ref&&de(d.ref,null,p),u.push(p.ref,p.__c||b,p)),C==null&&b!=null&&(C=b),(g=!!(4&p.__u))||d.__k===p.__k?f=Te(p,f,t,g):typeof p.type=="function"&&k!==void 0?f=k:b&&(f=b.nextSibling),p.__u&=-7);return n.__e=C,f}function dt(t,e,n,o,i){var r,a,_,f,l,u=n.length,s=u,d=0;for(t.__k=new Array(i),r=0;r<i;r++)(a=e[r])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=t.__k[r]=G(null,a,null,null,null):ne(a)?a=t.__k[r]=G(w,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=t.__k[r]=G(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):t.__k[r]=a,f=r+d,a.__=t,a.__b=t.__b+1,_=null,(l=a.__i=ht(a,n,f,s))!=-1&&(s--,(_=n[l])&&(_.__u|=2)),_==null||_.__v==null?(l==-1&&(i>u?d--:i<u&&d++),typeof a.type!="function"&&(a.__u|=4)):l!=f&&(l==f-1?d--:l==f+1?d++:(l>f?d--:d++,a.__u|=4))):t.__k[r]=null;if(s)for(r=0;r<u;r++)(_=n[r])!=null&&(2&_.__u)==0&&(_.__e==o&&(o=R(_)),De(_,_));return o}function Te(t,e,n,o){var i,r;if(typeof t.type=="function"){for(i=t.__k,r=0;i&&r<i.length;r++)i[r]&&(i[r].__=t,e=Te(i[r],e,n,o));return e}t.__e!=e&&(o&&(e&&t.type&&!e.parentNode&&(e=R(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function ht(t,e,n,o){var i,r,a,_=t.key,f=t.type,l=e[n],u=l!=null&&(2&l.__u)==0;if(l===null&&_==null||u&&_==l.key&&f==l.type)return n;if(o>(u?1:0)){for(i=n-1,r=n+1;i>=0||r<e.length;)if((l=e[a=i>=0?i--:r++])!=null&&(2&l.__u)==0&&_==l.key&&f==l.type)return a}return-1}function ke(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||ft.test(e)?n:n+"px"}function K(t,e,n,o,i){var r,a;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof o=="string"&&(t.style.cssText=o=""),o)for(e in o)n&&e in n||ke(t.style,e,"");if(n)for(e in n)o&&n[e]==o[e]||ke(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")r=e!=(e=e.replace(Pe,"$1")),a=e.toLowerCase(),e=a in t||e=="onFocusOut"||e=="onFocusIn"?a.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+r]=n,n?o?n.u=o.u:(n.u=pe,t.addEventListener(e,r?_e:le,r)):t.removeEventListener(e,r?_e:le,r);else{if(i=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function we(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=pe++;else if(e.t<n.u)return;return n(m.event?m.event(e):e)}}}function ue(t,e,n,o,i,r,a,_,f,l){var u,s,d,p,b,C,k,g,h,M,P,A,F,L,O,S=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(f=!!(32&n.__u),r=[_=e.__e=n.__e]),(u=m.__b)&&u(e);e:if(typeof S=="function")try{if(g=e.props,h="prototype"in S&&S.prototype.render,M=(u=S.contextType)&&o[u.__c],P=u?M?M.props.value:u.__:o,n.__c?k=(s=e.__c=n.__c).__=s.__E:(h?e.__c=s=new S(g,P):(e.__c=s=new X(g,P),s.constructor=S,s.render=mt),M&&M.sub(s),s.state||(s.state={}),s.__n=o,d=s.__d=!0,s.__h=[],s._sb=[]),h&&s.__s==null&&(s.__s=s.state),h&&S.getDerivedStateFromProps!=null&&(s.__s==s.state&&(s.__s=H({},s.__s)),H(s.__s,S.getDerivedStateFromProps(g,s.__s))),p=s.props,b=s.state,s.__v=e,d)h&&S.getDerivedStateFromProps==null&&s.componentWillMount!=null&&s.componentWillMount(),h&&s.componentDidMount!=null&&s.__h.push(s.componentDidMount);else{if(h&&S.getDerivedStateFromProps==null&&g!==p&&s.componentWillReceiveProps!=null&&s.componentWillReceiveProps(g,P),e.__v==n.__v||!s.__e&&s.shouldComponentUpdate!=null&&s.shouldComponentUpdate(g,s.__s,P)===!1){e.__v!=n.__v&&(s.props=g,s.state=s.__s,s.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(I){I&&(I.__=e)}),Z.push.apply(s.__h,s._sb),s._sb=[],s.__h.length&&a.push(s);break e}s.componentWillUpdate!=null&&s.componentWillUpdate(g,s.__s,P),h&&s.componentDidUpdate!=null&&s.__h.push(function(){s.componentDidUpdate(p,b,C)})}if(s.context=P,s.props=g,s.__P=t,s.__e=!1,A=m.__r,F=0,h)s.state=s.__s,s.__d=!1,A&&A(e),u=s.render(s.props,s.state,s.context),Z.push.apply(s.__h,s._sb),s._sb=[];else do s.__d=!1,A&&A(e),u=s.render(s.props,s.state,s.context),s.state=s.__s;while(s.__d&&++F<25);s.state=s.__s,s.getChildContext!=null&&(o=H(H({},o),s.getChildContext())),h&&!d&&s.getSnapshotBeforeUpdate!=null&&(C=s.getSnapshotBeforeUpdate(p,b)),L=u!=null&&u.type===w&&u.key==null?Ae(u.props.children):u,_=Ie(t,ne(L)?L:[L],e,n,o,i,r,a,_,f,l),s.base=e.__e,e.__u&=-161,s.__h.length&&a.push(s),k&&(s.__E=s.__=null)}catch(I){if(e.__v=null,f||r!=null)if(I.then){for(e.__u|=f?160:128;_&&_.nodeType==8&&_.nextSibling;)_=_.nextSibling;r[r.indexOf(_)]=null,e.__e=_}else{for(O=r.length;O--;)fe(r[O]);ce(e)}else e.__e=n.__e,e.__k=n.__k,I.then||ce(e);m.__e(I,e,n)}else r==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):_=e.__e=gt(n.__e,e,n,o,i,r,a,f,l);return(u=m.diffed)&&u(e),128&e.__u?void 0:_}function ce(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(ce))}function He(t,e,n){for(var o=0;o<n.length;o++)de(n[o],n[++o],n[++o]);m.__c&&m.__c(e,t),t.some(function(i){try{t=i.__h,i.__h=[],t.some(function(r){r.call(i)})}catch(r){m.__e(r,i.__v)}})}function Ae(t){return typeof t!="object"||t==null||t.__b>0?t:ne(t)?t.map(Ae):H({},t)}function gt(t,e,n,o,i,r,a,_,f){var l,u,s,d,p,b,C,k=n.props||Q,g=e.props,h=e.type;if(h=="svg"?i="http://www.w3.org/2000/svg":h=="math"?i="http://www.w3.org/1998/Math/MathML":i||(i="http://www.w3.org/1999/xhtml"),r!=null){for(l=0;l<r.length;l++)if((p=r[l])&&"setAttribute"in p==!!h&&(h?p.localName==h:p.nodeType==3)){t=p,r[l]=null;break}}if(t==null){if(h==null)return document.createTextNode(g);t=document.createElementNS(i,h,g.is&&g),_&&(m.__m&&m.__m(e,r),_=!1),r=null}if(h==null)k===g||_&&t.data==g||(t.data=g);else{if(r=r&&te.call(t.childNodes),!_&&r!=null)for(k={},l=0;l<t.attributes.length;l++)k[(p=t.attributes[l]).name]=p.value;for(l in k)p=k[l],l=="dangerouslySetInnerHTML"?s=p:l=="children"||l in g||l=="value"&&"defaultValue"in g||l=="checked"&&"defaultChecked"in g||K(t,l,null,p,i);for(l in g)p=g[l],l=="children"?d=p:l=="dangerouslySetInnerHTML"?u=p:l=="value"?b=p:l=="checked"?C=p:_&&typeof p!="function"||k[l]===p||K(t,l,p,k[l],i);if(u)_||s&&(u.__html==s.__html||u.__html==t.innerHTML)||(t.innerHTML=u.__html),e.__k=[];else if(s&&(t.innerHTML=""),Ie(e.type=="template"?t.content:t,ne(d)?d:[d],e,n,o,h=="foreignObject"?"http://www.w3.org/1999/xhtml":i,r,a,r?r[0]:n.__k&&R(n,0),_,f),r!=null)for(l=r.length;l--;)fe(r[l]);_||(l="value",h=="progress"&&b==null?t.removeAttribute("value"):b!=null&&(b!==t[l]||h=="progress"&&!b||h=="option"&&b!=k[l])&&K(t,l,b,k[l],i),l="checked",C!=null&&C!=t[l]&&K(t,l,C,k[l],i))}return t}function de(t,e,n){try{if(typeof t=="function"){var o=typeof t.__u=="function";o&&t.__u(),o&&e==null||(t.__u=t(e))}else t.current=e}catch(i){m.__e(i,n)}}function De(t,e,n){var o,i;if(m.unmount&&m.unmount(t),(o=t.ref)&&(o.current&&o.current!=t.__e||de(o,null,e)),(o=t.__c)!=null){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(r){m.__e(r,e)}o.base=o.__P=null}if(o=t.__k)for(i=0;i<o.length;i++)o[i]&&De(o[i],e,n||typeof t.type!="function");n||fe(t.__e),t.__c=t.__=t.__e=void 0}function mt(t,e,n){return this.constructor(t,n)}function Ne(t,e,n){var o,i,r,a;e==document&&(e=document.documentElement),m.__&&m.__(t,e),i=(o=typeof n=="function")?null:n&&n.__k||e.__k,r=[],a=[],ue(e,t=(!o&&n||e).__k=c(w,null,[t]),i||Q,Q,e.namespaceURI,!o&&n?[n]:i?null:e.firstChild?te.call(e.childNodes):null,r,!o&&n?n:i?i.__e:e.firstChild,o,a),He(r,t,a)}te=Z.slice,m={__e:function(t,e,n,o){for(var i,r,a;e=e.__;)if((i=e.__c)&&!i.__)try{if((r=i.constructor)&&r.getDerivedStateFromError!=null&&(i.setState(r.getDerivedStateFromError(t)),a=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(t,o||{}),a=i.__d),a)return i.__E=i}catch(_){t=_}throw t}},Ce=0,ct=function(t){return t!=null&&t.constructor===void 0},X.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=H({},this.state),typeof t=="function"&&(t=t(H({},n),this.props)),t&&H(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),xe(this))},X.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),xe(this))},X.prototype.render=w,U=[],Se=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Me=function(t,e){return t.__v.__b-e.__v.__b},ee.__r=0,Pe=/(PointerCapture)$|Capture$/i,pe=0,le=we(!1),_e=we(!0),pt=0;var V,y,he,Ue,J=0,$e=[],x=m,Le=x.__b,We=x.__r,Re=x.diffed,ze=x.__c,Be=x.unmount,Fe=x.__;function me(t,e){x.__h&&x.__h(y,t,J||e),J=0;var n=y.__H||(y.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function E(t){return J=1,bt(Je,t)}function bt(t,e,n){var o=me(V++,2);if(o.t=t,!o.__c&&(o.__=[n?n(e):Je(void 0,e),function(_){var f=o.__N?o.__N[0]:o.__[0],l=o.t(f,_);f!==l&&(o.__N=[l,o.__[1]],o.__c.setState({}))}],o.__c=y,!y.__f)){var i=function(_,f,l){if(!o.__c.__H)return!0;var u=o.__c.__H.__.filter(function(d){return d.__c});if(u.every(function(d){return!d.__N}))return!r||r.call(this,_,f,l);var s=o.__c.props!==_;return u.some(function(d){if(d.__N){var p=d.__[0];d.__=d.__N,d.__N=void 0,p!==d.__[0]&&(s=!0)}}),r&&r.call(this,_,f,l)||s};y.__f=!0;var r=y.shouldComponentUpdate,a=y.componentWillUpdate;y.componentWillUpdate=function(_,f,l){if(this.__e){var u=r;r=void 0,i(_,f,l),r=u}a&&a.call(this,_,f,l)},y.shouldComponentUpdate=i}return o.__N||o.__}function z(t,e){var n=me(V++,3);!x.__s&&Ve(n.__H,e)&&(n.__=t,n.u=e,y.__H.__h.push(n))}function oe(t){return J=5,je(function(){return{current:t}},[])}function je(t,e){var n=me(V++,7);return Ve(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function qe(t,e){return J=8,je(function(){return t},e)}function yt(){for(var t;t=$e.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(re),e.__h.some(ge),e.__h=[]}catch(n){e.__h=[],x.__e(n,t.__v)}}}x.__b=function(t){y=null,Le&&Le(t)},x.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Fe&&Fe(t,e)},x.__r=function(t){We&&We(t),V=0;var e=(y=t.__c).__H;e&&(he===y?(e.__h=[],y.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(re),e.__h.some(ge),e.__h=[],V=0)),he=y},x.diffed=function(t){Re&&Re(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&($e.push(e)!==1&&Ue===x.requestAnimationFrame||((Ue=x.requestAnimationFrame)||vt)(yt)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),he=y=null},x.__c=function(t,e){e.some(function(n){try{n.__h.some(re),n.__h=n.__h.filter(function(o){return!o.__||ge(o)})}catch(o){e.some(function(i){i.__h&&(i.__h=[])}),e=[],x.__e(o,n.__v)}}),ze&&ze(t,e)},x.unmount=function(t){Be&&Be(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(o){try{re(o)}catch(i){e=i}}),n.__H=void 0,e&&x.__e(e,n.__v))};var Oe=typeof requestAnimationFrame=="function";function vt(t){var e,n=function(){clearTimeout(o),Oe&&cancelAnimationFrame(e),setTimeout(t)},o=setTimeout(n,35);Oe&&(e=requestAnimationFrame(n))}function re(t){var e=y,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),y=e}function ge(t){var e=y;t.__c=t.__(),y=e}function Ve(t,e){return!t||t.length!==e.length||e.some(function(n,o){return n!==t[o]})}function Je(t,e){return typeof e=="function"?e(t):e}function B(t){let e=t.replace("#","");if(e.length===3&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),e.length!==6)return"#ffffff";let n=parseInt(e.slice(0,2),16),o=parseInt(e.slice(2,4),16),i=parseInt(e.slice(4,6),16);return(n*299+o*587+i*114)/1e3>150?"#1a1a1a":"#ffffff"}function Ye({config:t,isOpen:e,onClick:n}){let o=t.primaryColor||"#6366f1",i=B(o),r=t.launcherIcon,a=r?.startsWith("http"),_=r&&!a&&r.length<=4;return c("button",{class:"lp-launcher",onClick:n,style:{backgroundColor:o,color:i},"aria-label":e?"Close chat":"Open chat"},e?c("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},c("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),c("line",{x1:"6",y1:"6",x2:"18",y2:"18"})):a?c("img",{src:r,alt:"Chat",style:{width:"28px",height:"28px",objectFit:"contain"}}):_?c("span",{style:{fontSize:"24px",lineHeight:1}},r):c("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},c("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})))}function xt(t){let e=[],n=/(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g,o=0,i;for(;(i=n.exec(t))!==null;)i.index>o&&e.push(t.slice(o,i.index)),i[1]?e.push(c("strong",null,i[2])):i[3]&&e.push(c("a",{href:i[3],target:"_blank",rel:"noopener noreferrer"},i[3])),o=i.index+i[0].length;return o<t.length&&e.push(t.slice(o)),e}function kt(t){let e=t.split(`
`);return e.map((n,o)=>c("span",{key:o},xt(n),o<e.length-1&&c("br",null)))}function Ke({message:t,primaryColor:e}){let n=t.role==="user",o=B(e);return c("div",{class:`lp-msg ${n?"lp-msg-user":"lp-msg-assistant"}`,style:n?{backgroundColor:e,color:o}:void 0},kt(t.content))}function Ge(){return c("div",{class:"lp-typing"},c("span",null),c("span",null),c("span",null))}function ie(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}function wt(t){let e=`lp_session_${t}`,n=localStorage.getItem(e);return n||(n=ie(),localStorage.setItem(e,n)),n}function Ct(t){try{let e=localStorage.getItem(`lp_history_${t}`);if(e)return JSON.parse(e).slice(-50)}catch{}return[]}function St(t,e){try{localStorage.setItem(`lp_history_${t}`,JSON.stringify(e.slice(-50)))}catch{}}function Xe({config:t,token:e,agentId:n,channelId:o,apiOrigin:i,onClose:r}){let[a,_]=E(()=>Ct(o)),[f,l]=E(""),[u,s]=E(!1),[d,p]=E(!1),b=oe(null),C=oe(null),k=oe(wt(o)),g=t.primaryColor||"#6366f1",h=B(g),M=h==="#ffffff"?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)",P=t.agentName||"AI Assistant",A=t.welcomeMessage||"Hi! How can I help you today?",F=t.conversationStarters??[],L=t.theme==="dark",O=t.borderRadius==="sharp",S=t.showBranding!==!1;z(()=>{b.current?.scrollIntoView({behavior:"smooth"})},[a,d]),z(()=>{C.current?.focus()},[]);let I=qe(async v=>{if(!v.trim()||u)return;let W={id:ie(),role:"user",content:v.trim(),timestamp:Date.now()},$={id:ie(),role:"assistant",content:"",isStreaming:!0,timestamp:Date.now()};_(D=>[...D,W]),l(""),s(!0),p(!0);try{let D=await fetch(`${i}/api/channels/${n}/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({userMessage:v.trim(),sessionId:k.current})});if(!D.ok||!D.body)throw new Error("Chat request failed");let st=D.body.getReader(),at=new TextDecoder,ae="",j="",Y=!1;for(;;){let{value:lt,done:_t}=await st.read();if(_t)break;ae+=at.decode(lt,{stream:!0});let be=ae.split(`

`);ae=be.pop()??"";for(let ye of be)if(ye.startsWith("data: "))try{let q=JSON.parse(ye.slice(6));q.type==="text-delta"?(Y||(_(T=>[...T,$]),Y=!0,p(!1)),j+=q.delta,_(T=>T.map(N=>N.id===$.id?{...N,content:j}:N))):q.type==="done"?!Y&&j===""?(j=q.assistantContent||"I processed your request.",_(T=>[...T,{...$,content:j,isStreaming:!1}])):_(T=>T.map(N=>N.id===$.id?{...N,isStreaming:!1}:N)):q.type==="error"&&(Y||_(T=>[...T,{...$,content:"Sorry, something went wrong. Please try again.",isStreaming:!1}]))}catch{}}}catch{p(!1),_(D=>[...D,{id:ie(),role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again.",timestamp:Date.now()}])}finally{s(!1),p(!1)}},[n,i,e,u]);z(()=>{a.length>0&&St(o,a.filter(v=>!v.isStreaming))},[a,o]);function tt(v){v.key==="Enter"&&!v.shiftKey&&(v.preventDefault(),I(f))}function nt(v){let W=v.target;l(W.value),W.style.height="38px",W.style.height=Math.min(W.scrollHeight,100)+"px"}let rt=F.length>0&&a.filter(v=>v.role==="user").length===0,se=t.agentAvatar,ot=se?.startsWith("http"),it=["lp-chat-panel",L?"lp-dark":"",O?"lp-sharp":""].filter(Boolean).join(" ");return c("div",{class:it},c("div",{class:"lp-header",style:{backgroundColor:g}},c("div",{class:"lp-header-avatar",style:{backgroundColor:h==="#ffffff"?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.1)"}},ot?c("img",{src:se,alt:P}):c("span",{style:{color:h}},se||P.charAt(0))),c("div",{class:"lp-header-info"},c("div",{class:"lp-header-name",style:{color:h}},P),c("div",{class:"lp-header-status",style:{color:M}},c("span",{style:{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",backgroundColor:"#22c55e",marginRight:"4px",verticalAlign:"middle"}}),"Online")),c("button",{class:"lp-close-btn",onClick:r,"aria-label":"Close chat",style:{color:M}},c("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},c("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),c("line",{x1:"6",y1:"6",x2:"18",y2:"18"})))),c("div",{class:"lp-messages"},a.length===0&&c("div",{class:"lp-welcome"},A),a.map(v=>c(Ke,{key:v.id,message:v,primaryColor:g})),d&&c(Ge,null),c("div",{ref:b})),rt&&c("div",{class:"lp-starters"},F.slice(0,4).map(v=>c("button",{key:v,class:"lp-starter-btn",onClick:()=>I(v),disabled:u},v))),c("div",{class:"lp-input-area"},c("textarea",{ref:C,class:"lp-input",value:f,onInput:nt,onKeyDown:tt,placeholder:"Type a message...",rows:1,disabled:u}),c("button",{class:"lp-send-btn",style:{backgroundColor:g,color:h},onClick:()=>I(f),disabled:!f.trim()||u,"aria-label":"Send message"},c("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},c("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),c("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})))),S&&c("div",{class:"lp-powered"},c("a",{href:"https://launchpath.io",target:"_blank",rel:"noopener noreferrer"},"Powered by LaunchPath")))}function Qe({channelId:t,apiOrigin:e}){let[n,o]=E(null),[i,r]=E(null),[a,_]=E(null),[f,l]=E(!1),[u,s]=E(!1);if(z(()=>{fetch(`${e}/api/widget/${t}/config`).then(p=>{if(!p.ok)throw new Error("Config fetch failed");return p.json()}).then(p=>{o(p.config),r(p.token),_(p.agentId)}).catch(()=>s(!0))},[t,e]),u||!n)return null;let d=n.position||"right";return c("div",{class:`lp-position-${d}`},f&&i&&a?c(Xe,{config:n,token:i,agentId:a,channelId:t,apiOrigin:e,onClose:()=>l(!1)}):null,c(Ye,{config:n,isOpen:f,onClick:()=>l(!f)}))}var Ze=`
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
  width: 56px;
  height: 56px;
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
  width: 380px;
  height: 520px;
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
`;function et(){let t=document.querySelectorAll("script[data-channel]"),e=t[t.length-1];if(!e)return;let n=e.getAttribute("data-channel");if(!n)return;let o=e.getAttribute("src")||"",i;try{i=new URL(o,window.location.href).origin}catch{i=window.location.origin}let r=document.createElement("div");r.id="lp-widget-host",r.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;",document.body.appendChild(r);let a=r.attachShadow({mode:"open"}),_=document.createElement("style");_.textContent=Ze,a.appendChild(_);let f=document.createElement("div");f.id="lp-widget-root",f.style.cssText="pointer-events:auto;",a.appendChild(f),Ne(c(Qe,{channelId:n,apiOrigin:i}),f)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",et):et();})();
