// Copies the canvas right after a render: WebGPU canvases are only readable in that same task.
import { renderer } from './stage.ts'

const queue: (() => void)[] = []

export function grab(fn: (copy: HTMLCanvasElement) => void, maxWidth = Infinity) {
  queue.push(() => {
    const src = renderer.domElement
    const scale = Math.min(1, maxWidth / src.width)
    const copy = document.createElement('canvas')
    copy.width = Math.round(src.width * scale)
    copy.height = Math.round(src.height * scale)
    copy.getContext('2d')!.drawImage(src, 0, 0, copy.width, copy.height)
    fn(copy)
  })
}

// Called by the frame loop after each render.
export function flushGrabs() {
  for (const fn of queue.splice(0)) fn()
}
