function i(){throw new Error("Cycle detected")}function t(){if(h>1){h--;return}let i,t=!1;while(void 0!==n){let s=n;n=void 0;f++;while(void 0!==s){const o=s.o;s.o=void 0;s.f&=-3;if(!(8&s.f)&&v(s))try{s.c()}catch(s){if(!t){i=s;t=!0}}s=o}}f=0;h--;if(t)throw i}function s(i){if(h>0)return i();h++;try{return i()}finally{t()}}let o,n,h=0,f=0,r=0;function e(i){if(void 0===o)return;let t=i.n;if(void 0===t||t.t!==o){t={i:0,S:i,p:o.s,n:void 0,t:o,e:void 0,x:void 0,r:t};if(void 0!==o.s)o.s.n=t;o.s=t;i.n=t;if(32&o.f)i.S(t);return t}else if(-1===t.i){t.i=0;if(void 0!==t.n){t.n.p=t.p;if(void 0!==t.p)t.p.n=t.n;t.p=o.s;t.n=void 0;o.s.n=t;o.s=t}return t}}function c(i){this.v=i;this.i=0;this.n=void 0;this.t=void 0}c.prototype.h=function(){return!0};c.prototype.S=function(i){if(this.t!==i&&void 0===i.e){i.x=this.t;if(void 0!==this.t)this.t.e=i;this.t=i}};c.prototype.U=function(i){if(void 0!==this.t){const t=i.e,s=i.x;if(void 0!==t){t.x=s;i.e=void 0}if(void 0!==s){s.e=t;i.x=void 0}if(i===this.t)this.t=s}};c.prototype.subscribe=function(i){const t=this;return p(function(){const s=t.value,o=32&this.f;this.f&=-33;try{i(s)}finally{this.f|=o}})};c.prototype.valueOf=function(){return this.value};c.prototype.toString=function(){return this.value+""};c.prototype.peek=function(){return this.v};Object.defineProperty(c.prototype,"value",{get(){const i=e(this);if(void 0!==i)i.i=this.i;return this.v},set(s){if(s!==this.v){if(f>100)i();this.v=s;this.i++;r++;h++;try{for(let i=this.t;void 0!==i;i=i.x)i.t.N()}finally{t()}}}});function u(i){return new c(i)}function v(i){for(let t=i.s;void 0!==t;t=t.n)if(t.S.i!==t.i||!t.S.h()||t.S.i!==t.i)return!0;return!1}function d(i){for(let t=i.s;void 0!==t;t=t.n){const s=t.S.n;if(void 0!==s)t.r=s;t.S.n=t;t.i=-1;if(void 0===t.n){i.s=t;break}}}function l(i){let t,s=i.s;while(void 0!==s){const i=s.p;if(-1===s.i){s.S.U(s);if(void 0!==i)i.n=s.n;if(void 0!==s.n)s.n.p=i}else t=s;s.S.n=s.r;if(void 0!==s.r)s.r=void 0;s=i}i.s=t}function a(i){c.call(this,void 0);this.x=i;this.s=void 0;this.g=r-1;this.f=4}(a.prototype=new c).h=function(){this.f&=-3;if(1&this.f)return!1;if(32==(36&this.f))return!0;this.f&=-5;if(this.g===r)return!0;this.g=r;this.f|=1;if(this.i>0&&!v(this)){this.f&=-2;return!0}const i=o;try{d(this);o=this;const i=this.x();if(16&this.f||this.v!==i||0===this.i){this.v=i;this.f&=-17;this.i++}}catch(i){this.v=i;this.f|=16;this.i++}o=i;l(this);this.f&=-2;return!0};a.prototype.S=function(i){if(void 0===this.t){this.f|=36;for(let i=this.s;void 0!==i;i=i.n)i.S.S(i)}c.prototype.S.call(this,i)};a.prototype.U=function(i){if(void 0!==this.t){c.prototype.U.call(this,i);if(void 0===this.t){this.f&=-33;for(let i=this.s;void 0!==i;i=i.n)i.S.U(i)}}};a.prototype.N=function(){if(!(2&this.f)){this.f|=6;for(let i=this.t;void 0!==i;i=i.x)i.t.N()}};a.prototype.peek=function(){if(!this.h())i();if(16&this.f)throw this.v;return this.v};Object.defineProperty(a.prototype,"value",{get(){if(1&this.f)i();const t=e(this);this.h();if(void 0!==t)t.i=this.i;if(16&this.f)throw this.v;return this.v}});function w(i){return new a(i)}function y(i){const s=i.u;i.u=void 0;if("function"==typeof s){h++;const n=o;o=void 0;try{s()}catch(t){i.f&=-2;i.f|=8;_(i);throw t}finally{o=n;t()}}}function _(i){for(let t=i.s;void 0!==t;t=t.n)t.S.U(t);i.x=void 0;i.s=void 0;y(i)}function g(i){if(o!==this)throw new Error("Out-of-order effect");l(this);o=i;this.f&=-2;if(8&this.f)_(this);t()}function b(i){this.x=i;this.u=void 0;this.s=void 0;this.o=void 0;this.f=32}b.prototype.c=function(){const i=this.S();try{if(!(8&this.f)&&void 0!==this.x)this.u=this.x()}finally{i()}};b.prototype.S=function(){if(1&this.f)i();this.f|=1;this.f&=-9;y(this);d(this);h++;const t=o;o=this;return g.bind(this,t)};b.prototype.N=function(){if(!(2&this.f)){this.f|=2;this.o=n;n=this}};b.prototype.d=function(){this.f|=8;if(!(1&this.f))_(this)};function p(i){const t=new b(i);try{t.c()}catch(i){t.d();throw i}return t.d.bind(t)}export{c as Signal,s as batch,w as computed,p as effect,u as signal};//# sourceMappingURL=signals-core.mjs.map
