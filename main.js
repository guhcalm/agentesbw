import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js'
import Noise from './src/PerlinNoise/noise.js'
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js'

let canvas  = document.querySelector( 'canvas' )
let w       = ( canvas.width = window.innerWidth )
let h       = ( canvas.height = window.innerHeight )
let octaves = { x: 1, y: 1, z: 1 }
let malha   = { x: 10, y: 10, z: 10 }
let malhas  = { octaves, malha }
let quantidade = 800
let raio = .15
let velocidade = .1

let cena

function criarAmbiente( canvas ) {
    let cena = criarCena()
    let camera = criarCamera( canvas, cena )
    let luz = criarLuz( cena )
    let render = criarRenderizador( canvas )
    return { cena, camera, render }
}
function criarCena () {
    let background = 0x363d3d
    let cena = new THREE.Scene()
    cena.background = new THREE.Color( background )
    cena.fog = new THREE.Fog( background, -1, 3000  )
    return cena
}
function criarCamera( canvas, cena ) {
    let w = ( canvas.width = window.innerWidth )
    let h = ( canvas.height = window.innerHeight )
    let camera = new THREE.PerspectiveCamera( 75, w/h, .1, 1000 )
    cena.add(camera)
    return camera
}
function criarLuz( cena ) {
    let light = new THREE.HemisphereLight(0xffffff, 0xffffff, .5)
  
    let shadowLight = new THREE.DirectionalLight(0xffffff, .8);
    shadowLight.position.set(200, 200, 200);
    shadowLight.castShadow = true;
    shadowLight.shadowDarkness = .2;
        
    let backLight = new THREE.DirectionalLight(0xffffff, .4);
    backLight.position.set(-100, 200, 50);
    backLight.shadowDarkness = .2;
    backLight.castShadow = true;
        
    cena.add(backLight);
    cena.add(light);
    cena.add(shadowLight);
}
function criarRenderizador(canvas) {
    let render = new THREE.WebGLRenderer( { canvas, antialias: true } )
    render.setSize( w, h )
    return render
}


function init( canvas, malhas ) {
    let ambiente = criarAmbiente( canvas ) // {cena,camera,render}
    let malha = criarMalha(malhas)         // {unidades, intervalo, contorno}
    
    //OrbitControl
    const controls = new OrbitControls(ambiente.camera, canvas);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4;
    controls.maxDistance = 50;
    controls.minDistance = 5;
    controls.enablePan = false;
    controls.target.set(malha.contorno.x/2, malha.contorno.y/2, malha.contorno.y/2)
    ambiente.camera.position.set( malha.contorno.x/2, malha.contorno.y/2, 20 )

    let campo = criarCampo( malha )
    desenharCampo(ambiente, campo)
    let life = criarParticulas( ambiente, malha, quantidade )
    loop()
    function loop() {
        move( ambiente, malha, campo, life )
        requestAnimationFrame(loop)
        ambiente.render.render( ambiente.cena, ambiente.camera )
    }
}
function criarMalha(malhas) {
    let o = malhas.octaves
    let m = malhas.malha
    let unidades  = { x: o.x * m.x, y: o.y * m.y, z: o.z * m.z }
    let intervalo = { x: 10 / m.x, y: 10 / m.y, z: 10 / m.z }
    let contorno  = { 
        x: unidades.x * intervalo.x,
        y: unidades.y * intervalo.y,
        z: unidades.z * intervalo.z
    }  
    return { unidades, intervalo, contorno }
}
function criarCampo(malha) {
    let intervalo = malha.intervalo
    let unidades = malha.unidades
    let campo = [ new Array( unidades.x ) ]
    for ( let x = 0; x <= unidades.x; x++ ) {
        campo[x] = new Array( unidades.y )
    for ( let y = 0; y <= unidades.y; y++ ) {
        campo[x][y] = new Array( unidades.z )
    for ( let z = 0; z <= unidades.z; z++ ) {
        let xi = x * intervalo.x
        let yi = y * intervalo.y
        let zi = z * intervalo.z
        
        let pos = { x: xi, y: yi, z: zi }
        let noise = Noise( xi/unidades.x, yi/unidades.y, zi/unidades.z )

        let comprimento = malha.intervalo.x * noise
        let angulo = 2 * Math.PI * noise
        let dx = comprimento * Math.cos( angulo )
        let dy = comprimento * Math.sin( angulo )
        let dz = comprimento * Math.cos( angulo )

        campo[x][y][z] = { pos, noise, comprimento, angulo, dx, dy, dz }
    }}}
    return campo
}
function desenharCampo(ambiente, campo) {
    let particulas = new THREE.Group()
    campo.forEach( x => {
        x.forEach( y => {
        y.forEach( z => {
            let pos = z.pos
            let size = .03
            particulas.add(desenharPontos(pos, size))
        })})
    })
    ambiente.cena.add( particulas )
}
function desenharPontos(pos, size) {
    let geometry = new THREE.BoxGeometry( size, size, size )
    let material = new THREE.MeshBasicMaterial({
        color:'rgba(255,255,255,1)', 
        opacity: 1
    })
    let particula = new THREE.Mesh( geometry, material )
    particula.position.set( pos.x, pos.y, pos.z )
    return particula
}
function criarParticulas( ambiente, malha, quantidade ) {
    let particulas = new THREE.Group()
    let life = []
    for ( let i = 0; i <= quantidade; i++ ) {
        let xi = malha.contorno.x * Math.random()
        let yi = malha.contorno.y * Math.random()
        let zi = malha.contorno.z * Math.random()
        let pos = { x: xi, y: yi, z: zi }
        let size = raio
        particulas.add( desenharParticula( pos, size ) )
        life[i] = Math.random() * 10 + 5
    }
    ambiente.cena.add(particulas)
    return life
}
function desenharParticula(pos, size) {
    let geometry = new THREE.SphereGeometry( size, 5, 5 )
    let material = new THREE.MeshLambertMaterial({color:'rgba(255,255,255,1)', opacity: 1, flatShading: true, transparent: true })
    let particula = new THREE.Mesh( geometry, material )
    particula.position.set( pos.x, pos.y, pos.z )
    return particula
}

function move( ambiente, malha, campo, life ) {
    let group = ambiente.cena.children[5]
    let particulas = group.children
    console.log()
    let r = Math.random()
    let index = 0
    particulas.forEach( p => {
        life[index] -= .001
        //console.log(pos)
        let pos = p.position
        let v = {
            x: Math.round(pos.x / malha.intervalo.x),
            y: Math.round(pos.y / malha.intervalo.y),
            z: Math.round(pos.z / malha.intervalo.z),
        }
        
        let vel = {
            x: campo[v.x][v.y][v.z].dx,
            y: campo[v.x][v.y][v.z].dy,
            z: campo[v.x][v.y][v.z].dz
        }
        
        let color = p.material.color

        let noise = campo[v.x][v.y][v.z].noise * 1.2

        let r =  noise >= 0.5 ? (2 * noise - 1) : 0
        let g = noise <= 0.5 ? ( 2 * noise ) : ( 2 - 2 * noise )
        let b = noise <= 0.5 ? 1- (2 * noise) : 0

        color.r = noise
        color.g = noise
        color.b = noise

        p.material.opacity = noise

        pos.x += vel.x * velocidade
        pos.y += vel.y * velocidade
        pos.z += vel.z * velocidade

        if ( pos.x >= malha.contorno.x || 
             pos.y >= malha.contorno.y ||
             pos.z >= malha.contorno.z ||
             pos.x <= 0                || 
             pos.y <= 0                ||
             pos.z <= 0                ||
             life[index]  <=0
        ) 
        {
            let xi = malha.contorno.x * Math.random()
            let yi = malha.contorno.y * Math.random()
            let zi = malha.contorno.z * Math.random()
            pos.set( xi, yi, zi )
            life[index] = Math.random() * 10 + 5
        }
    
        index ++
        })
}

init( canvas, malhas )
