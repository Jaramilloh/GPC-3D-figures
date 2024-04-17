// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {RGBELoader} from "../lib/RGBELoader.js";
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, camera, cameraControls;

// Globales del modelo
let fenobot;
let PanelAxisLeft;
let PanelAxisRight;
let TyreFrontLeft;
let TyreFrontRight;
let TyreRearLeft;
let TyreRearRight;
let BaseBrazoRobot;
let Antebrazo1;
let Antebrazo2;
let SoporteHerramientas;
let SoporteBroca;
let SoporteSensor;
let EjeElevadorCamara;
let SoporteCamara;

// Otras globales
let effectController;
var keyMap = [];

// Acciones
init();
loadScene();
setupGui();
render();

function init()
{
    // Instanciar el motor
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar la escena
    scene = new THREE.Scene();

    // Instanciar la camara
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,1000);
    camera.position.set(50,100,50);
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0,0,0);
    camera.lookAt(0,0,0);

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio);
    document.addEventListener("keydown", onDocumentKeyDown, true); 
    document.addEventListener("keyup", onDocumentKeyUp, true);
}

function loadScene()
{

    //https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_gltf.html
    new RGBELoader()
        .setPath( 'textures/equirectangular/' )
        .load( 'flower_road_1k.hdr', function ( texture ) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

            // model
            const loader = new GLTFLoader().setPath( 'models/' );
            loader.load( 'testeo.glb', function ( gltf ) {
                fenobot = gltf.scene;
                fenobot.traverse(function (child) {
                    console.log(child);
                });

                SoporteHerramientas = fenobot.getObjectByName('SoporteHerramientas');
                SoporteBroca = fenobot.getObjectByName('SoporteBroca');
                SoporteSensor = fenobot.getObjectByName('SoporteSensor');

                scene.add( fenobot );
            } );
        } );
    
    scene.add( new THREE.AxesHelper(220) );
}

function render(delta)
{
    requestAnimationFrame(render);

    // actualizar desplazamiento del robot

    // actualizar las animaciones junto con la GUI
    TWEEN.update(delta);

    renderer.render(scene,camera);
}

function updateAspectRatio()
{
    renderer.setSize(window.innerWidth,window.innerHeight);
    const ar = window.innerWidth/window.innerHeight;
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function onDocumentKeyDown(event){ 
    var keyCode = event.keyCode;
    keyMap[keyCode] = true;
}
function onDocumentKeyUp(event){
    var keyCode = event.keyCode;
    keyMap[keyCode] = false;
}


function setupGui()
{
    // Definicion de los controles de la GUI
    effectController = {


        giroSoporteHerramientas: 0.0,
        giroSoporteBroca: 0.0,
        giroSoporteSensor: 0.0

	};

	// Creacion interfaz
	const gui = new GUI();

	// Control raiz
	const h = gui.addFolder("Fenobot");


    // Manejo del brazo robotico
    h.add(effectController, "giroSoporteHerramientas", -180.0, 180.0, 0.025).name("giroSoporteHerramientas").
    listen().onChange( value => {
        //SoporteHerramientas.rotateZ(value*Math.PI/180);
        SoporteHerramientas.rotation.z = value*Math.PI/180; 
    });
    h.add(effectController, "giroSoporteBroca", -180.0, 180.0, 0.025).name("giroSoporteBroca").
    listen().onChange( value => {
        SoporteBroca.rotation.y = value*Math.PI/180; });
    

    
}