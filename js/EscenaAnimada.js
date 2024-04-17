/**
 * EscenaAnimada.js
 * 
 * Seminario GPC #4. Escena basica en three.js con animacion
 * por tween al picar sobre los modelos. Se aÃ±ade GUI
 * 
 * @author <rvivo@upv.es>, 2022
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {TWEEN} from "../lib/tween.module.min.js"
import {OrbitControls} from "../lib/OrbitControls.module.js"
import Stats from "../lib/stats.module.js"
import {GUI} from "../lib/lil-gui.module.min.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let angulo = 0;
let esfera, cubo, esferaCubo, suelo;
let effectController;
let cameraControls;

// Global FPS
let stats;

// Acciones
init();
loadScene();
setupGui();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.setClearColor( new THREE.Color(0x0000AA) );
    document.getElementById('container').appendChild( renderer.domElement );

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);

    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );

    cameraControls = new OrbitControls( camera,renderer.domElement );
    cameraControls.target.set( 0,1,0 );
	camera.lookAt( 0,1,0 );

    // STATS --> stats.update() en update()
	stats = new Stats();
	stats.setMode( 0 );					// Muestra FPS
	stats.domElement.style.position = 'absolute';		// Abajo izquierda
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.left = '0px';
	document.getElementById( 'container' ).appendChild( stats.domElement );
    
    // Eventos
    window.addEventListener( 'resize', updateAspectRatio );
    renderer.domElement.addEventListener( 'dblclick', animate );
}

function loadScene()
{
    const material = new THREE.MeshBasicMaterial( { color: 'yellow', wireframe: true } );

    const geoCubo = new THREE.BoxGeometry( 2,2,2 );
    const geoEsfera = new THREE.SphereGeometry( 1, 20,20 );

    cubo = new THREE.Mesh( geoCubo, material );
    esfera = new THREE.Mesh( geoEsfera, material );

    // Suelo
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);

    // Importar un modelo en json
    const loader = new THREE.ObjectLoader();

    loader.load( 'models/soldado/soldado.json', 
        function(objeto){
            const soldado = new THREE.Object3D();
            soldado.add(objeto);
            cubo.add(soldado);
            soldado.position.y = 1;
            soldado.name = 'soldado';
        }
    )

    // Importar un modelo en gltf
    const glloader = new GLTFLoader();
    glloader.load('models/RobotExpressive.glb',
    function(objeto)
    {
        esfera.add(objeto.scene);
        objeto.scene.scale.set(0.5,0.5,0.5);
        objeto.scene.position.y = 1;
        objeto.scene.rotation.y = -Math.PI/2;
        objeto.scene.name = 'ROBOT';
        console.log("ROBOT");
        console.log(objeto);
    });

    esferaCubo = new THREE.Object3D();
    esferaCubo.position.y = 1.5;
    cubo.position.x = -1;
    esfera.position.x = 1;
    cubo.add( new THREE.AxesHelper(1) );

    scene.add( esferaCubo);
    esferaCubo.add( cubo );
    esferaCubo.add( esfera );
 

    scene.add( new THREE.AxesHelper(3) );

}

function setupGui()
{
	// Definicion de los controles
	effectController = {
		mensaje: 'Soldado & Robota',
		giroY: 0.0,
		separacion: 0,
		colorsuelo: "rgb(150,150,150)"
	};

	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu
	const h = gui.addFolder("Control esferaCubo");
	h.add(effectController, "mensaje").name("Aplicacion");
	h.add(effectController, "giroY", -180.0, 180.0, 0.025).name("Giro en Y");
	h.add(effectController, "separacion", { 'Ninguna': 0, 'Media': 2, 'Total': 5 }).name("Separacion");
    h.addColor(effectController, "colorsuelo").name("Color alambres");
}

function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

function update(delta)
{
    angulo += 0.01;
    //esferaCubo.rotation.y = angulo;

    // Lectura de controles en GUI (es mejor hacerlo con onChange)
	cubo.position.set( -1-effectController.separacion/2, 0, 0 );
	esfera.position.set( 1+effectController.separacion/2, 0, 0 );
	suelo.material.setValues( { color: effectController.colorsuelo } );
	esferaCubo.rotation.y = effectController.giroY * Math.PI/180;
    //effectController.giroY = 10 ;

    // Actualiza los FPS
	stats.update();

    // Actualiza la interpolacion
    TWEEN.update(delta);
}

function animate(event)
{
   // Capturar la posicion del click
   let x = event.clientX;
   let y = event.clientY;

   // Normalizar las coordenadas de click
   x = ( x / window.innerWidth ) * 2 - 1;
   y = -( y / window.innerHeight ) * 2 + 1;

   // Rayo e intersecciones
   const rayo = new THREE.Raycaster();
   rayo.setFromCamera( new THREE.Vector2(x,y), camera );

   const soldado = scene.getObjectByName('soldado');
   let intersecciones = rayo.intersectObjects( soldado.children, true );
   console.log(intersecciones)
   if( intersecciones.length > 0 ){
    // animacion soldado
        new TWEEN.Tween( soldado.position )
        .to( { x:[   0,    0],
           y:[   3,    1],
           z:[   0,    0]}, 2000)
        .interpolation( TWEEN.Interpolation.Bezier )
        .easing( TWEEN.Easing.Bounce.Out )
        .start();
   }
     
   const robota = scene.getObjectByName('ROBOT');
   intersecciones = rayo.intersectObjects( robota.children, true );
   if( intersecciones.length > 0 ){
        // animacion robota
        new TWEEN.Tween( robota.rotation )
        .to( { x:[0,0],
               y:[Math.PI,-Math.PI/2],
               z:[0,0]}, 5000)
        .interpolation(TWEEN.Interpolation.Linear)
        .easing( TWEEN.Easing.Exponential.InOut )
        .start();
   }

}

function render(delta)
{
    requestAnimationFrame( render );
    update(delta);
    renderer.render( scene, camera );
}