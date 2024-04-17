/**
 * Practica5.js
 * 
 * Seminario GPC #5. Practica 5: Iluminar y agregar texturas al robot
 * Autor: Juan Felipe Jaramillo Hernandez
 * Date: 19/10/2022
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js"
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, camera, cenital, cameraControls;

// Globales del robot
let base
let esparrago
let eje
let rotula
let disco
let nervios1
let nervios2
let nervios3
let nervios4
let muneca
let paralelepipedoDe
let dedoIz
let dedoDe
let paralelepipedoIz

// Globales de los conjuntos del robot
let robot;
let brazo;
let antebrazo;
let mano;
let pinzaIz;
let pinzaDe;

// texturas
let texsuelo;
let texBrazo;
let texrotula;
let texAntebrazo;

// Otras globales
let effectController;
let suelo;
let helperFocal;
let helperDirec;

const L = 100;
const dist = 300;

var keyMap = [];

// Acciones
init();
loadScene();
setupGui();
render();


function init()
{
    // Instanciar el motor
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor( new THREE.Color(0xffffff) );
    renderer.autoClear = false;
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar la escena
    scene = new THREE.Scene();

    // Instanciar las camaras
    // camara de perspectiva
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,2000);
    camera.position.set(120,250,110);
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0,130,0);
    camera.lookAt(0,130,0);
    // camara ortognal: cenital y con volumen fijo independientemente de la relacion aspecto
    cenital = new THREE.OrthographicCamera(-L,L,L,-L,1,dist+50);
    cenital.position.set( 0,dist,0 );
    cenital.up.set( 1,0,0 );
    cenital.lookAt( 0,0,0 );

    // Luces: ambiente, direccional y focal
    const ambiental = new THREE.AmbientLight(0x222222);
    scene.add(ambiental);

    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.8);
    direccional.position.set(-150,350,-150);
    direccional.castShadow = true;
    helperDirec = new THREE.CameraHelper(direccional.shadow.camera);
    scene.add(helperDirec);
    scene.add(direccional);

    const focal = new THREE.SpotLight(0xFFFFFF,0.3);
    focal.position.set(-150,350,150);
    focal.target.position.set(0,0,0);
    focal.angle = Math.PI/4;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    focal.shadow.camera.far = 1000;
    helperFocal = new THREE.CameraHelper(focal.shadow.camera);
    scene.add(helperFocal);
    scene.add(focal);

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio);
    document.addEventListener("keydown", onDocumentKeyDown, true); 
    document.addEventListener("keyup", onDocumentKeyUp, true);
}


function loadScene()
{
    const path = "./images/";

    const material = new THREE.MeshNormalMaterial( {wireframe: false, flatShading: true} );

    // Material suelo
    texsuelo = new THREE.TextureLoader().load(path+"pisometalico_1024.jpg");
    texsuelo.repeat.set(2,2);
    texsuelo.wrapS = texsuelo.wrapT = THREE.RepeatWrapping;
    const matSuelo = new THREE.MeshLambertMaterial({color:new THREE.Color("rgb(150,150,150)"),map:texsuelo});

    // Suelo
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000, 50,50), matSuelo );
    suelo.rotation.x = -Math.PI/2;
    suelo.receiveShadow = true;
    scene.add(suelo);

    // Material base, esparrago y eje
    texBrazo = new THREE.TextureLoader().load(path+"metal_128.jpg")
    const matBrazo = new THREE.MeshLambertMaterial({color:'white',map:texBrazo});

    /////// Base - r=50 h=15
    base = new THREE.Mesh( new THREE.CylinderGeometry(50,50, 15, 50,50), matBrazo );
    base.castShadow = true;
    base.receiveShadow = true;

    /////// Brazo - esparrago -> eje -> rotula
    // esparrago - r=20 h=18
    esparrago = new THREE.Mesh( new THREE.CylinderGeometry(20,20, 18, 50,50), matBrazo );
    esparrago.rotation.x = -Math.PI/2;
    esparrago.castShadow = true;
    esparrago.receiveShadow = true;

    // eje - w=18 h=120 depth=12
    eje = new THREE.Mesh( new THREE.BoxGeometry(18, 120, 12), matBrazo );
    eje.position.y = 60;
    eje.castShadow = true;
    eje.receiveShadow = true;

    // Material rotula: Phong + mapa de entorno
    const entorno = [path+"posx.jpg",path+"negx.jpg",
                     path+"posy.jpg", path+"negy.jpg",
                     path+"posz.jpg", path+"negz.jpg"];
    texrotula = new THREE.CubeTextureLoader().load(entorno);
    const matRotula = new THREE.MeshPhongMaterial({color:'white',
                                                   specular:'darkgray',
                                                   shininess: 50,
                                                   envMap: texrotula});
    // rotula - r=20
    rotula = new THREE.Mesh( new THREE.SphereGeometry(20, 20, 75) , matRotula );
    rotula.position.y = 120;
    rotula.castShadow = true;
    rotula.receiveShadow = true;

    // ensamble del brazo
    brazo = new THREE.Object3D();
    brazo.add( esparrago );
    brazo.add( eje );
    brazo.add( rotula );

    // Material disco, nervios, antebrazo, muneca
    texAntebrazo = new THREE.TextureLoader().load(path+"wood512.jpg")
    const matAntebrazo = new THREE.MeshPhongMaterial({color:'white',
                                                   specular:'white',
                                                   shininess: 20,
                                                   map: texAntebrazo});

    /////// Antebrazo - disco -> nervios -> mano
    // disco - r=22 h=16
    disco = new THREE.Mesh( new THREE.CylinderGeometry(22,22, 6, 50,50), matAntebrazo );
    disco.castShadow = true;
    disco.receiveShadow = true;

    // nervios - w=4 h=80 depth=4
    nervios1 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), matAntebrazo );
    nervios1.castShadow = true;
    nervios1.receiveShadow = true;
    nervios2 = nervios1.clone();
    nervios3 = nervios1.clone();
    nervios4 = nervios1.clone();
    nervios1.position.set(6, 40, 6);
    nervios2.position.set(-6, 40, 6);
    nervios3.position.set(6, 40, -6);
    nervios4.position.set(-6, 40, -6);
    
    // ensamble del antebrazo
    antebrazo = new THREE.Object3D();
    antebrazo.add( disco );
    antebrazo.add( nervios1 );
    antebrazo.add( nervios2 );
    antebrazo.add( nervios3 );
    antebrazo.add( nervios4 );
    antebrazo.position.set( 0.0, 120, 0 );
    
    /////// Mano
    // muneca - r=15 h=40
    muneca = new THREE.Mesh( new THREE.CylinderGeometry(15,15, 40, 15,1), matAntebrazo );
    muneca.rotation.x = -Math.PI/2;
    muneca.castShadow = true;
    muneca.receiveShadow = true;

    // Material dedo
    const matParalelepipedo = new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(153,0,0)"),
                                                        specular:'yellow',
                                                        shininess: 20});

    //// Pinza Izquierda
    // paralelepipedo - w=19 h=20 depth=4
    paralelepipedoDe = new THREE.Mesh( new THREE.BoxGeometry(19, 20, 4), matParalelepipedo );
    paralelepipedoDe.castShadow = true;
    paralelepipedoDe.receiveShadow = true;

    // pinza - w=19 h_init=20, depth_init=4, h_end=15, depth_end=2
    const malla_dedoIz = new THREE.BufferGeometry();
    const coordenadas = [ // 6caras x 4vert x 3coord = 72 float
        // Front
        -9.5, -10, -2, //7 -> 0
        -9.5, -10, 2, //0 -> 1
        -9.5, 10, 2, //3 -> 2
        -9.5, 10, -2, //4 -> 3
        // Left
        -9.5, -10, 2, //0 -> 4
        9.5, -7.5, 2, //1 -> 5
        9.5, 7.5, 2, //2 -> 6
        -9.5, 10, 2, //3 -> 7       
        // Back
        9.5, -7.5, 2, //1
        9.5, -7.5, 0, //6
        9.5, 7.5, 0, //5
        9.5, 7.5, 2, //2
        // Right
        9.5, -7.5, 0, //6
        -9.5, -10, -2, //7
        -9.5, 10, -2, //4
        9.5, 7.5, 0, //5
        // Top
        -9.5, 10, 2, //3        
        9.5, 7.5, 2, //2
        9.5, 7.5, 0, //5
        -9.5, 10, -2, //4
        // Bottom
        -9.5, -10, 2, //0                
        -9.5, -10, -2, //7
        9.5, -7.5, 0, //6
        9.5, -7.5, 2 //1
    ];
    const indices = [ // 6caras x 2triangulos x3vertices = 36
        0,1,2,   2,3,0,     // Front
        4,5,6,   6,7,4,     // Left
        8,9,10,   10,11,8,  // Back
        12,13,14, 14,15,12, // Right
        16,17,18, 18,19,16, // Top
        20,21,22, 22,23,20  // Bottom  
    ];
    
    // Norm((5-4)x(7-4))
        //-9.5, 10, -2,  //4
        //9.5, 7.5, 0,   //5
        //-9.5, -10, -2, //7
    const right_normal = new THREE.Vector3(9.5+9.5,7.5-10.0,0.0+2.0).cross( new THREE.Vector3(-9.5+9.5,-10-10,-2.0+2.0) );
    right_normal.normalize();
    //console.log("right_normal:", right_normal);
    
    // Norm((5-2)x(3-2))
        //9.5, 7.5, 0, //5
        //9.5, 7.5, 2, //2
        //-9.5, 10, 2, //3
    const top_normal = new THREE.Vector3(9.5-9.5,7.5-7.5,0.0-2.0).cross( new THREE.Vector3(-9.5-9.5,10.0-7.5,2.0-2.0) );
    top_normal.normalize();
    //console.log("top_normal:", top_normal);

    // Norm((6-7)x(0-7))
        //-9.5, -10, 2, //0
        //9.5, -7.5, 0, //6
        //-9.5, -10, -2, //7
    const bottom_normal = new THREE.Vector3(9.5+9.5,-7.5+10.0,0.0+2.0).cross( new THREE.Vector3(-9.5+9.5,-10.0+10.0,2.0+2.0) );
    bottom_normal.normalize();
    //console.log("bottom_normal:", bottom_normal);
    
    const normales = [ // 24 x3
        -1.0,0.0,0.0, -1.0,0.0,0.0, -1.0,0.0,0.0, -1.0,0.0,0.0,     // Front
        0.0,0.0,1.0, 0.0,0.0,1.0, 0.0,0.0,1.0, 0.0,0.0,1.0,         // Left
        1.0,0.0,0.0, 1.0,0.0,0.0, 1.0,0.0,0.0, 1.0,0.0,0.0,         // Back 
        right_normal.x,right_normal.y,right_normal.z,               // Right
        right_normal.x,right_normal.y,right_normal.z,               
        right_normal.x,right_normal.y,right_normal.z,               
        right_normal.x,right_normal.y,right_normal.z,
        top_normal.x,top_normal.y,top_normal.z,                     // Top
        top_normal.x,top_normal.y,top_normal.z,
        top_normal.x,top_normal.y,top_normal.z,
        top_normal.x,top_normal.y,top_normal.z,
        bottom_normal.x,bottom_normal.y,bottom_normal.z,            // Bottom
        bottom_normal.x,bottom_normal.y,bottom_normal.z,
        bottom_normal.x,bottom_normal.y,bottom_normal.z,
        bottom_normal.x,bottom_normal.y,bottom_normal.z
    ];
    malla_dedoIz.setIndex( indices );
    malla_dedoIz.setAttribute( 'position', new THREE.Float32BufferAttribute(coordenadas,3));
    malla_dedoIz.setAttribute( 'normal', new THREE.Float32BufferAttribute(normales,3));

    dedoIz = new THREE.Mesh( malla_dedoIz, matParalelepipedo );
    dedoIz.position.x = 19;
    dedoIz.castShadow = true;
    dedoIz.receiveShadow = true;

    // ensamble de la pinza izquierda
    pinzaIz = new THREE.Object3D();
    pinzaIz.add( paralelepipedoDe );
    pinzaIz.add( dedoIz );
    pinzaIz.position.set( 10, 0.0, -10 );

    //// Dedo derecho
    dedoDe = dedoIz.clone();
    dedoDe.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
    paralelepipedoIz = paralelepipedoDe.clone();

    // ensamble de la pinza derecha
    pinzaDe = new THREE.Object3D();
    pinzaDe.add( paralelepipedoIz );
    pinzaDe.add( dedoDe );
    pinzaDe.position.set( 10, 0.0, 10 );

    // ensamble de la mano
    mano = new THREE.Object3D();
    mano.add( muneca );
    mano.add( pinzaDe );
    mano.add( pinzaIz );
    mano.position.set( 0.0, 80, 0 );

    // ensamble del brazo robotico
    antebrazo.add( mano );
    brazo.add( antebrazo );

    // ensamble del robot
    robot = new THREE.Object3D();
    robot.add( brazo );
    robot.add( base );
    robot.position.y = 7.5;

    scene.add( robot );

    // Habitacion
    const paredes = [];
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"posx.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"negx.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"posy.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"negy.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"posz.jpg")} ));
    paredes.push( new THREE.MeshBasicMaterial( {side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path+"negz.jpg")} ));
    
    const geoHabitacion = new THREE.BoxGeometry(1000,500,1000);
    const habitacion = new THREE.Mesh(geoHabitacion,paredes);
    habitacion.position.y = 248;
    scene.add(habitacion);
}


function render(delta)
{
    requestAnimationFrame(render);

    // borrar el lienzo
    renderer.clear();

    // actualizar desplazamiento del robot
    desplazarRobot();

    // actualizar las animaciones junto con la GUI
    TWEEN.update(delta);
    updateGui();

    // actualizar el viewport con 1/4 de la dimension menor para la vista cenital
    const ar = window.innerWidth/window.innerHeight;
    if(ar>1){
        renderer.setViewport(0,window.innerHeight-window.innerHeight/4,window.innerHeight/4,window.innerHeight/4);
    }
    else{
        renderer.setViewport(0,window.innerHeight-window.innerWidth/4,window.innerWidth/4,window.innerWidth/4);
    }
    renderer.render(scene,cenital);

    // actualizar el vieport con toda la relacion aspecto para todo el modelo
    renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
    renderer.render(scene,camera);
}


function updateAspectRatio()
{
    // Fijar el tamaño del marco
    renderer.setSize(window.innerWidth,window.innerHeight);

    // camara perspectiva - actualizar el volumen de la vista de la camara
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
    // actualizar la posicion del robot
    if(keyMap[37] == true){ // flecha izq
        robot.position.z -= 1;
    }
    if(keyMap[39] == true){ // flecha der
        robot.position.z += 1;
    }
    if(keyMap[38] == true){ // flecha arriba
        robot.position.x += 1;
    }
    if(keyMap[40] == true){ // flecha abajo
        robot.position.x -= 1;
    }
    // actualizar la posicion de la camara cenital
    cenital.position.set( robot.position.x, dist, robot.position.z );
}

function update()
{
    // ejecutar animacion en el tiempo para cada articulacion del robot
    const time = 10000;
    const interpolacion = TWEEN.Interpolation.CatmullRom;
    const easing = TWEEN.Easing.Sinusoidal.InOut;

    new TWEEN.Tween(robot.rotation)
    .to({
        x: [0, 0],
        y: [-Math.PI, Math.PI, 0.0],
        z: [0, 0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(brazo.rotation)
    .to({
        x: [0, 0],
        y: [0, 0],
        z: [-45.0 * Math.PI / 180, 45.0 * Math.PI / 180, 0.0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(antebrazo.rotation)
    .to({
        x: [0, 0],
        y: [-Math.PI, Math.PI, 0.0],
        z: [-Math.PI / 2, Math.PI / 2, 0.0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(mano.rotation)
    .to({
        x: [0, 0],
        y: [0, 0],
        z: [-40.0 * Math.PI / 180, 220.0 * Math.PI / 180, 0.0]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(pinzaDe.position)
    .to({
        x: [10, 10],
        y: [0, 0],
        z: [2, 15, 10]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();

    new TWEEN.Tween(pinzaIz.position)
    .to({
        x: [10, 10],
        y: [0, 0],
        z: [-2, -15, -10]
    }, time)
    .interpolation(interpolacion)
    .easing(easing)
    .start();
}

function updateGui()
{
    // actualizar la GUI de acuerdo a las transformaciones del robot
    effectController.giroBase = robot.rotation.y*180/Math.PI;
    effectController.giroBrazo = brazo.rotation.z*180/Math.PI;
    effectController.giroAntebrazoY = antebrazo.rotation.y*180/Math.PI;
    effectController.giroAntebrazoZ = antebrazo.rotation.z*180/Math.PI;
    effectController.giroPinza = mano.rotation.z*180/Math.PI;
    effectController.separacionPinza = pinzaDe.position.z;
}

function setupGui()
{
    // Definicion de los controles de la GUI
    effectController = {
        giroBase: 0.0,
        giroBrazo: 0.0,
        giroAntebrazoY: 0.0,
        giroAntebrazoZ: 0.0,
        giroPinza: 0.0,
        separacionPinza: 0.0,
        alambres: false,
        suelo: false,
        anima: function() { update(); },
        helper1: true,
        helper2: true
	};

	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu agregando eventos listen() y onChange()
	const h = gui.addFolder("Control Robot");
	h.add(effectController, "giroBase", -180.0, 180.0, 0.025).name("Giro Base").
    listen().onChange( value => {
        robot.rotation.y = value*Math.PI/180; });
    h.add(effectController, "giroBrazo", -45.0, 45.0, 0.025).name("Giro Brazo").
    listen().onChange( value => {
        brazo.rotation.z = value*Math.PI/180; });
	h.add(effectController, "giroAntebrazoY", -180.0, 180.0, 0.025).name("Giro Antebrazo Y").
    listen().onChange( value => {
        antebrazo.rotation.y = value*Math.PI/180; });
	h.add(effectController, "giroAntebrazoZ", -90.0, 90.0, 0.025).name("Giro Antebrazo Z").
    listen().onChange( value => {
        antebrazo.rotation.z = value*Math.PI/180; });
	h.add(effectController, "giroPinza", -40.0, 220.0, 0.025).name("Giro Pinza").
    listen().onChange( value => {
        mano.rotation.z = value*Math.PI/180; });
	h.add(effectController, "separacionPinza", 2.0, 15.0, 0.025).name("Separacion Pinza").
    listen().onChange( value => {
        pinzaDe.position.z = value;
        pinzaIz.position.z = -1*value;
    });
    h.add(effectController, "alambres").name("Alambres Robot").
    listen().onChange( value => {
        base.material = new THREE.MeshLambertMaterial({color:'white',map:texBrazo,wireframe: value});
        esparrago.material = new THREE.MeshLambertMaterial({color:'white',map:texBrazo,wireframe: value});
        eje.material = new THREE.MeshLambertMaterial({color:'white',map:texBrazo,wireframe: value});
        rotula.material = new THREE.MeshPhongMaterial({color:'white',specular:'darkgray',shininess: 50,envMap: texrotula,wireframe: value});
        disco.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        nervios1.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        nervios2.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        nervios3.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        nervios4.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        muneca.material = new THREE.MeshPhongMaterial({color:'white',specular:'white',shininess: 20,map: texAntebrazo,wireframe: value});
        paralelepipedoDe.material = new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(153,0,0)"),specular:'yellow',shininess: 20,wireframe: value});
        paralelepipedoIz.material = new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(153,0,0)"),specular:'yellow',shininess: 20,wireframe: value});
        dedoIz.material = new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(153,0,0)"),specular:'yellow',shininess: 20,wireframe: value});
        dedoDe.material = new THREE.MeshPhongMaterial({color:new THREE.Color("rgb(153,0,0)"),specular:'yellow',shininess: 20,wireframe: value});
    });
    h.add(effectController, "suelo").name("Alambres Suelo").
    listen().onChange( value => {
        suelo.material = new THREE.MeshLambertMaterial({color:new THREE.Color("rgb(150,150,150)"),map:texsuelo,wireframe: value}); 
    });
    h.add(effectController, "anima").name("Animar");

	// Menu para el manejo de las camaras de iluminacion
	const j = gui.addFolder("Camera Helper");
    j.add(effectController, "helper1").name("Luz Focal").
    listen().onChange( value => {
        helperFocal.visible = value;
    });
    j.add(effectController, "helper2").name("Luz Direccional").
    listen().onChange( value => {
        helperDirec.visible = value;
    });
}