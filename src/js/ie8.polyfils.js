/*
 * IE8 Polyfils for iframeResizer.js
 *
 * Public domain code - Mozilla Contributors
 * https://developer.mozilla.org/
 */

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun /*, thisArg */) {
    "use strict";
    if (this === void 0 || this === null || typeof fun !== "function") throw new TypeError();

    let
      t = Object(this),
      len = t.length >>> 0,
      thisArg = arguments.length >= 2 ? arguments[1] : void 0;

    for (let i = 0; i < len; i++)
      if (i in t)
        fun.call(thisArg, t[i], i, t);
  };
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    let aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {
      },
      fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (callback, thisArg) {
    if (this === null) throw new TypeError(' this is null or not defined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    let
      O = Object(this),
      len = O.length >>> 0;

    for (let k = 0; k < len; k++) {
      if (k in O)
        callback.call(thisArg, O[k], k, O);
    }
  };
}


