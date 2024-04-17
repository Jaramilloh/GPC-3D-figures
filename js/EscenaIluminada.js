/**
 * EscenaIluminada.js
 * 
 * Seminario GPC#5. Construir una escena básica animada, con gui, luces y materiales.
 * @author <rvivo@upv.es>
 * 
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables estandar
let renderer, scene, camera;

// Otras globales
let cameraControls, effectController;
let esferaCubo,cubo,esfera,suelo;
let video;

// Acciones
init();
loadScene();
setupGUI();
render();

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar la camara
    camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,100);
    camera.position.set(0.5,2,7);
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0,1,0);
    camera.lookAt(0,1,0);

    // Luces
    const ambiental = new THREE.AmbientLight(0x222222);
    scene.add(ambiental);

    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.3);
    direccional.position.set(-1,1,-1);
    direccional.castShadow = true;
    //scene.add(new THREE.CameraHelper(direccional.shadow.camera));
    scene.add(direccional);

    const puntual = new THREE.PointLight(0xFFFFFF,0.5);
    puntual.position.set(2,7,-4);
    puntual.castShadow = true;
    scene.add(new THREE.CameraHelper(puntual.shadow.camera));
    scene.add(puntual);

    const focal = new THREE.SpotLight(0xFFFFFF,0.3);
    focal.position.set(-2,7,4);
    focal.target.position.set(0,0,0);
    focal.angle = Math.PI/7;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    focal.shadow.camera.far = 20;
    scene.add(new THREE.CameraHelper(focal.shadow.camera));
    scene.add(focal);

    // Eventos
    window.addEventListener('resize', updateAspectRatio );
    renderer.domElement.addEventListener('dblclick', animate );
}

function loadScene()
{
    const path = "./images/";

    // Material cubo: Lambert + textura de superposicion
    const texcubo = new THREE.TextureLoader().load(path+"wood512.jpg")
    const matCubo = new THREE.MeshLambertMaterial({color:'white',map:texcubo});

    // Material esfera: Phong + mapa de entorno
    const entorno = [path+"posx.jpg",path+"negx.jpg",
                     path+"posy.jpg", path+"negy.jpg",
                     path+"posz.jpg", path+"negz.jpg"];
    const texesfera = new THREE.CubeTextureLoader().load(entorno);
    const matEsfera = new THREE.MeshPhongMaterial({color:'white',
                                                   specular:'darkgray',
                                                   shininess: 30,
                                                   envMap: texesfera});

    // Material suelo: Lambert + textura de superposion
    const texsuelo = new THREE.TextureLoader().load(path+"pisometalico_1024.jpg");
    texsuelo.repeat.set(4,4);
    texsuelo.wrapS = texsuelo.wrapT = THREE.RepeatWrapping;
    const matSuelo = new THREE.MeshLambertMaterial({color:new THREE.Color("rgb(150,150,150)"),map:texsuelo});

    // Suelo
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 50,50), matSuelo );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true;
    scene.add(suelo);

    // Esfera y cubo
    esfera = new THREE.Mesh( new THREE.SphereGeometry(1,20,20), matEsfera );
    cubo = new THREE.Mesh( new THREE.BoxGeometry(2,2,2), matCubo );
    esfera.position.x = 1;
    cubo.position.x = -1;
    esfera.castShadow = true;
    esfera.receiveShadow = true;
    cubo.receiveShadow = true;
    cubo.castShadow = true;

    esferaCubo = new THREE.Object3D();
    esferaCubo.add(esfera);
    esferaCubo.add(cubo);
    esferaCubo.position.y = 1.5;

    scene.add(esferaCubo);

    scene.add( new THREE.AxesHelper(3) );
    cubo.add( new THREE.AxesHelper(1) );

    // Modelos importados
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto)
    {
        const soldado = new THREE.Object3D();
        soldado.add(objeto);
        objeto.material.setValues({map: new THREE.TextureLoader().load("./models/soldado/soldado.png")});
        objeto.castShadow = true;
        objeto.receiveShadow = true;
        cubo.add(soldado);
        soldado.position.y = 1;
        soldado.name = 'soldado';
    });

    const glloader = new GLTFLoader();
    glloader.load('models/RobotExpressive.glb',
    function(objeto)
    {
        esfera.add(objeto.scene);
        objeto.scene.traverse( ob=>{
            if(ob.isObject3D) ob.castShadow = true;
        });
        //objeto.scene.castShadow = true;
        //objeto.scene.receiveShadow = true;
        objeto.scene.scale.set(0.5,0.5,0.5);
        objeto.scene.position.y = 1;
        objeto.scene.rotation.y = -Math.PI/2;
        objeto.scene.name = 'robot';
        console.log("ROBOT");
        console.log(objeto);
    });

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
    
    const geoHabitacion = new THREE.BoxGeometry(40,40,40);
    const habitacion = new THREE.Mesh(geoHabitacion,paredes);
    scene.add(habitacion);

    // Video
    video = document.createElement('video');
    video.src = "./videos/Pixar.mp4";
    video.load();
    video.muted = true;
    const videoTexture = new THREE.VideoTexture( video );
    const movieMaterial = new THREE.MeshBasicMaterial({map:videoTexture});
    const movieScreen = new THREE.Mesh(new THREE.PlaneGeometry(20,6,4,4),movieMaterial);
    movieScreen.position.set(0,4.5,-5);
    scene.add(movieScreen);
}

function setupGUI()
{
	// Definicion de los controles
	effectController = {
		mensaje: 'Soldado & Robota',
		giroY: 0.0,
		separacion: 0,
		colorsuelo: "rgb(150,150,150)",
        play: function(){video.play();},
        pause: function(){video.pause();}
	};

	// Creacion interfaz
	const gui = new GUI();

	// Construccion del menu
	const h = gui.addFolder("Control esferaCubo");
	h.add(effectController, "mensaje").name("Aplicacion");
	h.add(effectController, "giroY", -180.0, 180.0, 0.025).name("Giro en Y");
	h.add(effectController, "separacion", { 'Ninguna': 0, 'Media': 2, 'Total': 5 }).name("Separacion");
    h.addColor(effectController, "colorsuelo").name("Color suelo");
    h.add(effectController, "play").name("Play");
    h.add(effectController, "pause").name("Pause");
}

function updateAspectRatio()
{
    const ar = window.innerWidth/window.innerHeight;
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function animate(event)
{
    // Capturar y normalizar
    let x= event.clientX;
    let y = event.clientY;
    x = ( x / window.innerWidth ) * 2 - 1;
    y = -( y / window.innerHeight ) * 2 + 1;

    // Construir el rayo y detectar la interseccion
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), camera);
    const soldado = scene.getObjectByName('soldado');
    const robot = scene.getObjectByName('robot');
    let intersecciones = rayo.intersectObjects(soldado.children,true);

    if( intersecciones.length > 0 ){
        new TWEEN.Tween( soldado.position ).
        to( {x:[0,0],y:[3,1],z:[0,0]}, 2000 ).
        interpolation( TWEEN.Interpolation.Bezier ).
        easing( TWEEN.Easing.Bounce.Out ).
        start();
    }

    intersecciones = rayo.intersectObjects(robot.children,true);

    if( intersecciones.length > 0 ){
        new TWEEN.Tween( robot.rotation ).
        to( {x:[0,0],y:[Math.PI,-Math.PI/2],z:[0,0]}, 5000 ).
        interpolation( TWEEN.Interpolation.Linear ).
        easing( TWEEN.Easing.Exponential.InOut ).
        start();
    }
}

function update()
{
    angulo += 0.01;
    //esferaCubo.rotation.y = angulo;

    // Lectura de controles en GUI (es mejor hacerlo con onChange)
	cubo.position.set( -1-effectController.separacion/2, 0, 0 );
	esfera.position.set( 1+effectController.separacion/2, 0, 0 );
	suelo.material.setValues( { color: effectController.colorsuelo } );
	esferaCubo.rotation.y = effectController.giroY * Math.PI/180;
    TWEEN.update();
}

function render()
{
    requestAnimationFrame(render);
    update();
    renderer.render(scene,camera);
}