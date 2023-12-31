/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { Observer } from "gsap/Observer";
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass,ChromaticAberrationEffect,FXAAEffect, BloomEffect, DepthOfFieldEffect, BlendFunction } from 'postprocessing';
import {VelocityDepthNormalPass, HBAOEffect, SSGIEffect} from 'realism-effects'

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const canvas = document.querySelector('.canvas');

let scene, camera, renderer, composer, mixer , action,canmat, animations;
let mesh, envMap, can, rotation, dof;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);
const clock = new THREE.Clock();
let textureLoader = new THREE.TextureLoader()

gsap.registerPlugin(ScrollTrigger);


import vertexShader from "../shaders/vertexshader.glsl";
import fragmentShader from "../shaders/fragmentShader.glsl";
import { Vector3 } from 'three';
let mandarinBase = textureLoader.load("/images/mandarin_basecolor.jpg");

let textures = {};
let fruits = [];

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

const loadTextures = [
  {
    name: 'mandarinBase', url: '/images/mandarin_basecolor.jpg'
  },
  {
    name: 'mandarinMetal', url: '/images/mandarin_metal.jpg', metal: true
  },
  {
    name: 'tarkhunbase', url: '/images/tarkhun_basecolor.jpg',
  },
  {
    name: 'tarkhunmetal', url: '/images/tarkhun_metal.jpg', metal: true
  },
  {
    name: 'pearbase', url: '/images/pear_basecolor.jpg'
  },
  {
    name: 'pearmetal', url: '/images/pear_metal.jpg', metal: true
  },
  {
    name: 'citrusbase', url: '/images/citrus_basecolor.jpg'
  },
  {
    name: 'citrusmetal', url: '/images/citrus_metal.jpg', metal: true
  },
]


loadTextures.forEach((texture, i) =>{
  textures[texture.name] = textureLoader.load(texture.url)

  if(!texture.metal){
    textures[texture.name].colorSpace = THREE.SRGBColorSpace;
    textures[texture.name].flipY = false;
  } else {
    textures[texture.name].flipY = false;
  }
})



manager.onLoad = function (){

    window.scrollTo(0,0)
    godswork();
 
};



hdriloader.load('images/hdri_05.hdr', function(hdri) {
  envMap = hdri;
  envMap.mapping = THREE.EquirectangularReflectionMapping

  sceneloader.load('mesh/Cans.glb', function(gltf){
    gltf.scene.traverse((child) => {
      if(child.isMesh){
        if(child.name == "Can"){  
      
          canmat = new THREE.MeshPhysicalMaterial({
            map: textures.mandarinBase,
            envMap: envMap,
            roughnessMap: textures.mandarinMetal,
            metalness: .6,
          })
          child.material = canmat
          can = child;
          
        }
        else if(child.name == "Tarkhun"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: textures.tarkhunbase,
            envMap: envMap,
            roughnessMap: textures.tarkhunmetal,
            metalness: .6,
          })
          child.material = material
          
        }
        else if(child.name == "Citrus"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: textures.citrusbase,
            envMap: envMap,
            roughnessMap: textures.citrusmetal,
            metalness: .6,
          })
          child.material = material
          
        }
        else if(child.name == "Pear"){  
      
          const material = new THREE.MeshPhysicalMaterial({
            map: textures.pearbase,
            envMap: envMap,
            roughnessMap: textures.pearmetal,
            metalness: .6,
          })
          child.material = material
          
        }else if (!child.name.includes("_metal") ){
          fruits.push(child);
        }}
    })
            
  mesh = gltf.scene;
  camera = gltf.cameras[0];
  animations = gltf.animations;

  mixer = new THREE.AnimationMixer(mesh); 


  action = mixer.clipAction(animations[0]);
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.timeScale = 1 
  action.play();

  
  });
});


function godswork() {
  scene = new THREE.Scene();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
      
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  // scene.fog = new THREE.Fog(0x3d0000, 2, 4.1);

  scene.environment = envMap;
  scene.background = new THREE.Color(0xffd000)
  // scene.background = envMap;

  // const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera)
  
   rotation = 0
   

   
    
  //PP
  const renderpass = new RenderPass(scene, camera);
  const parameters = {minFilter: THREE.LinearFilter,magFilter: THREE.LinearFilter,format: THREE.RGBAFormat,type: THREE.FloatType};
  const renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, parameters );
  composer = new EffectComposer(renderer, renderTarget);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(renderpass);
  
  // composer.addPass(new EffectPass(camera, new BrightnessContrastEffect({ brightness: -0.05, contrast: 0.01 })));
  
  
  dof = new DepthOfFieldEffect(camera, { resolutionScale: 1, worldFocusDistance: 2.5, worldFocusRange: 0.7, bokehScale: 3});
  // composer.addPass(new EffectPass(camera, dof))
  
  composer.addPass(new EffectPass(camera, new BloomEffect({intensity: 0.1,  radius: 0.6})));

  // composer.addPass(new EffectPass(camera, new ChromaticAberrationEffect({offset: new THREE.Vector2(0.0001, 0.0001)})));
  composer.addPass(new EffectPass(camera, new FXAAEffect()));


 


  const light = new THREE.PointLight(0xffffff, 0.5)
  light.position.y = 4
  light.position.z = -1
  // light.castShadow = true
  scene.add(light)

  scene.add(mesh);

 

  createAnimation(mixer, action, animations[0]);
  
  animate();
  // changeShader();
}


function animate() {


    const deltaTime = clock.getDelta();
    
    if(mixer!= null)mixer.update(deltaTime);
    
    requestAnimationFrame(animate);
    // renderer.render(scene, camera);
    composer.render(); 
    // const elapsedTime = clock.getElapsedTime();
    
    fruits.forEach((fruit, index)=>{
      fruit.rotation.y += 0.01
    })
    
    fruits.forEach((fruit) => {
      // if (fruit.userData.velocity) {
        //   fruit.position.add(fruit.userData.velocity);
        // }
        if (fruit.userData.angularVelocity) {
          fruit.rotation.x += fruit.userData.angularVelocity.x;
          fruit.rotation.y += fruit.userData.angularVelocity.y;
          fruit.rotation.z += fruit.userData.angularVelocity.z;
          dampenAngularVelocity(fruit, 0.98); // Adjust the damping factor as needed
        }
        
        
      })
      
    

}

function onMouseMove(event) {
  // Calculate mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with the cube
  const intersects = raycaster.intersectObjects(fruits);

  if (intersects.length > 0) {
    // Mouse is over the cube, trigger the impulse
    const impulseForce = { x: 0.1, y: 0.1, z: 0.0}; // Adjust the force as needed
    intersects.forEach((intersect) => {
      applyImpulse(intersect.object, impulseForce);
    });
  }
}
function applyImpulse(object, force) {
  // Simulate an impulse by updating the velocity or position
  object.userData.angularVelocity = new THREE.Vector3(force.x, force.y, force.z);
}

function dampenAngularVelocity(object, dampingFactor) {
  if (object.userData.angularVelocity) {
    object.userData.angularVelocity.multiplyScalar(dampingFactor);
  }
}

const scrollOptions = [
  {
    current: 2,
    next: 4,
  },
  {
    prevous:2,
    current: 4,
    next: 6,
    texture: textures.mandarinBase
  },
  {
    prevous: 4,
    current: 6,
    next: 8,
    texture: textures.pearbase,
  },
  {
    prevous: 6,
    current: 8,
    next: 10,
    texture: textures.citrusbase,
  },
  {
    prevous: 8,
    current: 10,
    next: 12,
    texture: textures.tarkhunbase
  },
  {
    prevous: 10,
    current: 12,
    // texture: 
  },
]


let animating = true;
let currentIndex = 0;
let wrap = gsap.utils.wrap(0, scrollOptions.length);


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
  

    gsap.to(proxy, {
      time: 2,
      duration: 2,
      ease: "sine.out",
      onUpdate: ()=>{
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
      },
      onComplete:()=>{
        animating = false;
        Observer.create({
          type: "wheel,touch,pointer",
          wheelSpeed: -1,
          onDown: () => !animating && changeCanPosition(currentIndex - 1, -1, proxy),
          onUp: () => !animating && changeCanPosition(currentIndex + 1, 1, proxy),
          tolerance: 10,
          preventDefault: true
        });
      },
    });
}    


function changeCanPosition(index, direction, proxy){

  if(direction > 0 && scrollOptions[currentIndex].next ||  direction < 0 && scrollOptions[currentIndex].prevous){
    index = wrap(index);
    animating = true;

    gsap.fromTo(proxy, {
      time: scrollOptions[currentIndex].current,
     
    },
    {
      time: direction > 0 ? scrollOptions[currentIndex].next : scrollOptions[currentIndex].prevous,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: ()=>{
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      onStart: ()=>{
        setTimeout(() => {
          if(scrollOptions[currentIndex + direction].texture) canmat.map = scrollOptions[currentIndex + direction].texture
        }, 1050);
      },
      onComplete:()=>{
        currentIndex = index;
        animating = false;
    }
    });
  }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

