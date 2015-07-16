//local variables
var controls,
    container, 
    renderer, 
    scene, 
    camera, 
    gui,
    sphere, torusKnot, octahedron, snake, skull,
    down   = false,
    mouseX = 0,
    mouseY = 0,
    start  = Date.now(),
    fov    = 30;  

// this variable contains all the values that is controled by the dat.gui
var control = new function() {
    this.red         = 1.0;
    this.blue        = 1.0;
    this.green       = 1.0;
    this.speed       = 0.020;
    this.extension   = 1.0;
    this.rotateX     = 0.0;
    this.rotateY     = 0.0;
    this.mouse       = new THREE.Vector3(0.0, 0.0, 0.0)
    this.time        = 0.0;
    this.spiky       = 0.0;
    this.wireframe   = true;
    this.ripple      = 0.0;
    this.shape       = 1;
    this.cellShading = 0.0;
}

// determines what the current shape is
var changeShape = control.shape;

// the main function that initializes the scene
window.addEventListener( 'load', function() {       

    // grab the container from the DOM
    container = document.getElementById( "container" );
    
    // create a scene
    scene = new THREE.Scene();      

    // create a camera the size of the browser window
    camera = new THREE.PerspectiveCamera( 
        fov, 
        window.innerWidth / window.innerHeight, 
        1, 
        100000);

    // places the camera at the following x,y,z coordinate
    camera.position.z = 40;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.target = new THREE.Vector3( 0, 0, 0 );       

    scene.add( camera );   

    // create a shader material      
    material = new THREE.ShaderMaterial( {

        uniforms: { 

            time: { // passes in the time
                type: "f", 
                value: 0.0 
            },
            red: { // determines red of the top light
                type: "f",
                value: control.red
            },
            blue: { // determines blue of the top light
                type: "f",
                value: control.blue
            },
            green: { // determines green of the top light
                type: "f",
                value: control.green
            },
            // bottom light is the opposite  of the top
            extension: { // determines spike multiplier
                type: "f",
                value: control.extension
            },
            rotateX: { // passes in amount to rotate the x-axis
                type: "f",
                value: control.rotateX
            },
            rotateY: { // passes in amount to rotate the y-axis
                type: "f",
                value: control.rotateY
            },
            mouseX: { // passes in the mouse x-coordinate
                type: "f",
                value: control.mouse.x
            },
            mouseY: { // passes in the mouse y-coordinate
                type: "f",
                value: control.mouse.y
            },
            mouse: { // passes in to use the mouse or not
                type: "f",
                value: control.time
            },
            spiky: { // determines how spikes are created
                type: "f",
                value: control.spiky
            },
            ripple: { // determines how pixelated the spikes are
                type: "f",
                value: control.ripple
            },
            cell: { // determines the amount of colors for cell shading
                type: "f",
                value: control.cellShading
            }
        },
        //applies the shaders
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        wireframe: control.wireframe,
    } );
    
    // loads a snake, applies the shaders and adds it to the scene
    loader = new THREE.JSONLoader();
    loader.load( "script/Snake2.js", function(geometry){
        snake = new THREE.Mesh(geometry, material);
        snake.visible = false;
        snake.position.y = -2;
        snake.position.z = -10
        scene.add(snake);
    });

    // loads a skull, applies the shaders and adds it to the scene
    loader = new THREE.JSONLoader();
    loader.load( "script/skull2.js", function(geometry){
        skull = new THREE.Mesh(geometry, material);
        skull.visible = false;
        scene.add(skull);
    });
    

    // creates a simple geometry that has the shader material
    sphere    = new THREE.Mesh(new THREE.SphereGeometry(5,100,100), material);
    torusKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(7,1,150,100),material);
    octahedron     = new THREE.Mesh(new THREE.OctahedronGeometry(5),material);

    //sets all but the torusKnot invisible to start
    sphere.visible = false;
    octahedron.visible  = false;

    // adds all the geometries to the scene
    scene.add(sphere);
    scene.add(torusKnot);
    scene.add(octahedron);

    // create the renderer and attach it to the DOM
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    // sets background
    var texture = THREE.ImageUtils.loadTexture( 'images/sky.jpg');
    var backgroundMesh = new THREE.Mesh( new THREE.PlaneGeometry(
        window.innerWidth/7, window.innerHeight/7,0),
        new THREE.MeshBasicMaterial({map: texture}));
    // moves the texture back
    backgroundMesh.position.z = -150.0;
    // adds the background to the scene
    scene.add(backgroundMesh);
    
    container.appendChild( renderer.domElement );              

    // sets up the dat.GUI controls
    gui = new dat.GUI();

    var f1 = gui.addFolder('Color'); // the Color folder
    f1.add(control, 'red',         0.0,1.0);
    f1.add(control, 'blue',        0.0,1.0);
    f1.add(control, 'green',       0.0,1.0);
    f1.add(control, 'cellShading', 0.0,1.0);

    var f2 = gui.addFolder('Animation'); // the Animation folder
    f2.add(control, 'speed',       0.0,0.1);
    f2.add(control, 'extension',   0.0,5.0);
    f2.add(control, 'time', {on: 1.0, off: 0.0});
    f2.add(control, 'spiky', {spiky: 0.0, smooth: 0.5, off: 1.0});
    f2.add(control, 'ripple',    0.0,1.0);

    var f3 = gui.addFolder('Shape'); // the Shape folder
    f3.add(control, 'wireframe');
    f3.add(control, 'shape', {skull: 4, snake: 3, 
        Octahedron: 2, TorusKnot: 1, Sphere: 0
        }).onChange(render());

    render();       

} );        

function render() {    
    //controls various parts of the model
    material.uniforms[   'time'  ].value = control.speed/9.9 * (Date.now() - start);
    material.uniforms[   'red'   ].value = control.red;
    material.uniforms[   'blue'  ].value = control.blue;
    material.uniforms[  'green'  ].value = control.green;
    material.uniforms['extension'].value = control.extension;
    material.uniforms[ 'rotateX' ].value = control.rotateX;
    material.uniforms[ 'rotateY' ].value = control.rotateY;
    material.uniforms[ 'mouseX'  ].value = control.mouse.x;
    material.uniforms[ 'mouseY'  ].value = control.mouse.y;
    material.uniforms[  'mouse'  ].value = control.time;
    material.uniforms[  'spiky'  ].value = control.spiky;
    material.uniforms[ 'ripple'  ].value = control.ripple;
    material.uniforms[  'cell'   ].value = control.cellShading;
    material.wireframe                   = control.wireframe;

    //determinews if shape has changed
    if(control.shape != changeShape) {
        changeShape = control.shape;

        // determines which shape to make visible
        if(control.shape == 0) {
            sphere.visible = true;
            torusKnot.visible = false;
            octahedron.visible = false;
            snake.visible = false;
            skull.visible = false;
        }
        else if(control.shape == 1) {
            sphere.visible = false;
            torusKnot.visible = true;
            octahedron.visible = false;
            snake.visible = false;
            skull.visible = false;
        }
        else if(control.shape == 2) {
            sphere.visible = false;
            torusKnot.visible = false;
            octahedron.visible = true;
            snake.visible = false;
            skull.visible = false;
        }
        else if(control.shape == 3) {
            sphere.visible = false;
            torusKnot.visible = false;
            octahedron.visible = false;
            snake.visible = true;
            skull.visible = false;
        }
        else if(control.shape == 4) {
            sphere.visible = false;
            torusKnot.visible = false;
            octahedron.visible = false;
            snake.visible = false;
            skull.visible = true;
        }
    }

    // if the control.ripple variable is 0, the model will not appear
    if(control.ripple == 0.0){
        material.uniforms['ripple'].value = 0.00001;
    }
 
    // renders the scene
    renderer.render( scene, camera);
    requestAnimationFrame( render );
}

document.addEventListener("mousedown", function(event){
    down = true; // allows for a different effect on click and drag vs move
    mouseX = event.clientX;
    mouseY = event.clientY;
});

document.addEventListener("mousemove", function(event){
    // rotates the snake
    if(down){
        speedX = (mouseX - event.clientX/window.innerWidth);
        speedY = -(mouseY - event.clientY/window.innerHeight);
        control.rotateX = speedY/40;
        control.rotateY = speedX/40;

        mouseX = event.clientX;
        mouseY = event.clientY;
    }
    // makes the spikes respond to the mouse
    else {
        control.mouse.x = event.clientX/window.innerWidth * 2.0 - 1.0;
        control.mouse.y = 1.0 - event.clientY/window.innerHeight *2.0;
    }
});

document.addEventListener("mouseup", function(event){
    down = false;
});