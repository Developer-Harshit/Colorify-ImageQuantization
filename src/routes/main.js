import { sort as fastsort } from "fast-sort";

import {
  TextureLoader,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
} from "three";
/*#__PURE__*/
function luminance(c) {
  // return (c.r + c.b + c.g) / 3.0
  return c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
}
class Manipulator {
  constructor(_imgid, _store) {
    this.imgid = _imgid;

    this.store = _store;

    this.loader = new TextureLoader();
    this.camera = new PerspectiveCamera();
    this.camera.position.z = 1;
    this.frameCount = 0;

    this.initilized = false;
    this.loop = true;
    this.store.loaded.value = true;
  }
  getImage() {
    return this.renderer.domElement.toDataURL();
  }
  _getRes() {
    let w = this.imageElement.naturalWidth;
    let h = this.imageElement.naturalHeight;
    const pixCount = w * h;
    const result = {
      w,
      h,
    };

    if (pixCount > 4000000 && this.store.resmode.value == 1) {
      const fac = 8000000 / pixCount;
      result.w *= fac / 2;
      result.h *= fac / 2;
    }

    return result;
  }
  saveImage(imgelemnet) {
    imgelemnet.src = this.renderer.domElement.toDataURL();
    imgelemnet.scrollIntoView(true);
    this.store.finished.value = true;
    const downloadAnchor = document.getElementById("download-" + this.imgid);

    downloadAnchor.href = imgelemnet.src;
    if (downloadAnchor) {
    }
  }
  resizeCanvas() {
    const dimension = this._getRes();
    this.renderer.setSize(dimension.w, dimension.h);
  }
  setShader(m_type, paletteSize) {
    const modes = [
      `gl_FragColor = nearestColor(c0,u_palette);`,
      `gl_FragColor = quantByPalette(c0,u_palette);`,
      `gl_FragColor = quantGray(c0,${paletteSize}.0);`,
    ];
    this.vertexShader = `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
      `;
    this.fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D u_texture;    
      uniform vec3 u_palette[${paletteSize}];
      
      
      
      float luminance(vec4 c){
          // return (c.r + c.b + c.g)/3.0;
          return c.r * 0.2126  + c.g * 0.7152 + c.b * 0.0722;
      }
      vec4 quantGray(vec4 c,float n){
          
          float i = ( round(luminance(c) * n) / n);
          return vec4(vec3(i),1.0);
      }
      vec4 quantByPalette(vec4 c , vec3 p[${paletteSize}]){
          highp int i =  int(round(luminance(c) * ${paletteSize - 1}.0));
          return vec4(p[i],1.0);
      }
      
      float distSQ(vec3 p1 ,vec3 p2){
          vec3 distanceVector = p2 - p1;
          return dot(distanceVector, distanceVector);
      }
      
      vec4 nearestColor(vec4 c, vec3 p[${paletteSize}]){
          float d = 1000000000.0;
          vec3 cr = vec3(1.0);
          for(int i=0;i<${paletteSize};++i){
              
              float mydist = distSQ(c.rgb,p[i]) ;
              if(d > mydist){
                  d = mydist;
                  cr = p[i];
              }
          }
          return vec4(cr,1.0);
      }
      void main() {
        
          vec4 c0 = texture2D(u_texture,vUv); 
          ${modes[m_type]}
      }  
      `;
  }

  createPalette() {
    this.myPalette = [];
    for (let i = 0; i < this.store.palette.length; i++) {
      this.myPalette.push(new Color(this.store.palette[i]));
    }
    this.myPalette = fastsort(this.myPalette).asc((u) => luminance(u));
  }
  bindLoop(startButton) {
    startButton.addEventListener("click", this.animate.bind(this), {
      once: true,
    });
  }
  init() {
    if (this.initilized) {
      this.resetScene();
      return;
    }

    this.imageElement = document.getElementById(this.imgid);
    this.renderer = new WebGLRenderer({ antialias: true });

    this.resetScene();
    this.renderer.setPixelRatio(1);

    this.initilized = true;
  }
  animate() {
    if (this.loop && this.frameCount < 10)
      requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);

    if (this.frameCount == 20) {
      alert("You got slow connection,try again");
      this.loop = false;
    }
  }
  resetScene() {
    this.store.finished.value = false;

    this.createPalette();
    this.setShader(this.store.rmode.value, this.store.palette.length);
    this.frameCount = 0;
    this.loop = true;
    this.scene = new Scene();
    this.createMesh();
    this.resizeCanvas();
  }
  createMesh() {
    this.texture = this.loader.load(this.imageElement.src);
    this.texture.matrixAutoUpdate = false;
    let shaderUniforms = {
      u_texture: { value: this.texture },
      u_palette: { value: this.myPalette },
    };

    this.planeMesh = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
      }),
    );
    this.scene.add(this.planeMesh);
    // to avoid extra zooming
    this.planeMesh.position.set(0, 0, -0.072);
    const that = this;
    this.planeMesh.onAfterRender = function (_renderer, _scene) {
      if (that.texture.image) {
        that.saveImage(that.imageElement);
        that.loop = false;
      }

      that.frameCount += 1;
    };
  }
}

export default Manipulator;