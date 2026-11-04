// Panels and hotkeys. F fullscreen, H hide UI, Space pause, P save a PNG.
import GUI from 'lil-gui'
import { clock, url } from './stage.ts'
import { store } from './store.ts'
import { grab } from './grab.ts'

// Every panel and folder can be collapsed, and remembers whether it was.
export function remember(gui: GUI, key: string) {
  if (store.get(`closed:${key}`, false)) gui.close()
  gui.onOpenClose((changed) => changed === gui && store.set(`closed:${key}`, changed._closed))
  return gui
}

export const createPanel = (title: string) => remember(new GUI({ title }), 'root')

function savePng() {
  grab((copy) => copy.toBlob((blob) => {
    if (!blob) return
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${document.title}-${Date.now()}.png` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }))
}

if (url.get('ui') === '0') document.body.classList.add('ui-hidden')

addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
  if (document.pointerLockElement && e.code !== 'KeyF' && e.code !== 'KeyH') return
  if (e.code === 'KeyF') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  else if (e.code === 'KeyH') document.body.classList.toggle('ui-hidden')
  else if (e.code === 'KeyP') savePng()
  else if (e.code === 'Space') {
    clock.paused = !clock.paused
    e.preventDefault()
  }
})
