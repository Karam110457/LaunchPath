"use strict";(()=>{var ee,m,ke,ot,L,ye,we,Ce,Se,_e,se,ae,it,X={},Q=[],st=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,te=Array.isArray;function I(t,e){for(var n in e)t[n]=e[n];return t}function ce(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function p(t,e,n){var r,s,o,a={};for(o in e)o=="key"?r=e[o]:o=="ref"?s=e[o]:a[o]=e[o];if(arguments.length>2&&(a.children=arguments.length>3?ee.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(o in t.defaultProps)a[o]===void 0&&(a[o]=t.defaultProps[o]);return K(t,a,r,s,null)}function K(t,e,n,r,s){var o={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:s??++ke,__i:-1,__u:0};return s==null&&m.vnode!=null&&m.vnode(o),o}function C(t){return t.children}function G(t,e){this.props=t,this.context=e}function R(t,e){if(e==null)return t.__?R(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?R(t):null}function at(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],s=[],o=I({},e);o.__v=e.__v+1,m.vnode&&m.vnode(o),pe(t.__P,o,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??R(e),!!(32&e.__u),s),o.__v=e.__v,o.__.__k[o.__i]=o,Ee(r,o,s),e.__e=e.__=null,o.__e!=n&&Me(o)}}function Me(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Me(t)}function ve(t){(!t.__d&&(t.__d=!0)&&L.push(t)&&!Z.__r++||ye!=m.debounceRendering)&&((ye=m.debounceRendering)||we)(Z)}function Z(){for(var t,e=1;L.length;)L.length>e&&L.sort(Ce),t=L.shift(),e=L.length,at(t);Z.__r=0}function Pe(t,e,n,r,s,o,a,_,u,l,f){var i,d,c,y,w,k,g,h=r&&r.__k||Q,P=e.length;for(u=lt(n,e,h,u,P),i=0;i<P;i++)(c=n.__k[i])!=null&&(d=c.__i!=-1&&h[c.__i]||X,c.__i=i,k=pe(t,c,d,s,o,a,_,u,l,f),y=c.__e,c.ref&&d.ref!=c.ref&&(d.ref&&ue(d.ref,null,c),f.push(c.ref,c.__c||y,c)),w==null&&y!=null&&(w=y),(g=!!(4&c.__u))||d.__k===c.__k?u=Te(c,u,t,g):typeof c.type=="function"&&k!==void 0?u=k:y&&(u=y.nextSibling),c.__u&=-7);return n.__e=w,u}function lt(t,e,n,r,s){var o,a,_,u,l,f=n.length,i=f,d=0;for(t.__k=new Array(s),o=0;o<s;o++)(a=e[o])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=t.__k[o]=K(null,a,null,null,null):te(a)?a=t.__k[o]=K(C,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=t.__k[o]=K(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):t.__k[o]=a,u=o+d,a.__=t,a.__b=t.__b+1,_=null,(l=a.__i=_t(a,n,u,i))!=-1&&(i--,(_=n[l])&&(_.__u|=2)),_==null||_.__v==null?(l==-1&&(s>f?d--:s<f&&d++),typeof a.type!="function"&&(a.__u|=4)):l!=u&&(l==u-1?d--:l==u+1?d++:(l>u?d--:d++,a.__u|=4))):t.__k[o]=null;if(i)for(o=0;o<f;o++)(_=n[o])!=null&&(2&_.__u)==0&&(_.__e==r&&(r=R(_)),Ie(_,_));return r}function Te(t,e,n,r){var s,o;if(typeof t.type=="function"){for(s=t.__k,o=0;s&&o<s.length;o++)s[o]&&(s[o].__=t,e=Te(s[o],e,n,r));return e}t.__e!=e&&(r&&(e&&t.type&&!e.parentNode&&(e=R(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function _t(t,e,n,r){var s,o,a,_=t.key,u=t.type,l=e[n],f=l!=null&&(2&l.__u)==0;if(l===null&&_==null||f&&_==l.key&&u==l.type)return n;if(r>(f?1:0)){for(s=n-1,o=n+1;s>=0||o<e.length;)if((l=e[a=s>=0?s--:o++])!=null&&(2&l.__u)==0&&_==l.key&&u==l.type)return a}return-1}function xe(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||st.test(e)?n:n+"px"}function Y(t,e,n,r,s){var o,a;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||xe(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||xe(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")o=e!=(e=e.replace(Se,"$1")),a=e.toLowerCase(),e=a in t||e=="onFocusOut"||e=="onFocusIn"?a.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+o]=n,n?r?n.u=r.u:(n.u=_e,t.addEventListener(e,o?ae:se,o)):t.removeEventListener(e,o?ae:se,o);else{if(s=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function be(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e.t==null)e.t=_e++;else if(e.t<n.u)return;return n(m.event?m.event(e):e)}}}function pe(t,e,n,r,s,o,a,_,u,l){var f,i,d,c,y,w,k,g,h,P,T,A,U,W,F,S=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(u=!!(32&n.__u),o=[_=e.__e=n.__e]),(f=m.__b)&&f(e);e:if(typeof S=="function")try{if(g=e.props,h="prototype"in S&&S.prototype.render,P=(f=S.contextType)&&r[f.__c],T=f?P?P.props.value:f.__:r,n.__c?k=(i=e.__c=n.__c).__=i.__E:(h?e.__c=i=new S(g,T):(e.__c=i=new G(g,T),i.constructor=S,i.render=pt),P&&P.sub(i),i.state||(i.state={}),i.__n=r,d=i.__d=!0,i.__h=[],i._sb=[]),h&&i.__s==null&&(i.__s=i.state),h&&S.getDerivedStateFromProps!=null&&(i.__s==i.state&&(i.__s=I({},i.__s)),I(i.__s,S.getDerivedStateFromProps(g,i.__s))),c=i.props,y=i.state,i.__v=e,d)h&&S.getDerivedStateFromProps==null&&i.componentWillMount!=null&&i.componentWillMount(),h&&i.componentDidMount!=null&&i.__h.push(i.componentDidMount);else{if(h&&S.getDerivedStateFromProps==null&&g!==c&&i.componentWillReceiveProps!=null&&i.componentWillReceiveProps(g,T),e.__v==n.__v||!i.__e&&i.shouldComponentUpdate!=null&&i.shouldComponentUpdate(g,i.__s,T)===!1){e.__v!=n.__v&&(i.props=g,i.state=i.__s,i.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(E){E&&(E.__=e)}),Q.push.apply(i.__h,i._sb),i._sb=[],i.__h.length&&a.push(i);break e}i.componentWillUpdate!=null&&i.componentWillUpdate(g,i.__s,T),h&&i.componentDidUpdate!=null&&i.__h.push(function(){i.componentDidUpdate(c,y,w)})}if(i.context=T,i.props=g,i.__P=t,i.__e=!1,A=m.__r,U=0,h)i.state=i.__s,i.__d=!1,A&&A(e),f=i.render(i.props,i.state,i.context),Q.push.apply(i.__h,i._sb),i._sb=[];else do i.__d=!1,A&&A(e),f=i.render(i.props,i.state,i.context),i.state=i.__s;while(i.__d&&++U<25);i.state=i.__s,i.getChildContext!=null&&(r=I(I({},r),i.getChildContext())),h&&!d&&i.getSnapshotBeforeUpdate!=null&&(w=i.getSnapshotBeforeUpdate(c,y)),W=f!=null&&f.type===C&&f.key==null?He(f.props.children):f,_=Pe(t,te(W)?W:[W],e,n,r,s,o,a,_,u,l),i.base=e.__e,e.__u&=-161,i.__h.length&&a.push(i),k&&(i.__E=i.__=null)}catch(E){if(e.__v=null,u||o!=null)if(E.then){for(e.__u|=u?160:128;_&&_.nodeType==8&&_.nextSibling;)_=_.nextSibling;o[o.indexOf(_)]=null,e.__e=_}else{for(F=o.length;F--;)ce(o[F]);le(e)}else e.__e=n.__e,e.__k=n.__k,E.then||le(e);m.__e(E,e,n)}else o==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):_=e.__e=ct(n.__e,e,n,r,s,o,a,u,l);return(f=m.diffed)&&f(e),128&e.__u?void 0:_}function le(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(le))}function Ee(t,e,n){for(var r=0;r<n.length;r++)ue(n[r],n[++r],n[++r]);m.__c&&m.__c(e,t),t.some(function(s){try{t=s.__h,s.__h=[],t.some(function(o){o.call(s)})}catch(o){m.__e(o,s.__v)}})}function He(t){return typeof t!="object"||t==null||t.__b>0?t:te(t)?t.map(He):I({},t)}function ct(t,e,n,r,s,o,a,_,u){var l,f,i,d,c,y,w,k=n.props||X,g=e.props,h=e.type;if(h=="svg"?s="http://www.w3.org/2000/svg":h=="math"?s="http://www.w3.org/1998/Math/MathML":s||(s="http://www.w3.org/1999/xhtml"),o!=null){for(l=0;l<o.length;l++)if((c=o[l])&&"setAttribute"in c==!!h&&(h?c.localName==h:c.nodeType==3)){t=c,o[l]=null;break}}if(t==null){if(h==null)return document.createTextNode(g);t=document.createElementNS(s,h,g.is&&g),_&&(m.__m&&m.__m(e,o),_=!1),o=null}if(h==null)k===g||_&&t.data==g||(t.data=g);else{if(o=o&&ee.call(t.childNodes),!_&&o!=null)for(k={},l=0;l<t.attributes.length;l++)k[(c=t.attributes[l]).name]=c.value;for(l in k)c=k[l],l=="dangerouslySetInnerHTML"?i=c:l=="children"||l in g||l=="value"&&"defaultValue"in g||l=="checked"&&"defaultChecked"in g||Y(t,l,null,c,s);for(l in g)c=g[l],l=="children"?d=c:l=="dangerouslySetInnerHTML"?f=c:l=="value"?y=c:l=="checked"?w=c:_&&typeof c!="function"||k[l]===c||Y(t,l,c,k[l],s);if(f)_||i&&(f.__html==i.__html||f.__html==t.innerHTML)||(t.innerHTML=f.__html),e.__k=[];else if(i&&(t.innerHTML=""),Pe(e.type=="template"?t.content:t,te(d)?d:[d],e,n,r,h=="foreignObject"?"http://www.w3.org/1999/xhtml":s,o,a,o?o[0]:n.__k&&R(n,0),_,u),o!=null)for(l=o.length;l--;)ce(o[l]);_||(l="value",h=="progress"&&y==null?t.removeAttribute("value"):y!=null&&(y!==t[l]||h=="progress"&&!y||h=="option"&&y!=k[l])&&Y(t,l,y,k[l],s),l="checked",w!=null&&w!=t[l]&&Y(t,l,w,k[l],s))}return t}function ue(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(s){m.__e(s,n)}}function Ie(t,e,n){var r,s;if(m.unmount&&m.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||ue(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){m.__e(o,e)}r.base=r.__P=null}if(r=t.__k)for(s=0;s<r.length;s++)r[s]&&Ie(r[s],e,n||typeof t.type!="function");n||ce(t.__e),t.__c=t.__=t.__e=void 0}function pt(t,e,n){return this.constructor(t,n)}function Ae(t,e,n){var r,s,o,a;e==document&&(e=document.documentElement),m.__&&m.__(t,e),s=(r=typeof n=="function")?null:n&&n.__k||e.__k,o=[],a=[],pe(e,t=(!r&&n||e).__k=p(C,null,[t]),s||X,X,e.namespaceURI,!r&&n?[n]:s?null:e.firstChild?ee.call(e.childNodes):null,o,!r&&n?n:s?s.__e:e.firstChild,r,a),Ee(o,t,a)}ee=Q.slice,m={__e:function(t,e,n,r){for(var s,o,a;e=e.__;)if((s=e.__c)&&!s.__)try{if((o=s.constructor)&&o.getDerivedStateFromError!=null&&(s.setState(o.getDerivedStateFromError(t)),a=s.__d),s.componentDidCatch!=null&&(s.componentDidCatch(t,r||{}),a=s.__d),a)return s.__E=s}catch(_){t=_}throw t}},ke=0,ot=function(t){return t!=null&&t.constructor===void 0},G.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=I({},this.state),typeof t=="function"&&(t=t(I({},n),this.props)),t&&I(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),ve(this))},G.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),ve(this))},G.prototype.render=C,L=[],we=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ce=function(t,e){return t.__v.__b-e.__v.__b},Z.__r=0,Se=/(PointerCapture)$|Capture$/i,_e=0,se=be(!1),ae=be(!0),it=0;var V,v,fe,De,q=0,Fe=[],b=m,Ne=b.__b,Le=b.__r,Ue=b.diffed,We=b.__c,ze=b.unmount,Re=b.__;function he(t,e){b.__h&&b.__h(v,t,q||e),q=0;var n=v.__H||(v.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function M(t){return q=1,ut(Ve,t)}function ut(t,e,n){var r=he(V++,2);if(r.t=t,!r.__c&&(r.__=[n?n(e):Ve(void 0,e),function(_){var u=r.__N?r.__N[0]:r.__[0],l=r.t(u,_);u!==l&&(r.__N=[l,r.__[1]],r.__c.setState({}))}],r.__c=v,!v.__f)){var s=function(_,u,l){if(!r.__c.__H)return!0;var f=r.__c.__H.__.filter(function(d){return d.__c});if(f.every(function(d){return!d.__N}))return!o||o.call(this,_,u,l);var i=r.__c.props!==_;return f.some(function(d){if(d.__N){var c=d.__[0];d.__=d.__N,d.__N=void 0,c!==d.__[0]&&(i=!0)}}),o&&o.call(this,_,u,l)||i};v.__f=!0;var o=v.shouldComponentUpdate,a=v.componentWillUpdate;v.componentWillUpdate=function(_,u,l){if(this.__e){var f=o;o=void 0,s(_,u,l),o=f}a&&a.call(this,_,u,l)},v.shouldComponentUpdate=s}return r.__N||r.__}function B(t,e){var n=he(V++,3);!b.__s&&je(n.__H,e)&&(n.__=t,n.u=e,v.__H.__h.push(n))}function re(t){return q=5,Oe(function(){return{current:t}},[])}function Oe(t,e){var n=he(V++,7);return je(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function $e(t,e){return q=8,Oe(function(){return t},e)}function ft(){for(var t;t=Fe.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(ne),e.__h.some(de),e.__h=[]}catch(n){e.__h=[],b.__e(n,t.__v)}}}b.__b=function(t){v=null,Ne&&Ne(t)},b.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Re&&Re(t,e)},b.__r=function(t){Le&&Le(t),V=0;var e=(v=t.__c).__H;e&&(fe===v?(e.__h=[],v.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(ne),e.__h.some(de),e.__h=[],V=0)),fe=v},b.diffed=function(t){Ue&&Ue(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(Fe.push(e)!==1&&De===b.requestAnimationFrame||((De=b.requestAnimationFrame)||dt)(ft)),e.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),fe=v=null},b.__c=function(t,e){e.some(function(n){try{n.__h.some(ne),n.__h=n.__h.filter(function(r){return!r.__||de(r)})}catch(r){e.some(function(s){s.__h&&(s.__h=[])}),e=[],b.__e(r,n.__v)}}),We&&We(t,e)},b.unmount=function(t){ze&&ze(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{ne(r)}catch(s){e=s}}),n.__H=void 0,e&&b.__e(e,n.__v))};var Be=typeof requestAnimationFrame=="function";function dt(t){var e,n=function(){clearTimeout(r),Be&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);Be&&(e=requestAnimationFrame(n))}function ne(t){var e=v,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),v=e}function de(t){var e=v;t.__c=t.__(),v=e}function je(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function Ve(t,e){return typeof e=="function"?e(t):e}function qe({config:t,isOpen:e,onClick:n}){let r=t.primaryColor||"#6366f1";return p("button",{class:"lp-launcher",onClick:n,style:{backgroundColor:r},"aria-label":e?"Close chat":"Open chat"},e?p("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},p("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),p("line",{x1:"6",y1:"6",x2:"18",y2:"18"})):p("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},p("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})))}function ht(t){let e=[],n=/(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g,r=0,s;for(;(s=n.exec(t))!==null;)s.index>r&&e.push(t.slice(r,s.index)),s[1]?e.push(p("strong",null,s[2])):s[3]&&e.push(p("a",{href:s[3],target:"_blank",rel:"noopener noreferrer"},s[3])),r=s.index+s[0].length;return r<t.length&&e.push(t.slice(r)),e}function gt(t){let e=t.split(`
`);return e.map((n,r)=>p("span",{key:r},ht(n),r<e.length-1&&p("br",null)))}function Je({message:t,primaryColor:e}){let n=t.role==="user";return p("div",{class:`lp-msg ${n?"lp-msg-user":"lp-msg-assistant"}`,style:n?{backgroundColor:e}:void 0},gt(t.content))}function Ye(){return p("div",{class:"lp-typing"},p("span",null),p("span",null),p("span",null))}function oe(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}function mt(t){let e=`lp_session_${t}`,n=localStorage.getItem(e);return n||(n=oe(),localStorage.setItem(e,n)),n}function yt(t){try{let e=localStorage.getItem(`lp_history_${t}`);if(e)return JSON.parse(e).slice(-50)}catch{}return[]}function vt(t,e){try{localStorage.setItem(`lp_history_${t}`,JSON.stringify(e.slice(-50)))}catch{}}function Ke({config:t,token:e,agentId:n,channelId:r,apiOrigin:s,onClose:o}){let[a,_]=M(()=>yt(r)),[u,l]=M(""),[f,i]=M(!1),[d,c]=M(!1),y=re(null),w=re(null),k=re(mt(r)),g=t.primaryColor||"#6366f1",h=t.agentName||"AI Assistant",P=t.welcomeMessage||"Hi! How can I help you today?",T=t.conversationStarters??[],A=t.headerText||h;B(()=>{y.current?.scrollIntoView({behavior:"smooth"})},[a,d]),B(()=>{w.current?.focus()},[]);let U=$e(async x=>{if(!x.trim()||f)return;let z={id:oe(),role:"user",content:x.trim(),timestamp:Date.now()},O={id:oe(),role:"assistant",content:"",isStreaming:!0,timestamp:Date.now()};_(D=>[...D,z]),l(""),i(!0),c(!0);try{let D=await fetch(`${s}/api/channels/${n}/chat`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({userMessage:x.trim(),sessionId:k.current})});if(!D.ok||!D.body)throw new Error("Chat request failed");let et=D.body.getReader(),tt=new TextDecoder,ie="",$="",J=!1;for(;;){let{value:nt,done:rt}=await et.read();if(rt)break;ie+=tt.decode(nt,{stream:!0});let ge=ie.split(`

`);ie=ge.pop()??"";for(let me of ge)if(me.startsWith("data: "))try{let j=JSON.parse(me.slice(6));j.type==="text-delta"?(J||(_(H=>[...H,O]),J=!0,c(!1)),$+=j.delta,_(H=>H.map(N=>N.id===O.id?{...N,content:$}:N))):j.type==="done"?!J&&$===""?($=j.assistantContent||"I processed your request.",_(H=>[...H,{...O,content:$,isStreaming:!1}])):_(H=>H.map(N=>N.id===O.id?{...N,isStreaming:!1}:N)):j.type==="error"&&(J||_(H=>[...H,{...O,content:"Sorry, something went wrong. Please try again.",isStreaming:!1}]))}catch{}}}catch{c(!1),_(D=>[...D,{id:oe(),role:"assistant",content:"Sorry, I'm having trouble connecting. Please try again.",timestamp:Date.now()}])}finally{i(!1),c(!1)}},[n,s,e,f]);B(()=>{a.length>0&&vt(r,a.filter(x=>!x.isStreaming))},[a,r]);function W(x){x.key==="Enter"&&!x.shiftKey&&(x.preventDefault(),U(u))}function F(x){let z=x.target;l(z.value),z.style.height="38px",z.style.height=Math.min(z.scrollHeight,100)+"px"}let S=T.length>0&&a.filter(x=>x.role==="user").length===0,E=t.agentAvatar,Ze=E?.startsWith("http");return p("div",{class:"lp-chat-panel"},p("div",{class:"lp-header"},p("div",{class:"lp-header-avatar",style:{backgroundColor:g}},Ze?p("img",{src:E,alt:h}):p("span",null,E||h.charAt(0))),p("div",{class:"lp-header-info"},p("div",{class:"lp-header-name"},A),p("div",{class:"lp-header-status"},"Online")),p("button",{class:"lp-close-btn",onClick:o,"aria-label":"Close chat"},p("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round"},p("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),p("line",{x1:"6",y1:"6",x2:"18",y2:"18"})))),p("div",{class:"lp-messages"},a.length===0&&p("div",{class:"lp-welcome"},P),a.map(x=>p(Je,{key:x.id,message:x,primaryColor:g})),d&&p(Ye,null),p("div",{ref:y})),S&&p("div",{class:"lp-starters"},T.slice(0,4).map(x=>p("button",{key:x,class:"lp-starter-btn",onClick:()=>U(x),disabled:f},x))),p("div",{class:"lp-input-area"},p("textarea",{ref:w,class:"lp-input",value:u,onInput:F,onKeyDown:W,placeholder:"Type a message...",rows:1,disabled:f}),p("button",{class:"lp-send-btn",style:{backgroundColor:g},onClick:()=>U(u),disabled:!u.trim()||f,"aria-label":"Send message"},p("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},p("line",{x1:"22",y1:"2",x2:"11",y2:"13"}),p("polygon",{points:"22 2 15 22 11 13 2 9 22 2"})))),p("div",{class:"lp-powered"},p("a",{href:"https://launchpath.io",target:"_blank",rel:"noopener noreferrer"},"Powered by LaunchPath")))}function Ge({channelId:t,apiOrigin:e}){let[n,r]=M(null),[s,o]=M(null),[a,_]=M(null),[u,l]=M(!1),[f,i]=M(!1);if(B(()=>{fetch(`${e}/api/widget/${t}/config`).then(c=>{if(!c.ok)throw new Error("Config fetch failed");return c.json()}).then(c=>{r(c.config),o(c.token),_(c.agentId)}).catch(()=>i(!0))},[t,e]),f||!n)return null;let d=n.position||"right";return p("div",{class:`lp-position-${d}`},u&&s&&a?p(Ke,{config:n,token:s,agentId:a,channelId:t,apiOrigin:e,onClose:()=>l(!1)}):null,p(qe,{config:n,isOpen:u,onClick:()=>l(!u)}))}var Xe=`
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
  border-bottom: 1px solid #f0f0f0;
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
`;function Qe(){let t=document.querySelectorAll("script[data-channel]"),e=t[t.length-1];if(!e)return;let n=e.getAttribute("data-channel");if(!n)return;let r=e.getAttribute("src")||"",s;try{s=new URL(r,window.location.href).origin}catch{s=window.location.origin}let o=document.createElement("div");o.id="lp-widget-host",o.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;",document.body.appendChild(o);let a=o.attachShadow({mode:"open"}),_=document.createElement("style");_.textContent=Xe,a.appendChild(_);let u=document.createElement("div");u.id="lp-widget-root",u.style.cssText="pointer-events:auto;",a.appendChild(u),Ae(p(Ge,{channelId:n,apiOrigin:s}),u)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Qe):Qe();})();
