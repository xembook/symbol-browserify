require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
"use strict";
/* tslint:disable */
/* eslint-disable */
/**
 * Catapult REST Endpoints
 * OpenAPI Specification of catapult-rest
 *
 * The version of the OpenAPI document: 1.0.4
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataRoutesApi = exports.MetadataRoutesApiFactory = exports.MetadataRoutesApiFp = exports.MetadataRoutesApiAxiosParamCreator = exports.HashLockRoutesApi = exports.HashLockRoutesApiFactory = exports.HashLockRoutesApiFp = exports.HashLockRoutesApiAxiosParamCreator = exports.FinalizationRoutesApi = exports.FinalizationRoutesApiFactory = exports.FinalizationRoutesApiFp = exports.FinalizationRoutesApiAxiosParamCreator = exports.ChainRoutesApi = exports.ChainRoutesApiFactory = exports.ChainRoutesApiFp = exports.ChainRoutesApiAxiosParamCreator = exports.BlockRoutesApi = exports.BlockRoutesApiFactory = exports.BlockRoutesApiFp = exports.BlockRoutesApiAxiosParamCreator = exports.AccountRoutesApi = exports.AccountRoutesApiFactory = exports.AccountRoutesApiFp = exports.AccountRoutesApiAxiosParamCreator = exports.TransactionTypeEnum = exports.TransactionStatusEnum = exports.TransactionGroupEnum = exports.StageEnum = exports.ReceiptTypeEnum = exports.PositionEnum = exports.Order = exports.NodeStatusEnum = exports.NodeIdentityEqualityStrategy = exports.NetworkTypeEnum = exports.NamespaceRegistrationTypeEnum = exports.MosaicSupplyChangeActionEnum = exports.MosaicRestrictionTypeEnum = exports.MosaicRestrictionEntryTypeEnum = exports.MetadataTypeEnum = exports.MerkleTreeNodeTypeEnum = exports.LockStatus = exports.LockHashAlgorithmEnum = exports.LinkActionEnum = exports.BlockOrderByEnum = exports.AliasTypeEnum = exports.AliasActionEnum = exports.AccountTypeEnum = exports.AccountRestrictionFlagsEnum = exports.AccountOrderByEnum = exports.AccountKeyTypeFlagsEnum = void 0;
exports.TransactionStatusRoutesApi = exports.TransactionStatusRoutesApiFactory = exports.TransactionStatusRoutesApiFp = exports.TransactionStatusRoutesApiAxiosParamCreator = exports.TransactionRoutesApi = exports.TransactionRoutesApiFactory = exports.TransactionRoutesApiFp = exports.TransactionRoutesApiAxiosParamCreator = exports.SecretLockRoutesApi = exports.SecretLockRoutesApiFactory = exports.SecretLockRoutesApiFp = exports.SecretLockRoutesApiAxiosParamCreator = exports.RestrictionMosaicRoutesApi = exports.RestrictionMosaicRoutesApiFactory = exports.RestrictionMosaicRoutesApiFp = exports.RestrictionMosaicRoutesApiAxiosParamCreator = exports.RestrictionAccountRoutesApi = exports.RestrictionAccountRoutesApiFactory = exports.RestrictionAccountRoutesApiFp = exports.RestrictionAccountRoutesApiAxiosParamCreator = exports.ReceiptRoutesApi = exports.ReceiptRoutesApiFactory = exports.ReceiptRoutesApiFp = exports.ReceiptRoutesApiAxiosParamCreator = exports.NodeRoutesApi = exports.NodeRoutesApiFactory = exports.NodeRoutesApiFp = exports.NodeRoutesApiAxiosParamCreator = exports.NetworkRoutesApi = exports.NetworkRoutesApiFactory = exports.NetworkRoutesApiFp = exports.NetworkRoutesApiAxiosParamCreator = exports.NamespaceRoutesApi = exports.NamespaceRoutesApiFactory = exports.NamespaceRoutesApiFp = exports.NamespaceRoutesApiAxiosParamCreator = exports.MultisigRoutesApi = exports.MultisigRoutesApiFactory = exports.MultisigRoutesApiFp = exports.MultisigRoutesApiAxiosParamCreator = exports.MosaicRoutesApi = exports.MosaicRoutesApiFactory = exports.MosaicRoutesApiFp = exports.MosaicRoutesApiAxiosParamCreator = void 0;
var axios_1 = __importDefault(require("axios"));
// Some imports not used depending on template conditions
// @ts-ignore
var common_1 = require("./common");
// @ts-ignore
var base_1 = require("./base");
/**
 * Type of account key: * 0 - Unset. * 1 - Linked account public key. * 2 - Node public key on which remote is allowed to harvest. * 4 - VRF public key.
 * @export
 * @enum {string}
 */
exports.AccountKeyTypeFlagsEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_4: 4
};
/**
 *
 * @export
 * @enum {string}
 */
exports.AccountOrderByEnum = {
    Id: 'id',
    Balance: 'balance'
};
/**
 * Type of account restriction: * 0x0001 (1 decimal) - Allow only incoming transactions from a given address. * 0x0002 (2 decimal) - Allow only incoming transactions containing a given mosaic identifier. * 0x4001 (16385 decimal) - Allow only outgoing transactions to a given address. * 0x4004 (16388 decimal) - Allow only outgoing transactions with a given transaction type. * 0x8001 (32769 decimal) - Block incoming transactions from a given address. * 0x8002 (32770 decimal) - Block incoming transactions containing a given mosaic identifier. * 0xC001 (49153 decimal) - Block outgoing transactions to a given address. * 0xC004 (49156 decimal) - Block outgoing transactions with a given transaction type.
 * @export
 * @enum {string}
 */
exports.AccountRestrictionFlagsEnum = {
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_16385: 16385,
    NUMBER_16388: 16388,
    NUMBER_32769: 32769,
    NUMBER_32770: 32770,
    NUMBER_49153: 49153,
    NUMBER_49156: 49156
};
/**
 * * 0 - Unlinked. * 1 - Balance-holding account that is linked to a remote harvester account. * 2 - Remote harvester account that is linked to a balance-holding account. * 3 - Remote harvester eligible account that is unlinked.
 * @export
 * @enum {string}
 */
exports.AccountTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_3: 3
};
/**
 * Alias action: * 0 - Unlink alias. * 1 - Link alias.
 * @export
 * @enum {string}
 */
exports.AliasActionEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Type of alias: * 0 - No alias. * 1 - Mosaic id alias. * 2 - Addres alias.
 * @export
 * @enum {string}
 */
exports.AliasTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2
};
/**
 *
 * @export
 * @enum {string}
 */
exports.BlockOrderByEnum = {
    Id: 'id',
    Height: 'height'
};
/**
 * Type of action: * 0 - Unlink. * 1 - Link.
 * @export
 * @enum {string}
 */
exports.LinkActionEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Algorithm used to hash the proof: * 0 (Op_Sha3_256) - Proof is hashed using SHA3-256. * 1 (Op_Hash_160) - Proof is hashed twice: first with SHA-256 and then with RIPEMD-160 (bitcoin\'s OP_HASH160). * 2 (Op_Hash_256) - Proof is hashed twice with SHA3-256 (bitcoin\'s OP_HASH256).
 * @export
 * @enum {string}
 */
exports.LockHashAlgorithmEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2
};
/**
 * Possible status of lock states: * 0 - UNUSED. * 1 - USED.
 * @export
 * @enum {string}
 */
exports.LockStatus = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Type of Merkle tree node: * 0 - Branch node. * 255 - Leaf node.
 * @export
 * @enum {string}
 */
exports.MerkleTreeNodeTypeEnum = {
    NUMBER_0: 0,
    NUMBER_255: 255
};
/**
 * Metadata type: * 0 - Account. * 1 - Mosaic. * 2 - Namespace.
 * @export
 * @enum {string}
 */
exports.MetadataTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2
};
/**
 * - 0 - Mosaic address restriction. - 1 - Mosaic global restriction.
 * @export
 * @enum {string}
 */
exports.MosaicRestrictionEntryTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Type of mosaic restriction. * 0 - Uninitialized value indicating no restriction. * 1 (EQ) - Allow if equal. * 2 (NE) - Allow if not equal. * 3 (LT) - Allow if less than. * 4 (LE) - Allow if less than or equal. * 5 (GT) - Allow if greater than. * 6 (GE) - Allow if greater than or equal.
 * @export
 * @enum {string}
 */
exports.MosaicRestrictionTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2,
    NUMBER_3: 3,
    NUMBER_4: 4,
    NUMBER_5: 5,
    NUMBER_6: 6
};
/**
 * Direction of the supply change: * 0  - Decrease. * 1  - Increase.
 * @export
 * @enum {string}
 */
exports.MosaicSupplyChangeActionEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Type of namespace: * 0 - Root namespace. * 1 - Subnamespace.
 * @export
 * @enum {string}
 */
exports.NamespaceRegistrationTypeEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1
};
/**
 * Network type: * 0x68 (104 decimal) - Main network. * 0x98 (152 decimal) - Test network.
 * @export
 * @enum {string}
 */
exports.NetworkTypeEnum = {
    NUMBER_104: 104,
    NUMBER_152: 152
};
/**
 * Node equality strategy. Defines if the identifier for the node must be its public key or host.
 * @export
 * @enum {string}
 */
exports.NodeIdentityEqualityStrategy = {
    Host: 'host',
    PublicKey: 'public-key'
};
/**
 *
 * @export
 * @enum {string}
 */
exports.NodeStatusEnum = {
    Up: 'up',
    Down: 'down'
};
/**
 * Indicates how to sort the results:  * ``asc`` - ascending * ``desc`` - descending
 * @export
 * @enum {string}
 */
exports.Order = {
    Asc: 'asc',
    Desc: 'desc'
};
/**
 * Position relative to the proofHash being evaluated.
 * @export
 * @enum {string}
 */
exports.PositionEnum = {
    Left: 'left',
    Right: 'right'
};
/**
 * Type of receipt: * 0x124D (4685 decimal) - Mosaic_Rental_Fee. * 0x134E (4942 decimal) - Namespace_Rental_Fee. * 0x2143 (8515 decimal) - Harvest_Fee. * 0x2248 (8776 decimal) - LockHash_Completed. * 0x2348 (9032 decimal) - LockHash_Expired. * 0x2252 (8786 decimal) - LockSecret_Completed. * 0x2352 (9042 decimal) - LockSecret_Expired. * 0x3148 (12616 decimal) - LockHash_Created. * 0x3152 (12626 decimal) - LockSecret_Created. * 0x414D (16717 decimal) - Mosaic_Expired. * 0x414E (16718 decimal) - Namespace_Expired. * 0x424E (16974 decimal) - Namespace_Deleted. * 0x5143 (20803 decimal) - Inflation. * 0xE143 (57667 decimal) - Transaction_Group. * 0xF143 (61763 decimal) - Address_Alias_Resolution. * 0xF243 (62019 decimal) - Mosaic_Alias_Resolution.
 * @export
 * @enum {string}
 */
exports.ReceiptTypeEnum = {
    NUMBER_4685: 4685,
    NUMBER_4942: 4942,
    NUMBER_8515: 8515,
    NUMBER_8776: 8776,
    NUMBER_9032: 9032,
    NUMBER_8786: 8786,
    NUMBER_9042: 9042,
    NUMBER_12616: 12616,
    NUMBER_12626: 12626,
    NUMBER_16717: 16717,
    NUMBER_16718: 16718,
    NUMBER_16974: 16974,
    NUMBER_20803: 20803,
    NUMBER_57667: 57667,
    NUMBER_61763: 61763,
    NUMBER_62019: 62019
};
/**
 * Type of stage: * 0 - Prevote. * 1 - Precommit. * 2 - Count.
 * @export
 * @enum {string}
 */
exports.StageEnum = {
    NUMBER_0: 0,
    NUMBER_1: 1,
    NUMBER_2: 2
};
/**
 * A transaction could be classified in the following groups: * Unconfirmed: The transaction reached the P2P network. At this point, it is not guaranteed that the transaction will be included in a block. * Confirmed: The transaction is included in a block. * Partial: The transaction requires to be cosigned by other transaction participants in order to be included in a block. * Failed: The transaction did not pass the network validation, and it was rejected.
 * @export
 * @enum {string}
 */
exports.TransactionGroupEnum = {
    Unconfirmed: 'unconfirmed',
    Confirmed: 'confirmed',
    Failed: 'failed',
    Partial: 'partial'
};
/**
 * List of status errors that can be returned via the status channel after announcing a transaction: * Success * Neutral * Failure * Failure_Core_Past_Deadline - Validation failed because the deadline passed. * Failure_Core_Future_Deadline - Validation failed because the deadline is too far in the future. * Failure_Core_Insufficient_Balance - Validation failed because the account has an insufficient balance. * Failure_Core_Too_Many_Transactions - Validation failed because there are too many transactions in a block. * Failure_Core_Nemesis_Account_Signed_After_Nemesis_Block - Validation failed because an entity originated from the nemesis account after the nemesis block. * Failure_Core_Wrong_Network - Validation failed because the entity has the wrong network specified. * Failure_Core_Invalid_Address - Validation failed because an address is invalid. * Failure_Core_Invalid_Version - Validation failed because entity version is invalid. * Failure_Core_Invalid_Transaction_Fee - Validation failed because a transaction fee is invalid. * Failure_Core_Block_Harvester_Ineligible - Validation failed because a block was harvested by an ineligible harvester. * Failure_Core_Zero_Address - Validation failed because an address is zero. * Failure_Core_Zero_Public_Key - Validation failed because a public key is zero. * Failure_Core_Nonzero_Internal_Padding - Validation failed because internal padding is nonzero. * Failure_Core_Address_Collision - Validation failed because an address collision is detected. * Failure_Core_Importance_Block_Mismatch - Validation failed because the block does not match the schema of an importance block. * Failure_Core_Unexpected_Block_Type - Validation failed because the block type is unexpected. * Failure_Core_Block_Explicit_Transactions_Hash_Mismatch - Validation failed because a block did not have the expected transactions hash at a specified height. * Failure_Core_Invalid_Link_Action - Validation failed because link action is invalid. * Failure_Core_Link_Already_Exists - Validation failed because main account is already linked to another account. * Failure_Core_Inconsistent_Unlink_Data - Validation failed because unlink data is not consistent with existing account link. * Failure_Core_Invalid_Link_Range - Validation failed because link range is invalid. * Failure_Core_Too_Many_Links - Validation failed because main account has too many links of the specified type. * Failure_Core_Link_Start_Epoch_Invalid - Validation failed because the start epoch is invalid. * Failure_Hash_Already_Exists * Failure_Signature_Not_Verifiable - Validation failed because the verification of the signature failed. * Failure_AccountLink_Link_Already_Exists - Validation failed because main account is already linked to another account. * Failure_AccountLink_Inconsistent_Unlink_Data - Validation failed because unlink data is not consistent with existing account link. * Failure_AccountLink_Unknown_Link - Validation failed because main account is not linked to another account. * Failure_AccountLink_Remote_Account_Ineligible - Validation failed because link is attempting to convert ineligible account to remote. * Failure_AccountLink_Remote_Account_Signer_Prohibited - Validation failed because remote is not allowed to sign a transaction. * Failure_AccountLink_Remote_Account_Participant_Prohibited - Validation failed because remote is not allowed to participate in the transaction. * Failure_Aggregate_Too_Many_Transactions - Validation failed because aggregate has too many transactions. * Failure_Aggregate_No_Transactions - Validation failed because aggregate does not have any transactions. * Failure_Aggregate_Too_Many_Cosignatures - Validation failed because aggregate has too many cosignatures. * Failure_Aggregate_Redundant_Cosignatures - Validation failed because redundant cosignatures are present. * Failure_Aggregate_Ineligible_Cosignatories - Validation failed because at least one cosignatory is ineligible. * Failure_Aggregate_Missing_Cosignatures - Validation failed because at least one required cosignature is missing. * Failure_Aggregate_Transactions_Hash_Mismatch - Validation failed because the aggregate transactions hash does not match the calculated value. * Failure_LockHash_Invalid_Mosaic_Id - Validation failed because lock does not allow the specified mosaic. * Failure_LockHash_Invalid_Mosaic_Amount - Validation failed because lock does not allow the specified amount. * Failure_LockHash_Hash_Already_Exists - Validation failed because hash is already present in cache. * Failure_LockHash_Unknown_Hash - Validation failed because hash is not present in cache. * Failure_LockHash_Inactive_Hash - Validation failed because hash is inactive. * Failure_LockHash_Invalid_Duration - Validation failed because duration is too long. * Failure_LockSecret_Invalid_Hash_Algorithm - Validation failed because hash algorithm for lock type secret is invalid. * Failure_LockSecret_Hash_Already_Exists - Validation failed because hash is already present in cache. * Failure_LockSecret_Proof_Size_Out_Of_Bounds - Validation failed because proof is too small or too large. * Failure_LockSecret_Secret_Mismatch - Validation failed because secret does not match proof. * Failure_LockSecret_Unknown_Composite_Key - Validation failed because composite key is unknown. * Failure_LockSecret_Inactive_Secret - Validation failed because secret is inactive. * Failure_LockSecret_Hash_Algorithm_Mismatch - Validation failed because hash algorithm does not match. * Failure_LockSecret_Invalid_Duration - Validation failed because duration is too long. * Failure_Metadata_Value_Too_Small - Validation failed because the metadata value is too small. * Failure_Metadata_Value_Too_Large - Validation failed because the metadata value is too large. * Failure_Metadata_Value_Size_Delta_Too_Large - Validation failed because the metadata value size delta is larger in magnitude than the value size. * Failure_Metadata_Value_Size_Delta_Mismatch - Validation failed because the metadata value size delta does not match expected value based on the current state. * Failure_Metadata_Value_Change_Irreversible - Validation failed because a metadata value change (truncation) is irreversible. * Failure_Mosaic_Invalid_Duration - Validation failed because the duration has an invalid value. * Failure_Mosaic_Invalid_Name - Validation failed because the name is invalid. * Failure_Mosaic_Name_Id_Mismatch - Validation failed because the name and id don\'t match. * Failure_Mosaic_Expired - Validation failed because the parent is expired. * Failure_Mosaic_Owner_Conflict - Validation failed because the parent owner conflicts with the child owner. * Failure_Mosaic_Id_Mismatch - Validation failed because the id is not the expected id generated from signer and nonce. * Failure_Mosaic_Parent_Id_Conflict - Validation failed because the existing parent id does not match the supplied parent id. * Failure_Mosaic_Invalid_Property - Validation failed because a mosaic property is invalid. * Failure_Mosaic_Invalid_Flags - Validation failed because the mosaic flags are invalid. * Failure_Mosaic_Invalid_Divisibility - Validation failed because the mosaic divisibility is invalid. * Failure_Mosaic_Invalid_Supply_Change_Action - Validation failed because the mosaic supply change action is invalid. * Failure_Mosaic_Invalid_Supply_Change_Amount - Validation failed because the mosaic supply change amount is invalid. * Failure_Mosaic_Invalid_Id - Validation failed because the mosaic id is invalid. * Failure_Mosaic_Modification_Disallowed - Validation failed because mosaic modification is not allowed. * Failure_Mosaic_Modification_No_Changes - Validation failed because mosaic modification would not result in any changes. * Failure_Mosaic_Supply_Immutable - Validation failed because the mosaic supply is immutable. * Failure_Mosaic_Supply_Negative - Validation failed because the resulting mosaic supply is negative. * Failure_Mosaic_Supply_Exceeded - Validation failed because the resulting mosaic supply exceeds the maximum allowed value. * Failure_Mosaic_Non_Transferable - Validation failed because the mosaic is not transferable. * Failure_Mosaic_Max_Mosaics_Exceeded - Validation failed because the credit of the mosaic would exceed the maximum of different mosaics an account is allowed to own. * Failure_Mosaic_Required_Property_Flag_Unset - Validation failed because the mosaic has at least one required property flag unset. * Failure_Multisig_Account_In_Both_Sets - Validation failed because account is specified to be both added and removed. * Failure_Multisig_Multiple_Deletes - Validation failed because multiple removals are present. * Failure_Multisig_Redundant_Modification - Validation failed because a modification is redundant. * Failure_Multisig_Unknown_Multisig_Account - Validation failed because account is not in multisig cache. * Failure_Multisig_Not_A_Cosignatory - Validation failed because account to be removed is not present. * Failure_Multisig_Already_A_Cosignatory - Validation failed because account to be added is already a cosignatory. * Failure_Multisig_Min_Setting_Out_Of_Range - Validation failed because new minimum settings are out of range. * Failure_Multisig_Min_Setting_Larger_Than_Num_Cosignatories - Validation failed because min settings are larger than number of cosignatories. * Failure_Multisig_Invalid_Modification_Action - Validation failed because the modification action is invalid. * Failure_Multisig_Max_Cosigned_Accounts - Validation failed because the cosignatory already cosigns the maximum number of accounts. * Failure_Multisig_Max_Cosignatories - Validation failed because the multisig account already has the maximum number of cosignatories. * Failure_Multisig_Loop - Validation failed because a multisig loop is created. * Failure_Multisig_Max_Multisig_Depth - Validation failed because the max multisig depth is exceeded. * Failure_Multisig_Operation_Prohibited_By_Account - Validation failed because an operation is not permitted by a multisig account. * Failure_Namespace_Invalid_Duration - Validation failed because the duration has an invalid value. * Failure_Namespace_Invalid_Name - Validation failed because the name is invalid. * Failure_Namespace_Name_Id_Mismatch - Validation failed because the name and id don\'t match. * Failure_Namespace_Expired - Validation failed because the parent is expired. * Failure_Namespace_Owner_Conflict - Validation failed because the parent owner conflicts with the child owner. * Failure_Namespace_Id_Mismatch - Validation failed because the id is not the expected id generated from signer and nonce. * Failure_Namespace_Invalid_Registration_Type - Validation failed because the namespace registration type is invalid. * Failure_Namespace_Root_Name_Reserved - Validation failed because the root namespace has a reserved name. * Failure_Namespace_Too_Deep - Validation failed because the resulting namespace would exceed the maximum allowed namespace depth. * Failure_Namespace_Unknown_Parent - Validation failed because the namespace parent is unknown. * Failure_Namespace_Already_Exists - Validation failed because the namespace already exists. * Failure_Namespace_Already_Active - Validation failed because the namespace is already active. * Failure_Namespace_Eternal_After_Nemesis_Block - Validation failed because an eternal namespace was received after the nemesis block. * Failure_Namespace_Max_Children_Exceeded - Validation failed because the maximum number of children for a root namespace was exceeded. * Failure_Namespace_Alias_Invalid_Action - Validation failed because alias action is invalid. * Failure_Namespace_Unknown - Validation failed because namespace does not exist. * Failure_Namespace_Alias_Already_Exists - Validation failed because namespace is already linked to an alias. * Failure_Namespace_Unknown_Alias - Validation failed because namespace is not linked to an alias. * Failure_Namespace_Alias_Inconsistent_Unlink_Type - Validation failed because unlink type is not consistent with existing alias. * Failure_Namespace_Alias_Inconsistent_Unlink_Data - Validation failed because unlink data is not consistent with existing alias. * Failure_Namespace_Alias_Invalid_Address - Validation failed because aliased address is invalid. * Failure_RestrictionAccount_Invalid_Restriction_Flags - Validation failed because the account restriction flags are invalid. * Failure_RestrictionAccount_Invalid_Modification_Action - Validation failed because a modification action is invalid. * Failure_RestrictionAccount_Invalid_Modification_Address - Validation failed because a modification address is invalid. * Failure_RestrictionAccount_Modification_Operation_Type_Incompatible - Validation failed because the operation type is incompatible. *Note*: This indicates that the existing restrictions have a different operation type than that specified in the notification. * Failure_RestrictionAccount_Redundant_Modification - Validation failed because a modification is redundant. * Failure_RestrictionAccount_Invalid_Modification - Validation failed because a value is not in the container. * Failure_RestrictionAccount_Modification_Count_Exceeded - Validation failed because the transaction has too many modifications. * Failure_RestrictionAccount_No_Modifications - Validation failed because the transaction has no modifications. * Failure_RestrictionAccount_Values_Count_Exceeded - Validation failed because the resulting account restriction has too many values. * Failure_RestrictionAccount_Invalid_Value - Validation failed because the account restriction value is invalid. * Failure_RestrictionAccount_Address_Interaction_Prohibited - Validation failed because the addresses involved in the transaction are not allowed to interact. * Failure_RestrictionAccount_Mosaic_Transfer_Prohibited - Validation failed because the mosaic transfer is prohibited by the recipient. * Failure_RestrictionAccount_Operation_Type_Prohibited - Validation failed because the operation type is not allowed to be initiated by the signer. * Failure_RestrictionMosaic_Invalid_Restriction_Type - Validation failed because the mosaic restriction type is invalid. * Failure_RestrictionMosaic_Previous_Value_Mismatch - Validation failed because specified previous value does not match current value. * Failure_RestrictionMosaic_Previous_Value_Must_Be_Zero - Validation failed because specified previous value is nonzero. * Failure_RestrictionMosaic_Max_Restrictions_Exceeded - Validation failed because the maximum number of restrictions would be exceeded. * Failure_RestrictionMosaic_Cannot_Delete_Nonexistent_Restriction - Validation failed because nonexistent restriction cannot be deleted. * Failure_RestrictionMosaic_Unknown_Global_Restriction - Validation failed because required global restriction does not exist. * Failure_RestrictionMosaic_Invalid_Global_Restriction - Validation failed because mosaic has invalid global restriction. * Failure_RestrictionMosaic_Account_Unauthorized - Validation failed because account lacks proper permissions to move mosaic. * Failure_Transfer_Message_Too_Large - Validation failed because the message is too large. * Failure_Transfer_Out_Of_Order_Mosaics - Validation failed because mosaics are out of order. * Failure_Chain_Unlinked - Validation failed because a block was received that did not link with the existing chain. * Failure_Chain_Block_Not_Hit - Validation failed because a block was received that is not a hit. * Failure_Chain_Block_Inconsistent_State_Hash - Validation failed because a block was received that has an inconsistent state hash. * Failure_Chain_Block_Inconsistent_Receipts_Hash - Validation failed because a block was received that has an inconsistent receipts hash. * Failure_Chain_Block_Invalid_Vrf_Proof - Validation failed because the Vrf proof is invalid. * Failure_Chain_Block_Unknown_Signer - Validation failed because the block signer is unknown. * Failure_Chain_Unconfirmed_Cache_Too_Full - Validation failed because the unconfirmed cache is too full. * Failure_Consumer_Empty_Input - Validation failed because the consumer input is empty. * Failure_Consumer_Block_Transactions_Hash_Mismatch - Validation failed because the block transactions hash does not match the calculated value. * Neutral_Consumer_Hash_In_Recency_Cache - Validation failed because an entity hash is present in the recency cache. * Failure_Consumer_Remote_Chain_Too_Many_Blocks - Validation failed because the chain part has too many blocks. * Failure_Consumer_Remote_Chain_Improper_Link - Validation failed because the chain is internally improperly linked. * Failure_Consumer_Remote_Chain_Duplicate_Transactions - Validation failed because the chain part contains duplicate transactions. * Failure_Consumer_Remote_Chain_Unlinked - Validation failed because the chain part does not link to the current chain. * Failure_Consumer_Remote_Chain_Difficulties_Mismatch - Validation failed because the remote chain difficulties do not match the calculated difficulties. * Failure_Consumer_Remote_Chain_Score_Not_Better - Validation failed because the remote chain score is not better. * Failure_Consumer_Remote_Chain_Too_Far_Behind - Validation failed because the remote chain is too far behind. * Failure_Consumer_Remote_Chain_Too_Far_In_Future - Validation failed because the remote chain timestamp is too far in the future. * Failure_Consumer_Batch_Signature_Not_Verifiable - Validation failed because the verification of the signature failed during a batch operation. * Failure_Consumer_Remote_Chain_Improper_Importance_Link - Validation failed because the remote chain has an improper importance link. * Failure_Extension_Partial_Transaction_Cache_Prune - Validation failed because the partial transaction was pruned from the temporal cache. * Failure_Extension_Partial_Transaction_Dependency_Removed - Validation failed because the partial transaction was pruned from the temporal cache due to its dependency being removed. * Failure_Extension_Read_Rate_Limit_Exceeded - Validation failed because socket read rate limit was exceeded.
 * @export
 * @enum {string}
 */
exports.TransactionStatusEnum = {
    Success: 'Success',
    Neutral: 'Neutral',
    Failure: 'Failure',
    FailureCorePastDeadline: 'Failure_Core_Past_Deadline',
    FailureCoreFutureDeadline: 'Failure_Core_Future_Deadline',
    FailureCoreInsufficientBalance: 'Failure_Core_Insufficient_Balance',
    FailureCoreTooManyTransactions: 'Failure_Core_Too_Many_Transactions',
    FailureCoreNemesisAccountSignedAfterNemesisBlock: 'Failure_Core_Nemesis_Account_Signed_After_Nemesis_Block',
    FailureCoreWrongNetwork: 'Failure_Core_Wrong_Network',
    FailureCoreInvalidAddress: 'Failure_Core_Invalid_Address',
    FailureCoreInvalidVersion: 'Failure_Core_Invalid_Version',
    FailureCoreInvalidTransactionFee: 'Failure_Core_Invalid_Transaction_Fee',
    FailureCoreBlockHarvesterIneligible: 'Failure_Core_Block_Harvester_Ineligible',
    FailureCoreZeroAddress: 'Failure_Core_Zero_Address',
    FailureCoreZeroPublicKey: 'Failure_Core_Zero_Public_Key',
    FailureCoreNonzeroInternalPadding: 'Failure_Core_Nonzero_Internal_Padding',
    FailureCoreAddressCollision: 'Failure_Core_Address_Collision',
    FailureCoreImportanceBlockMismatch: 'Failure_Core_Importance_Block_Mismatch',
    FailureCoreUnexpectedBlockType: 'Failure_Core_Unexpected_Block_Type',
    FailureCoreBlockExplicitTransactionsHashMismatch: 'Failure_Core_Block_Explicit_Transactions_Hash_Mismatch',
    FailureCoreInvalidLinkAction: 'Failure_Core_Invalid_Link_Action',
    FailureCoreLinkAlreadyExists: 'Failure_Core_Link_Already_Exists',
    FailureCoreInconsistentUnlinkData: 'Failure_Core_Inconsistent_Unlink_Data',
    FailureCoreInvalidLinkRange: 'Failure_Core_Invalid_Link_Range',
    FailureCoreTooManyLinks: 'Failure_Core_Too_Many_Links',
    FailureCoreLinkStartEpochInvalid: 'Failure_Core_Link_Start_Epoch_Invalid',
    FailureHashAlreadyExists: 'Failure_Hash_Already_Exists',
    FailureSignatureNotVerifiable: 'Failure_Signature_Not_Verifiable',
    FailureAccountLinkLinkAlreadyExists: 'Failure_AccountLink_Link_Already_Exists',
    FailureAccountLinkInconsistentUnlinkData: 'Failure_AccountLink_Inconsistent_Unlink_Data',
    FailureAccountLinkUnknownLink: 'Failure_AccountLink_Unknown_Link',
    FailureAccountLinkRemoteAccountIneligible: 'Failure_AccountLink_Remote_Account_Ineligible',
    FailureAccountLinkRemoteAccountSignerProhibited: 'Failure_AccountLink_Remote_Account_Signer_Prohibited',
    FailureAccountLinkRemoteAccountParticipantProhibited: 'Failure_AccountLink_Remote_Account_Participant_Prohibited',
    FailureAggregateTooManyTransactions: 'Failure_Aggregate_Too_Many_Transactions',
    FailureAggregateNoTransactions: 'Failure_Aggregate_No_Transactions',
    FailureAggregateTooManyCosignatures: 'Failure_Aggregate_Too_Many_Cosignatures',
    FailureAggregateRedundantCosignatures: 'Failure_Aggregate_Redundant_Cosignatures',
    FailureAggregateIneligibleCosignatories: 'Failure_Aggregate_Ineligible_Cosignatories',
    FailureAggregateMissingCosignatures: 'Failure_Aggregate_Missing_Cosignatures',
    FailureAggregateTransactionsHashMismatch: 'Failure_Aggregate_Transactions_Hash_Mismatch',
    FailureLockHashInvalidMosaicId: 'Failure_LockHash_Invalid_Mosaic_Id',
    FailureLockHashInvalidMosaicAmount: 'Failure_LockHash_Invalid_Mosaic_Amount',
    FailureLockHashHashAlreadyExists: 'Failure_LockHash_Hash_Already_Exists',
    FailureLockHashUnknownHash: 'Failure_LockHash_Unknown_Hash',
    FailureLockHashInactiveHash: 'Failure_LockHash_Inactive_Hash',
    FailureLockHashInvalidDuration: 'Failure_LockHash_Invalid_Duration',
    FailureLockSecretInvalidHashAlgorithm: 'Failure_LockSecret_Invalid_Hash_Algorithm',
    FailureLockSecretHashAlreadyExists: 'Failure_LockSecret_Hash_Already_Exists',
    FailureLockSecretProofSizeOutOfBounds: 'Failure_LockSecret_Proof_Size_Out_Of_Bounds',
    FailureLockSecretSecretMismatch: 'Failure_LockSecret_Secret_Mismatch',
    FailureLockSecretUnknownCompositeKey: 'Failure_LockSecret_Unknown_Composite_Key',
    FailureLockSecretInactiveSecret: 'Failure_LockSecret_Inactive_Secret',
    FailureLockSecretHashAlgorithmMismatch: 'Failure_LockSecret_Hash_Algorithm_Mismatch',
    FailureLockSecretInvalidDuration: 'Failure_LockSecret_Invalid_Duration',
    FailureMetadataValueTooSmall: 'Failure_Metadata_Value_Too_Small',
    FailureMetadataValueTooLarge: 'Failure_Metadata_Value_Too_Large',
    FailureMetadataValueSizeDeltaTooLarge: 'Failure_Metadata_Value_Size_Delta_Too_Large',
    FailureMetadataValueSizeDeltaMismatch: 'Failure_Metadata_Value_Size_Delta_Mismatch',
    FailureMetadataValueChangeIrreversible: 'Failure_Metadata_Value_Change_Irreversible',
    FailureMosaicInvalidDuration: 'Failure_Mosaic_Invalid_Duration',
    FailureMosaicInvalidName: 'Failure_Mosaic_Invalid_Name',
    FailureMosaicNameIdMismatch: 'Failure_Mosaic_Name_Id_Mismatch',
    FailureMosaicExpired: 'Failure_Mosaic_Expired',
    FailureMosaicOwnerConflict: 'Failure_Mosaic_Owner_Conflict',
    FailureMosaicIdMismatch: 'Failure_Mosaic_Id_Mismatch',
    FailureMosaicParentIdConflict: 'Failure_Mosaic_Parent_Id_Conflict',
    FailureMosaicInvalidProperty: 'Failure_Mosaic_Invalid_Property',
    FailureMosaicInvalidFlags: 'Failure_Mosaic_Invalid_Flags',
    FailureMosaicInvalidDivisibility: 'Failure_Mosaic_Invalid_Divisibility',
    FailureMosaicInvalidSupplyChangeAction: 'Failure_Mosaic_Invalid_Supply_Change_Action',
    FailureMosaicInvalidSupplyChangeAmount: 'Failure_Mosaic_Invalid_Supply_Change_Amount',
    FailureMosaicInvalidId: 'Failure_Mosaic_Invalid_Id',
    FailureMosaicModificationDisallowed: 'Failure_Mosaic_Modification_Disallowed',
    FailureMosaicModificationNoChanges: 'Failure_Mosaic_Modification_No_Changes',
    FailureMosaicSupplyImmutable: 'Failure_Mosaic_Supply_Immutable',
    FailureMosaicSupplyNegative: 'Failure_Mosaic_Supply_Negative',
    FailureMosaicSupplyExceeded: 'Failure_Mosaic_Supply_Exceeded',
    FailureMosaicNonTransferable: 'Failure_Mosaic_Non_Transferable',
    FailureMosaicMaxMosaicsExceeded: 'Failure_Mosaic_Max_Mosaics_Exceeded',
    FailureMosaicRequiredPropertyFlagUnset: 'Failure_Mosaic_Required_Property_Flag_Unset',
    FailureMultisigAccountInBothSets: 'Failure_Multisig_Account_In_Both_Sets',
    FailureMultisigMultipleDeletes: 'Failure_Multisig_Multiple_Deletes',
    FailureMultisigRedundantModification: 'Failure_Multisig_Redundant_Modification',
    FailureMultisigUnknownMultisigAccount: 'Failure_Multisig_Unknown_Multisig_Account',
    FailureMultisigNotACosignatory: 'Failure_Multisig_Not_A_Cosignatory',
    FailureMultisigAlreadyACosignatory: 'Failure_Multisig_Already_A_Cosignatory',
    FailureMultisigMinSettingOutOfRange: 'Failure_Multisig_Min_Setting_Out_Of_Range',
    FailureMultisigMinSettingLargerThanNumCosignatories: 'Failure_Multisig_Min_Setting_Larger_Than_Num_Cosignatories',
    FailureMultisigInvalidModificationAction: 'Failure_Multisig_Invalid_Modification_Action',
    FailureMultisigMaxCosignedAccounts: 'Failure_Multisig_Max_Cosigned_Accounts',
    FailureMultisigMaxCosignatories: 'Failure_Multisig_Max_Cosignatories',
    FailureMultisigLoop: 'Failure_Multisig_Loop',
    FailureMultisigMaxMultisigDepth: 'Failure_Multisig_Max_Multisig_Depth',
    FailureMultisigOperationProhibitedByAccount: 'Failure_Multisig_Operation_Prohibited_By_Account',
    FailureNamespaceInvalidDuration: 'Failure_Namespace_Invalid_Duration',
    FailureNamespaceInvalidName: 'Failure_Namespace_Invalid_Name',
    FailureNamespaceNameIdMismatch: 'Failure_Namespace_Name_Id_Mismatch',
    FailureNamespaceExpired: 'Failure_Namespace_Expired',
    FailureNamespaceOwnerConflict: 'Failure_Namespace_Owner_Conflict',
    FailureNamespaceIdMismatch: 'Failure_Namespace_Id_Mismatch',
    FailureNamespaceInvalidRegistrationType: 'Failure_Namespace_Invalid_Registration_Type',
    FailureNamespaceRootNameReserved: 'Failure_Namespace_Root_Name_Reserved',
    FailureNamespaceTooDeep: 'Failure_Namespace_Too_Deep',
    FailureNamespaceUnknownParent: 'Failure_Namespace_Unknown_Parent',
    FailureNamespaceAlreadyExists: 'Failure_Namespace_Already_Exists',
    FailureNamespaceAlreadyActive: 'Failure_Namespace_Already_Active',
    FailureNamespaceEternalAfterNemesisBlock: 'Failure_Namespace_Eternal_After_Nemesis_Block',
    FailureNamespaceMaxChildrenExceeded: 'Failure_Namespace_Max_Children_Exceeded',
    FailureNamespaceAliasInvalidAction: 'Failure_Namespace_Alias_Invalid_Action',
    FailureNamespaceUnknown: 'Failure_Namespace_Unknown',
    FailureNamespaceAliasAlreadyExists: 'Failure_Namespace_Alias_Already_Exists',
    FailureNamespaceUnknownAlias: 'Failure_Namespace_Unknown_Alias',
    FailureNamespaceAliasInconsistentUnlinkType: 'Failure_Namespace_Alias_Inconsistent_Unlink_Type',
    FailureNamespaceAliasInconsistentUnlinkData: 'Failure_Namespace_Alias_Inconsistent_Unlink_Data',
    FailureNamespaceAliasInvalidAddress: 'Failure_Namespace_Alias_Invalid_Address',
    FailureRestrictionAccountInvalidRestrictionFlags: 'Failure_RestrictionAccount_Invalid_Restriction_Flags',
    FailureRestrictionAccountInvalidModificationAction: 'Failure_RestrictionAccount_Invalid_Modification_Action',
    FailureRestrictionAccountInvalidModificationAddress: 'Failure_RestrictionAccount_Invalid_Modification_Address',
    FailureRestrictionAccountModificationOperationTypeIncompatible: 'Failure_RestrictionAccount_Modification_Operation_Type_Incompatible',
    FailureRestrictionAccountRedundantModification: 'Failure_RestrictionAccount_Redundant_Modification',
    FailureRestrictionAccountInvalidModification: 'Failure_RestrictionAccount_Invalid_Modification',
    FailureRestrictionAccountModificationCountExceeded: 'Failure_RestrictionAccount_Modification_Count_Exceeded',
    FailureRestrictionAccountNoModifications: 'Failure_RestrictionAccount_No_Modifications',
    FailureRestrictionAccountValuesCountExceeded: 'Failure_RestrictionAccount_Values_Count_Exceeded',
    FailureRestrictionAccountInvalidValue: 'Failure_RestrictionAccount_Invalid_Value',
    FailureRestrictionAccountAddressInteractionProhibited: 'Failure_RestrictionAccount_Address_Interaction_Prohibited',
    FailureRestrictionAccountMosaicTransferProhibited: 'Failure_RestrictionAccount_Mosaic_Transfer_Prohibited',
    FailureRestrictionAccountOperationTypeProhibited: 'Failure_RestrictionAccount_Operation_Type_Prohibited',
    FailureRestrictionMosaicInvalidRestrictionType: 'Failure_RestrictionMosaic_Invalid_Restriction_Type',
    FailureRestrictionMosaicPreviousValueMismatch: 'Failure_RestrictionMosaic_Previous_Value_Mismatch',
    FailureRestrictionMosaicPreviousValueMustBeZero: 'Failure_RestrictionMosaic_Previous_Value_Must_Be_Zero',
    FailureRestrictionMosaicMaxRestrictionsExceeded: 'Failure_RestrictionMosaic_Max_Restrictions_Exceeded',
    FailureRestrictionMosaicCannotDeleteNonexistentRestriction: 'Failure_RestrictionMosaic_Cannot_Delete_Nonexistent_Restriction',
    FailureRestrictionMosaicUnknownGlobalRestriction: 'Failure_RestrictionMosaic_Unknown_Global_Restriction',
    FailureRestrictionMosaicInvalidGlobalRestriction: 'Failure_RestrictionMosaic_Invalid_Global_Restriction',
    FailureRestrictionMosaicAccountUnauthorized: 'Failure_RestrictionMosaic_Account_Unauthorized',
    FailureTransferMessageTooLarge: 'Failure_Transfer_Message_Too_Large',
    FailureTransferOutOfOrderMosaics: 'Failure_Transfer_Out_Of_Order_Mosaics',
    FailureChainUnlinked: 'Failure_Chain_Unlinked',
    FailureChainBlockNotHit: 'Failure_Chain_Block_Not_Hit',
    FailureChainBlockInconsistentStateHash: 'Failure_Chain_Block_Inconsistent_State_Hash',
    FailureChainBlockInconsistentReceiptsHash: 'Failure_Chain_Block_Inconsistent_Receipts_Hash',
    FailureChainBlockInvalidVrfProof: 'Failure_Chain_Block_Invalid_Vrf_Proof',
    FailureChainBlockUnknownSigner: 'Failure_Chain_Block_Unknown_Signer',
    FailureChainUnconfirmedCacheTooFull: 'Failure_Chain_Unconfirmed_Cache_Too_Full',
    FailureConsumerEmptyInput: 'Failure_Consumer_Empty_Input',
    FailureConsumerBlockTransactionsHashMismatch: 'Failure_Consumer_Block_Transactions_Hash_Mismatch',
    NeutralConsumerHashInRecencyCache: 'Neutral_Consumer_Hash_In_Recency_Cache',
    FailureConsumerRemoteChainTooManyBlocks: 'Failure_Consumer_Remote_Chain_Too_Many_Blocks',
    FailureConsumerRemoteChainImproperLink: 'Failure_Consumer_Remote_Chain_Improper_Link',
    FailureConsumerRemoteChainDuplicateTransactions: 'Failure_Consumer_Remote_Chain_Duplicate_Transactions',
    FailureConsumerRemoteChainUnlinked: 'Failure_Consumer_Remote_Chain_Unlinked',
    FailureConsumerRemoteChainDifficultiesMismatch: 'Failure_Consumer_Remote_Chain_Difficulties_Mismatch',
    FailureConsumerRemoteChainScoreNotBetter: 'Failure_Consumer_Remote_Chain_Score_Not_Better',
    FailureConsumerRemoteChainTooFarBehind: 'Failure_Consumer_Remote_Chain_Too_Far_Behind',
    FailureConsumerRemoteChainTooFarInFuture: 'Failure_Consumer_Remote_Chain_Too_Far_In_Future',
    FailureConsumerBatchSignatureNotVerifiable: 'Failure_Consumer_Batch_Signature_Not_Verifiable',
    FailureConsumerRemoteChainImproperImportanceLink: 'Failure_Consumer_Remote_Chain_Improper_Importance_Link',
    FailureExtensionPartialTransactionCachePrune: 'Failure_Extension_Partial_Transaction_Cache_Prune',
    FailureExtensionPartialTransactionDependencyRemoved: 'Failure_Extension_Partial_Transaction_Dependency_Removed',
    FailureExtensionReadRateLimitExceeded: 'Failure_Extension_Read_Rate_Limit_Exceeded'
};
/**
 * Type of transaction: * 0x414C (16716 decimal) - AccountKeyLinkTransaction. * 0x4243 (16963 decimal) - VrfKeyLinkTransaction. * 0x4143 (16707 decimal) - VotingKeyLinkTransaction. * 0x424C (16972 decimal) - NodeKeyLinkTransaction. * 0x4141 (16705 decimal) - AggregateCompleteTransaction. * 0x4241 (16961 decimal) - AggregateBondedTransaction. * 0x414D (16717 decimal) - MosaicDefinitionTransaction. * 0x424D (16973 decimal) - MosaicSupplyChangeTransaction. * 0x434D (17229 decimal) - MosaicSupplyRevocationTransaction. * 0x414E (16718 decimal) - NamespaceRegistrationTransaction. * 0x424E (16974 decimal) - AddressAliasTransaction. * 0x434E (17230 decimal) - MosaicAliasTransaction. * 0x4144 (16708 decimal) - AccountMetadataTransaction. * 0x4244 (16964 decimal) - MosaicMetadataTransaction. * 0x4344 (17220 decimal) - NamespaceMetadataTransaction. * 0x4155 (16725 decimal) - MultisigAccountModificationTransaction. * 0x4148 (16712 decimal) - HashLockTransaction. * 0x4152 (16722 decimal) - SecretLockTransaction. * 0x4252 (16978 decimal) - SecretProofTransaction. * 0x4150 (16720 decimal) - AccountAddressRestrictionTransaction. * 0x4250 (16976 decimal) - AccountMosaicRestrictionTransaction. * 0x4350 (17232 decimal) - AccountOperationRestrictionTransaction. * 0x4151 (16721 decimal) - MosaicGlobalRestrictionTransaction. * 0x4251 (16977 decimal) - MosaicAddressRestrictionTransaction. * 0x4154 (16724 decimal) - TransferTransaction.
 * @export
 * @enum {string}
 */
exports.TransactionTypeEnum = {
    NUMBER_16716: 16716,
    NUMBER_16963: 16963,
    NUMBER_16707: 16707,
    NUMBER_16972: 16972,
    NUMBER_16705: 16705,
    NUMBER_16961: 16961,
    NUMBER_16717: 16717,
    NUMBER_16973: 16973,
    NUMBER_17229: 17229,
    NUMBER_16718: 16718,
    NUMBER_16974: 16974,
    NUMBER_17230: 17230,
    NUMBER_16708: 16708,
    NUMBER_16964: 16964,
    NUMBER_17220: 17220,
    NUMBER_16725: 16725,
    NUMBER_16712: 16712,
    NUMBER_16722: 16722,
    NUMBER_16978: 16978,
    NUMBER_16720: 16720,
    NUMBER_16976: 16976,
    NUMBER_17232: 17232,
    NUMBER_16721: 16721,
    NUMBER_16977: 16977,
    NUMBER_16724: 16724
};
/**
 * AccountRoutesApi - axios parameter creator
 * @export
 */
var AccountRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the account information.
         * @summary Get account information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfo: function (accountId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'accountId' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountInfo', 'accountId', accountId);
                    localVarPath = "/accounts/{accountId}"
                        .replace("{".concat("accountId", "}"), encodeURIComponent(String(accountId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the account merkle information.
         * @summary Get account merkle information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfoMerkle: function (accountId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'accountId' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountInfoMerkle', 'accountId', accountId);
                    localVarPath = "/accounts/{accountId}/merkle"
                        .replace("{".concat("accountId", "}"), encodeURIComponent(String(accountId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the account information for an array of accounts.
         * @summary Get accounts information
         * @param {AccountIds} [accountIds]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsInfo: function (accountIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/accounts";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(accountIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of accounts.
         * @summary Search accounts
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {AccountOrderByEnum} [orderBy] Sort responses by the property set. If &#x60;&#x60;balance&#x60;&#x60; option is selected, the request must define the &#x60;&#x60;mosaicId&#x60;&#x60; filter.
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccounts: function (pageSize, pageNumber, offset, order, orderBy, mosaicId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/accounts";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    if (orderBy !== undefined) {
                        localVarQueryParameter['orderBy'] = orderBy;
                    }
                    if (mosaicId !== undefined) {
                        localVarQueryParameter['mosaicId'] = mosaicId;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.AccountRoutesApiAxiosParamCreator = AccountRoutesApiAxiosParamCreator;
/**
 * AccountRoutesApi - functional programming interface
 * @export
 */
var AccountRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.AccountRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the account information.
         * @summary Get account information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfo: function (accountId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountInfo(accountId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the account merkle information.
         * @summary Get account merkle information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfoMerkle: function (accountId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountInfoMerkle(accountId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the account information for an array of accounts.
         * @summary Get accounts information
         * @param {AccountIds} [accountIds]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsInfo: function (accountIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountsInfo(accountIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of accounts.
         * @summary Search accounts
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {AccountOrderByEnum} [orderBy] Sort responses by the property set. If &#x60;&#x60;balance&#x60;&#x60; option is selected, the request must define the &#x60;&#x60;mosaicId&#x60;&#x60; filter.
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccounts: function (pageSize, pageNumber, offset, order, orderBy, mosaicId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchAccounts(pageSize, pageNumber, offset, order, orderBy, mosaicId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.AccountRoutesApiFp = AccountRoutesApiFp;
/**
 * AccountRoutesApi - factory interface
 * @export
 */
var AccountRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.AccountRoutesApiFp)(configuration);
    return {
        /**
         * Returns the account information.
         * @summary Get account information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfo: function (accountId, options) {
            return localVarFp.getAccountInfo(accountId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the account merkle information.
         * @summary Get account merkle information
         * @param {string} accountId Account public key or address encoded using a 32-character set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountInfoMerkle: function (accountId, options) {
            return localVarFp.getAccountInfoMerkle(accountId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the account information for an array of accounts.
         * @summary Get accounts information
         * @param {AccountIds} [accountIds]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsInfo: function (accountIds, options) {
            return localVarFp.getAccountsInfo(accountIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of accounts.
         * @summary Search accounts
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {AccountOrderByEnum} [orderBy] Sort responses by the property set. If &#x60;&#x60;balance&#x60;&#x60; option is selected, the request must define the &#x60;&#x60;mosaicId&#x60;&#x60; filter.
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccounts: function (pageSize, pageNumber, offset, order, orderBy, mosaicId, options) {
            return localVarFp.searchAccounts(pageSize, pageNumber, offset, order, orderBy, mosaicId, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.AccountRoutesApiFactory = AccountRoutesApiFactory;
/**
 * AccountRoutesApi - object-oriented interface
 * @export
 * @class AccountRoutesApi
 * @extends {BaseAPI}
 */
var AccountRoutesApi = /** @class */ (function (_super) {
    __extends(AccountRoutesApi, _super);
    function AccountRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the account information.
     * @summary Get account information
     * @param {AccountRoutesApiGetAccountInfoRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountRoutesApi
     */
    AccountRoutesApi.prototype.getAccountInfo = function (requestParameters, options) {
        var _this = this;
        return (0, exports.AccountRoutesApiFp)(this.configuration).getAccountInfo(requestParameters.accountId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the account merkle information.
     * @summary Get account merkle information
     * @param {AccountRoutesApiGetAccountInfoMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountRoutesApi
     */
    AccountRoutesApi.prototype.getAccountInfoMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.AccountRoutesApiFp)(this.configuration).getAccountInfoMerkle(requestParameters.accountId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the account information for an array of accounts.
     * @summary Get accounts information
     * @param {AccountRoutesApiGetAccountsInfoRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountRoutesApi
     */
    AccountRoutesApi.prototype.getAccountsInfo = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.AccountRoutesApiFp)(this.configuration).getAccountsInfo(requestParameters.accountIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of accounts.
     * @summary Search accounts
     * @param {AccountRoutesApiSearchAccountsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountRoutesApi
     */
    AccountRoutesApi.prototype.searchAccounts = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.AccountRoutesApiFp)(this.configuration).searchAccounts(requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, requestParameters.orderBy, requestParameters.mosaicId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return AccountRoutesApi;
}(base_1.BaseAPI));
exports.AccountRoutesApi = AccountRoutesApi;
/**
 * BlockRoutesApi - axios parameter creator
 * @export
 */
var BlockRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets a block from the chain that has the given height.
         * @summary Get block information
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getBlockByHeight: function (height, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'height' is not null or undefined
                    (0, common_1.assertParamExists)('getBlockByHeight', 'height', height);
                    localVarPath = "/blocks/{height}"
                        .replace("{".concat("height", "}"), encodeURIComponent(String(height)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the merkle path for a receipt statement or resolution linked to a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.receiptsHash) to verify if the statement was linked with the block.
         * @summary Get the merkle path for a given a receipt statement hash and block
         * @param {string} height Block height.
         * @param {string} hash Receipt hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleReceipts: function (height, hash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'height' is not null or undefined
                    (0, common_1.assertParamExists)('getMerkleReceipts', 'height', height);
                    // verify required parameter 'hash' is not null or undefined
                    (0, common_1.assertParamExists)('getMerkleReceipts', 'hash', hash);
                    localVarPath = "/blocks/{height}/statements/{hash}/merkle"
                        .replace("{".concat("height", "}"), encodeURIComponent(String(height)))
                        .replace("{".concat("hash", "}"), encodeURIComponent(String(hash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the merkle path for a transaction included in a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.transactionsHash) to verify if the transaction was included in the block.
         * @summary Get the merkle path for a given a transaction and block
         * @param {string} height Block height.
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleTransaction: function (height, hash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'height' is not null or undefined
                    (0, common_1.assertParamExists)('getMerkleTransaction', 'height', height);
                    // verify required parameter 'hash' is not null or undefined
                    (0, common_1.assertParamExists)('getMerkleTransaction', 'hash', hash);
                    localVarPath = "/blocks/{height}/transactions/{hash}/merkle"
                        .replace("{".concat("height", "}"), encodeURIComponent(String(height)))
                        .replace("{".concat("hash", "}"), encodeURIComponent(String(hash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of bocks.
         * @summary Search blocks
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [beneficiaryAddress] Filter by beneficiary address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {BlockOrderByEnum} [orderBy] Sort responses by the property set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchBlocks: function (signerPublicKey, beneficiaryAddress, pageSize, pageNumber, offset, order, orderBy, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/blocks";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (signerPublicKey !== undefined) {
                        localVarQueryParameter['signerPublicKey'] = signerPublicKey;
                    }
                    if (beneficiaryAddress !== undefined) {
                        localVarQueryParameter['beneficiaryAddress'] = beneficiaryAddress;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    if (orderBy !== undefined) {
                        localVarQueryParameter['orderBy'] = orderBy;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.BlockRoutesApiAxiosParamCreator = BlockRoutesApiAxiosParamCreator;
/**
 * BlockRoutesApi - functional programming interface
 * @export
 */
var BlockRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.BlockRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets a block from the chain that has the given height.
         * @summary Get block information
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getBlockByHeight: function (height, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getBlockByHeight(height, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the merkle path for a receipt statement or resolution linked to a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.receiptsHash) to verify if the statement was linked with the block.
         * @summary Get the merkle path for a given a receipt statement hash and block
         * @param {string} height Block height.
         * @param {string} hash Receipt hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleReceipts: function (height, hash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMerkleReceipts(height, hash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the merkle path for a transaction included in a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.transactionsHash) to verify if the transaction was included in the block.
         * @summary Get the merkle path for a given a transaction and block
         * @param {string} height Block height.
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleTransaction: function (height, hash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMerkleTransaction(height, hash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of bocks.
         * @summary Search blocks
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [beneficiaryAddress] Filter by beneficiary address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {BlockOrderByEnum} [orderBy] Sort responses by the property set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchBlocks: function (signerPublicKey, beneficiaryAddress, pageSize, pageNumber, offset, order, orderBy, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchBlocks(signerPublicKey, beneficiaryAddress, pageSize, pageNumber, offset, order, orderBy, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.BlockRoutesApiFp = BlockRoutesApiFp;
/**
 * BlockRoutesApi - factory interface
 * @export
 */
var BlockRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.BlockRoutesApiFp)(configuration);
    return {
        /**
         * Gets a block from the chain that has the given height.
         * @summary Get block information
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getBlockByHeight: function (height, options) {
            return localVarFp.getBlockByHeight(height, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the merkle path for a receipt statement or resolution linked to a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.receiptsHash) to verify if the statement was linked with the block.
         * @summary Get the merkle path for a given a receipt statement hash and block
         * @param {string} height Block height.
         * @param {string} hash Receipt hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleReceipts: function (height, hash, options) {
            return localVarFp.getMerkleReceipts(height, hash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the merkle path for a transaction included in a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.transactionsHash) to verify if the transaction was included in the block.
         * @summary Get the merkle path for a given a transaction and block
         * @param {string} height Block height.
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMerkleTransaction: function (height, hash, options) {
            return localVarFp.getMerkleTransaction(height, hash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of bocks.
         * @summary Search blocks
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [beneficiaryAddress] Filter by beneficiary address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {BlockOrderByEnum} [orderBy] Sort responses by the property set.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchBlocks: function (signerPublicKey, beneficiaryAddress, pageSize, pageNumber, offset, order, orderBy, options) {
            return localVarFp.searchBlocks(signerPublicKey, beneficiaryAddress, pageSize, pageNumber, offset, order, orderBy, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.BlockRoutesApiFactory = BlockRoutesApiFactory;
/**
 * BlockRoutesApi - object-oriented interface
 * @export
 * @class BlockRoutesApi
 * @extends {BaseAPI}
 */
var BlockRoutesApi = /** @class */ (function (_super) {
    __extends(BlockRoutesApi, _super);
    function BlockRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets a block from the chain that has the given height.
     * @summary Get block information
     * @param {BlockRoutesApiGetBlockByHeightRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BlockRoutesApi
     */
    BlockRoutesApi.prototype.getBlockByHeight = function (requestParameters, options) {
        var _this = this;
        return (0, exports.BlockRoutesApiFp)(this.configuration).getBlockByHeight(requestParameters.height, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the merkle path for a receipt statement or resolution linked to a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.receiptsHash) to verify if the statement was linked with the block.
     * @summary Get the merkle path for a given a receipt statement hash and block
     * @param {BlockRoutesApiGetMerkleReceiptsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BlockRoutesApi
     */
    BlockRoutesApi.prototype.getMerkleReceipts = function (requestParameters, options) {
        var _this = this;
        return (0, exports.BlockRoutesApiFp)(this.configuration).getMerkleReceipts(requestParameters.height, requestParameters.hash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the merkle path for a transaction included in a block. The merkle path is the minimum number of nodes needed to calculate the merkle root.  Steps to calculate the merkle root: 1. proofHash = hash (leaf). 2. Concatenate proofHash with the first unprocessed item from the merklePath list as follows: * a) If item.position == left -> proofHash = sha_256(item.hash + proofHash). * b) If item.position == right -> proofHash = sha_256(proofHash+ item.hash). 3. Repeat 2. for every item in the merklePath list. 4. Compare if the calculated proofHash equals the one recorded in the block header (block.transactionsHash) to verify if the transaction was included in the block.
     * @summary Get the merkle path for a given a transaction and block
     * @param {BlockRoutesApiGetMerkleTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BlockRoutesApi
     */
    BlockRoutesApi.prototype.getMerkleTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.BlockRoutesApiFp)(this.configuration).getMerkleTransaction(requestParameters.height, requestParameters.hash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of bocks.
     * @summary Search blocks
     * @param {BlockRoutesApiSearchBlocksRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BlockRoutesApi
     */
    BlockRoutesApi.prototype.searchBlocks = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.BlockRoutesApiFp)(this.configuration).searchBlocks(requestParameters.signerPublicKey, requestParameters.beneficiaryAddress, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, requestParameters.orderBy, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return BlockRoutesApi;
}(base_1.BaseAPI));
exports.BlockRoutesApi = BlockRoutesApi;
/**
 * ChainRoutesApi - axios parameter creator
 * @export
 */
var ChainRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the current information of the blockchain.  The higher the score, the better the chain. During synchronization, nodes try to get the best blockchain in the network.  The score for a block is derived from its difficulty and the time (in seconds) that has elapsed since the last block:      block score = difficulty − time elapsed since last block
         * @summary Get the current information of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChainInfo: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/chain/info";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.ChainRoutesApiAxiosParamCreator = ChainRoutesApiAxiosParamCreator;
/**
 * ChainRoutesApi - functional programming interface
 * @export
 */
var ChainRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.ChainRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the current information of the blockchain.  The higher the score, the better the chain. During synchronization, nodes try to get the best blockchain in the network.  The score for a block is derived from its difficulty and the time (in seconds) that has elapsed since the last block:      block score = difficulty − time elapsed since last block
         * @summary Get the current information of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChainInfo: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getChainInfo(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.ChainRoutesApiFp = ChainRoutesApiFp;
/**
 * ChainRoutesApi - factory interface
 * @export
 */
var ChainRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.ChainRoutesApiFp)(configuration);
    return {
        /**
         * Returns the current information of the blockchain.  The higher the score, the better the chain. During synchronization, nodes try to get the best blockchain in the network.  The score for a block is derived from its difficulty and the time (in seconds) that has elapsed since the last block:      block score = difficulty − time elapsed since last block
         * @summary Get the current information of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChainInfo: function (options) {
            return localVarFp.getChainInfo(options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.ChainRoutesApiFactory = ChainRoutesApiFactory;
/**
 * ChainRoutesApi - object-oriented interface
 * @export
 * @class ChainRoutesApi
 * @extends {BaseAPI}
 */
var ChainRoutesApi = /** @class */ (function (_super) {
    __extends(ChainRoutesApi, _super);
    function ChainRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the current information of the blockchain.  The higher the score, the better the chain. During synchronization, nodes try to get the best blockchain in the network.  The score for a block is derived from its difficulty and the time (in seconds) that has elapsed since the last block:      block score = difficulty − time elapsed since last block
     * @summary Get the current information of the chain
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChainRoutesApi
     */
    ChainRoutesApi.prototype.getChainInfo = function (options) {
        var _this = this;
        return (0, exports.ChainRoutesApiFp)(this.configuration).getChainInfo(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return ChainRoutesApi;
}(base_1.BaseAPI));
exports.ChainRoutesApi = ChainRoutesApi;
/**
 * FinalizationRoutesApi - axios parameter creator
 * @export
 */
var FinalizationRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets finalization proof for the greatest height associated with the given epoch.
         * @summary Get finalization proof
         * @param {number} epoch Finalization epoch.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtEpoch: function (epoch, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'epoch' is not null or undefined
                    (0, common_1.assertParamExists)('getFinalizationProofAtEpoch', 'epoch', epoch);
                    localVarPath = "/finalization/proof/epoch/{epoch}"
                        .replace("{".concat("epoch", "}"), encodeURIComponent(String(epoch)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets finalization proof at the given height.
         * @summary Get finalization proof
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtHeight: function (height, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'height' is not null or undefined
                    (0, common_1.assertParamExists)('getFinalizationProofAtHeight', 'height', height);
                    localVarPath = "/finalization/proof/height/{height}"
                        .replace("{".concat("height", "}"), encodeURIComponent(String(height)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.FinalizationRoutesApiAxiosParamCreator = FinalizationRoutesApiAxiosParamCreator;
/**
 * FinalizationRoutesApi - functional programming interface
 * @export
 */
var FinalizationRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.FinalizationRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets finalization proof for the greatest height associated with the given epoch.
         * @summary Get finalization proof
         * @param {number} epoch Finalization epoch.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtEpoch: function (epoch, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getFinalizationProofAtEpoch(epoch, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets finalization proof at the given height.
         * @summary Get finalization proof
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtHeight: function (height, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getFinalizationProofAtHeight(height, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.FinalizationRoutesApiFp = FinalizationRoutesApiFp;
/**
 * FinalizationRoutesApi - factory interface
 * @export
 */
var FinalizationRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.FinalizationRoutesApiFp)(configuration);
    return {
        /**
         * Gets finalization proof for the greatest height associated with the given epoch.
         * @summary Get finalization proof
         * @param {number} epoch Finalization epoch.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtEpoch: function (epoch, options) {
            return localVarFp.getFinalizationProofAtEpoch(epoch, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets finalization proof at the given height.
         * @summary Get finalization proof
         * @param {string} height Block height.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFinalizationProofAtHeight: function (height, options) {
            return localVarFp.getFinalizationProofAtHeight(height, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.FinalizationRoutesApiFactory = FinalizationRoutesApiFactory;
/**
 * FinalizationRoutesApi - object-oriented interface
 * @export
 * @class FinalizationRoutesApi
 * @extends {BaseAPI}
 */
var FinalizationRoutesApi = /** @class */ (function (_super) {
    __extends(FinalizationRoutesApi, _super);
    function FinalizationRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets finalization proof for the greatest height associated with the given epoch.
     * @summary Get finalization proof
     * @param {FinalizationRoutesApiGetFinalizationProofAtEpochRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FinalizationRoutesApi
     */
    FinalizationRoutesApi.prototype.getFinalizationProofAtEpoch = function (requestParameters, options) {
        var _this = this;
        return (0, exports.FinalizationRoutesApiFp)(this.configuration).getFinalizationProofAtEpoch(requestParameters.epoch, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets finalization proof at the given height.
     * @summary Get finalization proof
     * @param {FinalizationRoutesApiGetFinalizationProofAtHeightRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FinalizationRoutesApi
     */
    FinalizationRoutesApi.prototype.getFinalizationProofAtHeight = function (requestParameters, options) {
        var _this = this;
        return (0, exports.FinalizationRoutesApiFp)(this.configuration).getFinalizationProofAtHeight(requestParameters.height, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return FinalizationRoutesApi;
}(base_1.BaseAPI));
exports.FinalizationRoutesApi = FinalizationRoutesApi;
/**
 * HashLockRoutesApi - axios parameter creator
 * @export
 */
var HashLockRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets the hash lock for a given hash.
         * @summary Get hash lock information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLock: function (hash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'hash' is not null or undefined
                    (0, common_1.assertParamExists)('getHashLock', 'hash', hash);
                    localVarPath = "/lock/hash/{hash}"
                        .replace("{".concat("hash", "}"), encodeURIComponent(String(hash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the hash lock merkle for a given hash.
         * @summary Get hash lock merkle information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLockMerkle: function (hash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'hash' is not null or undefined
                    (0, common_1.assertParamExists)('getHashLockMerkle', 'hash', hash);
                    localVarPath = "/lock/hash/{hash}/merkle"
                        .replace("{".concat("hash", "}"), encodeURIComponent(String(hash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of hash locks.
         * @summary Search hash lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchHashLock: function (address, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/lock/hash";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.HashLockRoutesApiAxiosParamCreator = HashLockRoutesApiAxiosParamCreator;
/**
 * HashLockRoutesApi - functional programming interface
 * @export
 */
var HashLockRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.HashLockRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets the hash lock for a given hash.
         * @summary Get hash lock information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLock: function (hash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getHashLock(hash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the hash lock merkle for a given hash.
         * @summary Get hash lock merkle information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLockMerkle: function (hash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getHashLockMerkle(hash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of hash locks.
         * @summary Search hash lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchHashLock: function (address, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchHashLock(address, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.HashLockRoutesApiFp = HashLockRoutesApiFp;
/**
 * HashLockRoutesApi - factory interface
 * @export
 */
var HashLockRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.HashLockRoutesApiFp)(configuration);
    return {
        /**
         * Gets the hash lock for a given hash.
         * @summary Get hash lock information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLock: function (hash, options) {
            return localVarFp.getHashLock(hash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the hash lock merkle for a given hash.
         * @summary Get hash lock merkle information
         * @param {string} hash Filter by hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getHashLockMerkle: function (hash, options) {
            return localVarFp.getHashLockMerkle(hash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of hash locks.
         * @summary Search hash lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchHashLock: function (address, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchHashLock(address, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.HashLockRoutesApiFactory = HashLockRoutesApiFactory;
/**
 * HashLockRoutesApi - object-oriented interface
 * @export
 * @class HashLockRoutesApi
 * @extends {BaseAPI}
 */
var HashLockRoutesApi = /** @class */ (function (_super) {
    __extends(HashLockRoutesApi, _super);
    function HashLockRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets the hash lock for a given hash.
     * @summary Get hash lock information
     * @param {HashLockRoutesApiGetHashLockRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof HashLockRoutesApi
     */
    HashLockRoutesApi.prototype.getHashLock = function (requestParameters, options) {
        var _this = this;
        return (0, exports.HashLockRoutesApiFp)(this.configuration).getHashLock(requestParameters.hash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the hash lock merkle for a given hash.
     * @summary Get hash lock merkle information
     * @param {HashLockRoutesApiGetHashLockMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof HashLockRoutesApi
     */
    HashLockRoutesApi.prototype.getHashLockMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.HashLockRoutesApiFp)(this.configuration).getHashLockMerkle(requestParameters.hash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of hash locks.
     * @summary Search hash lock entries
     * @param {HashLockRoutesApiSearchHashLockRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof HashLockRoutesApi
     */
    HashLockRoutesApi.prototype.searchHashLock = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.HashLockRoutesApiFp)(this.configuration).searchHashLock(requestParameters.address, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return HashLockRoutesApi;
}(base_1.BaseAPI));
exports.HashLockRoutesApi = HashLockRoutesApi;
/**
 * MetadataRoutesApi - axios parameter creator
 * @export
 */
var MetadataRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets the metadata for a given composite hash.
         * @summary Get metadata information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadata: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getMetadata', 'compositeHash', compositeHash);
                    localVarPath = "/metadata/{compositeHash}"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the metadata merkle for a given composite hash.
         * @summary Get metadata merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadataMerkle: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getMetadataMerkle', 'compositeHash', compositeHash);
                    localVarPath = "/metadata/{compositeHash}/merkle"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of metadata.
         * @summary Search metadata entries
         * @param {string} [sourceAddress] Filter by address sending the metadata entry.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [scopedMetadataKey] Filter by metadata key.
         * @param {string} [targetId] Filter by namespace or mosaic id.
         * @param {MetadataTypeEnum} [metadataType] Filter by metadata type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMetadataEntries: function (sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/metadata";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (sourceAddress !== undefined) {
                        localVarQueryParameter['sourceAddress'] = sourceAddress;
                    }
                    if (targetAddress !== undefined) {
                        localVarQueryParameter['targetAddress'] = targetAddress;
                    }
                    if (scopedMetadataKey !== undefined) {
                        localVarQueryParameter['scopedMetadataKey'] = scopedMetadataKey;
                    }
                    if (targetId !== undefined) {
                        localVarQueryParameter['targetId'] = targetId;
                    }
                    if (metadataType !== undefined) {
                        localVarQueryParameter['metadataType'] = metadataType;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.MetadataRoutesApiAxiosParamCreator = MetadataRoutesApiAxiosParamCreator;
/**
 * MetadataRoutesApi - functional programming interface
 * @export
 */
var MetadataRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.MetadataRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets the metadata for a given composite hash.
         * @summary Get metadata information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadata: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMetadata(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the metadata merkle for a given composite hash.
         * @summary Get metadata merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadataMerkle: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMetadataMerkle(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of metadata.
         * @summary Search metadata entries
         * @param {string} [sourceAddress] Filter by address sending the metadata entry.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [scopedMetadataKey] Filter by metadata key.
         * @param {string} [targetId] Filter by namespace or mosaic id.
         * @param {MetadataTypeEnum} [metadataType] Filter by metadata type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMetadataEntries: function (sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchMetadataEntries(sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.MetadataRoutesApiFp = MetadataRoutesApiFp;
/**
 * MetadataRoutesApi - factory interface
 * @export
 */
var MetadataRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.MetadataRoutesApiFp)(configuration);
    return {
        /**
         * Gets the metadata for a given composite hash.
         * @summary Get metadata information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadata: function (compositeHash, options) {
            return localVarFp.getMetadata(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the metadata merkle for a given composite hash.
         * @summary Get metadata merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMetadataMerkle: function (compositeHash, options) {
            return localVarFp.getMetadataMerkle(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of metadata.
         * @summary Search metadata entries
         * @param {string} [sourceAddress] Filter by address sending the metadata entry.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [scopedMetadataKey] Filter by metadata key.
         * @param {string} [targetId] Filter by namespace or mosaic id.
         * @param {MetadataTypeEnum} [metadataType] Filter by metadata type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMetadataEntries: function (sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchMetadataEntries(sourceAddress, targetAddress, scopedMetadataKey, targetId, metadataType, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.MetadataRoutesApiFactory = MetadataRoutesApiFactory;
/**
 * MetadataRoutesApi - object-oriented interface
 * @export
 * @class MetadataRoutesApi
 * @extends {BaseAPI}
 */
var MetadataRoutesApi = /** @class */ (function (_super) {
    __extends(MetadataRoutesApi, _super);
    function MetadataRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets the metadata for a given composite hash.
     * @summary Get metadata information
     * @param {MetadataRoutesApiGetMetadataRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MetadataRoutesApi
     */
    MetadataRoutesApi.prototype.getMetadata = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MetadataRoutesApiFp)(this.configuration).getMetadata(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the metadata merkle for a given composite hash.
     * @summary Get metadata merkle information
     * @param {MetadataRoutesApiGetMetadataMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MetadataRoutesApi
     */
    MetadataRoutesApi.prototype.getMetadataMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MetadataRoutesApiFp)(this.configuration).getMetadataMerkle(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of metadata.
     * @summary Search metadata entries
     * @param {MetadataRoutesApiSearchMetadataEntriesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MetadataRoutesApi
     */
    MetadataRoutesApi.prototype.searchMetadataEntries = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.MetadataRoutesApiFp)(this.configuration).searchMetadataEntries(requestParameters.sourceAddress, requestParameters.targetAddress, requestParameters.scopedMetadataKey, requestParameters.targetId, requestParameters.metadataType, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return MetadataRoutesApi;
}(base_1.BaseAPI));
exports.MetadataRoutesApi = MetadataRoutesApi;
/**
 * MosaicRoutesApi - axios parameter creator
 * @export
 */
var MosaicRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets the mosaic definition for a given mosaic identifier.
         * @summary Get mosaic information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaic: function (mosaicId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'mosaicId' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaic', 'mosaicId', mosaicId);
                    localVarPath = "/mosaics/{mosaicId}"
                        .replace("{".concat("mosaicId", "}"), encodeURIComponent(String(mosaicId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the mosaic definition merkle for a given mosaic identifier.
         * @summary Get mosaic merkle information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicMerkle: function (mosaicId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'mosaicId' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaicMerkle', 'mosaicId', mosaicId);
                    localVarPath = "/mosaics/{mosaicId}/merkle"
                        .replace("{".concat("mosaicId", "}"), encodeURIComponent(String(mosaicId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of mosaic definition.
         * @summary Get mosaics information for an array of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaics: function (mosaicIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'mosaicIds' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaics', 'mosaicIds', mosaicIds);
                    localVarPath = "/mosaics";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(mosaicIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of mosaics.
         * @summary Search mosaics
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaics: function (ownerAddress, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/mosaics";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (ownerAddress !== undefined) {
                        localVarQueryParameter['ownerAddress'] = ownerAddress;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.MosaicRoutesApiAxiosParamCreator = MosaicRoutesApiAxiosParamCreator;
/**
 * MosaicRoutesApi - functional programming interface
 * @export
 */
var MosaicRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.MosaicRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets the mosaic definition for a given mosaic identifier.
         * @summary Get mosaic information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaic: function (mosaicId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaic(mosaicId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the mosaic definition merkle for a given mosaic identifier.
         * @summary Get mosaic merkle information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicMerkle: function (mosaicId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaicMerkle(mosaicId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of mosaic definition.
         * @summary Get mosaics information for an array of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaics: function (mosaicIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaics(mosaicIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of mosaics.
         * @summary Search mosaics
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaics: function (ownerAddress, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchMosaics(ownerAddress, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.MosaicRoutesApiFp = MosaicRoutesApiFp;
/**
 * MosaicRoutesApi - factory interface
 * @export
 */
var MosaicRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.MosaicRoutesApiFp)(configuration);
    return {
        /**
         * Gets the mosaic definition for a given mosaic identifier.
         * @summary Get mosaic information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaic: function (mosaicId, options) {
            return localVarFp.getMosaic(mosaicId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the mosaic definition merkle for a given mosaic identifier.
         * @summary Get mosaic merkle information
         * @param {string} mosaicId Mosaic identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicMerkle: function (mosaicId, options) {
            return localVarFp.getMosaicMerkle(mosaicId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of mosaic definition.
         * @summary Get mosaics information for an array of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaics: function (mosaicIds, options) {
            return localVarFp.getMosaics(mosaicIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of mosaics.
         * @summary Search mosaics
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaics: function (ownerAddress, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchMosaics(ownerAddress, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.MosaicRoutesApiFactory = MosaicRoutesApiFactory;
/**
 * MosaicRoutesApi - object-oriented interface
 * @export
 * @class MosaicRoutesApi
 * @extends {BaseAPI}
 */
var MosaicRoutesApi = /** @class */ (function (_super) {
    __extends(MosaicRoutesApi, _super);
    function MosaicRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets the mosaic definition for a given mosaic identifier.
     * @summary Get mosaic information
     * @param {MosaicRoutesApiGetMosaicRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MosaicRoutesApi
     */
    MosaicRoutesApi.prototype.getMosaic = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MosaicRoutesApiFp)(this.configuration).getMosaic(requestParameters.mosaicId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the mosaic definition merkle for a given mosaic identifier.
     * @summary Get mosaic merkle information
     * @param {MosaicRoutesApiGetMosaicMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MosaicRoutesApi
     */
    MosaicRoutesApi.prototype.getMosaicMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MosaicRoutesApiFp)(this.configuration).getMosaicMerkle(requestParameters.mosaicId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of mosaic definition.
     * @summary Get mosaics information for an array of mosaics
     * @param {MosaicRoutesApiGetMosaicsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MosaicRoutesApi
     */
    MosaicRoutesApi.prototype.getMosaics = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MosaicRoutesApiFp)(this.configuration).getMosaics(requestParameters.mosaicIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of mosaics.
     * @summary Search mosaics
     * @param {MosaicRoutesApiSearchMosaicsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MosaicRoutesApi
     */
    MosaicRoutesApi.prototype.searchMosaics = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.MosaicRoutesApiFp)(this.configuration).searchMosaics(requestParameters.ownerAddress, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return MosaicRoutesApi;
}(base_1.BaseAPI));
exports.MosaicRoutesApi = MosaicRoutesApi;
/**
 * MultisigRoutesApi - axios parameter creator
 * @export
 */
var MultisigRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the multisig account information.
         * @summary Get multisig account information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisig: function (address, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'address' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountMultisig', 'address', address);
                    localVarPath = "/account/{address}/multisig"
                        .replace("{".concat("address", "}"), encodeURIComponent(String(address)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the multisig account graph.
         * @summary Get multisig account graph information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigGraph: function (address, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'address' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountMultisigGraph', 'address', address);
                    localVarPath = "/account/{address}/multisig/graph"
                        .replace("{".concat("address", "}"), encodeURIComponent(String(address)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the multisig account merkle information.
         * @summary Get multisig account merkle information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigMerkle: function (address, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'address' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountMultisigMerkle', 'address', address);
                    localVarPath = "/account/{address}/multisig/merkle"
                        .replace("{".concat("address", "}"), encodeURIComponent(String(address)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.MultisigRoutesApiAxiosParamCreator = MultisigRoutesApiAxiosParamCreator;
/**
 * MultisigRoutesApi - functional programming interface
 * @export
 */
var MultisigRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.MultisigRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the multisig account information.
         * @summary Get multisig account information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisig: function (address, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountMultisig(address, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the multisig account graph.
         * @summary Get multisig account graph information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigGraph: function (address, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountMultisigGraph(address, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the multisig account merkle information.
         * @summary Get multisig account merkle information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigMerkle: function (address, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountMultisigMerkle(address, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.MultisigRoutesApiFp = MultisigRoutesApiFp;
/**
 * MultisigRoutesApi - factory interface
 * @export
 */
var MultisigRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.MultisigRoutesApiFp)(configuration);
    return {
        /**
         * Returns the multisig account information.
         * @summary Get multisig account information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisig: function (address, options) {
            return localVarFp.getAccountMultisig(address, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the multisig account graph.
         * @summary Get multisig account graph information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigGraph: function (address, options) {
            return localVarFp.getAccountMultisigGraph(address, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the multisig account merkle information.
         * @summary Get multisig account merkle information
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountMultisigMerkle: function (address, options) {
            return localVarFp.getAccountMultisigMerkle(address, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.MultisigRoutesApiFactory = MultisigRoutesApiFactory;
/**
 * MultisigRoutesApi - object-oriented interface
 * @export
 * @class MultisigRoutesApi
 * @extends {BaseAPI}
 */
var MultisigRoutesApi = /** @class */ (function (_super) {
    __extends(MultisigRoutesApi, _super);
    function MultisigRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the multisig account information.
     * @summary Get multisig account information
     * @param {MultisigRoutesApiGetAccountMultisigRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MultisigRoutesApi
     */
    MultisigRoutesApi.prototype.getAccountMultisig = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MultisigRoutesApiFp)(this.configuration).getAccountMultisig(requestParameters.address, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the multisig account graph.
     * @summary Get multisig account graph information
     * @param {MultisigRoutesApiGetAccountMultisigGraphRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MultisigRoutesApi
     */
    MultisigRoutesApi.prototype.getAccountMultisigGraph = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MultisigRoutesApiFp)(this.configuration).getAccountMultisigGraph(requestParameters.address, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the multisig account merkle information.
     * @summary Get multisig account merkle information
     * @param {MultisigRoutesApiGetAccountMultisigMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MultisigRoutesApi
     */
    MultisigRoutesApi.prototype.getAccountMultisigMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.MultisigRoutesApiFp)(this.configuration).getAccountMultisigMerkle(requestParameters.address, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return MultisigRoutesApi;
}(base_1.BaseAPI));
exports.MultisigRoutesApi = MultisigRoutesApi;
/**
 * NamespaceRoutesApi - axios parameter creator
 * @export
 */
var NamespaceRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns friendly names for accounts.
         * @summary Get readable names for a set of accountIds
         * @param {Addresses} addresses
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsNames: function (addresses, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'addresses' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountsNames', 'addresses', addresses);
                    localVarPath = "/namespaces/account/names";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(addresses, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns friendly names for mosaics.
         * @summary Get readable names for a set of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicsNames: function (mosaicIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'mosaicIds' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaicsNames', 'mosaicIds', mosaicIds);
                    localVarPath = "/namespaces/mosaic/names";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(mosaicIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the namespace for a given namespace identifier.
         * @summary Get namespace information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespace: function (namespaceId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'namespaceId' is not null or undefined
                    (0, common_1.assertParamExists)('getNamespace', 'namespaceId', namespaceId);
                    localVarPath = "/namespaces/{namespaceId}"
                        .replace("{".concat("namespaceId", "}"), encodeURIComponent(String(namespaceId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the namespace merkle for a given namespace identifier.
         * @summary Get namespace merkle information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespaceMerkle: function (namespaceId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'namespaceId' is not null or undefined
                    (0, common_1.assertParamExists)('getNamespaceMerkle', 'namespaceId', namespaceId);
                    localVarPath = "/namespaces/{namespaceId}/merkle"
                        .replace("{".concat("namespaceId", "}"), encodeURIComponent(String(namespaceId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns friendly names for namespaces.
         * @summary Get readable names for a set of namespaces
         * @param {NamespaceIds} namespaceIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespacesNames: function (namespaceIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'namespaceIds' is not null or undefined
                    (0, common_1.assertParamExists)('getNamespacesNames', 'namespaceIds', namespaceIds);
                    localVarPath = "/namespaces/names";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(namespaceIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of namespaces.
         * @summary Search namespaces
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {NamespaceRegistrationTypeEnum} [registrationType] Filter by registration type.
         * @param {string} [level0] Filter by root namespace.
         * @param {AliasTypeEnum} [aliasType] Filter by alias type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchNamespaces: function (ownerAddress, registrationType, level0, aliasType, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/namespaces";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (ownerAddress !== undefined) {
                        localVarQueryParameter['ownerAddress'] = ownerAddress;
                    }
                    if (registrationType !== undefined) {
                        localVarQueryParameter['registrationType'] = registrationType;
                    }
                    if (level0 !== undefined) {
                        localVarQueryParameter['level0'] = level0;
                    }
                    if (aliasType !== undefined) {
                        localVarQueryParameter['aliasType'] = aliasType;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.NamespaceRoutesApiAxiosParamCreator = NamespaceRoutesApiAxiosParamCreator;
/**
 * NamespaceRoutesApi - functional programming interface
 * @export
 */
var NamespaceRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.NamespaceRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns friendly names for accounts.
         * @summary Get readable names for a set of accountIds
         * @param {Addresses} addresses
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsNames: function (addresses, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountsNames(addresses, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns friendly names for mosaics.
         * @summary Get readable names for a set of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicsNames: function (mosaicIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaicsNames(mosaicIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the namespace for a given namespace identifier.
         * @summary Get namespace information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespace: function (namespaceId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNamespace(namespaceId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the namespace merkle for a given namespace identifier.
         * @summary Get namespace merkle information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespaceMerkle: function (namespaceId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNamespaceMerkle(namespaceId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns friendly names for namespaces.
         * @summary Get readable names for a set of namespaces
         * @param {NamespaceIds} namespaceIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespacesNames: function (namespaceIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNamespacesNames(namespaceIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of namespaces.
         * @summary Search namespaces
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {NamespaceRegistrationTypeEnum} [registrationType] Filter by registration type.
         * @param {string} [level0] Filter by root namespace.
         * @param {AliasTypeEnum} [aliasType] Filter by alias type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchNamespaces: function (ownerAddress, registrationType, level0, aliasType, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchNamespaces(ownerAddress, registrationType, level0, aliasType, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.NamespaceRoutesApiFp = NamespaceRoutesApiFp;
/**
 * NamespaceRoutesApi - factory interface
 * @export
 */
var NamespaceRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.NamespaceRoutesApiFp)(configuration);
    return {
        /**
         * Returns friendly names for accounts.
         * @summary Get readable names for a set of accountIds
         * @param {Addresses} addresses
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountsNames: function (addresses, options) {
            return localVarFp.getAccountsNames(addresses, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns friendly names for mosaics.
         * @summary Get readable names for a set of mosaics
         * @param {MosaicIds} mosaicIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicsNames: function (mosaicIds, options) {
            return localVarFp.getMosaicsNames(mosaicIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the namespace for a given namespace identifier.
         * @summary Get namespace information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespace: function (namespaceId, options) {
            return localVarFp.getNamespace(namespaceId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the namespace merkle for a given namespace identifier.
         * @summary Get namespace merkle information
         * @param {string} namespaceId Namespace identifier.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespaceMerkle: function (namespaceId, options) {
            return localVarFp.getNamespaceMerkle(namespaceId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns friendly names for namespaces.
         * @summary Get readable names for a set of namespaces
         * @param {NamespaceIds} namespaceIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNamespacesNames: function (namespaceIds, options) {
            return localVarFp.getNamespacesNames(namespaceIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of namespaces.
         * @summary Search namespaces
         * @param {string} [ownerAddress] Filter by owner address.
         * @param {NamespaceRegistrationTypeEnum} [registrationType] Filter by registration type.
         * @param {string} [level0] Filter by root namespace.
         * @param {AliasTypeEnum} [aliasType] Filter by alias type.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchNamespaces: function (ownerAddress, registrationType, level0, aliasType, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchNamespaces(ownerAddress, registrationType, level0, aliasType, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.NamespaceRoutesApiFactory = NamespaceRoutesApiFactory;
/**
 * NamespaceRoutesApi - object-oriented interface
 * @export
 * @class NamespaceRoutesApi
 * @extends {BaseAPI}
 */
var NamespaceRoutesApi = /** @class */ (function (_super) {
    __extends(NamespaceRoutesApi, _super);
    function NamespaceRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns friendly names for accounts.
     * @summary Get readable names for a set of accountIds
     * @param {NamespaceRoutesApiGetAccountsNamesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.getAccountsNames = function (requestParameters, options) {
        var _this = this;
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).getAccountsNames(requestParameters.addresses, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns friendly names for mosaics.
     * @summary Get readable names for a set of mosaics
     * @param {NamespaceRoutesApiGetMosaicsNamesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.getMosaicsNames = function (requestParameters, options) {
        var _this = this;
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).getMosaicsNames(requestParameters.mosaicIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the namespace for a given namespace identifier.
     * @summary Get namespace information
     * @param {NamespaceRoutesApiGetNamespaceRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.getNamespace = function (requestParameters, options) {
        var _this = this;
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).getNamespace(requestParameters.namespaceId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the namespace merkle for a given namespace identifier.
     * @summary Get namespace merkle information
     * @param {NamespaceRoutesApiGetNamespaceMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.getNamespaceMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).getNamespaceMerkle(requestParameters.namespaceId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns friendly names for namespaces.
     * @summary Get readable names for a set of namespaces
     * @param {NamespaceRoutesApiGetNamespacesNamesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.getNamespacesNames = function (requestParameters, options) {
        var _this = this;
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).getNamespacesNames(requestParameters.namespaceIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of namespaces.
     * @summary Search namespaces
     * @param {NamespaceRoutesApiSearchNamespacesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NamespaceRoutesApi
     */
    NamespaceRoutesApi.prototype.searchNamespaces = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.NamespaceRoutesApiFp)(this.configuration).searchNamespaces(requestParameters.ownerAddress, requestParameters.registrationType, requestParameters.level0, requestParameters.aliasType, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return NamespaceRoutesApi;
}(base_1.BaseAPI));
exports.NamespaceRoutesApi = NamespaceRoutesApi;
/**
 * NetworkRoutesApi - axios parameter creator
 * @export
 */
var NetworkRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the content from a catapult-server network configuration file (resources/config-network.properties). To enable this feature, the REST setting \"network.propertiesFilePath\" must define where the file is located. This is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get the network properties
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkProperties: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/network/properties";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the current network type.
         * @summary Get the current network type of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkType: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/network";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the estimated effective rental fees for namespaces and mosaics. This endpoint is only available if the REST instance has access to catapult-server ``resources/config-network.properties`` file. To activate this feature, add the setting \"network.propertiesFilePath\" in the configuration file (rest/resources/rest.json).
         * @summary Get rental fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRentalFees: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/network/fees/rental";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the average, median, highest and lower fee multiplier over the last \"numBlocksTransactionFeeStats\". The setting \"numBlocksTransactionFeeStats\" is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get transaction fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionFees: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/network/fees/transaction";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.NetworkRoutesApiAxiosParamCreator = NetworkRoutesApiAxiosParamCreator;
/**
 * NetworkRoutesApi - functional programming interface
 * @export
 */
var NetworkRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.NetworkRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the content from a catapult-server network configuration file (resources/config-network.properties). To enable this feature, the REST setting \"network.propertiesFilePath\" must define where the file is located. This is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get the network properties
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkProperties: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNetworkProperties(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the current network type.
         * @summary Get the current network type of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkType: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNetworkType(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the estimated effective rental fees for namespaces and mosaics. This endpoint is only available if the REST instance has access to catapult-server ``resources/config-network.properties`` file. To activate this feature, add the setting \"network.propertiesFilePath\" in the configuration file (rest/resources/rest.json).
         * @summary Get rental fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRentalFees: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getRentalFees(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the average, median, highest and lower fee multiplier over the last \"numBlocksTransactionFeeStats\". The setting \"numBlocksTransactionFeeStats\" is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get transaction fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionFees: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getTransactionFees(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.NetworkRoutesApiFp = NetworkRoutesApiFp;
/**
 * NetworkRoutesApi - factory interface
 * @export
 */
var NetworkRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.NetworkRoutesApiFp)(configuration);
    return {
        /**
         * Returns the content from a catapult-server network configuration file (resources/config-network.properties). To enable this feature, the REST setting \"network.propertiesFilePath\" must define where the file is located. This is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get the network properties
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkProperties: function (options) {
            return localVarFp.getNetworkProperties(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the current network type.
         * @summary Get the current network type of the chain
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNetworkType: function (options) {
            return localVarFp.getNetworkType(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the estimated effective rental fees for namespaces and mosaics. This endpoint is only available if the REST instance has access to catapult-server ``resources/config-network.properties`` file. To activate this feature, add the setting \"network.propertiesFilePath\" in the configuration file (rest/resources/rest.json).
         * @summary Get rental fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRentalFees: function (options) {
            return localVarFp.getRentalFees(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the average, median, highest and lower fee multiplier over the last \"numBlocksTransactionFeeStats\". The setting \"numBlocksTransactionFeeStats\" is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
         * @summary Get transaction fees information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionFees: function (options) {
            return localVarFp.getTransactionFees(options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.NetworkRoutesApiFactory = NetworkRoutesApiFactory;
/**
 * NetworkRoutesApi - object-oriented interface
 * @export
 * @class NetworkRoutesApi
 * @extends {BaseAPI}
 */
var NetworkRoutesApi = /** @class */ (function (_super) {
    __extends(NetworkRoutesApi, _super);
    function NetworkRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the content from a catapult-server network configuration file (resources/config-network.properties). To enable this feature, the REST setting \"network.propertiesFilePath\" must define where the file is located. This is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
     * @summary Get the network properties
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NetworkRoutesApi
     */
    NetworkRoutesApi.prototype.getNetworkProperties = function (options) {
        var _this = this;
        return (0, exports.NetworkRoutesApiFp)(this.configuration).getNetworkProperties(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the current network type.
     * @summary Get the current network type of the chain
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NetworkRoutesApi
     */
    NetworkRoutesApi.prototype.getNetworkType = function (options) {
        var _this = this;
        return (0, exports.NetworkRoutesApiFp)(this.configuration).getNetworkType(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the estimated effective rental fees for namespaces and mosaics. This endpoint is only available if the REST instance has access to catapult-server ``resources/config-network.properties`` file. To activate this feature, add the setting \"network.propertiesFilePath\" in the configuration file (rest/resources/rest.json).
     * @summary Get rental fees information
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NetworkRoutesApi
     */
    NetworkRoutesApi.prototype.getRentalFees = function (options) {
        var _this = this;
        return (0, exports.NetworkRoutesApiFp)(this.configuration).getRentalFees(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the average, median, highest and lower fee multiplier over the last \"numBlocksTransactionFeeStats\". The setting \"numBlocksTransactionFeeStats\" is adjustable via the configuration file (rest/resources/rest.json) per REST instance.
     * @summary Get transaction fees information
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NetworkRoutesApi
     */
    NetworkRoutesApi.prototype.getTransactionFees = function (options) {
        var _this = this;
        return (0, exports.NetworkRoutesApiFp)(this.configuration).getTransactionFees(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return NetworkRoutesApi;
}(base_1.BaseAPI));
exports.NetworkRoutesApi = NetworkRoutesApi;
/**
 * NodeRoutesApi - axios parameter creator
 * @export
 */
var NodeRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Supplies information regarding the connection and services status.
         * @summary Get the node health information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeHealth: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/health";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Supplies additional information about the application running on a node.
         * @summary Get the node information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeInfo: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/info";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the list of peers visible by the node.
         * @summary Get peers information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodePeers: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/peers";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns storage information about the node.
         * @summary Get the storage information of the node
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeStorage: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/storage";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the node time at the moment the reply was sent and received.
         * @summary Get the node time
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeTime: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/time";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the version of the running catapult-rest component.
         * @summary Get the version of the running REST component
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getServerInfo: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/server";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns array of unlocked account public keys.
         * @summary Get the unlocked harvesting account public keys.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnlockedAccount: function (options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/node/unlockedaccount";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.NodeRoutesApiAxiosParamCreator = NodeRoutesApiAxiosParamCreator;
/**
 * NodeRoutesApi - functional programming interface
 * @export
 */
var NodeRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.NodeRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Supplies information regarding the connection and services status.
         * @summary Get the node health information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeHealth: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNodeHealth(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Supplies additional information about the application running on a node.
         * @summary Get the node information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeInfo: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNodeInfo(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the list of peers visible by the node.
         * @summary Get peers information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodePeers: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNodePeers(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns storage information about the node.
         * @summary Get the storage information of the node
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeStorage: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNodeStorage(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the node time at the moment the reply was sent and received.
         * @summary Get the node time
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeTime: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getNodeTime(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the version of the running catapult-rest component.
         * @summary Get the version of the running REST component
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getServerInfo: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getServerInfo(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns array of unlocked account public keys.
         * @summary Get the unlocked harvesting account public keys.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnlockedAccount: function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getUnlockedAccount(options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.NodeRoutesApiFp = NodeRoutesApiFp;
/**
 * NodeRoutesApi - factory interface
 * @export
 */
var NodeRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.NodeRoutesApiFp)(configuration);
    return {
        /**
         * Supplies information regarding the connection and services status.
         * @summary Get the node health information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeHealth: function (options) {
            return localVarFp.getNodeHealth(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Supplies additional information about the application running on a node.
         * @summary Get the node information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeInfo: function (options) {
            return localVarFp.getNodeInfo(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the list of peers visible by the node.
         * @summary Get peers information
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodePeers: function (options) {
            return localVarFp.getNodePeers(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns storage information about the node.
         * @summary Get the storage information of the node
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeStorage: function (options) {
            return localVarFp.getNodeStorage(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the node time at the moment the reply was sent and received.
         * @summary Get the node time
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getNodeTime: function (options) {
            return localVarFp.getNodeTime(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the version of the running catapult-rest component.
         * @summary Get the version of the running REST component
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getServerInfo: function (options) {
            return localVarFp.getServerInfo(options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns array of unlocked account public keys.
         * @summary Get the unlocked harvesting account public keys.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnlockedAccount: function (options) {
            return localVarFp.getUnlockedAccount(options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.NodeRoutesApiFactory = NodeRoutesApiFactory;
/**
 * NodeRoutesApi - object-oriented interface
 * @export
 * @class NodeRoutesApi
 * @extends {BaseAPI}
 */
var NodeRoutesApi = /** @class */ (function (_super) {
    __extends(NodeRoutesApi, _super);
    function NodeRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Supplies information regarding the connection and services status.
     * @summary Get the node health information
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getNodeHealth = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getNodeHealth(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Supplies additional information about the application running on a node.
     * @summary Get the node information
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getNodeInfo = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getNodeInfo(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the list of peers visible by the node.
     * @summary Get peers information
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getNodePeers = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getNodePeers(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns storage information about the node.
     * @summary Get the storage information of the node
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getNodeStorage = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getNodeStorage(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the node time at the moment the reply was sent and received.
     * @summary Get the node time
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getNodeTime = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getNodeTime(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the version of the running catapult-rest component.
     * @summary Get the version of the running REST component
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getServerInfo = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getServerInfo(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns array of unlocked account public keys.
     * @summary Get the unlocked harvesting account public keys.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof NodeRoutesApi
     */
    NodeRoutesApi.prototype.getUnlockedAccount = function (options) {
        var _this = this;
        return (0, exports.NodeRoutesApiFp)(this.configuration).getUnlockedAccount(options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return NodeRoutesApi;
}(base_1.BaseAPI));
exports.NodeRoutesApi = NodeRoutesApi;
/**
 * ReceiptRoutesApi - axios parameter creator
 * @export
 */
var ReceiptRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets an array of address resolution statements.
         * @summary Get receipts address resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAddressResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/statements/resolutions/address";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of mosaic resolution statements.
         * @summary Get receipts mosaic resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/statements/resolutions/mosaic";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets an array of transaction statements.
         * @summary Search transaction statements
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {Array<ReceiptTypeEnum>} [receiptType] Filter by receipt type. To filter by multiple receipt types, add more filter query params like: &#x60;&#x60;receiptType&#x3D;8515&amp;receiptType&#x3D;20803&#x60;&#x60;.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [senderAddress] Filter by address sending mosaics.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [artifactId] Mosaic or namespace identifier
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchReceipts: function (height, fromHeight, toHeight, receiptType, recipientAddress, senderAddress, targetAddress, artifactId, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/statements/transaction";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (fromHeight !== undefined) {
                        localVarQueryParameter['fromHeight'] = fromHeight;
                    }
                    if (toHeight !== undefined) {
                        localVarQueryParameter['toHeight'] = toHeight;
                    }
                    if (receiptType) {
                        localVarQueryParameter['receiptType'] = receiptType;
                    }
                    if (recipientAddress !== undefined) {
                        localVarQueryParameter['recipientAddress'] = recipientAddress;
                    }
                    if (senderAddress !== undefined) {
                        localVarQueryParameter['senderAddress'] = senderAddress;
                    }
                    if (targetAddress !== undefined) {
                        localVarQueryParameter['targetAddress'] = targetAddress;
                    }
                    if (artifactId !== undefined) {
                        localVarQueryParameter['artifactId'] = artifactId;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.ReceiptRoutesApiAxiosParamCreator = ReceiptRoutesApiAxiosParamCreator;
/**
 * ReceiptRoutesApi - functional programming interface
 * @export
 */
var ReceiptRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.ReceiptRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets an array of address resolution statements.
         * @summary Get receipts address resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAddressResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchAddressResolutionStatements(height, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of mosaic resolution statements.
         * @summary Get receipts mosaic resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchMosaicResolutionStatements(height, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets an array of transaction statements.
         * @summary Search transaction statements
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {Array<ReceiptTypeEnum>} [receiptType] Filter by receipt type. To filter by multiple receipt types, add more filter query params like: &#x60;&#x60;receiptType&#x3D;8515&amp;receiptType&#x3D;20803&#x60;&#x60;.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [senderAddress] Filter by address sending mosaics.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [artifactId] Mosaic or namespace identifier
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchReceipts: function (height, fromHeight, toHeight, receiptType, recipientAddress, senderAddress, targetAddress, artifactId, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchReceipts(height, fromHeight, toHeight, receiptType, recipientAddress, senderAddress, targetAddress, artifactId, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.ReceiptRoutesApiFp = ReceiptRoutesApiFp;
/**
 * ReceiptRoutesApi - factory interface
 * @export
 */
var ReceiptRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.ReceiptRoutesApiFp)(configuration);
    return {
        /**
         * Gets an array of address resolution statements.
         * @summary Get receipts address resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAddressResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchAddressResolutionStatements(height, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of mosaic resolution statements.
         * @summary Get receipts mosaic resolution statements
         * @param {string} [height] Filter by block height.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicResolutionStatements: function (height, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchMosaicResolutionStatements(height, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets an array of transaction statements.
         * @summary Search transaction statements
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {Array<ReceiptTypeEnum>} [receiptType] Filter by receipt type. To filter by multiple receipt types, add more filter query params like: &#x60;&#x60;receiptType&#x3D;8515&amp;receiptType&#x3D;20803&#x60;&#x60;.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [senderAddress] Filter by address sending mosaics.
         * @param {string} [targetAddress] Filter by target address.
         * @param {string} [artifactId] Mosaic or namespace identifier
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchReceipts: function (height, fromHeight, toHeight, receiptType, recipientAddress, senderAddress, targetAddress, artifactId, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchReceipts(height, fromHeight, toHeight, receiptType, recipientAddress, senderAddress, targetAddress, artifactId, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.ReceiptRoutesApiFactory = ReceiptRoutesApiFactory;
/**
 * ReceiptRoutesApi - object-oriented interface
 * @export
 * @class ReceiptRoutesApi
 * @extends {BaseAPI}
 */
var ReceiptRoutesApi = /** @class */ (function (_super) {
    __extends(ReceiptRoutesApi, _super);
    function ReceiptRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets an array of address resolution statements.
     * @summary Get receipts address resolution statements
     * @param {ReceiptRoutesApiSearchAddressResolutionStatementsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ReceiptRoutesApi
     */
    ReceiptRoutesApi.prototype.searchAddressResolutionStatements = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.ReceiptRoutesApiFp)(this.configuration).searchAddressResolutionStatements(requestParameters.height, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of mosaic resolution statements.
     * @summary Get receipts mosaic resolution statements
     * @param {ReceiptRoutesApiSearchMosaicResolutionStatementsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ReceiptRoutesApi
     */
    ReceiptRoutesApi.prototype.searchMosaicResolutionStatements = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.ReceiptRoutesApiFp)(this.configuration).searchMosaicResolutionStatements(requestParameters.height, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets an array of transaction statements.
     * @summary Search transaction statements
     * @param {ReceiptRoutesApiSearchReceiptsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ReceiptRoutesApi
     */
    ReceiptRoutesApi.prototype.searchReceipts = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.ReceiptRoutesApiFp)(this.configuration).searchReceipts(requestParameters.height, requestParameters.fromHeight, requestParameters.toHeight, requestParameters.receiptType, requestParameters.recipientAddress, requestParameters.senderAddress, requestParameters.targetAddress, requestParameters.artifactId, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return ReceiptRoutesApi;
}(base_1.BaseAPI));
exports.ReceiptRoutesApi = ReceiptRoutesApi;
/**
 * RestrictionAccountRoutesApi - axios parameter creator
 * @export
 */
var RestrictionAccountRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the account restrictions for a given address.
         * @summary Get the account restrictions
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictions: function (address, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'address' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountRestrictions', 'address', address);
                    localVarPath = "/restrictions/account/{address}"
                        .replace("{".concat("address", "}"), encodeURIComponent(String(address)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the account restrictions merkle for a given address.
         * @summary Get the account restrictions merkle
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictionsMerkle: function (address, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'address' is not null or undefined
                    (0, common_1.assertParamExists)('getAccountRestrictionsMerkle', 'address', address);
                    localVarPath = "/restrictions/account/{address}/merkle"
                        .replace("{".concat("address", "}"), encodeURIComponent(String(address)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of account restrictions.
         * @summary Search account restrictions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccountRestrictions: function (address, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/restrictions/account";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.RestrictionAccountRoutesApiAxiosParamCreator = RestrictionAccountRoutesApiAxiosParamCreator;
/**
 * RestrictionAccountRoutesApi - functional programming interface
 * @export
 */
var RestrictionAccountRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.RestrictionAccountRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the account restrictions for a given address.
         * @summary Get the account restrictions
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictions: function (address, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountRestrictions(address, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the account restrictions merkle for a given address.
         * @summary Get the account restrictions merkle
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictionsMerkle: function (address, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getAccountRestrictionsMerkle(address, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of account restrictions.
         * @summary Search account restrictions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccountRestrictions: function (address, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchAccountRestrictions(address, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.RestrictionAccountRoutesApiFp = RestrictionAccountRoutesApiFp;
/**
 * RestrictionAccountRoutesApi - factory interface
 * @export
 */
var RestrictionAccountRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.RestrictionAccountRoutesApiFp)(configuration);
    return {
        /**
         * Returns the account restrictions for a given address.
         * @summary Get the account restrictions
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictions: function (address, options) {
            return localVarFp.getAccountRestrictions(address, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the account restrictions merkle for a given address.
         * @summary Get the account restrictions merkle
         * @param {string} address Account address.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountRestrictionsMerkle: function (address, options) {
            return localVarFp.getAccountRestrictionsMerkle(address, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of account restrictions.
         * @summary Search account restrictions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchAccountRestrictions: function (address, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchAccountRestrictions(address, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.RestrictionAccountRoutesApiFactory = RestrictionAccountRoutesApiFactory;
/**
 * RestrictionAccountRoutesApi - object-oriented interface
 * @export
 * @class RestrictionAccountRoutesApi
 * @extends {BaseAPI}
 */
var RestrictionAccountRoutesApi = /** @class */ (function (_super) {
    __extends(RestrictionAccountRoutesApi, _super);
    function RestrictionAccountRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the account restrictions for a given address.
     * @summary Get the account restrictions
     * @param {RestrictionAccountRoutesApiGetAccountRestrictionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionAccountRoutesApi
     */
    RestrictionAccountRoutesApi.prototype.getAccountRestrictions = function (requestParameters, options) {
        var _this = this;
        return (0, exports.RestrictionAccountRoutesApiFp)(this.configuration).getAccountRestrictions(requestParameters.address, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the account restrictions merkle for a given address.
     * @summary Get the account restrictions merkle
     * @param {RestrictionAccountRoutesApiGetAccountRestrictionsMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionAccountRoutesApi
     */
    RestrictionAccountRoutesApi.prototype.getAccountRestrictionsMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.RestrictionAccountRoutesApiFp)(this.configuration).getAccountRestrictionsMerkle(requestParameters.address, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of account restrictions.
     * @summary Search account restrictions
     * @param {RestrictionAccountRoutesApiSearchAccountRestrictionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionAccountRoutesApi
     */
    RestrictionAccountRoutesApi.prototype.searchAccountRestrictions = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.RestrictionAccountRoutesApiFp)(this.configuration).searchAccountRestrictions(requestParameters.address, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return RestrictionAccountRoutesApi;
}(base_1.BaseAPI));
exports.RestrictionAccountRoutesApi = RestrictionAccountRoutesApi;
/**
 * RestrictionMosaicRoutesApi - axios parameter creator
 * @export
 */
var RestrictionMosaicRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the mosaic restrictions for a composite hash.
         * @summary Get the mosaic restrictions
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictions: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaicRestrictions', 'compositeHash', compositeHash);
                    localVarPath = "/restrictions/mosaic/{compositeHash}"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns the mosaic restrictions merkle for a given composite hash.
         * @summary Get the mosaic restrictions merkle
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictionsMerkle: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getMosaicRestrictionsMerkle', 'compositeHash', compositeHash);
                    localVarPath = "/restrictions/mosaic/{compositeHash}/merkle"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of mosaic restrictions.
         * @summary Search mosaic restrictions
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {MosaicRestrictionEntryTypeEnum} [entryType] Filter by entry type.
         * @param {string} [targetAddress] Filter by target address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicRestrictions: function (mosaicId, entryType, targetAddress, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/restrictions/mosaic";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (mosaicId !== undefined) {
                        localVarQueryParameter['mosaicId'] = mosaicId;
                    }
                    if (entryType !== undefined) {
                        localVarQueryParameter['entryType'] = entryType;
                    }
                    if (targetAddress !== undefined) {
                        localVarQueryParameter['targetAddress'] = targetAddress;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.RestrictionMosaicRoutesApiAxiosParamCreator = RestrictionMosaicRoutesApiAxiosParamCreator;
/**
 * RestrictionMosaicRoutesApi - functional programming interface
 * @export
 */
var RestrictionMosaicRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.RestrictionMosaicRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the mosaic restrictions for a composite hash.
         * @summary Get the mosaic restrictions
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictions: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaicRestrictions(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns the mosaic restrictions merkle for a given composite hash.
         * @summary Get the mosaic restrictions merkle
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictionsMerkle: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getMosaicRestrictionsMerkle(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of mosaic restrictions.
         * @summary Search mosaic restrictions
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {MosaicRestrictionEntryTypeEnum} [entryType] Filter by entry type.
         * @param {string} [targetAddress] Filter by target address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicRestrictions: function (mosaicId, entryType, targetAddress, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchMosaicRestrictions(mosaicId, entryType, targetAddress, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.RestrictionMosaicRoutesApiFp = RestrictionMosaicRoutesApiFp;
/**
 * RestrictionMosaicRoutesApi - factory interface
 * @export
 */
var RestrictionMosaicRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.RestrictionMosaicRoutesApiFp)(configuration);
    return {
        /**
         * Returns the mosaic restrictions for a composite hash.
         * @summary Get the mosaic restrictions
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictions: function (compositeHash, options) {
            return localVarFp.getMosaicRestrictions(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns the mosaic restrictions merkle for a given composite hash.
         * @summary Get the mosaic restrictions merkle
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMosaicRestrictionsMerkle: function (compositeHash, options) {
            return localVarFp.getMosaicRestrictionsMerkle(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of mosaic restrictions.
         * @summary Search mosaic restrictions
         * @param {string} [mosaicId] Filter by mosaic identifier.
         * @param {MosaicRestrictionEntryTypeEnum} [entryType] Filter by entry type.
         * @param {string} [targetAddress] Filter by target address.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchMosaicRestrictions: function (mosaicId, entryType, targetAddress, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchMosaicRestrictions(mosaicId, entryType, targetAddress, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.RestrictionMosaicRoutesApiFactory = RestrictionMosaicRoutesApiFactory;
/**
 * RestrictionMosaicRoutesApi - object-oriented interface
 * @export
 * @class RestrictionMosaicRoutesApi
 * @extends {BaseAPI}
 */
var RestrictionMosaicRoutesApi = /** @class */ (function (_super) {
    __extends(RestrictionMosaicRoutesApi, _super);
    function RestrictionMosaicRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the mosaic restrictions for a composite hash.
     * @summary Get the mosaic restrictions
     * @param {RestrictionMosaicRoutesApiGetMosaicRestrictionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionMosaicRoutesApi
     */
    RestrictionMosaicRoutesApi.prototype.getMosaicRestrictions = function (requestParameters, options) {
        var _this = this;
        return (0, exports.RestrictionMosaicRoutesApiFp)(this.configuration).getMosaicRestrictions(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns the mosaic restrictions merkle for a given composite hash.
     * @summary Get the mosaic restrictions merkle
     * @param {RestrictionMosaicRoutesApiGetMosaicRestrictionsMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionMosaicRoutesApi
     */
    RestrictionMosaicRoutesApi.prototype.getMosaicRestrictionsMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.RestrictionMosaicRoutesApiFp)(this.configuration).getMosaicRestrictionsMerkle(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of mosaic restrictions.
     * @summary Search mosaic restrictions
     * @param {RestrictionMosaicRoutesApiSearchMosaicRestrictionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RestrictionMosaicRoutesApi
     */
    RestrictionMosaicRoutesApi.prototype.searchMosaicRestrictions = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.RestrictionMosaicRoutesApiFp)(this.configuration).searchMosaicRestrictions(requestParameters.mosaicId, requestParameters.entryType, requestParameters.targetAddress, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return RestrictionMosaicRoutesApi;
}(base_1.BaseAPI));
exports.RestrictionMosaicRoutesApi = RestrictionMosaicRoutesApi;
/**
 * SecretLockRoutesApi - axios parameter creator
 * @export
 */
var SecretLockRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Gets the hash lock for a given composite hash.
         * @summary Get secret lock information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLock: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getSecretLock', 'compositeHash', compositeHash);
                    localVarPath = "/lock/secret/{compositeHash}"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Gets the hash lock merkle for a given composite hash.
         * @summary Get secret lock merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLockMerkle: function (compositeHash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'compositeHash' is not null or undefined
                    (0, common_1.assertParamExists)('getSecretLockMerkle', 'compositeHash', compositeHash);
                    localVarPath = "/lock/secret/{compositeHash}/merkle"
                        .replace("{".concat("compositeHash", "}"), encodeURIComponent(String(compositeHash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of secret locks.
         * @summary Search secret lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [secret] Filter by secret.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchSecretLock: function (address, secret, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/lock/secret";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (secret !== undefined) {
                        localVarQueryParameter['secret'] = secret;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.SecretLockRoutesApiAxiosParamCreator = SecretLockRoutesApiAxiosParamCreator;
/**
 * SecretLockRoutesApi - functional programming interface
 * @export
 */
var SecretLockRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.SecretLockRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Gets the hash lock for a given composite hash.
         * @summary Get secret lock information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLock: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getSecretLock(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Gets the hash lock merkle for a given composite hash.
         * @summary Get secret lock merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLockMerkle: function (compositeHash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getSecretLockMerkle(compositeHash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of secret locks.
         * @summary Search secret lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [secret] Filter by secret.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchSecretLock: function (address, secret, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchSecretLock(address, secret, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.SecretLockRoutesApiFp = SecretLockRoutesApiFp;
/**
 * SecretLockRoutesApi - factory interface
 * @export
 */
var SecretLockRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.SecretLockRoutesApiFp)(configuration);
    return {
        /**
         * Gets the hash lock for a given composite hash.
         * @summary Get secret lock information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLock: function (compositeHash, options) {
            return localVarFp.getSecretLock(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Gets the hash lock merkle for a given composite hash.
         * @summary Get secret lock merkle information
         * @param {string} compositeHash Filter by composite hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSecretLockMerkle: function (compositeHash, options) {
            return localVarFp.getSecretLockMerkle(compositeHash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of secret locks.
         * @summary Search secret lock entries
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [secret] Filter by secret.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchSecretLock: function (address, secret, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchSecretLock(address, secret, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.SecretLockRoutesApiFactory = SecretLockRoutesApiFactory;
/**
 * SecretLockRoutesApi - object-oriented interface
 * @export
 * @class SecretLockRoutesApi
 * @extends {BaseAPI}
 */
var SecretLockRoutesApi = /** @class */ (function (_super) {
    __extends(SecretLockRoutesApi, _super);
    function SecretLockRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Gets the hash lock for a given composite hash.
     * @summary Get secret lock information
     * @param {SecretLockRoutesApiGetSecretLockRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SecretLockRoutesApi
     */
    SecretLockRoutesApi.prototype.getSecretLock = function (requestParameters, options) {
        var _this = this;
        return (0, exports.SecretLockRoutesApiFp)(this.configuration).getSecretLock(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Gets the hash lock merkle for a given composite hash.
     * @summary Get secret lock merkle information
     * @param {SecretLockRoutesApiGetSecretLockMerkleRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SecretLockRoutesApi
     */
    SecretLockRoutesApi.prototype.getSecretLockMerkle = function (requestParameters, options) {
        var _this = this;
        return (0, exports.SecretLockRoutesApiFp)(this.configuration).getSecretLockMerkle(requestParameters.compositeHash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of secret locks.
     * @summary Search secret lock entries
     * @param {SecretLockRoutesApiSearchSecretLockRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SecretLockRoutesApi
     */
    SecretLockRoutesApi.prototype.searchSecretLock = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.SecretLockRoutesApiFp)(this.configuration).searchSecretLock(requestParameters.address, requestParameters.secret, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return SecretLockRoutesApi;
}(base_1.BaseAPI));
exports.SecretLockRoutesApi = SecretLockRoutesApi;
/**
 * TransactionRoutesApi - axios parameter creator
 * @export
 */
var TransactionRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Announces a cosignature transaction to the network.
         * @summary Announce a cosignature transaction
         * @param {Cosignature} cosignature
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceCosignatureTransaction: function (cosignature, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'cosignature' is not null or undefined
                    (0, common_1.assertParamExists)('announceCosignatureTransaction', 'cosignature', cosignature);
                    localVarPath = "/transactions/cosignature";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'PUT' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(cosignature, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Announces an aggregate bonded transaction to the network.
         * @summary Announce an aggregate bonded transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announcePartialTransaction: function (transactionPayload, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionPayload' is not null or undefined
                    (0, common_1.assertParamExists)('announcePartialTransaction', 'transactionPayload', transactionPayload);
                    localVarPath = "/transactions/partial";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'PUT' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionPayload, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Announces a transaction to the network. The [catbuffer library](https://github.com/nemtech/catbuffer) defines the protocol to serialize and deserialize Symbol entities. Catbuffers are integrated into [Symbol SDKs](https://nemtech.github.io/sdk.html).  It\'s recommended to use SDKs instead of calling the API endpoint directly to announce transactions.
         * @summary Announce a new transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceTransaction: function (transactionPayload, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionPayload' is not null or undefined
                    (0, common_1.assertParamExists)('announceTransaction', 'transactionPayload', transactionPayload);
                    localVarPath = "/transactions";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'PUT' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionPayload, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns confirmed transaction information given a transactionId or hash.
         * @summary Get confirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransaction: function (transactionId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionId' is not null or undefined
                    (0, common_1.assertParamExists)('getConfirmedTransaction', 'transactionId', transactionId);
                    localVarPath = "/transactions/confirmed/{transactionId}"
                        .replace("{".concat("transactionId", "}"), encodeURIComponent(String(transactionId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns confirmed transactions information for a given array of transactionIds.
         * @summary Get confirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransactions: function (transactionIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionIds' is not null or undefined
                    (0, common_1.assertParamExists)('getConfirmedTransactions', 'transactionIds', transactionIds);
                    localVarPath = "/transactions/confirmed";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns partial transaction information given a transactionId or hash.
         * @summary Get partial transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransaction: function (transactionId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionId' is not null or undefined
                    (0, common_1.assertParamExists)('getPartialTransaction', 'transactionId', transactionId);
                    localVarPath = "/transactions/partial/{transactionId}"
                        .replace("{".concat("transactionId", "}"), encodeURIComponent(String(transactionId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns partial transactions information for a given array of transactionIds.
         * @summary Get partial trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransactions: function (transactionIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionIds' is not null or undefined
                    (0, common_1.assertParamExists)('getPartialTransactions', 'transactionIds', transactionIds);
                    localVarPath = "/transactions/partial";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns unconfirmed transaction information given a transactionId or hash.
         * @summary Get unconfirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransaction: function (transactionId, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionId' is not null or undefined
                    (0, common_1.assertParamExists)('getUnconfirmedTransaction', 'transactionId', transactionId);
                    localVarPath = "/transactions/unconfirmed/{transactionId}"
                        .replace("{".concat("transactionId", "}"), encodeURIComponent(String(transactionId)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns unconfirmed transactions information for a given array of transactionIds.
         * @summary Get unconfirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransactions: function (transactionIds, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionIds' is not null or undefined
                    (0, common_1.assertParamExists)('getUnconfirmedTransactions', 'transactionIds', transactionIds);
                    localVarPath = "/transactions/unconfirmed";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionIds, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of confirmed transactions. If a transaction was announced with an alias rather than an address, the address that will be considered when querying is the one that was resolved from the alias at confirmation time.
         * @summary Search confirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchConfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/transactions/confirmed";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (recipientAddress !== undefined) {
                        localVarQueryParameter['recipientAddress'] = recipientAddress;
                    }
                    if (signerPublicKey !== undefined) {
                        localVarQueryParameter['signerPublicKey'] = signerPublicKey;
                    }
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (fromHeight !== undefined) {
                        localVarQueryParameter['fromHeight'] = fromHeight;
                    }
                    if (toHeight !== undefined) {
                        localVarQueryParameter['toHeight'] = toHeight;
                    }
                    if (fromTransferAmount !== undefined) {
                        localVarQueryParameter['fromTransferAmount'] = fromTransferAmount;
                    }
                    if (toTransferAmount !== undefined) {
                        localVarQueryParameter['toTransferAmount'] = toTransferAmount;
                    }
                    if (type) {
                        localVarQueryParameter['type'] = type;
                    }
                    if (embedded !== undefined) {
                        localVarQueryParameter['embedded'] = embedded;
                    }
                    if (transferMosaicId !== undefined) {
                        localVarQueryParameter['transferMosaicId'] = transferMosaicId;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of partial transactions.
         * @summary Search partial transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchPartialTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/transactions/partial";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (recipientAddress !== undefined) {
                        localVarQueryParameter['recipientAddress'] = recipientAddress;
                    }
                    if (signerPublicKey !== undefined) {
                        localVarQueryParameter['signerPublicKey'] = signerPublicKey;
                    }
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (fromHeight !== undefined) {
                        localVarQueryParameter['fromHeight'] = fromHeight;
                    }
                    if (toHeight !== undefined) {
                        localVarQueryParameter['toHeight'] = toHeight;
                    }
                    if (fromTransferAmount !== undefined) {
                        localVarQueryParameter['fromTransferAmount'] = fromTransferAmount;
                    }
                    if (toTransferAmount !== undefined) {
                        localVarQueryParameter['toTransferAmount'] = toTransferAmount;
                    }
                    if (type) {
                        localVarQueryParameter['type'] = type;
                    }
                    if (embedded !== undefined) {
                        localVarQueryParameter['embedded'] = embedded;
                    }
                    if (transferMosaicId !== undefined) {
                        localVarQueryParameter['transferMosaicId'] = transferMosaicId;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of unconfirmed transactions.
         * @summary Search unconfirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchUnconfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    localVarPath = "/transactions/unconfirmed";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    if (address !== undefined) {
                        localVarQueryParameter['address'] = address;
                    }
                    if (recipientAddress !== undefined) {
                        localVarQueryParameter['recipientAddress'] = recipientAddress;
                    }
                    if (signerPublicKey !== undefined) {
                        localVarQueryParameter['signerPublicKey'] = signerPublicKey;
                    }
                    if (height !== undefined) {
                        localVarQueryParameter['height'] = height;
                    }
                    if (fromHeight !== undefined) {
                        localVarQueryParameter['fromHeight'] = fromHeight;
                    }
                    if (toHeight !== undefined) {
                        localVarQueryParameter['toHeight'] = toHeight;
                    }
                    if (fromTransferAmount !== undefined) {
                        localVarQueryParameter['fromTransferAmount'] = fromTransferAmount;
                    }
                    if (toTransferAmount !== undefined) {
                        localVarQueryParameter['toTransferAmount'] = toTransferAmount;
                    }
                    if (type) {
                        localVarQueryParameter['type'] = type;
                    }
                    if (embedded !== undefined) {
                        localVarQueryParameter['embedded'] = embedded;
                    }
                    if (transferMosaicId !== undefined) {
                        localVarQueryParameter['transferMosaicId'] = transferMosaicId;
                    }
                    if (pageSize !== undefined) {
                        localVarQueryParameter['pageSize'] = pageSize;
                    }
                    if (pageNumber !== undefined) {
                        localVarQueryParameter['pageNumber'] = pageNumber;
                    }
                    if (offset !== undefined) {
                        localVarQueryParameter['offset'] = offset;
                    }
                    if (order !== undefined) {
                        localVarQueryParameter['order'] = order;
                    }
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.TransactionRoutesApiAxiosParamCreator = TransactionRoutesApiAxiosParamCreator;
/**
 * TransactionRoutesApi - functional programming interface
 * @export
 */
var TransactionRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.TransactionRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Announces a cosignature transaction to the network.
         * @summary Announce a cosignature transaction
         * @param {Cosignature} cosignature
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceCosignatureTransaction: function (cosignature, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.announceCosignatureTransaction(cosignature, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Announces an aggregate bonded transaction to the network.
         * @summary Announce an aggregate bonded transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announcePartialTransaction: function (transactionPayload, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.announcePartialTransaction(transactionPayload, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Announces a transaction to the network. The [catbuffer library](https://github.com/nemtech/catbuffer) defines the protocol to serialize and deserialize Symbol entities. Catbuffers are integrated into [Symbol SDKs](https://nemtech.github.io/sdk.html).  It\'s recommended to use SDKs instead of calling the API endpoint directly to announce transactions.
         * @summary Announce a new transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceTransaction: function (transactionPayload, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.announceTransaction(transactionPayload, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns confirmed transaction information given a transactionId or hash.
         * @summary Get confirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransaction: function (transactionId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getConfirmedTransaction(transactionId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns confirmed transactions information for a given array of transactionIds.
         * @summary Get confirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransactions: function (transactionIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getConfirmedTransactions(transactionIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns partial transaction information given a transactionId or hash.
         * @summary Get partial transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransaction: function (transactionId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getPartialTransaction(transactionId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns partial transactions information for a given array of transactionIds.
         * @summary Get partial trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransactions: function (transactionIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getPartialTransactions(transactionIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns unconfirmed transaction information given a transactionId or hash.
         * @summary Get unconfirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransaction: function (transactionId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getUnconfirmedTransaction(transactionId, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns unconfirmed transactions information for a given array of transactionIds.
         * @summary Get unconfirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransactions: function (transactionIds, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getUnconfirmedTransactions(transactionIds, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of confirmed transactions. If a transaction was announced with an alias rather than an address, the address that will be considered when querying is the one that was resolved from the alias at confirmation time.
         * @summary Search confirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchConfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchConfirmedTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of partial transactions.
         * @summary Search partial transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchPartialTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchPartialTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of unconfirmed transactions.
         * @summary Search unconfirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchUnconfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.searchUnconfirmedTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.TransactionRoutesApiFp = TransactionRoutesApiFp;
/**
 * TransactionRoutesApi - factory interface
 * @export
 */
var TransactionRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.TransactionRoutesApiFp)(configuration);
    return {
        /**
         * Announces a cosignature transaction to the network.
         * @summary Announce a cosignature transaction
         * @param {Cosignature} cosignature
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceCosignatureTransaction: function (cosignature, options) {
            return localVarFp.announceCosignatureTransaction(cosignature, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Announces an aggregate bonded transaction to the network.
         * @summary Announce an aggregate bonded transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announcePartialTransaction: function (transactionPayload, options) {
            return localVarFp.announcePartialTransaction(transactionPayload, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Announces a transaction to the network. The [catbuffer library](https://github.com/nemtech/catbuffer) defines the protocol to serialize and deserialize Symbol entities. Catbuffers are integrated into [Symbol SDKs](https://nemtech.github.io/sdk.html).  It\'s recommended to use SDKs instead of calling the API endpoint directly to announce transactions.
         * @summary Announce a new transaction
         * @param {TransactionPayload} transactionPayload
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        announceTransaction: function (transactionPayload, options) {
            return localVarFp.announceTransaction(transactionPayload, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns confirmed transaction information given a transactionId or hash.
         * @summary Get confirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransaction: function (transactionId, options) {
            return localVarFp.getConfirmedTransaction(transactionId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns confirmed transactions information for a given array of transactionIds.
         * @summary Get confirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getConfirmedTransactions: function (transactionIds, options) {
            return localVarFp.getConfirmedTransactions(transactionIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns partial transaction information given a transactionId or hash.
         * @summary Get partial transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransaction: function (transactionId, options) {
            return localVarFp.getPartialTransaction(transactionId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns partial transactions information for a given array of transactionIds.
         * @summary Get partial trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getPartialTransactions: function (transactionIds, options) {
            return localVarFp.getPartialTransactions(transactionIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns unconfirmed transaction information given a transactionId or hash.
         * @summary Get unconfirmed transaction information
         * @param {string} transactionId Transaction id or hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransaction: function (transactionId, options) {
            return localVarFp.getUnconfirmedTransaction(transactionId, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns unconfirmed transactions information for a given array of transactionIds.
         * @summary Get unconfirmed trasactions information
         * @param {TransactionIds} transactionIds
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUnconfirmedTransactions: function (transactionIds, options) {
            return localVarFp.getUnconfirmedTransactions(transactionIds, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of confirmed transactions. If a transaction was announced with an alias rather than an address, the address that will be considered when querying is the one that was resolved from the alias at confirmation time.
         * @summary Search confirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchConfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchConfirmedTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of partial transactions.
         * @summary Search partial transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchPartialTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchPartialTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of unconfirmed transactions.
         * @summary Search unconfirmed transactions
         * @param {string} [address] Filter by address involved in the transaction. An account\&#39;s address is considered to be involved in the transaction when the account is the sender, recipient, or it is required to cosign the transaction. This filter cannot be combined with &#x60;&#x60;recipientAddress&#x60;&#x60; and &#x60;&#x60;signerPublicKey&#x60;&#x60; query params.
         * @param {string} [recipientAddress] Filter by address of the account receiving the transaction.
         * @param {string} [signerPublicKey] Filter by public key of the account signing the entity.
         * @param {string} [height] Filter by block height.
         * @param {string} [fromHeight] Only blocks with height greater or equal than this one are returned.
         * @param {string} [toHeight] Only blocks with height smaller or equal than this one are returned.
         * @param {string} [fromTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, greater or equal than this amount are returned.
         * @param {string} [toTransferAmount] Requires providing the &#x60;transferMosaicId&#x60; filter. Only transfer transactions with a transfer amount of the provided mosaic id, lesser or equal than this amount are returned.
         * @param {Array<TransactionTypeEnum>} [type] Filter by transaction type. To filter by multiple transaction types, add more filter query params like: &#x60;&#x60;type&#x3D;16974&amp;type&#x3D;16718&#x60;&#x60;.
         * @param {boolean} [embedded] When true, the endpoint also returns all the embedded aggregate transactions. Otherwise, only top-level transactions used to calculate the block transactionsHash are returned. **Note:** This field does not work when combined with the &#x60;&#x60;address&#x60;&#x60; parameter. This is, embedded transactions containing the address specified through the &#x60;&#x60;address&#x60;&#x60; parameter will not be returned even when used with &#x60;&#x60;embedded&#x3D;true&#x60;&#x60;. There is no problem when using other parameters like &#x60;&#x60;recipientAddress&#x60;&#x60; instead.
         * @param {string} [transferMosaicId] Filters transactions involving a specific &#x60;&#x60;mosaicId&#x60;&#x60;.
         * @param {number} [pageSize] Select the number of entries to return.
         * @param {number} [pageNumber] Filter by page number.
         * @param {string} [offset] Entry id at which to start pagination. If the ordering parameter is set to -id, the elements returned precede the identifier. Otherwise, newer elements with respect to the id are returned.
         * @param {Order} [order] Sort responses in ascending or descending order based on the collection property set on the param &#x60;&#x60;orderBy&#x60;&#x60;. If the request does not specify &#x60;&#x60;orderBy&#x60;&#x60;, REST returns the collection ordered by id.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        searchUnconfirmedTransactions: function (address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options) {
            return localVarFp.searchUnconfirmedTransactions(address, recipientAddress, signerPublicKey, height, fromHeight, toHeight, fromTransferAmount, toTransferAmount, type, embedded, transferMosaicId, pageSize, pageNumber, offset, order, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.TransactionRoutesApiFactory = TransactionRoutesApiFactory;
/**
 * TransactionRoutesApi - object-oriented interface
 * @export
 * @class TransactionRoutesApi
 * @extends {BaseAPI}
 */
var TransactionRoutesApi = /** @class */ (function (_super) {
    __extends(TransactionRoutesApi, _super);
    function TransactionRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Announces a cosignature transaction to the network.
     * @summary Announce a cosignature transaction
     * @param {TransactionRoutesApiAnnounceCosignatureTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.announceCosignatureTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).announceCosignatureTransaction(requestParameters.cosignature, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Announces an aggregate bonded transaction to the network.
     * @summary Announce an aggregate bonded transaction
     * @param {TransactionRoutesApiAnnouncePartialTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.announcePartialTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).announcePartialTransaction(requestParameters.transactionPayload, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Announces a transaction to the network. The [catbuffer library](https://github.com/nemtech/catbuffer) defines the protocol to serialize and deserialize Symbol entities. Catbuffers are integrated into [Symbol SDKs](https://nemtech.github.io/sdk.html).  It\'s recommended to use SDKs instead of calling the API endpoint directly to announce transactions.
     * @summary Announce a new transaction
     * @param {TransactionRoutesApiAnnounceTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.announceTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).announceTransaction(requestParameters.transactionPayload, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns confirmed transaction information given a transactionId or hash.
     * @summary Get confirmed transaction information
     * @param {TransactionRoutesApiGetConfirmedTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getConfirmedTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getConfirmedTransaction(requestParameters.transactionId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns confirmed transactions information for a given array of transactionIds.
     * @summary Get confirmed trasactions information
     * @param {TransactionRoutesApiGetConfirmedTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getConfirmedTransactions = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getConfirmedTransactions(requestParameters.transactionIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns partial transaction information given a transactionId or hash.
     * @summary Get partial transaction information
     * @param {TransactionRoutesApiGetPartialTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getPartialTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getPartialTransaction(requestParameters.transactionId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns partial transactions information for a given array of transactionIds.
     * @summary Get partial trasactions information
     * @param {TransactionRoutesApiGetPartialTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getPartialTransactions = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getPartialTransactions(requestParameters.transactionIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns unconfirmed transaction information given a transactionId or hash.
     * @summary Get unconfirmed transaction information
     * @param {TransactionRoutesApiGetUnconfirmedTransactionRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getUnconfirmedTransaction = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getUnconfirmedTransaction(requestParameters.transactionId, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns unconfirmed transactions information for a given array of transactionIds.
     * @summary Get unconfirmed trasactions information
     * @param {TransactionRoutesApiGetUnconfirmedTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.getUnconfirmedTransactions = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionRoutesApiFp)(this.configuration).getUnconfirmedTransactions(requestParameters.transactionIds, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of confirmed transactions. If a transaction was announced with an alias rather than an address, the address that will be considered when querying is the one that was resolved from the alias at confirmation time.
     * @summary Search confirmed transactions
     * @param {TransactionRoutesApiSearchConfirmedTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.searchConfirmedTransactions = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.TransactionRoutesApiFp)(this.configuration).searchConfirmedTransactions(requestParameters.address, requestParameters.recipientAddress, requestParameters.signerPublicKey, requestParameters.height, requestParameters.fromHeight, requestParameters.toHeight, requestParameters.fromTransferAmount, requestParameters.toTransferAmount, requestParameters.type, requestParameters.embedded, requestParameters.transferMosaicId, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of partial transactions.
     * @summary Search partial transactions
     * @param {TransactionRoutesApiSearchPartialTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.searchPartialTransactions = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.TransactionRoutesApiFp)(this.configuration).searchPartialTransactions(requestParameters.address, requestParameters.recipientAddress, requestParameters.signerPublicKey, requestParameters.height, requestParameters.fromHeight, requestParameters.toHeight, requestParameters.fromTransferAmount, requestParameters.toTransferAmount, requestParameters.type, requestParameters.embedded, requestParameters.transferMosaicId, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of unconfirmed transactions.
     * @summary Search unconfirmed transactions
     * @param {TransactionRoutesApiSearchUnconfirmedTransactionsRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionRoutesApi
     */
    TransactionRoutesApi.prototype.searchUnconfirmedTransactions = function (requestParameters, options) {
        var _this = this;
        if (requestParameters === void 0) { requestParameters = {}; }
        return (0, exports.TransactionRoutesApiFp)(this.configuration).searchUnconfirmedTransactions(requestParameters.address, requestParameters.recipientAddress, requestParameters.signerPublicKey, requestParameters.height, requestParameters.fromHeight, requestParameters.toHeight, requestParameters.fromTransferAmount, requestParameters.toTransferAmount, requestParameters.type, requestParameters.embedded, requestParameters.transferMosaicId, requestParameters.pageSize, requestParameters.pageNumber, requestParameters.offset, requestParameters.order, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return TransactionRoutesApi;
}(base_1.BaseAPI));
exports.TransactionRoutesApi = TransactionRoutesApi;
/**
 * TransactionStatusRoutesApi - axios parameter creator
 * @export
 */
var TransactionStatusRoutesApiAxiosParamCreator = function (configuration) {
    var _this = this;
    return {
        /**
         * Returns the transaction status for a given hash.
         * @summary Get transaction status
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatus: function (hash, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'hash' is not null or undefined
                    (0, common_1.assertParamExists)('getTransactionStatus', 'hash', hash);
                    localVarPath = "/transactionStatus/{hash}"
                        .replace("{".concat("hash", "}"), encodeURIComponent(String(hash)));
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'GET' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
        /**
         * Returns an array of transaction statuses for a given array of transaction hashes.
         * @summary Get transaction statuses
         * @param {TransactionHashes} transactionHashes
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatuses: function (transactionHashes, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(_this, void 0, void 0, function () {
                var localVarPath, localVarUrlObj, baseOptions, localVarRequestOptions, localVarHeaderParameter, localVarQueryParameter, headersFromBaseOptions;
                return __generator(this, function (_a) {
                    // verify required parameter 'transactionHashes' is not null or undefined
                    (0, common_1.assertParamExists)('getTransactionStatuses', 'transactionHashes', transactionHashes);
                    localVarPath = "/transactionStatus";
                    localVarUrlObj = new URL(localVarPath, common_1.DUMMY_BASE_URL);
                    if (configuration) {
                        baseOptions = configuration.baseOptions;
                    }
                    localVarRequestOptions = __assign(__assign({ method: 'POST' }, baseOptions), options);
                    localVarHeaderParameter = {};
                    localVarQueryParameter = {};
                    localVarHeaderParameter['Content-Type'] = 'application/json';
                    (0, common_1.setSearchParams)(localVarUrlObj, localVarQueryParameter);
                    headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
                    localVarRequestOptions.headers = __assign(__assign(__assign({}, localVarHeaderParameter), headersFromBaseOptions), options.headers);
                    localVarRequestOptions.data = (0, common_1.serializeDataIfNeeded)(transactionHashes, localVarRequestOptions, configuration);
                    return [2 /*return*/, {
                            url: (0, common_1.toPathString)(localVarUrlObj),
                            options: localVarRequestOptions,
                        }];
                });
            });
        },
    };
};
exports.TransactionStatusRoutesApiAxiosParamCreator = TransactionStatusRoutesApiAxiosParamCreator;
/**
 * TransactionStatusRoutesApi - functional programming interface
 * @export
 */
var TransactionStatusRoutesApiFp = function (configuration) {
    var localVarAxiosParamCreator = (0, exports.TransactionStatusRoutesApiAxiosParamCreator)(configuration);
    return {
        /**
         * Returns the transaction status for a given hash.
         * @summary Get transaction status
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatus: function (hash, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getTransactionStatus(hash, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
        /**
         * Returns an array of transaction statuses for a given array of transaction hashes.
         * @summary Get transaction statuses
         * @param {TransactionHashes} transactionHashes
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatuses: function (transactionHashes, options) {
            return __awaiter(this, void 0, void 0, function () {
                var localVarAxiosArgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, localVarAxiosParamCreator.getTransactionStatuses(transactionHashes, options)];
                        case 1:
                            localVarAxiosArgs = _a.sent();
                            return [2 /*return*/, (0, common_1.createRequestFunction)(localVarAxiosArgs, axios_1.default, base_1.BASE_PATH, configuration)];
                    }
                });
            });
        },
    };
};
exports.TransactionStatusRoutesApiFp = TransactionStatusRoutesApiFp;
/**
 * TransactionStatusRoutesApi - factory interface
 * @export
 */
var TransactionStatusRoutesApiFactory = function (configuration, basePath, axios) {
    var localVarFp = (0, exports.TransactionStatusRoutesApiFp)(configuration);
    return {
        /**
         * Returns the transaction status for a given hash.
         * @summary Get transaction status
         * @param {string} hash Transaction hash.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatus: function (hash, options) {
            return localVarFp.getTransactionStatus(hash, options).then(function (request) { return request(axios, basePath); });
        },
        /**
         * Returns an array of transaction statuses for a given array of transaction hashes.
         * @summary Get transaction statuses
         * @param {TransactionHashes} transactionHashes
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getTransactionStatuses: function (transactionHashes, options) {
            return localVarFp.getTransactionStatuses(transactionHashes, options).then(function (request) { return request(axios, basePath); });
        },
    };
};
exports.TransactionStatusRoutesApiFactory = TransactionStatusRoutesApiFactory;
/**
 * TransactionStatusRoutesApi - object-oriented interface
 * @export
 * @class TransactionStatusRoutesApi
 * @extends {BaseAPI}
 */
var TransactionStatusRoutesApi = /** @class */ (function (_super) {
    __extends(TransactionStatusRoutesApi, _super);
    function TransactionStatusRoutesApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Returns the transaction status for a given hash.
     * @summary Get transaction status
     * @param {TransactionStatusRoutesApiGetTransactionStatusRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionStatusRoutesApi
     */
    TransactionStatusRoutesApi.prototype.getTransactionStatus = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionStatusRoutesApiFp)(this.configuration).getTransactionStatus(requestParameters.hash, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    /**
     * Returns an array of transaction statuses for a given array of transaction hashes.
     * @summary Get transaction statuses
     * @param {TransactionStatusRoutesApiGetTransactionStatusesRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof TransactionStatusRoutesApi
     */
    TransactionStatusRoutesApi.prototype.getTransactionStatuses = function (requestParameters, options) {
        var _this = this;
        return (0, exports.TransactionStatusRoutesApiFp)(this.configuration).getTransactionStatuses(requestParameters.transactionHashes, options).then(function (request) { return request(_this.axios, _this.basePath); });
    };
    return TransactionStatusRoutesApi;
}(base_1.BaseAPI));
exports.TransactionStatusRoutesApi = TransactionStatusRoutesApi;

},{"./base":6,"./common":7,"axios":10}],6:[function(require,module,exports){
"use strict";
/* tslint:disable */
/* eslint-disable */
/**
 * Catapult REST Endpoints
 * OpenAPI Specification of catapult-rest
 *
 * The version of the OpenAPI document: 1.0.4
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredError = exports.BaseAPI = exports.COLLECTION_FORMATS = exports.BASE_PATH = void 0;
// Some imports not used depending on template conditions
// @ts-ignore
var axios_1 = __importDefault(require("axios"));
exports.BASE_PATH = "http://localhost:3000".replace(/\/+$/, "");
/**
 *
 * @export
 */
exports.COLLECTION_FORMATS = {
    csv: ",",
    ssv: " ",
    tsv: "\t",
    pipes: "|",
};
/**
 *
 * @export
 * @class BaseAPI
 */
var BaseAPI = /** @class */ (function () {
    function BaseAPI(configuration, basePath, axios) {
        if (basePath === void 0) { basePath = exports.BASE_PATH; }
        if (axios === void 0) { axios = axios_1.default; }
        this.basePath = basePath;
        this.axios = axios;
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }
    return BaseAPI;
}());
exports.BaseAPI = BaseAPI;
;
/**
 *
 * @export
 * @class RequiredError
 * @extends {Error}
 */
var RequiredError = /** @class */ (function (_super) {
    __extends(RequiredError, _super);
    function RequiredError(field, msg) {
        var _this = _super.call(this, msg) || this;
        _this.field = field;
        _this.name = "RequiredError";
        return _this;
    }
    return RequiredError;
}(Error));
exports.RequiredError = RequiredError;

},{"axios":10}],7:[function(require,module,exports){
"use strict";
/* tslint:disable */
/* eslint-disable */
/**
 * Catapult REST Endpoints
 * OpenAPI Specification of catapult-rest
 *
 * The version of the OpenAPI document: 1.0.4
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestFunction = exports.toPathString = exports.serializeDataIfNeeded = exports.setSearchParams = exports.setOAuthToObject = exports.setBearerAuthToObject = exports.setBasicAuthToObject = exports.setApiKeyToObject = exports.assertParamExists = exports.DUMMY_BASE_URL = void 0;
var base_1 = require("./base");
/**
 *
 * @export
 */
exports.DUMMY_BASE_URL = 'https://example.com';
/**
 *
 * @throws {RequiredError}
 * @export
 */
var assertParamExists = function (functionName, paramName, paramValue) {
    if (paramValue === null || paramValue === undefined) {
        throw new base_1.RequiredError(paramName, "Required parameter ".concat(paramName, " was null or undefined when calling ").concat(functionName, "."));
    }
};
exports.assertParamExists = assertParamExists;
/**
 *
 * @export
 */
var setApiKeyToObject = function (object, keyParamName, configuration) {
    return __awaiter(this, void 0, void 0, function () {
        var localVarApiKeyValue, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(configuration && configuration.apiKey)) return [3 /*break*/, 5];
                    if (!(typeof configuration.apiKey === 'function')) return [3 /*break*/, 2];
                    return [4 /*yield*/, configuration.apiKey(keyParamName)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, configuration.apiKey];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    localVarApiKeyValue = _a;
                    object[keyParamName] = localVarApiKeyValue;
                    _b.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
};
exports.setApiKeyToObject = setApiKeyToObject;
/**
 *
 * @export
 */
var setBasicAuthToObject = function (object, configuration) {
    if (configuration && (configuration.username || configuration.password)) {
        object["auth"] = { username: configuration.username, password: configuration.password };
    }
};
exports.setBasicAuthToObject = setBasicAuthToObject;
/**
 *
 * @export
 */
var setBearerAuthToObject = function (object, configuration) {
    return __awaiter(this, void 0, void 0, function () {
        var accessToken, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(configuration && configuration.accessToken)) return [3 /*break*/, 5];
                    if (!(typeof configuration.accessToken === 'function')) return [3 /*break*/, 2];
                    return [4 /*yield*/, configuration.accessToken()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, configuration.accessToken];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    accessToken = _a;
                    object["Authorization"] = "Bearer " + accessToken;
                    _b.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
};
exports.setBearerAuthToObject = setBearerAuthToObject;
/**
 *
 * @export
 */
var setOAuthToObject = function (object, name, scopes, configuration) {
    return __awaiter(this, void 0, void 0, function () {
        var localVarAccessTokenValue, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(configuration && configuration.accessToken)) return [3 /*break*/, 5];
                    if (!(typeof configuration.accessToken === 'function')) return [3 /*break*/, 2];
                    return [4 /*yield*/, configuration.accessToken(name, scopes)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, configuration.accessToken];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    localVarAccessTokenValue = _a;
                    object["Authorization"] = "Bearer " + localVarAccessTokenValue;
                    _b.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
};
exports.setOAuthToObject = setOAuthToObject;
/**
 *
 * @export
 */
var setSearchParams = function (url) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    var searchParams = new URLSearchParams(url.search);
    for (var _a = 0, objects_1 = objects; _a < objects_1.length; _a++) {
        var object = objects_1[_a];
        for (var key in object) {
            if (Array.isArray(object[key])) {
                searchParams.delete(key);
                for (var _b = 0, _c = object[key]; _b < _c.length; _b++) {
                    var item = _c[_b];
                    searchParams.append(key, item);
                }
            }
            else {
                searchParams.set(key, object[key]);
            }
        }
    }
    url.search = searchParams.toString();
};
exports.setSearchParams = setSearchParams;
/**
 *
 * @export
 */
var serializeDataIfNeeded = function (value, requestOptions, configuration) {
    var nonString = typeof value !== 'string';
    var needsSerialization = nonString && configuration && configuration.isJsonMime
        ? configuration.isJsonMime(requestOptions.headers['Content-Type'])
        : nonString;
    return needsSerialization
        ? JSON.stringify(value !== undefined ? value : {})
        : (value || "");
};
exports.serializeDataIfNeeded = serializeDataIfNeeded;
/**
 *
 * @export
 */
var toPathString = function (url) {
    return url.pathname + url.search + url.hash;
};
exports.toPathString = toPathString;
/**
 *
 * @export
 */
var createRequestFunction = function (axiosArgs, globalAxios, BASE_PATH, configuration) {
    return function (axios, basePath) {
        if (axios === void 0) { axios = globalAxios; }
        if (basePath === void 0) { basePath = BASE_PATH; }
        var axiosRequestArgs = __assign(__assign({}, axiosArgs.options), { url: ((configuration === null || configuration === void 0 ? void 0 : configuration.basePath) || basePath) + axiosArgs.url });
        return axios.request(axiosRequestArgs);
    };
};
exports.createRequestFunction = createRequestFunction;

},{"./base":6}],8:[function(require,module,exports){
"use strict";
/* tslint:disable */
/* eslint-disable */
/**
 * Catapult REST Endpoints
 * OpenAPI Specification of catapult-rest
 *
 * The version of the OpenAPI document: 1.0.4
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = void 0;
var Configuration = /** @class */ (function () {
    function Configuration(param) {
        if (param === void 0) { param = {}; }
        this.apiKey = param.apiKey;
        this.username = param.username;
        this.password = param.password;
        this.accessToken = param.accessToken;
        this.basePath = param.basePath;
        this.baseOptions = param.baseOptions;
        this.formDataCtor = param.formDataCtor;
    }
    /**
     * Check if the given MIME is a JSON MIME.
     * JSON MIME examples:
     *   application/json
     *   application/json; charset=UTF8
     *   APPLICATION/JSON
     *   application/vnd.company+json
     * @param mime - MIME (Multipurpose Internet Mail Extensions)
     * @return True if the given MIME is JSON, false otherwise.
     */
    Configuration.prototype.isJsonMime = function (mime) {
        var jsonMime = new RegExp('^(application\/json|[^;/ \t]+\/[^;/ \t]+[+]json)[ \t]*(;.*)?$', 'i');
        return mime !== null && (jsonMime.test(mime) || mime.toLowerCase() === 'application/json-patch+json');
    };
    return Configuration;
}());
exports.Configuration = Configuration;

},{}],9:[function(require,module,exports){
"use strict";
/* tslint:disable */
/* eslint-disable */
/**
 * Catapult REST Endpoints
 * OpenAPI Specification of catapult-rest
 *
 * The version of the OpenAPI document: 1.0.4
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./api"), exports);
__exportStar(require("./configuration"), exports);

},{"./api":5,"./configuration":8}],10:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":12}],11:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var transitionalDefaults = require('../defaults/transitional');
var AxiosError = require('../core/AxiosError');
var CanceledError = require('../cancel/CanceledError');
var parseProtocol = require('../helpers/parseProtocol');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);

    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || transitionalDefaults;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new CanceledError() : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    if (!requestData) {
      requestData = null;
    }

    var protocol = parseProtocol(fullPath);

    if (protocol && [ 'http', 'https', 'file' ].indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData);
  });
};

},{"../cancel/CanceledError":14,"../core/AxiosError":17,"../core/buildFullPath":19,"../defaults/transitional":25,"../helpers/parseProtocol":37,"./../core/settle":22,"./../helpers/buildURL":28,"./../helpers/cookies":30,"./../helpers/isURLSameOrigin":33,"./../helpers/parseHeaders":36,"./../utils":41}],12:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = require('./cancel/CanceledError');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
axios.VERSION = require('./env/data').version;
axios.toFormData = require('./helpers/toFormData');

// Expose AxiosError class
axios.AxiosError = require('../lib/core/AxiosError');

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"../lib/core/AxiosError":17,"./cancel/CancelToken":13,"./cancel/CanceledError":14,"./cancel/isCancel":15,"./core/Axios":16,"./core/mergeConfig":21,"./defaults":24,"./env/data":26,"./helpers/bind":27,"./helpers/isAxiosError":32,"./helpers/spread":38,"./helpers/toFormData":39,"./utils":41}],13:[function(require,module,exports){
'use strict';

var CanceledError = require('./CanceledError');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new CanceledError(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./CanceledError":14}],14:[function(require,module,exports){
'use strict';

var AxiosError = require('../core/AxiosError');
var utils = require('../utils');

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function CanceledError(message) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

module.exports = CanceledError;

},{"../core/AxiosError":17,"../utils":41}],15:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],16:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var buildFullPath = require('./buildFullPath');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

module.exports = Axios;

},{"../helpers/buildURL":28,"../helpers/validator":40,"./../utils":41,"./InterceptorManager":18,"./buildFullPath":19,"./dispatchRequest":20,"./mergeConfig":21}],17:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

var prototype = AxiosError.prototype;
var descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED'
// eslint-disable-next-line func-names
].forEach(function(code) {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = function(error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

module.exports = AxiosError;

},{"../utils":41}],18:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":41}],19:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":29,"../helpers/isAbsoluteURL":31}],20:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var CanceledError = require('../cancel/CanceledError');

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/CanceledError":14,"../cancel/isCancel":15,"../defaults":24,"./../utils":41,"./transformData":23}],21:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'beforeRedirect': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};

},{"../utils":41}],22:[function(require,module,exports){
'use strict';

var AxiosError = require('./AxiosError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
};

},{"./AxiosError":17}],23:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};

},{"../defaults":24,"./../utils":41}],24:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('../utils');
var normalizeHeaderName = require('../helpers/normalizeHeaderName');
var AxiosError = require('../core/AxiosError');
var transitionalDefaults = require('./transitional');
var toFormData = require('../helpers/toFormData');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('../adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('../adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: transitionalDefaults,

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    var isObjectPayload = utils.isObject(data);
    var contentType = headers && headers['Content-Type'];

    var isFileList;

    if ((isFileList = utils.isFileList(data)) || (isObjectPayload && contentType === 'multipart/form-data')) {
      var _FormData = this.env && this.env.FormData;
      return toFormData(isFileList ? {'files[]': data} : data, _FormData && new _FormData());
    } else if (isObjectPayload || contentType === 'application/json') {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: require('./env/FormData')
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"../adapters/http":11,"../adapters/xhr":11,"../core/AxiosError":17,"../helpers/normalizeHeaderName":34,"../helpers/toFormData":39,"../utils":41,"./env/FormData":35,"./transitional":25,"_process":4}],25:[function(require,module,exports){
'use strict';

module.exports = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

},{}],26:[function(require,module,exports){
module.exports = {
  "version": "0.27.2"
};
},{}],27:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],28:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":41}],29:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],30:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":41}],31:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

},{}],32:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};

},{"./../utils":41}],33:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":41}],34:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":41}],35:[function(require,module,exports){
// eslint-disable-next-line strict
module.exports = null;

},{}],36:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":41}],37:[function(require,module,exports){
'use strict';

module.exports = function parseProtocol(url) {
  var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
};

},{}],38:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],39:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

var utils = require('../utils');

/**
 * Convert a data object to FormData
 * @param {Object} obj
 * @param {?Object} [formData]
 * @returns {Object}
 **/

function toFormData(obj, formData) {
  // eslint-disable-next-line no-param-reassign
  formData = formData || new FormData();

  var stack = [];

  function convertValue(value) {
    if (value === null) return '';

    if (utils.isDate(value)) {
      return value.toISOString();
    }

    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  function build(data, parentKey) {
    if (utils.isPlainObject(data) || utils.isArray(data)) {
      if (stack.indexOf(data) !== -1) {
        throw Error('Circular reference detected in ' + parentKey);
      }

      stack.push(data);

      utils.forEach(data, function each(value, key) {
        if (utils.isUndefined(value)) return;
        var fullKey = parentKey ? parentKey + '.' + key : key;
        var arr;

        if (value && !parentKey && typeof value === 'object') {
          if (utils.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (utils.endsWith(key, '[]') && (arr = utils.toArray(value))) {
            // eslint-disable-next-line func-names
            arr.forEach(function(el) {
              !utils.isUndefined(el) && formData.append(fullKey, convertValue(el));
            });
            return;
          }
        }

        build(value, fullKey);
      });

      stack.pop();
    } else {
      formData.append(parentKey, convertValue(data));
    }
  }

  build(obj);

  return formData;
}

module.exports = toFormData;

}).call(this)}).call(this,require("buffer").Buffer)
},{"../utils":41,"buffer":2}],40:[function(require,module,exports){
'use strict';

var VERSION = require('../env/data').version;
var AxiosError = require('../core/AxiosError');

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

},{"../core/AxiosError":17,"../env/data":26}],41:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

// eslint-disable-next-line func-names
var kindOf = (function(cache) {
  // eslint-disable-next-line func-names
  return function(thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
})(Object.create(null));

function kindOfTest(type) {
  type = type.toLowerCase();
  return function isKindOf(thing) {
    return kindOf(thing) === type;
  };
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (kindOf(val) !== 'object') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(thing) {
  var pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
    toString.call(thing) === pattern ||
    (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

/**
 * Determine if a value is a URLSearchParams object
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 */

function inherits(constructor, superConstructor, props, descriptors) {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function} [filter]
 * @returns {Object}
 */

function toFlatObject(sourceObj, destObj, filter) {
  var props;
  var i;
  var prop;
  var merged = {};

  destObj = destObj || {};

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if (!merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/*
 * determines whether a string ends with the characters of a specified string
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 * @returns {boolean}
 */
function endsWith(str, searchString, position) {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  var lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object
 * @param {*} [thing]
 * @returns {Array}
 */
function toArray(thing) {
  if (!thing) return null;
  var i = thing.length;
  if (isUndefined(i)) return null;
  var arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

// eslint-disable-next-line func-names
var isTypedArray = (function(TypedArray) {
  // eslint-disable-next-line func-names
  return function(thing) {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM,
  inherits: inherits,
  toFlatObject: toFlatObject,
  kindOf: kindOf,
  kindOfTest: kindOfTest,
  endsWith: endsWith,
  toArray: toArray,
  isTypedArray: isTypedArray,
  isFileList: isFileList
};

},{"./helpers/bind":27}],"/node_modules/@nemtus/symbol-sdk-openapi-generator-typescript-axios":[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./api"), exports);

},{"./api":9}]},{},[]);
