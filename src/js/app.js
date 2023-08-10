/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer, EffectPass, BrightnessContrastEffect, RenderPass, SMAAEffect, ChromaticAberrationEffect } from 'postprocessing';
import { gsap } from 'gsap';
import { DoubleSide, EquirectangularRefractionMapping } from 'three';
import { AnimationUtils } from 'three';


const canvas = document.querySelector('.canvas');

let scene, camera, renderer, controls, composer;
let mesh, envMap;
let manager = new THREE.LoadingManager;
let sceneloader = new GLTFLoader(manager);
let hdriloader = new RGBELoader(manager);

manager.onLoad = function (){
  godswork();
  animate();
};
hdriloader.load('images/hdri_05.hdr', function(hdri) {
  envMap = hdri;
  envMap.mapping = THREE.EquirectangularReflectionMapping

  
});

sceneloader.load('mesh/Cans.glb', function(gltf){
  gltf.scene.traverse((child) => {
    if (child.isMesh){

      if(child.name != 'Retopo_Island' ){

      const textureLoader = new THREE.TextureLoader()
      const texture = textureLoader.load('images/aluminum_roughness.jpg')

      const pbrMaterial = new THREE.MeshStandardMaterial();
      pbrMaterial.copy(child.material);

      
      pbrMaterial.map = child.material.map;
      pbrMaterial.roughness = 0.4;
      pbrMaterial.roughnessMap = texture;
      pbrMaterial.metalness = 0.7;
      pbrMaterial.metalnessMap = child.material.metalnessMap;
      
      // pbrMaterial.envMap = envMap;

      // Replace the original material with the PBR material
      child.material = pbrMaterial;
      child.castShadow = true;
      child.receiveShadow = true;

      }else{

        child.receiveShadow = true;
        
      }
    }

    mesh = gltf.scene;

  })
});

function godswork() {
    // Create the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1.5;
    camera.position.y = 0.2;
    // camera.position.x = -0.2;
    // camera.rotation.x = -0.15;
   
    renderer = new THREE.WebGLRenderer({antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    THREE.ColorManagement.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

  
    scene.environment = envMap;
    // scene.background = envMap;
    scene.background = new THREE.Color(0x93CCC7);


    controls = new OrbitControls(camera, renderer.domElement);
    // controls.enabled = false;


    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    
//PP
    const renderpass = new RenderPass(scene, camera);
    const parameters = {minFilter: THREE.LinearFilter,magFilter: THREE.LinearFilter,format: THREE.RGBAFormat,type: THREE.FloatType};
    const renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, parameters );
    composer = new EffectComposer(renderer, renderTarget);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderpass);
    composer.addPass(new EffectPass(camera, new BrightnessContrastEffect({ brightness: -0.15, contrast: 0.3 })));
    composer.addPass(new EffectPass(camera, new SMAAEffect()));
    composer.addPass(new EffectPass(camera, new ChromaticAberrationEffect({offset: new THREE.Vector2(0.0002, 0.0002)})));





    const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
    directionalLight.position.set(1, 1, 0);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    directionalLight.shadow.mapSize.width = 1024; 
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5; 
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.radius = 10;
    directionalLight.shadow.blurSamples = 25;

    scene.add(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    // renderer.render(scene, camera);
    composer.render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}



