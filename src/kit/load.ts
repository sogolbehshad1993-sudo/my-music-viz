// Asset loading. Files in public/assets/ are served at /assets/...
//   const gltf = await load.gltf('/assets/chair.glb'); ctx.scene.add(gltf.scene)
//   ctx.scene.environment = await load.hdr('/assets/studio.hdr')
//   const tex = await load.texture('/assets/paper.jpg')
import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const draco = new DRACOLoader().setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/')
const gltfLoader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)

export const load = {
  gltf: (url: string) => gltfLoader.loadAsync(url),
  texture: async (url: string) => {
    const tex = await new THREE.TextureLoader().loadAsync(url)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  },
  hdr: async (url: string) => {
    const tex = await new HDRLoader().loadAsync(url)
    tex.mapping = THREE.EquirectangularReflectionMapping
    return tex
  },
}
