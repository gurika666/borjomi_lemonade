/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass, SMAAEffect, ChromaticAberrationEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const canvas = document.querySelector('.canvas');

let scene, camera, renderer, composer, mixer, action, animations;

let mesh, envMap;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);
const clock = new THREE.Clock();
gsap.registerPlugin(ScrollTrigger);


manager.onLoad = function (){
  godswork();
};


hdriloader.load('images/hdri_05.hdr', function(hdri) {
  envMap = hdri;
  envMap.mapping = THREE.EquirectangularReflectionMapping
});

sceneloader.load('mesh/Cans.glb', function(gltf){
    mesh = gltf.scene;
    camera = gltf.cameras[0];
    animations = gltf.animations;

    mixer = new THREE.AnimationMixer(mesh);  
    
    action = mixer.clipAction(animations[0]);    
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
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


function animate() {
    const deltaTime = clock.getDelta();
    
    if(mixer!= null)mixer.update(deltaTime);
    
    requestAnimationFrame(animate);
    composer.render();    

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
        end: "+=5000%",
        scrub: true,
        onUpdate: function () {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      }
    });

    gsap.to(proxy, {
        time: 5,
        duration: 5,
        onUpdate: function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        onComplete:()=>{
            document.body.classList.remove('no-scroll');
            scrollingTL.fromTo(proxy, {time: 5},{time: clip.duration});
        }
    });
}    


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

