// Polyfill for IE
Math.trunc=Math.trunc||function(t){return isNaN(t)?NaN:t>0?Math.floor(t):Math.ceil(t)},Array.prototype.includes||Object.defineProperty(Array.prototype,"includes",{value:function(t,r){if(null==this)throw new TypeError('"this" est nul ou non défini');var e=Object(this),n=e.length>>>0;if(0===n)return!1;var a,i,o=0|r,u=Math.max(o>=0?o:n-Math.abs(o),0);for(;u<n;){if((a=e[u])===(i=t)||"number"==typeof a&&"number"==typeof i&&isNaN(a)&&isNaN(i))return!0;u++}return!1}});

if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}