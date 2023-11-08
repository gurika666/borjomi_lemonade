/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass, SMAAEffect, ChromaticAberrationEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const canvas = document.querySelector('.canvas');

let scene, camera, renderer, composer, mixer , action,canmat, animations;
let mesh, envMap, can;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);
const clock = new THREE.Clock();
let textureLoader = new THREE.TextureLoader()

gsap.registerPlugin(ScrollTrigger);


import vertexShader from "../shaders/vertexshader.glsl";
import fragmentShader from "../shaders/fragmentShader.glsl";
let mandarinBase = textureLoader.load("/images/mandarin_basecolor.jpg");
mandarinBase.flipY = false;
mandarinBase.colorSpace = THREE.SRGBColorSpace;
let mandarinMetal = textureLoader.load("/images/mandarin_metal.jpg");
mandarinMetal.flipY = false;
let tarkhunbase = textureLoader.load("/images/tarkhun_basecolor.jpg");
tarkhunbase.flipY = false;
tarkhunbase.colorSpace = THREE.SRGBColorSpace;
let tarkhunmetal = textureLoader.load("/images/tarkhun_metal.jpg");
tarkhunmetal.flipY = false;
let pearbase = textureLoader.load("/images/pear_basecolor.jpg");
pearbase.flipY = false;
pearbase.colorSpace = THREE.SRGBColorSpace;
let pearmetal = textureLoader.load("/images/pear_metal.jpg");
pearmetal.flipY = false;
let citrusbase = textureLoader.load("/images/citrus_basecolor.jpg");
citrusbase.flipY = false;
citrusbase.colorSpace = THREE.SRGBColorSpace;
let citrusmetal = textureLoader.load("/images/citrus_metal.jpg");
citrusmetal.flipY = false;


manager.onLoad = function (){

  window.scrollTo(0,0)
  godswork();
};



hdriloader.load('images/hdri_05.hdr', function(hdri) {
  envMap = hdri;
  envMap.mapping = THREE.EquirectangularReflectionMapping
  
});

sceneloader.load('mesh/Cans.glb', function(gltf){
    gltf.scene.traverse((child) => {
        if(child.name == "Can"){  
      
          canmat = new THREE.MeshPhysicalMaterial({
            map: mandarinBase,
            envMap: envMap,
            roughnessMap: mandarinMetal,
            metalness: .6,
          })
          child.material = canmat
          
        }
        if(child.name == "Tarkhun"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: tarkhunbase,
            envMap: envMap,
            roughnessMap: tarkhunmetal,
            metalness: .6,
          })
          child.material = material
          
        }
        if(child.name == "Citrus"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: citrusbase,
            envMap: envMap,
            roughnessMap: citrusmetal,
            metalness: .6,
          })
          child.material = material
          
        }
        if(child.name == "Pear"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: pearbase,
            envMap: envMap,
            roughnessMap: pearmetal,
            metalness: .6,
          })
          child.material = material
          
        }
    })
            
  mesh = gltf.scene;
  camera = gltf.cameras[0];
  animations = gltf.animations;

  mixer = new THREE.AnimationMixer(mesh);  

  action = mixer.clipAction(animations[0]);
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.timeScale = 0.6

  action.play();

});


function godswork() {
  scene = new THREE.Scene();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize);
      
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  scene.environment = envMap;
  // scene.background = envMap;
  

  
    
//PP
  const renderpass = new RenderPass(scene, camera);
  const parameters = {minFilter: THREE.LinearFilter,magFilter: THREE.LinearFilter,format: THREE.RGBAFormat,type: THREE.FloatType};
  const renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, parameters );
  composer = new EffectComposer(renderer, renderTarget);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(renderpass);
  composer.addPass(new EffectPass(camera, new BrightnessContrastEffect({ brightness: -0.05, contrast: 0.01 })));
  composer.addPass(new EffectPass(camera, new SMAAEffect()));
  composer.addPass(new EffectPass(camera, new ChromaticAberrationEffect({offset: new THREE.Vector2(0.0002, 0.0002)})));

  // const light = new THREE.AmbientLight(10)
  // scene.add(light)
  scene.add(mesh);

  createAnimation(mixer, action, animations[0]);
  
  animate();
  changeShader();
}


function animate() {
    const deltaTime = clock.getDelta();
    
    if(mixer!= null)mixer.update(deltaTime);
    
    requestAnimationFrame(animate);
    // renderer.render(scene, camera);
    composer.render(); 
    const elapsedTime = clock.getElapsedTime();

    // canmat.uniforms.blendValue.value = (Math.sin(elapsedTime) + 1) / 2;
    // canmat.uniforms.blendValue.value += 0.1;
    // console.log(canmat.uniforms.blendValue.value)

}


function createAnimation(mixer, action, clip) {
    let proxy = {
      get time() {
        return mixer.time;
      },
      set time(value) {
        action.paused = false;
        mixer.setTime(value);
        action.paused = true;
      }
    };
    
    let scrollingTL = gsap.timeline({
      scrollTrigger: {
        trigger: canvas,
        start: "top top",
        endTrigger: ".container-end",
        scrub: true,
        onUpdate: function () {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      }
    });

    gsap.to(proxy, {
        time: 6,
        duration: 6,
        onUpdate: function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        onComplete:()=>{
            document.body.classList.remove('no-scroll');
            scrollingTL.fromTo(proxy, {time: 6},{time: 35});
        }
    });
}    

function changeShader(){
  ScrollTrigger.create({
    trigger: ".container2",
    start: "top bottom",
    end: "bottom bottom",
    // markers: true,
    onUpdate: (self) => {
      // console.log(
      //   "progress:",
      //   self.progress.toFixed(3),
      //   "direction:",
      //   self.direction,
      //   "velocity",
      //   self.getVelocity()
      // );
      // canmat.uniforms.blendValue.value = self.progress.toFixed(3),
      // console.log(canmat.uniforms.blendValue.value)
    },
  });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

