/**
 * Proyecto.js
 * 
 * Seminario GPC. Proyecto: prototipo de robot para fenotipado de cultivos agricolas
 * Autor: Juan Felipe Jaramillo Hernandez
 * Date: 22/10/2022
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {RGBELoader} from "../lib/RGBELoader.js";
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, camera, cameraControls;

// Otras camaras usadas
let cenital, picada, robotCamera;

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
let EjeElevadorCamara;
let SoporteCamara;
let Camara;

// Helpers
let hemiLightHelper, dirLightHelper, helperCentinal, helperPicada, helperRobot;

// Otras globales
let effectController;
var keyMap = [];
let corn;

// Acciones
init();
loadScene();
setupGui();

function init()
{
    // Instanciar el motor
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( new THREE.Color().setHSL( 0.6, 0, 1 ) );
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('container').appendChild( renderer.domElement );
    //document.body.appendChild( renderer.domElement );

    // Instanciar la escena
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( scene.background, 1, 5000 );

    // Agregar iluminacion hemisferica
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.8 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 300, 0 );
    scene.add( hemiLight );
    hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
    scene.add( hemiLightHelper );

    // Agregar iluminacion direccional
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( 750, 1000, 750 );
    scene.add( dirLight );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    const d = 1000;
    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;
    dirLight.shadow.camera.far = 3000;
    dirLight.shadow.bias = - 0.0001;
    dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
    scene.add( dirLightHelper );

    // Instanciar la camara
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,3000);
    camera.position.set(50,300,50);
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.minPolarAngle = 0;
    cameraControls.maxPolarAngle = 96.0*Math.PI/180;
    cameraControls.minDistance = 90;
    cameraControls.maxDistance = 300;
    cameraControls.enablePan = false;
    cameraControls.target.set(0,50,0);
    camera.lookAt(0,50,0);

    // camara ortognal: cenital y con volumen fijo independientemente de la relacion aspecto
    const L = 70;
    const dist = 200;
    cenital = new THREE.OrthographicCamera(-L,L,L,-L,1,dist+10);
    cenital.position.set( 0,dist,0 );
    cenital.up.set( 1,0,0 );
    cenital.lookAt( 0,0,0 );
    helperCentinal = new THREE.CameraHelper( cenital );
    scene.add( helperCentinal );

    // camara ortognal: picada y con volumen fijo independientemente de la relacion aspecto
    picada = new THREE.OrthographicCamera(-20,20,21,-23,-20,120);
    picada.position.set( 70,24,5 );
    picada.up.set( 0,1,0 );
    picada.lookAt( 10,12,-21 );
    helperPicada = new THREE.CameraHelper( picada );
    scene.add( helperPicada );

    // camara perspectiva: vista del robot
    robotCamera = new THREE.PerspectiveCamera(75,1,1,150);
    robotCamera.position.set(0,1,0);
    robotCamera.lookAt(0,0,0);
    robotCamera.rotation.y -= Math.PI/2;
    robotCamera.rotation.x += Math.PI/2;
    robotCamera.updateProjectionMatrix();
    robotCamera.position.set(1,1,0);
    helperRobot = new THREE.CameraHelper( robotCamera );
    scene.add( helperRobot );

    // ocultar todos los helpers
    helperPicada.visible = false;
    hemiLightHelper.visible = false;
    dirLightHelper.visible = false; 
    helperCentinal.visible = false; 
    helperPicada.visible = false;
    helperRobot.visible = false;

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio);
    document.addEventListener("keydown", onDocumentKeyDown, true); 
    document.addEventListener("keyup", onDocumentKeyUp, true);
}

function loadScene()
{

    const loadingManager = new THREE.LoadingManager();

    const progressBar = document.getElementById('progress-bar');
    loadingManager.onProgress = function(url, loaded, total){
        progressBar.value = (loaded / total) * 100;
    }

    const progressBarContainer = document.querySelector('.progress-bar-container');
    loadingManager.onLoad = function(){
        progressBarContainer.style.display = 'none';
        //console.log(`Finished loading`);
    }

    const loaderGLTF = new GLTFLoader(loadingManager).setPath( './models/' );
    const textureLoader = new THREE.TextureLoader(loadingManager);

    // Agregar proyeccion equirectangular para iluminar la escena https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_gltf.html
    new RGBELoader()
        .setPath( './textures/equirectangular/' )
        .load( 'flower_road_1k.hdr', function ( texture ) { // Tomado de https://polyhaven.com/ creado por Greg Zaal
            texture.mapping = THREE.EquirectangularReflectionMapping;
            //scene.background = texture;
            scene.environment = texture;
            texture.dispose();
        } );
    
    // Agregar habitacion contenedora (This is the work of Emil Persson, aka Humus. http://www.humus.name)
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cposx.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cnegx.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cposy.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cnegy.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cposz.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: textureLoader.load("./images/Cnegz.jpg")} ));
    const geoHabitacion = new THREE.BoxGeometry(1500,1500,1500);
    const habitacion = new THREE.Mesh(geoHabitacion,paredes);
    habitacion.position.y = 200;
    habitacion.rotation.y = Math.PI / 2;
    scene.add(habitacion);
    
    // Suelo
    // Material suelo: Lambert + textura de superposion
    const texsuelo = textureLoader.load("./images/Grass3.jpg"); // (Tomado de https://teamturflandscapes.com/home/grass-green-textures/)
    texsuelo.repeat.set(6,6);
    texsuelo.wrapS = texsuelo.wrapT = THREE.RepeatWrapping;
    const groundMat = new THREE.MeshLambertMaterial({color: 0xffffff, map:texsuelo});
    groundMat.color.setHSL( 0.095, 1, 0.75 );
    const groundGeo = new THREE.PlaneGeometry( 1500, 1500 );

    const ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
    scene.add( ground );

    // Cargar modelo del robot
    loaderGLTF.load( 'FenobotModel.glb', function ( gltf ) {
        fenobot = gltf.scene;
        fenobot.position.y = 35;
        fenobot.traverse(function (child) {
            //console.log(child);
            child.receiveShadow = true;
            child.castShadow = true;
        });
        PanelAxisLeft = fenobot.getObjectByName('PanelAxisLeft');
        PanelAxisRight = fenobot.getObjectByName('PanelAxisRight');
        TyreFrontLeft = fenobot.getObjectByName('TyreFrontLeft');
        TyreFrontRight = fenobot.getObjectByName('TyreFrontRight');
        TyreRearLeft = fenobot.getObjectByName('TyreRearLeft');
        TyreRearRight = fenobot.getObjectByName('TyreRearRight');
        BaseBrazoRobot = fenobot.getObjectByName('BaseBrazoRobot');
        Antebrazo1 = fenobot.getObjectByName('Antebrazo1');
        Antebrazo2 = fenobot.getObjectByName('Antebrazo2');
        SoporteHerramientas = fenobot.getObjectByName('SoporteHerramientas');
        SoporteBroca = fenobot.getObjectByName('SoporteBroca');
        EjeElevadorCamara = fenobot.getObjectByName('EjeElevadorCamara');
        SoporteCamara = fenobot.getObjectByName('SoporteCamara');
        Camara = fenobot.getObjectByName('Camara001');
        Camara.add(robotCamera);
        fenobot.add(picada);
        fenobot.add(cenital);
        picada.position.y -= 35;
        cenital.position.y -= 35;
        scene.add( fenobot );
    } );

    // Cargar plantas demostrativas
    // Planta de maiz: "Corn! Corn! Corn!" (https://skfb.ly/6t6wL) by Tiia Tuulia is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
    loaderGLTF.load( 'corn_corn_corn.glb', function ( gltf ) {
        corn = gltf.scene;
        corn.traverse(function (child) {
            child.receiveShadow = true;
            child.castShadow = true;
        });
        corn.scale.set(90,90,90);
        for(let i = -400; i < 400; i+=80){
            const cornCopy = corn.clone();
            cornCopy.position.set(i, 0, 190);
            cornCopy.rotation.y = Math.random() * (Math.PI);
            scene.add( cornCopy );
        }
    } );

    render();
}

function render(delta)
{
    requestAnimationFrame(render);
    renderer.clear();

    // actualizar desplazamiento del robot
    desplazarRobot();

    // actualizar las animaciones junto con la GUI
    TWEEN.update(delta);
    updateGui();

    // actualizar el viewport con 1/3 de la dimension menor para la vista cenital, la vista de picada y la vista de la camara del robot
    const ar = window.innerWidth/window.innerHeight;
    if(ar>1){
        renderer.setViewport(0,window.innerHeight-window.innerHeight/3,window.innerHeight/3,window.innerHeight/3);
    }
    else{
        renderer.setViewport(0,window.innerHeight-window.innerWidth/3,window.innerWidth/3,window.innerWidth/3);
    }
    renderer.render(scene,robotCamera);

    if(ar>1){
        renderer.setViewport(0,window.innerHeight-2*window.innerHeight/3,window.innerHeight/3,window.innerHeight/3);
    }
    else{
        renderer.setViewport(0,window.innerHeight-2*window.innerWidth/3,window.innerWidth/3,window.innerWidth/3);
    }
    renderer.render(scene,picada);

    if(ar>1){
        renderer.setViewport(0,window.innerHeight-3*window.innerHeight/3,window.innerHeight/3,window.innerHeight/3);
    }
    else{
        renderer.setViewport(0,window.innerHeight-3*window.innerWidth/3,window.innerWidth/3,window.innerWidth/3);
    }
    renderer.render(scene,cenital);

    // actualizar el vieport con toda la relacion aspecto para todo el modelo
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
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

function desplazarRobot()
{

    if(fenobot)
    {
        // actualizar la posicion del robot dentro de los limites de la habitacion
        if(keyMap[37] == true){ // flecha izq
            if(fenobot.position.z > -680 && fenobot.position.z < 680 && fenobot.position.x < 680 && fenobot.position.x > -680){
               fenobot.translateZ(keyMap[40] == true || keyMap[38] ? -0.5 : -1); 
            }
            else{
                fenobot.position.set(0,35,0);
            }
            TyreFrontRight.rotation.y += -Math.PI/100;
            TyreRearRight.rotation.y += Math.PI/100;
            TyreFrontLeft.rotation.y += -Math.PI/100;
            TyreRearLeft.rotation.y += Math.PI/100;
        }
        if(keyMap[39] == true){ // flecha der
            if(fenobot.position.z > -680 && fenobot.position.z < 680 && fenobot.position.x < 680 && fenobot.position.x > -680){
                fenobot.translateZ(keyMap[40] == true || keyMap[38] ? 0.5 : 1);
            }
            else{
                fenobot.position.set(0,35,0);
            }
            TyreFrontRight.rotation.y += Math.PI/100;
            TyreRearRight.rotation.y += -Math.PI/100;
            TyreFrontLeft.rotation.y += Math.PI/100;
            TyreRearLeft.rotation.y += -Math.PI/100;
        }
        if(keyMap[38] == true){ // flecha arriba
            if(fenobot.position.z > -680 && fenobot.position.z < 680 && fenobot.position.x < 680 && fenobot.position.x > -680){
                fenobot.translateX(keyMap[37] == true || keyMap[39] == true ? 0.5 : 1);
            }
            else{
                fenobot.position.set(0,35,0);
            }
            TyreFrontRight.rotation.y += -Math.PI/100;
            TyreRearRight.rotation.y += -Math.PI/100;
            TyreFrontLeft.rotation.y += Math.PI/100;
            TyreRearLeft.rotation.y += Math.PI/100;
        }
        if(keyMap[40] == true){ // flecha abajo
            if(fenobot.position.z > -680 && fenobot.position.z < 680 && fenobot.position.x < 680 && fenobot.position.x > -680){
                fenobot.translateX(keyMap[37] == true || keyMap[39] == true ? -0.5 : -1);
            }
            else{
                fenobot.position.set(0,35,0);
            }
            TyreFrontRight.rotation.y += Math.PI/100;
            TyreRearRight.rotation.y += Math.PI/100;
            TyreFrontLeft.rotation.y += -Math.PI/100;
            TyreRearLeft.rotation.y += -Math.PI/100;
        }

        // actualizar la rotacion del robot
        if(keyMap[65] == true){ // tecla A
            fenobot.rotation.y += Math.PI/200;
            TyreFrontRight.rotation.y += -Math.PI/100;
            TyreRearRight.rotation.y += -Math.PI/100;
            TyreFrontLeft.rotation.y += -Math.PI/100;
            TyreRearLeft.rotation.y += -Math.PI/100;
        }
        if(keyMap[68] == true){ // tecla D
            fenobot.rotation.y += -Math.PI/200;
            TyreFrontRight.rotation.y += Math.PI/100;
            TyreRearRight.rotation.y += Math.PI/100;
            TyreFrontLeft.rotation.y += Math.PI/100;
            TyreRearLeft.rotation.y += Math.PI/100;
        }

        // Actualizar la posicion de la camara para seguir el desplazamiento del robot
        var vec3 = new THREE.Vector3();
        vec3.subVectors(camera.position, fenobot.position);
        cameraControls.object.position.copy(fenobot.position).add(vec3);
        cameraControls.target.copy(fenobot.position);
        cameraControls.update();
    }
}

function DemostracionPanelesSolares()
{
    const time = 8000;
    const interpolacion = TWEEN.Interpolation.CatmullRom;
    const easing = TWEEN.Easing.Sinusoidal.InOut;

    new TWEEN.Tween(PanelAxisLeft.rotation)
    .to({
        x: [-Math.PI / 2, -Math.PI / 2],
        y: [-60.0 * Math.PI / 180, 45.0 * Math.PI / 180, 0.0],
        z: [0, 0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(PanelAxisRight.rotation)
    .to({
        x: [-Math.PI / 2, -Math.PI / 2],
        y: [-60.0 * Math.PI / 180, 45.0 * Math.PI / 180, 0.0],
        z: [0, 0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();
}

function DemostracionBrazoRobot()
{
    const time = 8000;

    new TWEEN.Tween(BaseBrazoRobot.rotation)
    .to({
        x: [0, 0],
        y: [0, 0],
        z: [0, 0]
    }, time*0.2)
    .start();

    new TWEEN.Tween(SoporteHerramientas.rotation)
    .to({
        x: [0, 0],
        y: [0, 0],
        z: [90.0*Math.PI/180, 227.0*Math.PI/180]
    }, time*0.3)
    .start();

    new TWEEN.Tween(Antebrazo1.rotation)
    .to({
        x: [0, 0],
        y: [0, 0],
        z: [0, -60.0*Math.PI/180]
    }, time*0.3)
    .start()
    .onComplete(function(){

        new TWEEN.Tween(Antebrazo1.rotation)
        .to({
            x: [0, 0],
            y: [0, 0],
            z: [-60.0*Math.PI/180, -90.0*Math.PI/180]
        }, time*0.3)
        .start();

        new TWEEN.Tween(SoporteBroca.rotation)
        .to({
            x: [0, 0],
            y: [-5*Math.PI, 5*Math.PI],
            z: [0, 0]
        }, time*0.5)
        .start();

        new TWEEN.Tween(Antebrazo2.rotation)
        .to({
            x: [0, 0],
            y: [0, 0],
            z: [0, 40.0*Math.PI/180]
        }, time*0.3)
        .start()
        .onComplete(function(){

            new TWEEN.Tween(Antebrazo1.rotation)
            .to({
                x: [0, 0],
                y: [0, 0],
                z: [-90.0*Math.PI/180, -60.0*Math.PI/180]
            }, time*0.3)
            .start();
    
            new TWEEN.Tween(Antebrazo2.rotation)
            .to({
                x: [0, 0],
                y: [0, 0],
                z: [40.0*Math.PI/180, 0]
            }, time*0.3)
            .start()
            .onComplete(function(){

                new TWEEN.Tween(SoporteHerramientas.rotation)
                .to({
                    x: [0, 0],
                    y: [0, 0],
                    z: [227.0*Math.PI/180, 320.0*Math.PI/180]
                }, time*0.3)
                .start()
                .onComplete(function(){

                    new TWEEN.Tween(Antebrazo1.rotation)
                    .to({
                        x: [0, 0],
                        y: [0, 0],
                        z: [-60.0*Math.PI/180, -90.0*Math.PI/180]
                    }, time*0.3)
                    .start();
            
                    new TWEEN.Tween(Antebrazo2.rotation)
                    .to({
                        x: [0, 0],
                        y: [0, 0],
                        z: [0, 40.0*Math.PI/180]
                    }, time*0.3)
                    .start()
                    .onComplete(function(){

                        new TWEEN.Tween(Antebrazo1.rotation)
                        .to({
                            x: [0, 0],
                            y: [0, 0],
                            z: [-90.0*Math.PI/180, -60.0*Math.PI/180]
                        }, time*0.3)
                        .start();
                
                        new TWEEN.Tween(Antebrazo2.rotation)
                        .to({
                            x: [0, 0],
                            y: [0, 0],
                            z: [40.0*Math.PI/180, 0]
                        }, time*0.3)
                        .start()
                        .onComplete(function(){

                            new TWEEN.Tween(Antebrazo1.rotation)
                            .to({
                                x: [0, 0],
                                y: [0, 0],
                                z: [-60.0*Math.PI/180, 0]
                            }, time*0.3)
                            .start();

                            new TWEEN.Tween(SoporteHerramientas.rotation)
                            .to({
                                x: [0, 0],
                                y: [0, 0],
                                z: [320.0*Math.PI/180, 90.0*Math.PI/180]
                            }, time*0.3)
                            .start();
                        });
                    });
                });
            });
        });
    });
}

function DemostracionElevadorCamara()
{
    const time = 8000;

    new TWEEN.Tween(EjeElevadorCamara.position)
    .to({
        x: [0, 0],
        y: [-56.0*Math.PI/180, 35.0*Math.PI/180],
        z: [0, 0]
    }, time*0.3)
    .start()
    .onComplete(function(){
        new TWEEN.Tween(SoporteCamara.rotation)
        .to({
            x: [0, 0],
            y: [0 ,0],
            z: [0.0, -15.0*Math.PI/180]
        }, time*0.3)
        .start()
        .onComplete(function(){
            new TWEEN.Tween(EjeElevadorCamara.rotation)
            .to({
                x: [0, 0],
                y: [-25.0*Math.PI/180, 25.0*Math.PI/180],
                z: [0, 0]
            }, time*0.3)
            .start()
            .onComplete(function(){
                new TWEEN.Tween(EjeElevadorCamara.position)
                .to({
                    x: [0, 0],
                    y: [35.0*Math.PI/180, -56.0*Math.PI/180],
                    z: [0, 0]
                }, time*0.3)
                .start();

                new TWEEN.Tween(EjeElevadorCamara.rotation)
                .to({
                    x: [0, 0],
                    y: [25.0*Math.PI/180, 0.0],
                    z: [0, 0]
                }, time*0.3)
                .start();

                new TWEEN.Tween(SoporteCamara.rotation)
                .to({
                    x: [0, 0],
                    y: [0 ,0],
                    z: [-15.0*Math.PI/180, 0]
                }, time*0.3)
                .start();
            });
        });
    });
}

function updateGui()
{
    if(fenobot)
    {
        effectController.controlesMov = 'Up-Down-Left-Right';
        effectController.controlesRot = 'A-D';
        // actualizar la GUI de acuerdo a las transformaciones del robot
        effectController.giroPanelAxisLeft = PanelAxisLeft.rotation.y*180/Math.PI;
        effectController.giroPanelAxisRight = PanelAxisRight.rotation.y*180/Math.PI;
        effectController.giroBaseBrazoRobot = BaseBrazoRobot.rotation.x*180/Math.PI;
        effectController.giroAntebrazo1 = Antebrazo1.rotation.z*180/Math.PI;
        effectController.giroAntebrazo2 = Antebrazo2.rotation.z*180/Math.PI;
        effectController.giroSoporteHerramientas = SoporteHerramientas.rotation.z*180/Math.PI;
        effectController.giroSoporteBroca = SoporteBroca.rotation.y*180/Math.PI;
        effectController.giroYEjeElevadorCamara = EjeElevadorCamara.position.y*180/Math.PI;
        effectController.giroZEjeElevadorCamara = EjeElevadorCamara.rotation.y*180/Math.PI;
        effectController.giroSoporteCamara = SoporteCamara.rotation.z*180/Math.PI;
    }
}

function setupGui()
{
    // Definicion de los controles de la GUI
    effectController = {

        controlesRot: 'A-D',
        controlesMov: 'Up-Down-Left-Right',
        giroPanelAxisLeft: 0.0,
        giroPanelAxisRight: 0.0,

        giroBaseBrazoRobot: 0.0,
        giroAntebrazo1: 0.0,
        giroAntebrazo2: 0.0,
        giroSoporteHerramientas: 0.0,
        giroSoporteBroca: 0.0,

        giroYEjeElevadorCamara: 0.0,
        giroZEjeElevadorCamara: 0.0,
        giroSoporteCamara: 0.0,

        BThemiLightHelper: false, 
        BTdirLightHelper: false, 
        BThelperCentinal: false, 
        BThelperPicada: false,
        BThelperRobot: false,

        animaPanelesSolares: function() { DemostracionPanelesSolares(); },
        animaBrazoRobot: function() { DemostracionBrazoRobot(); },
        animaCamaraRobot: function() { DemostracionElevadorCamara(); }
	};

	// Creacion interfaz
	const gui = new GUI();
    gui.add(effectController, "controlesMov").name("Desplazamiento").listen();
    gui.add(effectController, "controlesRot").name("Rotación").listen();

    // Manejo inclinacion paneles solares del robot
    const y = gui.addFolder("Paneles Solares");
	y.add(effectController, "giroPanelAxisLeft", -60.0, 45.0, 0.01).name("Panel Solar Izq.").
    listen().onChange( value => {
        PanelAxisLeft.rotation.y = value*Math.PI/180; });
	y.add(effectController, "giroPanelAxisRight", -60.0, 45.0, 0.01).name("Panel Solar Der.").
    listen().onChange( value => {
        PanelAxisRight.rotation.y = value*Math.PI/180; });
    y.add(effectController, "animaPanelesSolares").name("Demostración Paneles Solares");

    // Manejo del brazo robotico
    const x = gui.addFolder("Brazo Robótico");
    x.add(effectController, "giroBaseBrazoRobot", -45.0, 45.0, 0.01).name("Base").
    listen().onChange( value => {
        BaseBrazoRobot.rotation.x = value*Math.PI/180; });
    x.add(effectController, "giroAntebrazo1", -120.0, 0.0, 0.01).name("Antebrazo").
    listen().onChange( value => {
        Antebrazo1.rotation.z = value*Math.PI/180; });
    x.add(effectController, "giroAntebrazo2", 0.0, 135.0, 0.01).name("Brazo").
    listen().onChange( value => {
        Antebrazo2.rotation.z = value*Math.PI/180; });
    x.add(effectController, "giroSoporteHerramientas", 80.0, 345.0, 0.01).name("Eje de herramientas").
    listen().onChange( value => {
        SoporteHerramientas.rotation.z = value*Math.PI/180; 
    });
    x.add(effectController, "giroSoporteBroca", -360.0, 360.0, 0.025).name("Taladro").
    listen().onChange( value => {
        SoporteBroca.rotation.y = value*Math.PI/180; });
    x.add(effectController, "animaBrazoRobot").name("Demostración Medición del Suelo");

    // Manejo elevador de la camara
    const z = gui.addFolder("Elevador Cámara");
    z.add(effectController, "giroYEjeElevadorCamara", -56.0, 35.0, 0.01).name("Traslación vertical").
    listen().onChange( value => {
        EjeElevadorCamara.position.y = value*Math.PI/180; });
    z.add(effectController, "giroZEjeElevadorCamara", -45.0, 45.0, 0.01).name("Ángulo de deriva (Yaw)").
    listen().onChange( value => {
        EjeElevadorCamara.rotation.y = value*Math.PI/180; });
    z.add(effectController, "giroSoporteCamara", -45.0, 45.0, 0.01).name("Ángulo de inclinación (Pitch)").
    listen().onChange( value => {
        SoporteCamara.rotation.z = value*Math.PI/180; });
    z.add(effectController, "animaCamaraRobot").name("Demostración Elevador Cámara");

    // Activar/desactivar helpers de camaras y luces
    const w = gui.addFolder("Helpers");
    w.add(effectController, "BThemiLightHelper").name("Luz Hemisférica").
    listen().onChange( value => {
        hemiLightHelper.visible = value;
    });
    w.add(effectController, "BTdirLightHelper").name("Luz Direccional").
    listen().onChange( value => {
        dirLightHelper.visible = value;
    });
    w.add(effectController, "BThelperCentinal").name("Cámara Cenital").
    listen().onChange( value => {
        helperCentinal.visible = value;
    });
    w.add(effectController, "BThelperPicada").name("Cámara Picada").
    listen().onChange( value => {
        helperPicada.visible = value;
    });
    w.add(effectController, "BThelperRobot").name("Cámara Robot").
    listen().onChange( value => {
        helperRobot.visible = value;
    });
}