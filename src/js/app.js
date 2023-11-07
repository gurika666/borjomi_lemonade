/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass, SMAAEffect, ChromaticAberrationEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


const canvas = document.querySelector('.canvas');


let scene, camera, renderer, composer, mixer, firstaction, action,canmat;


let mesh, envMap;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);
const clock = new THREE.Clock();
let textureLoader = new THREE.TextureLoader()


//play animations
let animations = [];
let scrollanim = true;
let stopped = false;

import vertexShader from "../shaders/vertexshader.glsl";
import fragmentShader from "../shaders/fragmentShader.glsl";
let texture1 = textureLoader.load("/images/Tarkhun_Basecolor.jpg");
let texture2 = textureLoader.load("/images/Mandarin_Basecolor.jpg");

manager.onLoad = function (){
  godswork();
};
hdriloader.load('images/hdri_05.hdr', function(hdri) {
  envMap = hdri;
  envMap.mapping = THREE.EquirectangularReflectionMapping

  
});

sceneloader.load('mesh/Cans.glb', function(gltf){
    gltf.scene.traverse((child) => {
        if(child.name == "Can"){
            canmat = new THREE.ShaderMaterial({
              uniforms:{
                texture1: { value: texture1 },
                texture2: { value: texture2 },
                blendValue: { value: 0 }, // Initialize with a blend value
              },
              vertexShader: vertexShader,
              fragmentShader:fragmentShader
            })
            child.material = canmat
            // child.material.texture = texture1
        }
    })
     

            
    mesh = gltf.scene;
    camera = gltf.cameras[0];
    animations = gltf.animations;

    mixer = new THREE.AnimationMixer(mesh);  


    // let loader = THREE.AnimationUtils.subclip(gltf.animations[0], "loading", 100 , 150)
    // let fullAnim = THREE.AnimationUtils.subclip(gltf.animations[0], "full", 150 , 600)

    // firstaction = mixer.clipAction(loader);
    // firstaction.setLoop(THREE.LoopOnce);
    // firstaction.clampWhenFinished = true;

    // firstaction.play();

    // action = mixer.clipAction(fullAnim);

    action = mixer.clipAction(animations[0]);
    action.timeScale = 0.6
    // action.setLoop(THREE.LoopOnce);
    // action.clampWhenFinished = true;

    action.play();





   

   

});


function godswork() {
    
    scene = new THREE.Scene();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
 
   
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // THREE.ColorManagement.enabled = true;
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
   
    

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

  
    scene.environment = envMap;
    // scene.background = envMap;
    // scene.background = new THREE.Color(0x93CCC7);
    
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

    scene.add(mesh);

   
   
    createAnimation(mixer, action, animations[0]);
   
    animate();
}

gsap.registerPlugin(ScrollTrigger);

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
        trigger: renderer.domElement,
        start: "top top",
        end: "+=5000%",
        pin: true,
        scrub: true,
        markers: true,
        onUpdate: function () {
         
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          console.log(proxy.time)
        }
      }
    });
    scrollingTL.to(proxy, {
        time: clip.duration,
        // repeat: 3,
      });

      
    }


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

