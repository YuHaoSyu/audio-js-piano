class Piano {
  constructor() {
    this.keys = new Map([
      ['black', []],
      ['white', []]
    ])
  }
  pitch(i) {
    return String.fromCharCode(65 + (i % 7))
  }
  frequency(i) {
    return ((440 * Math.pow(2, (i - 49) / 12) * 10000) | 0) / 10000
  }
  init({ ww, wh, whiteK, blackK, allKeys, alignCenter }) {
    let offsetI = 1
    for (let i = allKeys; i--; ) {
      const x = i * whiteK.w + alignCenter
      const y = wh - whiteK.h
      if ([1, 4].includes(i % 7)) offsetI += 1

      const keyData = {
        x1: x,
        x2: x + whiteK.w,
        y1: y,
        y2: y + whiteK.h,
        pitch: this.pitch(i) + (((i + 5) / 7) | 0),
        hz: this.frequency(i * 2 + offsetI - 15)
      }

      this.keys.get('white').push(keyData)
    }
    offsetI = 2
    for (let i = allKeys - 1; i--; ) {
      const x = i * whiteK.w + whiteK.w - blackK.w / 2 + alignCenter
      const y = wh - whiteK.h
      if ([1, 4].includes(i % 7)) {
        offsetI += 1
        continue
      }

      const keyData = {
        x1: x,
        x2: x + blackK.w,
        y1: y,
        y2: y + blackK.h,
        pitch: this.pitch(i) + '♯/' + this.pitch(i + 1) + '♭',
        hz: this.frequency(i * 2 + offsetI - 15)
      }
      this.keys.get('black').push(keyData)
    }
    return this.keys
  }

  /* prettier-ignore */
  matchKey({ clientX, clientY, offsetTop }) {
    const top =  clientY - offsetTop
    for (const [type, keys] of this.keys) {
      const matched = keys.filter(({ x1, x2, y1, y2 }) =>
          y1 < top && top < y2 && x1 < clientX && clientX < x2
        )[0]
      if (matched) return matched
    }
  }
}
let piano
self.addEventListener('message', function (e) {
  /* prettier-ignore */
  ({
    init() {
      piano = new Piano()
      const keys = piano.init(e.data.send)
      self.postMessage({ method: 'draw', send:{ keys } })
    },
    matchKey() {
      const key = piano.matchKey(e.data.send)
      self.postMessage({ method: 'cacheKey', send:{ key } })
    }
  }[e.data.method]())
})
