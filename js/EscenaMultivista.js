/**
 * EscenaMultivista.js
 * 
 * Seminario GPC#3. Visualizar una escena bÃ¡sica desde 4 camaras
 * en 4 marcos diferentes.
 * @author <rvivo@upv.es>
 * 
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";

// Variables estandar
let renderer, scene, camera;

// Otras globales
let esferaCubo;
let angulo = 0;
let cameraControls;
let alzado, planta, perfil;
const L = 5;

// Acciones
init();
loadScene();
render();

function setCameras(ar)
{
    let camaraOrto;

    // Construir las camaras ortograficas
    if(ar>1)
     camaraOrto = new THREE.OrthographicCamera(-L*ar,L*ar,L,-L,-10,100);
    else
     camaraOrto = new THREE.OrthographicCamera(-L,L,L/ar,-L/ar,-10,100);

    alzado = camaraOrto.clone();
    alzado.position.set(0,0,10);
    alzado.lookAt(0,0,0);

    perfil = camaraOrto.clone();
    perfil.position.set(10,0,0);
    perfil.lookAt(0,0,0);

    planta = camaraOrto.clone();
    planta.position.set(0,10,0);
    planta.lookAt(0,0,0);
    planta.up = new THREE.Vector3(0,0,-1);

    
}

function init()
{
    // Instanciar el motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(0xAAAAAA);
    renderer.autoClear = false;
    document.getElementById('container').appendChild( renderer.domElement );

    // Instanciar el nodo raiz de la escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0.5,0.5,0.5);

    // Instanciar la camara perspectiva
    const ar = window.innerWidth/window.innerHeight;
    camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,100);
    camera.position.set(0.5,2,7);

    cameraControls = new OrbitControls(camera,renderer.domElement);
    cameraControls.target.set(0,1,0);
    camera.lookAt(0,1,0);

    // Otras camaras
    setCameras(ar);

    // Captura de eventos
    window.addEventListener('resize', updateAspectRatio );
    renderer.domElement.addEventListener('dblclick',rotateShape);

}

function loadScene()
{
    // Material sencillo
    const material = new THREE.MeshBasicMaterial({color:'yellow',wireframe:true});

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    scene.add(suelo);

    // Esfera y cubo
    const esfera = new THREE.Mesh( new THREE.SphereGeometry(1,20,20), material );
    const cubo = new THREE.Mesh( new THREE.BoxGeometry(2,2,2), material );
    esfera.position.x = 1;
    cubo.position.x = -1;

    esferaCubo = new THREE.Object3D();
    esferaCubo.add(esfera);
    esferaCubo.add(cubo);
    esferaCubo.position.y = 1.5;
    esferaCubo.name = "grupoEC";

    scene.add(esferaCubo);

    scene.add( new THREE.AxesHelper(3) );
    cubo.add( new THREE.AxesHelper(1) );

    // Modelos importados
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto)
    {
        cubo.add(objeto);
        objeto.position.y = 1;
    });

    const glloader = new GLTFLoader();
    glloader.load('models/RobotExpressive.glb',
    function(objeto)
    {
        esfera.add(objeto.scene);
        objeto.scene.scale.set(0.5,0.5,0.5);
        objeto.scene.position.y = 1;
        objeto.scene.rotation.y = -Math.PI/2;
        console.log("ROBOT");
        console.log(objeto);
    });


}

function updateAspectRatio()
{
    // Cambia las dimensiones del canvas
    renderer.setSize(window.innerWidth,window.innerHeight);

    // Nuevo relacion aspecto de la camara
    const ar = window.innerWidth/window.innerHeight;

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

    // ortografica
    if(ar>1){
        alzado.left = planta.left = perfil.left = -L*ar;
        alzado.right = planta.right =perfil.right = L*ar;
    }
    else{
        alzado.top = planta.top= perfil.top=  L/ar;
        alzado.bottom = planta.bottom = perfil.bottom = -L/ar;       
    }
 

    alzado.updateProjectionMatrix();
    perfil.updateProjectionMatrix();
    planta.updateProjectionMatrix();
}

function update()
{
    angulo += 0.01;
    //esferaCubo.rotation.y = angulo;
}

function rotateShape(evento)
{
    // Capturar la posicion de doble click (S.R. top-left con Y down)
    let x = evento.clientX;
    let y = evento.clientY;

    // Zona de click
    let derecha = false, abajo = false;
    let cam = null;

    if( x > window.innerWidth/2 ){
        derecha = true;
        x -= window.innerWidth/2;
    }
    if( y > window.innerHeight/2 ){
        abajo = true;
        y -= window.innerHeight/2;
    }

    // x e y estan en el primer cuadrante

    if(derecha)
        if(abajo) cam = camera;
        else cam = perfil;
    else
        if(abajo) cam = planta;
        else cam = alzado;

    // cam es la camara que recibe el doble click

    // Normalizar las coordenadas de click al cuadrado de 2x2

    x = ( x * 4/window.innerWidth ) - 1;
    y = -( y * 4/window.innerHeight ) + 1; //--> Ejercicio !!

    // Rayo e intersecciones
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), cam);

    const intersecciones = rayo.intersectObjects( 
        scene.getObjectByName('grupoEC').children,false );
    if(intersecciones.length>0)
        intersecciones[0].object.rotation.y += Math.PI / 8;
        
}

function render()
{
    requestAnimationFrame(render);
    update();

    renderer.clear();

    // El S.R. del viewport es left-bottom con X right y Y up
    renderer.setViewport(0,window.innerHeight/2, window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene,alzado);

    renderer.setViewport(0,0, window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene,planta);

    renderer.setViewport(window.innerWidth/2,window.innerHeight/2, window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene,perfil);

    renderer.setViewport(window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
    renderer.render(scene,camera);
}