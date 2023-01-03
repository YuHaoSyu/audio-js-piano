const worker = new Worker('./js/worker.js')
const cvs = document.getElementById('piano')
const c = cvs.getContext('2d')
const ww = (cvs.width = innerWidth)
const wh = (cvs.height = 180)

class Piano {
  constructor() {
    const whiteK = { w: 26, h: 180 }
    const blackK = { w: 20, h: 120 }
    const allKeys = Math.ceil(ww / whiteK.w) > 52 ? 52 : Math.ceil(ww / whiteK.w)
    const alignCenter = (ww - allKeys * whiteK.w) / 2
    this.whiteK = whiteK
    this.blackK = blackK
    this.top = wh - whiteK.h
    this.keyInfo = null
    worker.postMessage({
      method: 'init',
      send: { ww, wh, whiteK, blackK, allKeys, alignCenter }
    })

    this.actx = new AudioContext()
    this.oscArr = []
    this.oscTimes = 0
  }

  draw(keyboard) {
    c.strokeStyle = '#000'
    c.font = '20px '

    for (const [type, keys] of keyboard) {
      c.fillStyle = type
      for (const key of keys) {
        if (type === 'white') {
          c.strokeRect(key.x1, key.y1, this.whiteK.w, this.whiteK.h)
        }
        c.fillRect(key.x1, key.y1, this[type + 'K'].w, this[type + 'K'].h)
        if (type === 'white') {
          c.strokeText(
            key.pitch,
            key.x1 + this.whiteK.w / 2 - 5,
            key.y1 + this.blackK.h + 30
          )
        }
      }
    }
  }
  get waveform() {
    const WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle']
    const { value } = document.getElementById('waveform')
    return WAVEFORMS[value]
  }

  get osc() {
    const { actx } = this
    const unionwidthVal = document.getElementById('unionwidth').value
    const osc = actx.createOscillator()
    osc.frequency.value = this.keyInfo.hz
    osc.type = this.waveform
    osc.detune.value = unionwidthVal - this.oscTimes * unionwidthVal
    return osc
  }

  cacheKey(key) {
    this.keyInfo = key
    const { actx } = this

    for (let i = 3; i--; ) {
      this.oscTimes++
      const { osc } = this
      osc.connect(actx.destination)
      this.oscArr.push(osc)
      osc.start()
      osc.stop(actx.currentTime + 0.3)
    }
    this.oscTimes = 0
  }

  // ADSR({ hz }) {
  //   const ADSR = { attack: 0.2, decay: 0, sustain: 1, release: 0.3 }
  //   const STATGE_MAX_TIME = 2
  //   const node = this.actx.createGain()
  //   node.gain.cancelScheduledValues()

  //   const osc = this.createOsc(gainNode, 0)
  //   // ATTACK -> DECAY -> SUSTAIN
  //   const now = this.actx.currentTime
  //   const atkDuration = ADSR.attack * STATGE_MAX_TIME
  //   const atkEndTime = now + atkDuration
  //   const decayDuration = ADSR.decay * STATGE_MAX_TIME
  //   node.gain.setValueAtTime(0, this.actx.currentTime)
  //   node.gain.linearRampToValueAtTime(1, atkEndTime)
  //   node.gain.setTargetAtTime(ADSR.sustain, atkEndTime, decayDuration)

  //   // gainNode.gain.value = 0
  //   // gainNode.connect(this.actx.destination)
  // }

  press({ clientX, clientY }) {
    worker.postMessage({
      method: 'matchKey',
      send: { offsetTop: cvs.offsetTop, clientX, clientY }
    })
  }
}
const piano = new Piano()

worker.addEventListener('message', ({ data: { method, send } }) => {
  /* prettier-ignore */
  ({
    draw() {
      const map2obj = Object.fromEntries(send.keys)
      const obj2arr = Object.entries(map2obj)
      piano.draw(obj2arr.reverse())
    },
    cacheKey() {
      piano.cacheKey(send.key)
    }
  }[method]())
})

cvs.addEventListener('mousedown', piano.press.bind(piano))
// cvs.addEventListener('mouseup', piano.findNoteInfo.bind(piano))

/**
 *  e.g
 *  -  oscillator.frequency.value
 *  -  gainNode.gain.value
 *  -  biquadFilterNode.Q.value
 **/
/**
 *  AudioParam.value = value
 *  AudioParam.setValueAtTime()
 *  AudioParam.linearRampToValueAtTime()
 *  AudioParam.exponentialRamToValueAtTime()
 *  AudioParam.setTargetAtTime()
 *  AudioParam.setValueCurveAtTime()
 *  AudioParam.cancelScheduledValues()
 */
