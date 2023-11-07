/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass, SMAAEffect, ChromaticAberrationEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { Observer } from "gsap/Observer";
import { DoubleSide, EquirectangularRefractionMapping } from 'three';
import { AnimationUtils } from 'three';

const canvas = document.querySelector('.canvas');
gsap.registerPlugin(Observer);

let scene, camera, renderer, controls, composer, mixer;

let loaderAnim, revealAnim, firstAnim;
let mesh, envMap;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);
const clock = new THREE.Clock();

//play animations
let animations = [];
let currentIndex = 0;
let wrap;

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

    mixer = new THREE.AnimationMixer(mesh);



    let loader = THREE.AnimationUtils.subclip(gltf.animations[0], "2", 100 , 150)
    let scroll1 = THREE.AnimationUtils.subclip(gltf.animations[0], "3", 150 , 237)
    let scroll2 = THREE.AnimationUtils.subclip(gltf.animations[0], "4", 237 , 327)
    let scroll3 = THREE.AnimationUtils.subclip(gltf.animations[0], "5", 327 , 421)
    let scroll4 = THREE.AnimationUtils.subclip(gltf.animations[0], "6", 421 , 515)
    let scroll5 = THREE.AnimationUtils.subclip(gltf.animations[0], "7", 515 , 571)


    let clips = [loader, scroll1,scroll2,scroll3,scroll4,scroll5];

    
    for(let i = 0; i < clips.length; i++){
        animations[i] = mixer.clipAction(clips[i])
        animations[i].setLoop(THREE.LoopOnce);
        animations[i].clampWhenFinished = true;
        
      
    }

    animations[0].play();

  

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


    // controls.enabled = false;

    


    addObserver();

    
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





    // const directionalLight = new THREE.DirectionalLight(0xffffff,0.2);
    // directionalLight.position.set(1, 1, 0);
    // directionalLight.castShadow = true;
    // scene.add(directionalLight);

    // directionalLight.shadow.mapSize.width = 1024; 
    // directionalLight.shadow.mapSize.height = 1024;
    // directionalLight.shadow.camera.near = 0.5; 
    // directionalLight.shadow.camera.far = 50;
    // directionalLight.shadow.radius = 100;
    // directionalLight.shadow.blurSamples = 25;

    // mesh.receiveShadow = true;
    scene.add(mesh);

    animate();
}

function addObserver(){
    wrap = gsap.utils.wrap(0, animations.length);
    gsap.registerPlugin(Observer);
    
    Observer.create({
        type: "wheel,touch,pointer",
        wheelSpeed: -1,
        onDown: () => {
            if(!animations[currentIndex].isRunning()){
                playAnimation(currentIndex - 1, -1)
            }
        },
        onUp: () => {
            if(!animations[currentIndex].isRunning()){
                 playAnimation(currentIndex + 1, 1)
            }
        },
        tolerance: 10,
        preventDefault: true
      });    
}


function playAnimation(index, direction){
    
    index = wrap(index);
    
    if(currentIndex == animations.length - 1 && direction > 0 || !currentIndex && direction < 0 ) return false;
    
    currentIndex = index;
    console.log(currentIndex);
    animations[index].play();
   
 

   

}
  

function animate() {
    const deltaTime = clock.getDelta();

    mixer.update(deltaTime);

    requestAnimationFrame(animate);
    // renderer.render(scene, camera);
    composer.render();    
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

