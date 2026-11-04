// Real input devices, opened on first use and kept open across scene reloads.
const cc = new Array<number>(128).fill(0)
let midiOpened = false
let analyser: AnalyserNode | undefined
let bins = new Uint8Array(0)
let micOpened = false

export const bands = { level: [20, 8000], low: [20, 250], mid: [250, 2000], high: [2000, 8000] } as const
export type Band = keyof typeof bands

export function midiCC(n: number) {
  if (!midiOpened) {
    midiOpened = true
    navigator.requestMIDIAccess().then((access) => {
      const listen = () => access.inputs.forEach((port) => {
        port.onmidimessage = (e) => {
          const [status, num, v] = e.data ?? []
          if ((status & 0xf0) === 0xb0) cc[num] = v / 127
        }
      })
      listen()
      access.onstatechange = listen
    }).catch((e) => console.warn('MIDI unavailable:', e))
  }
  return cc[n]
}

export function micBand(band: Band) {
  if (!micOpened) {
    micOpened = true
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audio = new AudioContext()
      analyser = audio.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.7
      audio.createMediaStreamSource(stream).connect(analyser)
      bins = new Uint8Array(analyser.frequencyBinCount)
    }).catch((e) => console.warn('Microphone unavailable:', e))
  }
  if (!analyser) return 0
  analyser.getByteFrequencyData(bins)
  const hz = analyser.context.sampleRate / analyser.fftSize
  const [from, to] = bands[band].map((f) => Math.max(1, Math.round(f / hz)))
  let sum = 0
  for (let i = from; i < to; i++) sum += bins[i]
  return sum / ((to - from) * 255)
}
