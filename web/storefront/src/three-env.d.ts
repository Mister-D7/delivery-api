declare module 'three' {
  const three: any;
  export = three;
  export as namespace THREE;
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  export class GLTFLoader {
    load(url: string, onLoad?: (gltf: any) => void, onProgress?: (e: any) => void, onError?: (e: any) => void): void;
    loadAsync(url: string, onProgress?: (e: any) => void): Promise<any>;
  }
}

declare module 'three/examples/jsm/environments/RoomEnvironment.js' {
  export class RoomEnvironment {}
}
