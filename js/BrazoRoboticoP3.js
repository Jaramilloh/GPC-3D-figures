/**
 * Practica3.js
 * 
 * Seminario GPC #3. Practica 3: agregar vistas dinamicas al brazo robotico
 * Autor: Juan Felipe Jaramillo Hernandez
 * Date: 28/09/2022
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";

// Variables de consenso
let renderer, scene, camera, cenital, cameraControls;

// Otras globales
let robot;
let brazo;
let antebrazo;
let mano;
let pinzaIz;
let pinzaDe;

let angulo = 0;
let angulo_restringido = 0;
let translacion = 0;

let aux1 = 0;
let aux2 = 0;

const L = 60;
const dist = 300;

// Acciones
init();
loadScene();
render();

function init()
{
    // Instanciar el motor
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor( new THREE.Color(0xffffff) );
    renderer.autoClear = false;
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar la escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar las camaras
    // camara de perspectiva
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,1000);
    camera.position.set(120,250,110);
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0,130,0);
    camera.lookAt(0,130,0);
    // camara ortognal: cenital y con volumen fijo independientemente de la relacion aspecto
    cenital = new THREE.OrthographicCamera(-L,L,L,-L,1,dist+50);
    cenital.position.set( 0,dist,0 );
    cenital.up.set( 1,0,0 );
    cenital.lookAt( 0,0,0 );

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio);
}

function loadScene()
{
    const material = new THREE.MeshNormalMaterial( {wireframe: false, flatShading: true} );

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000, 50,50), new THREE.MeshNormalMaterial( {wireframe: true, flatShading: false} ) );
    suelo.rotation.x = -Math.PI/2;
    scene.add(suelo);

    /////// Base - r=50 h=15
    const base = new THREE.Mesh( new THREE.CylinderGeometry(50,50, 15, 30,1), material );

    /////// Brazo - esparrago -> eje -> rotula
    // esparrago - r=20 h=18
    const esparrago = new THREE.Mesh( new THREE.CylinderGeometry(20,20, 18, 15,1), material );
    esparrago.rotation.x = -Math.PI/2;

    // eje - w=18 h=120 depth=12
    const eje = new THREE.Mesh( new THREE.BoxGeometry(18, 120, 12), material );
    eje.position.y = 60;

    // rotula - r=20
    const rotula = new THREE.Mesh( new THREE.SphereGeometry(20, 20, 10) , material );
    rotula.position.y = 120;

    // ensamble del brazo
    brazo = new THREE.Object3D();
    brazo.add( esparrago );
    brazo.add( eje );
    brazo.add( rotula );

    /////// Antebrazo - disco -> nervios -> mano
    // disco - r=22 h=16
    const disco = new THREE.Mesh( new THREE.CylinderGeometry(22,22, 6, 20,1), material );
    
    // nervios - w=4 h=80 depth=4
    const nervios1 = new THREE.Mesh( new THREE.BoxGeometry(4, 80, 4), material );
    const nervios2 = nervios1.clone();
    const nervios3 = nervios1.clone();
    const nervios4 = nervios1.clone();
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
    const muneca = new THREE.Mesh( new THREE.CylinderGeometry(15,15, 40, 15,1), material );
    muneca.rotation.x = -Math.PI/2;

    //// Pinza Izquierda
    // paralelepipedo - w=19 h=20 depth=4
    const paralelepipedoDe = new THREE.Mesh( new THREE.BoxGeometry(19, 20, 4), material );
 
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
        
        //-9.5, -10, 2, //0 
        //9.5, -7.5, 2, //1
        //9.5, 7.5, 2, //2
        //-9.5, 10, 2, //3
        //-9.5, 10, -2, //4
        //9.5, 7.5, 0, //5
        //9.5, -7.5, 0, //6
        //-9.5, -10, -2, //7
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
    console.log("right_normal:", right_normal);
    
    // Norm((5-2)x(3-2))
        //9.5, 7.5, 0, //5
        //9.5, 7.5, 2, //2
        //-9.5, 10, 2, //3
    const top_normal = new THREE.Vector3(9.5-9.5,7.5-7.5,0.0-2.0).cross( new THREE.Vector3(-9.5-9.5,10.0-7.5,2.0-2.0) );
    top_normal.normalize();
    console.log("top_normal:", top_normal);

    // Norm((6-7)x(0-7))
        //-9.5, -10, 2, //0
        //9.5, -7.5, 0, //6
        //-9.5, -10, -2, //7
    const bottom_normal = new THREE.Vector3(9.5+9.5,-7.5+10.0,0.0+2.0).cross( new THREE.Vector3(-9.5+9.5,-10.0+10.0,2.0+2.0) );
    bottom_normal.normalize();
    console.log("bottom_normal:", bottom_normal);
    
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

    const dedoIz = new THREE.Mesh( malla_dedoIz, material );
    //const dedoIz = new THREE.Mesh( malla_dedoIz, new THREE.MeshBasicMaterial( {color:'green', wireframe: true} ) );
    dedoIz.position.x = 19;

    // ensamble de la pinza izquierda
    pinzaIz = new THREE.Object3D();
    pinzaIz.add( paralelepipedoDe );
    pinzaIz.add( dedoIz );
    pinzaIz.position.set( 10, 0.0, -10 );

    //// Dedo derecho
    const dedoDe = dedoIz.clone();
    dedoDe.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, -1));
    const paralelepipedoIz = paralelepipedoDe.clone();

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
    robot = new THREE.Object3D();
    robot.add( brazo );
    robot.add( base );
 
    // clonacion para un mostrar un robot estatico y otro en movimiento
    const robot_static = robot.clone();
    robot.position.set(-200, 7.5, 100);
    robot_static.position.y = 7.5;

    scene.add(robot);
    scene.add(robot_static);
    scene.add( new THREE.AxesHelper(220) );
}

function update()
{
    angulo += 0.01;

    if(aux1 == 0)
    {
        angulo_restringido += 0.01;
    }
    else
    {
        angulo_restringido -= 0.01;
    }

    if(aux2 == 0)
    {
        translacion += 0.1;
    }
    else
    {
        translacion -= 0.1;
    }

    robot.rotation.y = angulo;
    brazo.rotation.z = angulo_restringido; // limitar entre 0 y pi/3
    antebrazo.rotation.y = angulo;
    antebrazo.rotation.z = angulo_restringido;
    //mano.rotation.z = angulo_restringido;
    pinzaIz.position.z = translacion;
    pinzaDe.position.z = -1*translacion;

    if(angulo_restringido > Math.PI/3)
    {
        aux1 = 1;
    }
    else if(angulo_restringido < -Math.PI/3)
    {
        aux1 = 0;
    }

    if(translacion > 15)
    {
        aux2 = 1;
    }
    else if(translacion < 2)
    {
        aux2 = 0;
    }
}

function render()
{
    requestAnimationFrame(render);
    update();

    // borrar una unica vez
    renderer.clear();

    // agregar un viewport con 1/4 de la dimension menor para la vista centinal
    const ar = window.innerWidth/window.innerHeight;
    if(ar>1){
        renderer.setViewport(0,window.innerHeight-window.innerHeight/4,window.innerHeight/4,window.innerHeight/4);
    }
    else{
        renderer.setViewport(0,window.innerHeight-window.innerWidth/4,window.innerWidth/4,window.innerWidth/4);
    }
    renderer.render(scene,cenital);

    // agregar un vieport con toda la relacion aspecto para todo el modelo
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