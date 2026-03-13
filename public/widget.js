"use strict";(()=>{var ve,k,Ze,qt,O,Ge,Qe,et,tt,$e,Ae,De,Gt,be={},xe=[],Jt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ke=Array.isArray;function U(t,e){for(var n in e)t[n]=e[n];return t}function Re(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function s(t,e,n){var r,o,i,p={};for(i in e)i=="key"?r=e[i]:i=="ref"?o=e[i]:p[i]=e[i];if(arguments.length>2&&(p.children=arguments.length>3?ve.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(i in t.defaultProps)p[i]===void 0&&(p[i]=t.defaultProps[i]);return me(t,p,r,o,null)}function me(t,e,n,r,o){var i={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++Ze,__i:-1,__u:0};return o==null&&k.vnode!=null&&k.vnode(i),i}function I(t){return t.children}function he(t,e){this.props=t,this.context=e}function X(t,e){if(e==null)return t.__?X(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?X(t):null}function Kt(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],o=[],i=U({},e);i.__v=e.__v+1,k.vnode&&k.vnode(i),Be(t.__P,i,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??X(e),!!(32&e.__u),o),i.__v=e.__v,i.__.__k[i.__i]=i,it(r,i,o),e.__e=e.__=null,i.__e!=n&&nt(i)}}function nt(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),nt(t)}function Je(t){(!t.__d&&(t.__d=!0)&&O.push(t)&&!ye.__r++||Ge!=k.debounceRendering)&&((Ge=k.debounceRendering)||Qe)(ye)}function ye(){for(var t,e=1;O.length;)O.length>e&&O.sort(et),t=O.shift(),e=O.length,Kt(t);ye.__r=0}function rt(t,e,n,r,o,i,p,c,d,l,u){var a,g,f,b,x,w,h,_=r&&r.__k||xe,C=e.length;for(d=Xt(n,e,_,d,C),a=0;a<C;a++)(f=n.__k[a])!=null&&(g=f.__i!=-1&&_[f.__i]||be,f.__i=a,w=Be(t,f,g,o,i,p,c,d,l,u),b=f.__e,f.ref&&g.ref!=f.ref&&(g.ref&&We(g.ref,null,f),u.push(f.ref,f.__c||b,f)),x==null&&b!=null&&(x=b),(h=!!(4&f.__u))||g.__k===f.__k?d=ot(f,d,t,h):typeof f.type=="function"&&w!==void 0?d=w:b&&(d=b.nextSibling),f.__u&=-7);return n.__e=x,d}function Xt(t,e,n,r,o){var i,p,c,d,l,u=n.length,a=u,g=0;for(t.__k=new Array(o),i=0;i<o;i++)(p=e[i])!=null&&typeof p!="boolean"&&typeof p!="function"?(typeof p=="string"||typeof p=="number"||typeof p=="bigint"||p.constructor==String?p=t.__k[i]=me(null,p,null,null,null):ke(p)?p=t.__k[i]=me(I,{children:p},null,null,null):p.constructor===void 0&&p.__b>0?p=t.__k[i]=me(p.type,p.props,p.key,p.ref?p.ref:null,p.__v):t.__k[i]=p,d=i+g,p.__=t,p.__b=t.__b+1,c=null,(l=p.__i=Zt(p,n,d,a))!=-1&&(a--,(c=n[l])&&(c.__u|=2)),c==null||c.__v==null?(l==-1&&(o>u?g--:o<u&&g++),typeof p.type!="function"&&(p.__u|=4)):l!=d&&(l==d-1?g--:l==d+1?g++:(l>d?g--:g++,p.__u|=4))):t.__k[i]=null;if(a)for(i=0;i<u;i++)(c=n[i])!=null&&(2&c.__u)==0&&(c.__e==r&&(r=X(c)),st(c,c));return r}function ot(t,e,n,r){var o,i;if(typeof t.type=="function"){for(o=t.__k,i=0;o&&i<o.length;i++)o[i]&&(o[i].__=t,e=ot(o[i],e,n,r));return e}t.__e!=e&&(r&&(e&&t.type&&!e.parentNode&&(e=X(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function Zt(t,e,n,r){var o,i,p,c=t.key,d=t.type,l=e[n],u=l!=null&&(2&l.__u)==0;if(l===null&&c==null||u&&c==l.key&&d==l.type)return n;if(r>(u?1:0)){for(o=n-1,i=n+1;o>=0||i<e.length;)if((l=e[p=o>=0?o--:i++])!=null&&(2&l.__u)==0&&c==l.key&&d==l.type)return p}return-1}function Ke(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||Jt.test(e)?n:n+"px"}function ge(t,e,n,r,o){var i,p;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||Ke(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||Ke(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")i=e!=(e=e.replace(tt,"$1")),p=e.toLowerCase(),e=p in t||e=="onFocusOut"||e=="onFocusIn"?p.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+i]=n,n?r?n.u=r.u:(n.u=$e,t.addEventListener(e,i?De:Ae,i)):t.removeEventListener(e,i?De:Ae,i);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function Xe(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=$e++;else if(e.t<n.u)return;return n(k.event?k.event(e):e)}}}function Be(t,e,n,r,o,i,p,c,d,l){var u,a,g,f,b,x,w,h,_,C,H,j,Y,q,G,P=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(d=!!(32&n.__u),i=[c=e.__e=n.__e]),(u=k.__b)&&u(e);e:if(typeof P=="function")try{if(h=e.props,_="prototype"in P&&P.prototype.render,C=(u=P.contextType)&&r[u.__c],H=u?C?C.props.value:u.__:r,n.__c?w=(a=e.__c=n.__c).__=a.__E:(_?e.__c=a=new P(h,H):(e.__c=a=new he(h,H),a.constructor=P,a.render=en),C&&C.sub(a),a.state||(a.state={}),a.__n=r,g=a.__d=!0,a.__h=[],a._sb=[]),_&&a.__s==null&&(a.__s=a.state),_&&P.getDerivedStateFromProps!=null&&(a.__s==a.state&&(a.__s=U({},a.__s)),U(a.__s,P.getDerivedStateFromProps(h,a.__s))),f=a.props,b=a.state,a.__v=e,g)_&&P.getDerivedStateFromProps==null&&a.componentWillMount!=null&&a.componentWillMount(),_&&a.componentDidMount!=null&&a.__h.push(a.componentDidMount);else{if(_&&P.getDerivedStateFromProps==null&&h!==f&&a.componentWillReceiveProps!=null&&a.componentWillReceiveProps(h,H),e.__v==n.__v||!a.__e&&a.shouldComponentUpdate!=null&&a.shouldComponentUpdate(h,a.__s,H)===!1){e.__v!=n.__v&&(a.props=h,a.state=a.__s,a.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(z){z&&(z.__=e)}),xe.push.apply(a.__h,a._sb),a._sb=[],a.__h.length&&p.push(a);break e}a.componentWillUpdate!=null&&a.componentWillUpdate(h,a.__s,H),_&&a.componentDidUpdate!=null&&a.__h.push(function(){a.componentDidUpdate(f,b,x)})}if(a.context=H,a.props=h,a.__P=t,a.__e=!1,j=k.__r,Y=0,_)a.state=a.__s,a.__d=!1,j&&j(e),u=a.render(a.props,a.state,a.context),xe.push.apply(a.__h,a._sb),a._sb=[];else do a.__d=!1,j&&j(e),u=a.render(a.props,a.state,a.context),a.state=a.__s;while(a.__d&&++Y<25);a.state=a.__s,a.getChildContext!=null&&(r=U(U({},r),a.getChildContext())),_&&!g&&a.getSnapshotBeforeUpdate!=null&&(x=a.getSnapshotBeforeUpdate(f,b)),q=u!=null&&u.type===I&&u.key==null?at(u.props.children):u,c=rt(t,ke(q)?q:[q],e,n,r,o,i,p,c,d,l),a.base=e.__e,e.__u&=-161,a.__h.length&&p.push(a),w&&(a.__E=a.__=null)}catch(z){if(e.__v=null,d||i!=null)if(z.then){for(e.__u|=d?160:128;c&&c.nodeType==8&&c.nextSibling;)c=c.nextSibling;i[i.indexOf(c)]=null,e.__e=c}else{for(G=i.length;G--;)Re(i[G]);He(e)}else e.__e=n.__e,e.__k=n.__k,z.then||He(e);k.__e(z,e,n)}else i==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):c=e.__e=Qt(n.__e,e,n,r,o,i,p,d,l);return(u=k.diffed)&&u(e),128&e.__u?void 0:c}function He(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(He))}function it(t,e,n){for(var r=0;r<n.length;r++)We(n[r],n[++r],n[++r]);k.__c&&k.__c(e,t),t.some(function(o){try{t=o.__h,o.__h=[],t.some(function(i){i.call(o)})}catch(i){k.__e(i,o.__v)}})}function at(t){return typeof t!="object"||t==null||t.__b>0?t:ke(t)?t.map(at):U({},t)}function Qt(t,e,n,r,o,i,p,c,d){var l,u,a,g,f,b,x,w=n.props||be,h=e.props,_=e.type;if(_=="svg"?o="http://www.w3.org/2000/svg":_=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),i!=null){for(l=0;l<i.length;l++)if((f=i[l])&&"setAttribute"in f==!!_&&(_?f.localName==_:f.nodeType==3)){t=f,i[l]=null;break}}if(t==null){if(_==null)return document.createTextNode(h);t=document.createElementNS(o,_,h.is&&h),c&&(k.__m&&k.__m(e,i),c=!1),i=null}if(_==null)w===h||c&&t.data==h||(t.data=h);else{if(i=i&&ve.call(t.childNodes),!c&&i!=null)for(w={},l=0;l<t.attributes.length;l++)w[(f=t.attributes[l]).name]=f.value;for(l in w)f=w[l],l=="dangerouslySetInnerHTML"?a=f:l=="children"||l in h||l=="value"&&"defaultValue"in h||l=="checked"&&"defaultChecked"in h||ge(t,l,null,f,o);for(l in h)f=h[l],l=="children"?g=f:l=="dangerouslySetInnerHTML"?u=f:l=="value"?b=f:l=="checked"?x=f:c&&typeof f!="function"||w[l]===f||ge(t,l,f,w[l],o);if(u)c||a&&(u.__html==a.__html||u.__html==t.innerHTML)||(t.innerHTML=u.__html),e.__k=[];else if(a&&(t.innerHTML=""),rt(e.type=="template"?t.content:t,ke(g)?g:[g],e,n,r,_=="foreignObject"?"http://www.w3.org/1999/xhtml":o,i,p,i?i[0]:n.__k&&X(n,0),c,d),i!=null)for(l=i.length;l--;)Re(i[l]);c||(l="value",_=="progress"&&b==null?t.removeAttribute("value"):b!=null&&(b!==t[l]||_=="progress"&&!b||_=="option"&&b!=w[l])&&ge(t,l,b,w[l],o),l="checked",x!=null&&x!=t[l]&&ge(t,l,x,w[l],o))}return t}function We(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(o){k.__e(o,n)}}function st(t,e,n){var r,o;if(k.unmount&&k.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||We(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(i){k.__e(i,e)}r.base=r.__P=null}if(r=t.__k)for(o=0;o<r.length;o++)r[o]&&st(r[o],e,n||typeof t.type!="function");n||Re(t.__e),t.__c=t.__=t.__e=void 0}function en(t,e,n){return this.constructor(t,n)}function lt(t,e,n){var r,o,i,p;e==document&&(e=document.documentElement),k.__&&k.__(t,e),o=(r=typeof n=="function")?null:n&&n.__k||e.__k,i=[],p=[],Be(e,t=(!r&&n||e).__k=s(I,null,[t]),o||be,be,e.namespaceURI,!r&&n?[n]:o?null:e.firstChild?ve.call(e.childNodes):null,i,!r&&n?n:o?o.__e:e.firstChild,r,p),it(i,t,p)}ve=xe.slice,k={__e:function(t,e,n,r){for(var o,i,p;e=e.__;)if((o=e.__c)&&!o.__)try{if((i=o.constructor)&&i.getDerivedStateFromError!=null&&(o.setState(i.getDerivedStateFromError(t)),p=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(t,r||{}),p=o.__d),p)return o.__E=o}catch(c){t=c}throw t}},Ze=0,qt=function(t){return t!=null&&t.constructor===void 0},he.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=U({},this.state),typeof t=="function"&&(t=t(U({},n),this.props)),t&&U(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),Je(this))},he.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Je(this))},he.prototype.render=I,O=[],Qe=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,et=function(t,e){return t.__v.__b-e.__v.__b},ye.__r=0,tt=/(PointerCapture)$|Capture$/i,$e=0,Ae=Xe(!1),De=Xe(!0),Gt=0;var ie,E,Ne,pt,ae=0,ht=[],T=k,ct=T.__b,ut=T.__r,dt=T.diffed,ft=T.__c,_t=T.unmount,gt=T.__;function Ue(t,e){T.__h&&T.__h(E,t,ae||e),ae=0;var n=E.__H||(E.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function v(t){return ae=1,tn(yt,t)}function tn(t,e,n){var r=Ue(ie++,2);if(r.t=t,!r.__c&&(r.__=[n?n(e):yt(void 0,e),function(c){var d=r.__N?r.__N[0]:r.__[0],l=r.t(d,c);d!==l&&(r.__N=[l,r.__[1]],r.__c.setState({}))}],r.__c=E,!E.__f)){var o=function(c,d,l){if(!r.__c.__H)return!0;var u=r.__c.__H.__.filter(function(g){return g.__c});if(u.every(function(g){return!g.__N}))return!i||i.call(this,c,d,l);var a=r.__c.props!==c;return u.some(function(g){if(g.__N){var f=g.__[0];g.__=g.__N,g.__N=void 0,f!==g.__[0]&&(a=!0)}}),i&&i.call(this,c,d,l)||a};E.__f=!0;var i=E.shouldComponentUpdate,p=E.componentWillUpdate;E.componentWillUpdate=function(c,d,l){if(this.__e){var u=i;i=void 0,o(c,d,l),i=u}p&&p.call(this,c,d,l)},E.shouldComponentUpdate=o}return r.__N||r.__}function D(t,e){var n=Ue(ie++,3);!T.__s&&xt(n.__H,e)&&(n.__=t,n.u=e,E.__H.__h.push(n))}function R(t){return ae=5,bt(function(){return{current:t}},[])}function bt(t,e){var n=Ue(ie++,7);return xt(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function Ce(t,e){return ae=8,bt(function(){return t},e)}function nn(){for(var t;t=ht.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(we),e.__h.some(Le),e.__h=[]}catch(n){e.__h=[],T.__e(n,t.__v)}}}T.__b=function(t){E=null,ct&&ct(t)},T.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),gt&&gt(t,e)},T.__r=function(t){ut&&ut(t),ie=0;var e=(E=t.__c).__H;e&&(Ne===E?(e.__h=[],E.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(we),e.__h.some(Le),e.__h=[],ie=0)),Ne=E},T.diffed=function(t){dt&&dt(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(ht.push(e)!==1&&pt===T.requestAnimationFrame||((pt=T.requestAnimationFrame)||rn)(nn)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),Ne=E=null},T.__c=function(t,e){e.some(function(n){try{n.__h.some(we),n.__h=n.__h.filter(function(r){return!r.__||Le(r)})}catch(r){e.some(function(o){o.__h&&(o.__h=[])}),e=[],T.__e(r,n.__v)}}),ft&&ft(t,e)},T.unmount=function(t){_t&&_t(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{we(r)}catch(o){e=o}}),n.__H=void 0,e&&T.__e(e,n.__v))};var mt=typeof requestAnimationFrame=="function";function rn(t){var e,n=function(){clearTimeout(r),mt&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);mt&&(e=requestAnimationFrame(n))}function we(t){var e=E,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),E=e}function Le(t){var e=E;t.__c=t.__(),E=e}function xt(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function yt(t,e){return typeof e=="function"?e(t):e}function B(t){let e=t.replace("#","");if(e.length===3&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),e.length!==6)return"#ffffff";let n=parseInt(e.slice(0,2),16),r=parseInt(e.slice(2,4),16),o=parseInt(e.slice(4,6),16);return(n*299+r*587+o*114)/1e3>150?"#1a1a1a":"#ffffff"}function vt({config:t,isOpen:e,onClick:n,size:r=56}){let o=t.primaryColor||"#6366f1",i=B(o),p=t.launcherIcon,c=p?.startsWith("http"),d=p&&!c&&p.length<=4,l=r/56,u=Math.round(24*l),a=Math.round(20*l),g=Math.round(28*l);return s("button",{class:"lp-launcher",onClick:n,style:{backgroundColor:o,color:i,width:`${r}px`,height:`${r}px`},"aria-label":e?"Close chat":"Open chat"},e?s("svg",{width:a,height:a,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},s("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),s("line",{x1:"6",y1:"6",x2:"18",y2:"18"})):c?s("img",{src:p,alt:"Chat",style:{width:`${g}px`,height:`${g}px`,objectFit:"contain"}}):d?s("span",{style:{fontSize:`${Math.round(24*l)}px`,lineHeight:1}},p):s("svg",{width:u,height:u,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},s("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})))}function on(t){let e=[],n=/(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g,r=0,o;for(;(o=n.exec(t))!==null;)o.index>r&&e.push(t.slice(r,o.index)),o[1]?e.push(s("strong",null,o[2])):o[3]&&e.push(s("a",{href:o[3],target:"_blank",rel:"noopener noreferrer"},o[3])),r=o.index+o[0].length;return r<t.length&&e.push(t.slice(r)),e}function an(t){let e=t.split(`
`);return e.map((n,r)=>s("span",{key:r},on(n),r<e.length-1&&s("br",null)))}function sn({attachment:t,isUser:e}){if(!t)return null;let n=t.fileType.startsWith("image/"),r=Math.round(t.fileSize/1024);return n?s("a",{href:t.url,target:"_blank",rel:"noopener noreferrer","aria-label":`View image: ${t.fileName}`,style:{display:"block",marginBottom:"6px",borderRadius:"8px",overflow:"hidden"}},s("img",{src:t.url,alt:t.fileName,style:{maxWidth:"100%",maxHeight:"200px",borderRadius:"8px",display:"block"},loading:"lazy"})):s("a",{href:t.url,target:"_blank",rel:"noopener noreferrer","aria-label":`Download ${t.fileName}`,style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"8px",background:e?"rgba(255,255,255,0.15)":"rgba(0,0,0,0.05)",textDecoration:"none",color:"inherit",marginBottom:"6px",fontSize:"12px"}},s("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round",style:{flexShrink:0}},s("path",{d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),s("polyline",{points:"14 2 14 8 20 8"})),s("span",{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},t.fileName),s("span",{style:{opacity:.6,flexShrink:0}},r,"KB"))}function kt({message:t,primaryColor:e}){let n=t.role==="user",r=B(e);return s("div",{class:`lp-msg ${n?"lp-msg-user":"lp-msg-assistant"}`,style:n?{backgroundColor:e,color:r}:void 0,role:"article","aria-label":`${n?"You":"Assistant"}: ${t.content||"attachment"}`},t.attachment&&s(sn,{attachment:t.attachment,isUser:n}),t.content&&an(t.content))}function wt(){return s("div",{class:"lp-typing"},s("span",null),s("span",null),s("span",null))}function Ct({fields:t,primaryColor:e,isDark:n,onSubmit:r}){let[o,i]=v(""),[p,c]=v(""),[d,l]=v(""),u=B(e);function a(f){if(f.preventDefault(),l(""),t.includes("email")&&p.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.trim())){l("Please enter a valid email address");return}if(t.includes("name")&&!o.trim()){l("Please enter your name");return}if(t.includes("email")&&!p.trim()){l("Please enter your email");return}r({name:o.trim()||void 0,email:p.trim()||void 0})}let g={width:"100%",padding:"10px 14px",borderRadius:"12px",border:`1px solid ${n?"#374151":"#e5e7eb"}`,background:n?"#1f2937":"#fff",color:n?"#f3f4f6":"#1a1a2e",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"};return s("div",{style:{padding:"24px 20px",display:"flex",flexDirection:"column",gap:"12px",flex:1,justifyContent:"center"}},s("div",{style:{textAlign:"center",marginBottom:"4px"}},s("p",{style:{fontSize:"15px",fontWeight:600,color:n?"#f3f4f6":"#1a1a2e",marginBottom:"4px"}},"Before we start"),s("p",{style:{fontSize:"13px",color:n?"#9ca3af":"#6b7280"}},"Let us know how to reach you")),s("form",{onSubmit:a,style:{display:"flex",flexDirection:"column",gap:"10px"},"aria-label":"Pre-chat form"},t.includes("name")&&s("input",{type:"text",placeholder:"Your name",value:o,onInput:f=>i(f.target.value),style:g,"aria-label":"Your name","aria-required":"true",autoComplete:"name"}),t.includes("email")&&s("input",{type:"email",placeholder:"Your email",value:p,onInput:f=>c(f.target.value),style:g,"aria-label":"Your email","aria-required":"true",autoComplete:"email"}),d&&s("p",{role:"alert",style:{fontSize:"12px",color:"#ef4444",textAlign:"center"}},d),s("button",{type:"submit","aria-label":"Start chat",style:{padding:"10px 20px",borderRadius:"12px",border:"none",background:e,color:u,fontSize:"14px",fontWeight:600,cursor:"pointer",marginTop:"4px"}},"Start Chat")))}function St({primaryColor:t,isDark:e,onSubmit:n,onDismiss:r}){let[o,i]=v(0),[p,c]=v(0),[d,l]=v(""),[u,a]=v(!1);function g(){o!==0&&(a(!0),n(o,d.trim()))}if(u)return s("div",{style:{padding:"24px 20px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}},s("span",{style:{fontSize:"32px"}},"\u{1F389}"),s("p",{style:{fontSize:"15px",fontWeight:600,color:e?"#f3f4f6":"#1a1a2e"}},"Thank you for your feedback!"),s("button",{onClick:r,style:{marginTop:"8px",padding:"8px 20px",borderRadius:"12px",border:`1px solid ${e?"#374151":"#e5e7eb"}`,background:"transparent",color:e?"#9ca3af":"#6b7280",fontSize:"13px",cursor:"pointer"}},"Close"));let f=[1,2,3,4,5],b=p||o;return s("div",{style:{padding:"20px",display:"flex",flexDirection:"column",gap:"12px"}},s("p",{style:{fontSize:"14px",fontWeight:600,color:e?"#f3f4f6":"#1a1a2e",textAlign:"center"}},"How was your experience?"),s("div",{role:"group","aria-label":"Satisfaction rating",style:{display:"flex",justifyContent:"center",gap:"8px"}},f.map(x=>s("button",{key:x,onClick:()=>i(x),onMouseEnter:()=>c(x),onMouseLeave:()=>c(0),"aria-label":`Rate ${x} out of 5 stars`,"aria-pressed":o===x,style:{background:"none",border:"none",cursor:"pointer",fontSize:"28px",padding:"4px",transition:"transform 0.15s",transform:b>=x?"scale(1.15)":"scale(1)",filter:b>=x?"none":"grayscale(1) opacity(0.4)"}},"\u2B50"))),o>0&&s("textarea",{placeholder:"Any additional feedback? (optional)",value:d,onInput:x=>l(x.target.value),rows:2,style:{width:"100%",padding:"10px 14px",borderRadius:"12px",border:`1px solid ${e?"#374151":"#e5e7eb"}`,background:e?"#1f2937":"#fff",color:e?"#f3f4f6":"#1a1a2e",fontSize:"13px",fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}}),s("div",{style:{display:"flex",gap:"8px",justifyContent:"center"}},s("button",{onClick:r,style:{padding:"8px 16px",borderRadius:"12px",border:`1px solid ${e?"#374151":"#e5e7eb"}`,background:"transparent",color:e?"#9ca3af":"#6b7280",fontSize:"13px",cursor:"pointer"}},"Skip"),s("button",{onClick:g,disabled:o===0,style:{padding:"8px 20px",borderRadius:"12px",border:"none",background:o>0?t:e?"#374151":"#e5e7eb",color:o>0?B(t):e?"#6b7280":"#9ca3af",fontSize:"13px",fontWeight:600,cursor:o>0?"pointer":"default",opacity:o>0?1:.6}},"Submit")))}function W(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}function ln(t){let e=`lp_session_${t}`,n=localStorage.getItem(e);return n||(n=W(),localStorage.setItem(e,n)),n}function pn(t){try{let e=localStorage.getItem(`lp_history_${t}`);if(e)return JSON.parse(e).slice(-50)}catch{}return[]}function cn(t,e){try{localStorage.setItem(`lp_history_${t}`,JSON.stringify(e.slice(-50)))}catch{}}function un(t){try{let e=localStorage.getItem(`lp_visitor_${t}`);return e?JSON.parse(e):null}catch{return null}}function dn(t,e){try{localStorage.setItem(`lp_visitor_${t}`,JSON.stringify(e))}catch{}}function fn({status:t}){return t==="human_takeover"?s("div",{role:"status","aria-live":"assertive",style:{padding:"8px 16px",backgroundColor:"rgba(59,130,246,0.08)",borderBottom:"1px solid rgba(59,130,246,0.12)",textAlign:"center",fontSize:"12px",color:"#3b82f6",fontWeight:500}},"A team member is responding to this conversation"):t==="paused"?s("div",{role:"status","aria-live":"assertive",style:{padding:"8px 16px",backgroundColor:"rgba(245,158,11,0.08)",borderBottom:"1px solid rgba(245,158,11,0.12)",textAlign:"center",fontSize:"12px",color:"#d97706",fontWeight:500}},"This conversation is paused"):t==="closed"?s("div",{role:"status","aria-live":"assertive",style:{padding:"8px 16px",backgroundColor:"rgba(113,113,122,0.08)",borderBottom:"1px solid rgba(113,113,122,0.12)",textAlign:"center",fontSize:"12px",color:"#71717a",fontWeight:500}},"This conversation has been closed"):null}function _n(){return s("div",{style:{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:"4px",marginTop:"2px",marginRight:"4px"}},s("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"#9ca3af","stroke-width":"2.5","stroke-linecap":"round","stroke-linejoin":"round"},s("polyline",{points:"20 6 9 17 4 12"})),s("span",{style:{fontSize:"10px",color:"#9ca3af"}},"Delivered"))}function Mt({config:t,token:e,agentId:n,channelId:r,apiOrigin:o,onClose:i,size:p}){let c=p?.panelW??380,d=p?.panelH??520,l=p?.fontSize??14,[u,a]=v(()=>pn(r)),[g,f]=v(""),[b,x]=v(!1),[w,h]=v(!1),[_,C]=v("active"),[H,j]=v(!1),[Y,q]=v(!1),G=R(null),P=R(null),z=R(ln(r)),se=R(null),Z=R(0),Se=R(!1),le=R("active"),At=t.preChatForm?.enabled&&(t.preChatForm.fields?.length??0)>0,[pe,Dt]=v(()=>un(r)),Me=At&&!pe&&u.length===0,J=t.primaryColor||"#6366f1",K=B(J),Ie=K==="#ffffff"?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)",ce=t.agentName||"AI Assistant",Ht=t.welcomeMessage||"Hi! How can I help you today?",je=t.conversationStarters??[],ue=t.theme==="dark",$t=t.borderRadius==="sharp",Rt=t.showBranding!==!1;D(()=>{_==="closed"&&le.current!=="closed"&&t.csatSurvey?.enabled&&!Y&&j(!0),le.current=_},[_,t.csatSurvey?.enabled,Y]),D(()=>{_==="active"&&(le.current==="human_takeover"||le.current==="paused")&&u.length>0&&a(m=>[...m,{id:W(),role:"assistant",content:"You're now back with our AI assistant. How else can I help?",timestamp:Date.now()}])},[_]),D(()=>{G.current?.scrollIntoView({behavior:"smooth"})},[u,w]),D(()=>{Me||P.current?.focus()},[Me]),D(()=>{if(!Se.current||_==="closed")return;let m=_==="human_takeover"?3e3:1e4,S=async()=>{try{let M=await fetch(`${o}/api/widget/${r}/status?sessionId=${z.current}&since=0`);if(M.ok){let y=await M.json();Z.current=y.totalMessages??0,y.status&&y.status!==_&&C(y.status)}}catch{}};return Z.current===0&&S(),se.current=setInterval(async()=>{try{let M=await fetch(`${o}/api/widget/${r}/status?sessionId=${z.current}&since=${Z.current}`);if(!M.ok)return;let y=await M.json();if(y.status&&y.status!==_&&C(y.status),y.totalMessages!=null&&y.totalMessages>Z.current){let A=(y.newMessages??[]).filter($=>$.role==="human_agent");A.length>0&&a($=>[...$,...A.map(te=>({id:W(),role:"assistant",content:te.content,timestamp:Date.now(),isHumanAgent:!0}))]),Z.current=y.totalMessages}}catch{}},m),()=>{se.current&&(clearInterval(se.current),se.current=null)}},[_,o,r]);function Bt(m){Dt(m),dn(r,m)}function Wt(m,S){fetch(`${o}/api/widget/${r}/rating`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:z.current,rating:m,feedback:S||void 0})}).catch(()=>{})}let de=Ce(async m=>{if(!m.trim()||b||_==="closed")return;Se.current=!0;let S={id:W(),role:"user",content:m.trim(),timestamp:Date.now()};a(M=>[...M,S]),f(""),x(!0),h(!0);try{let M={userMessage:m.trim(),sessionId:z.current};pe&&(M.visitorInfo=pe);let y=await fetch(`${o}/api/channels/${n}/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify(M)});if((y.headers.get("content-type")??"").includes("application/json")){let F=await y.json();if(F.error==="human_takeover"){C("human_takeover"),a(ze=>[...ze,{id:W(),role:"assistant",content:F.message||"A team member will respond shortly.",timestamp:Date.now()}]),x(!1),h(!1);return}if(F.error==="conversation_paused"){C("paused"),x(!1),h(!1);return}if(F.error==="conversation_closed"){C("closed"),x(!1),h(!1);return}if(!y.ok)throw new Error(F.message||"Chat request failed")}if(!y.ok||!y.body)throw new Error("Chat request failed");let $=y.body.getReader(),te=new TextDecoder,ne="",N="",_e=!1,re={id:W(),role:"assistant",content:"",isStreaming:!0,timestamp:Date.now()};for(;;){let{value:F,done:ze}=await $.read();if(ze)break;ne+=te.decode(F,{stream:!0});let Ye=ne.split(`

`);ne=Ye.pop()??"";for(let qe of Ye)if(qe.startsWith("data: "))try{let oe=JSON.parse(qe.slice(6));oe.type==="text-delta"?(_e||(a(L=>[...L,re]),_e=!0,h(!1)),N+=oe.delta,a(L=>L.map(V=>V.id===re.id?{...V,content:N}:V))):oe.type==="done"?!_e&&N===""?(N=oe.assistantContent||"I processed your request.",a(L=>[...L,{...re,content:N,isStreaming:!1}])):a(L=>L.map(V=>V.id===re.id?{...V,isStreaming:!1}:V)):oe.type==="error"&&(_e||a(L=>[...L,{...re,content:"Sorry, something went wrong. Please try again.",isStreaming:!1}]))}catch{}}}catch{h(!1),a(M=>[...M,{id:W(),role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again.",timestamp:Date.now()}])}finally{x(!1),h(!1)}},[n,o,e,b,_,pe]);D(()=>{u.length>0&&cn(r,u.filter(m=>!m.isStreaming))},[u,r]);function Nt(m){m.key==="Enter"&&!m.shiftKey&&(m.preventDefault(),de(g))}function Lt(m){let S=m.target;f(S.value),S.style.height="38px",S.style.height=Math.min(S.scrollHeight,100)+"px"}let Ut=je.length>0&&u.filter(m=>m.role==="user").length===0,Ee=t.agentAvatar,jt=Ee?.startsWith("http"),Ft=["lp-chat-panel",ue?"lp-dark":"",$t?"lp-sharp":""].filter(Boolean).join(" "),[Q,Fe]=v(!1);function Vt(){Q||_==="closed"||(Fe(!0),fetch(`${o}/api/widget/${r}/close`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:z.current})}).then(m=>{m.ok&&C("closed")}).catch(()=>{}).finally(()=>Fe(!1)))}let Ve=R(null),[Te,Oe]=v(!1);async function Ot(m){let S=m.target,M=S.files?.[0];if(M){if(S.value="",M.size>5*1024*1024){a(y=>[...y,{id:W(),role:"assistant",content:"File is too large. Maximum size is 5MB.",timestamp:Date.now()}]);return}Oe(!0),Se.current=!0;try{let y=new FormData;y.append("file",M),y.append("sessionId",z.current);let A=await fetch(`${o}/api/widget/${r}/upload`,{method:"POST",body:y});if(!A.ok){let N=await A.json().catch(()=>({}));throw new Error(N.error||"Upload failed")}let $=await A.json(),te=$.fileType.startsWith("image/"),ne={id:W(),role:"user",content:te?"":`Sent a file: ${$.fileName}`,timestamp:Date.now(),attachment:$};a(N=>[...N,ne]),await de(`[User attached a file: ${$.fileName} (${$.fileType})]`)}catch{a(A=>[...A,{id:W(),role:"assistant",content:"Failed to upload file. Please try again.",timestamp:Date.now()}])}finally{Oe(!1)}}}let ee=b||Te||_==="closed"||_==="paused",fe=(()=>{for(let m=u.length-1;m>=0;m--)if(u[m].role==="user"&&!u[m].isStreaming)return m;return-1})(),Yt=fe>=0&&!b&&!w&&(u.length>fe+1||fe===u.length-1),Pe=R(null);return D(()=>{function m(S){if(S.key==="Escape"){i();return}if(S.key==="Tab"&&Pe.current){let M=Pe.current.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');if(M.length===0)return;let y=M[0],A=M[M.length-1];S.shiftKey&&document.activeElement===y?(S.preventDefault(),A.focus()):!S.shiftKey&&document.activeElement===A&&(S.preventDefault(),y.focus())}}return document.addEventListener("keydown",m),()=>document.removeEventListener("keydown",m)},[i]),s("div",{ref:Pe,class:Ft,style:{width:`${c}px`,height:`${d}px`,fontSize:`${l}px`},role:"dialog","aria-label":`Chat with ${ce}`,"aria-modal":"true"},s("div",{class:"lp-header",role:"banner",style:{backgroundColor:J}},s("div",{class:"lp-header-avatar",style:{backgroundColor:K==="#ffffff"?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.1)"}},jt?s("img",{src:Ee,alt:ce}):s("span",{style:{color:K}},Ee||ce.charAt(0))),s("div",{class:"lp-header-info"},s("div",{class:"lp-header-name",style:{color:K}},ce),s("div",{class:"lp-header-status",style:{color:Ie}},s("span",{style:{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",backgroundColor:_==="closed"?"#71717a":_==="human_takeover"?"#3b82f6":"#22c55e",marginRight:"4px",verticalAlign:"middle"}}),_==="human_takeover"?"Team member connected":_==="closed"?"Closed":"Online")),s("div",{style:{display:"flex",alignItems:"center",gap:"4px"}},t.endChat?.enabled!==!1&&_!=="closed"&&u.length>0&&s("button",{onClick:Vt,disabled:Q,"aria-label":"End chat",style:{background:"none",border:`1px solid ${K==="#ffffff"?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.15)"}`,borderRadius:"12px",padding:"3px 10px",cursor:Q?"default":"pointer",color:Ie,fontSize:"11px",fontWeight:500,opacity:Q?.5:1,transition:"opacity 150ms"}},Q?"Ending...":"End Chat"),s("button",{class:"lp-close-btn",onClick:i,"aria-label":"Minimize chat",style:{color:Ie}},s("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},s("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),s("line",{x1:"6",y1:"6",x2:"18",y2:"18"}))))),s(fn,{status:_}),H&&!Y&&s(St,{primaryColor:J,isDark:ue,onSubmit:Wt,onDismiss:()=>{j(!1),q(!0)}}),Me&&!H?s(Ct,{fields:t.preChatForm.fields,primaryColor:J,isDark:ue,onSubmit:Bt}):H?null:s(I,null,s("div",{class:"lp-messages",role:"log","aria-live":"polite","aria-label":"Conversation messages"},u.length===0&&s("div",{class:"lp-welcome"},Ht),u.map((m,S)=>s("div",{key:m.id},s(kt,{message:m,primaryColor:J}),m.role==="user"&&S===fe&&Yt&&s(_n,null))),w&&s(wt,null),s("div",{ref:G})),Ut&&s("div",{class:"lp-starters"},je.slice(0,4).map(m=>s("button",{key:m,class:"lp-starter-btn",onClick:()=>de(m),disabled:b},m))),s("div",{class:"lp-input-area"},t.fileUpload?.enabled!==!1&&s(I,null,s("input",{ref:Ve,type:"file",accept:"image/png,image/jpeg,image/gif,image/webp,application/pdf",style:{display:"none"},onChange:Ot,"aria-hidden":"true"}),s("button",{onClick:()=>Ve.current?.click(),disabled:ee,"aria-label":"Attach file",style:{background:"none",border:"none",cursor:ee?"default":"pointer",padding:"6px",color:ue?"#6b7280":"#9ca3af",opacity:ee?.4:1,flexShrink:0,display:"flex",alignItems:"center",transition:"color 0.15s"}},Te?s("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round",style:{animation:"lp-bounce 1s ease-in-out infinite"}},s("circle",{cx:"12",cy:"12",r:"10","stroke-dasharray":"30","stroke-dashoffset":"10"})):s("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},s("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})))),s("textarea",{ref:P,class:"lp-input",value:g,onInput:Lt,onKeyDown:Nt,placeholder:_==="closed"?"This conversation has ended":_==="paused"?"Conversation paused...":Te?"Uploading file...":"Type a message...",rows:1,disabled:ee,"aria-label":"Message input"}),s("button",{class:"lp-send-btn",style:{backgroundColor:J,color:K},onClick:()=>de(g),disabled:!g.trim()||ee,"aria-label":"Send message"},s("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},s("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),s("polygon",{points:"22 2 15 22 11 13 2 9 22 2"}))))),Rt&&s("div",{class:"lp-powered"},s("a",{href:"https://launchpath.io",target:"_blank",rel:"noopener noreferrer"},"Powered by LaunchPath")))}function It({message:t,delay:e,position:n,isDark:r,isSharp:o,onDismiss:i,onClick:p}){let[c,d]=v(!1);return D(()=>{let l=setTimeout(()=>d(!0),e*1e3);return()=>clearTimeout(l)},[e]),c?s("div",{class:`lp-greeting lp-greeting-${n}`,onClick:p},s("button",{class:`lp-greeting-close lp-greeting-close-${n}`,onClick:l=>{l.stopPropagation(),i()},"aria-label":"Dismiss"},s("svg",{width:"8",height:"8",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"3","stroke-linecap":"round"},s("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),s("line",{x1:"6",y1:"6",x2:"18",y2:"18"}))),t,s("div",{class:`lp-greeting-tail lp-greeting-tail-${n}`})):null}var Et={compact:{launcher:48,panelW:340,panelH:460,fontSize:13},default:{launcher:56,panelW:380,panelH:520,fontSize:14},large:{launcher:64,panelW:420,panelH:580,fontSize:15}};function Tt({channelId:t,apiOrigin:e}){let[n,r]=v(null),[o,i]=v(null),[p,c]=v(null),[d,l]=v(!1),[u,a]=v(!1),[g,f]=v(!1);D(()=>{fetch(`${e}/api/widget/${t}/config`).then(C=>{if(!C.ok)throw new Error("Config fetch failed");return C.json()}).then(C=>{r(C.config),i(C.token),c(C.agentId)}).catch(()=>f(!0))},[t,e]);let b=Ce(()=>{l(!0),a(!0)},[]);if(g||!n)return null;let x=n.position||"right",w=Et[n.widgetSize||"default"],_=!!n.greetingMessage?.trim()&&!d&&!u;return s("div",{class:`lp-position-${x}`},d&&o&&p?s(Mt,{config:n,token:o,agentId:p,channelId:t,apiOrigin:e,onClose:()=>l(!1),size:w}):null,_&&s(It,{message:n.greetingMessage,delay:n.greetingDelay??3,position:x,isDark:n.theme==="dark",isSharp:n.borderRadius==="sharp",onDismiss:()=>a(!0),onClick:b}),s(vt,{config:n,isOpen:d,onClick:()=>d?l(!1):b(),size:w.launcher}))}var Pt=`
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

/* ===== Focus visible ===== */
*:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

/* ===== Skip to content (screen reader) ===== */
.lp-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
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

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;function zt(){let t=document.querySelectorAll("script[data-channel]"),e=t[t.length-1];if(!e)return;let n=e.getAttribute("data-channel");if(!n)return;let r=e.getAttribute("src")||"",o;try{o=new URL(r,window.location.href).origin}catch{o=window.location.origin}let i=document.createElement("div");i.id="lp-widget-host",i.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;",document.body.appendChild(i);let p=i.attachShadow({mode:"open"}),c=document.createElement("style");c.textContent=Pt,p.appendChild(c);let d=document.createElement("div");d.id="lp-widget-root",d.style.cssText="pointer-events:auto;",p.appendChild(d),lt(s(Tt,{channelId:n,apiOrigin:o}),d)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",zt):zt();})();
