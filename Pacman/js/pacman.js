/*
    Erick Evangeliste
    Metal Gear-esque Pacman game
    2017  
 */
    var sw = 1;
    var renderer, rendererHUD;
    var scene;
    var camera, cameraHUD;

    //Objects that will be meshed and created in a 3D field
    var player, toggle, cube, groundPlane, guard;
    var intel1, intel2, intel3, intel4, intel5, guard1, guard2, guard3, guard4, guard5, guard6;

    var startx, starty, startz;
    var scoreObject;

    var intelLeft = 0;

    //parameters for the HUD
    var rw = 300, rh = 150;
    var ca = 80, ar = 3;

    var movSpeed = 0.1;
    var camSpeed = .2;
    
    var baseWidth = 55;
    var baseHeight = 30;
    
    var speed = 1.5;
    
    var mesh, victory;

    var up = new THREE.Vector3( 0,4,0 );
    var down = new THREE.Vector3( 0,-4, 0 );
    var left = new THREE.Vector3(-4, 0, 0);
    var right = new THREE.Vector3(4, 0, 0);

    var gup = new THREE.Vector3( 0,speed,0 );
    var gdown = new THREE.Vector3( 0,-speed, 0 );
    var gleft = new THREE.Vector3(-speed, 0, 0);
    var gright = new THREE.Vector3(speed, 0, 0);

    Physijs.scripts.worker = 'libs/physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';

    var base =
    [   
        '#######################################################',
        '#                          ###                        #',
        '#     X        ########    ###        #####     X     #',
        '#              ########             G     #           #',//guard1
        '#       #      ########     X         #####  #######  #',
        '#                                                     #',
        '#     ########    #   #####     #####   ###  #######  #',
        '#                 #   #####     #####   ###  #######  #',
        '#                 #                     ###           #',
        '#######           #######   ###   #####          ######',
        '#                 #######   ###   #####               #',
        '#   	 G                                        G      #',//guard2 and guard3
        '#             ###       ###  ####     ###             #',
        '#             ###       #       #     ###        ######',
        '#                       #   P  B#                     #',
        '#             ###       #       #     ###             #',
        '#             ###       ###  ####     ###             #',
        '#     G         ###                     ###           #',//guard 4
        '#               ###   ###############   ###           #',
        '#######         ###   ###############   ###      ######',//guard 5
        '#                                                     #',
        '#    #######    ########   ###   ########    ######   #',
        '#    #######    ########   ###   ########             #',
        '#        ###                                ##        #',
        '####     ###    ###          X         ##   ##    #####',
        '####     ###    ###                    ##   ##    #####',
        '#               ###   G                ##             #',//guard6
        '#       ####    ###        ###   #############    G   #',
        '#  X    ####    ###        ###   #############    X   #',
        '#                                                     #',
        '#######################################################'
    ];

    function init()
    {
        scene = new Physijs.Scene();
        scene.setGravity(new THREE.Vector3( 0, 0, -100));

        setupRenderers();
        setupCameras();
        setupSpotlight(100,100,0xffffff,1);
        
        loadSounds();
        updateScore();
        createBase(base); // create base from 2D array initialized earlier in the code
        controlGuards(); //control the direction the guards are moving in
    
        var container = document.getElementById("MainView");
        container.appendChild( renderer.domElement );

        // HUD
        var containerHUD = document.getElementById("HUDView");
        containerHUD.appendChild( rendererHUD.domElement );

        // Call render
        render();
    }
    
    function render()
    {
        //plays different music depending on the amount of intel left to gather
        if(intelLeft > 0)
        {
            calmmusic.loop = true;
            calmmusic.play();
        }
        else
        {
            calmmusic.pause();
            alert.loop = true;
            alert.play();

        }

        scene.simulate();
        //user controls for player
        if( Key.isDown( Key.A ) )
        {
            player.setLinearVelocity( left );
        }

        if( Key.isDown( Key.D ) )
        {
             player.setLinearVelocity( right );
        }

        if( Key.isDown( Key.W ) )
        {
            player.setLinearVelocity( up );
        }

        if( Key.isDown( Key.S ) )
        {
             player.setLinearVelocity( down );
             controlGuards();
        }
      
        //ensures the camera is following the player
        camera.position.x = player.position.x;
        camera.position.y = player.position.y - 10;
        camera.position.z = player.position.z + 3;

        camera.lookAt(player.position);

        //ensures the HUD is always following the player
        cameraHUD.position.x = player.position.x;
        cameraHUD.position.y = player.position.y - 3;
        cameraHUD.position.z = player.position.z + 10;
        
        cameraHUD.lookAt(player.position);

        // Request animation frame
        requestAnimationFrame( render );
        
        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
        renderer.render( scene, camera );
        
        rendererHUD.setScissorTest(true);
        rendererHUD.setViewport( 0, 0, rw, rh );
        rendererHUD.render( scene, cameraHUD );
    }

    function setupRenderers()
    {
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor( 0x000000, 0 );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMapEnabled = true;

        // HUD
        rendererHUD = new THREE.WebGLRenderer();
        rendererHUD.setClearColor( 0x000000, 0 );
        rendererHUD.setSize( rw, rh );
        rendererHUD.shadowMapEnabled = true;
    }
    
    function setupCameras()
    {
        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.lookAt( scene.position );
        camera.name = 'camera';

        // HUD
        cameraHUD = new THREE.PerspectiveCamera(ca,rw/rh,0.1,4000);
        cameraHUD.lookAt( new THREE.Vector3(0,0, 0) );
    }
    //updates score when an intel is removed
    function updateScore()
    {
        var loader = new THREE.FontLoader();

        loader.load( 'fonts/helvetiker_regular.typeface.js', function ( font ) 
        {

            var textGeo = new THREE.TextGeometry( "Intel Left :" + intelLeft, 
            {

                font: font,

                size: 2,
                height: 2,
                curveSegments: .1,
                bevelThickness: 2,
                bevelSize: 5,
                bevelEnabled: false

            });

        var textMaterial = new THREE.MeshBasicMaterial( { color: 'white' } );

        mesh = new THREE.Mesh( textGeo, textMaterial );
        mesh.position.set( 0, starty + 85, 3);
        mesh.rotation.x = (Math.PI) / 2;
        mesh.rotation.y = .2;

        scene.add( mesh );
        });
    }
    
    function setBrightness( value )
    {
        var i;
        for( i=1; i<=4; i++ )
        {
            var name = "SpotLight"+i;
            var light = scene.getObjectByName( name );
            light.intensity = value;
        }
    }

    function setupSpotlight(x,z,color,number)
    {
        spotLight = new THREE.SpotLight( color, 3, 200, 1, 0, 0 );
        spotLight.position.set( 100, 100, 100 );
        spotLight.target.position.set( 100,100,100);
        spotLight.name = "SpotLight"+number;
        scene.add(spotLight);
    }
   
    var targetlist;
    function addIntel(x, y, z, icount, inteltexture)
    {
    	
        var intelgeometry = new THREE.BoxGeometry(.3, .3, .3);
        var intelmaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:inteltexture}), .4, 0 );
        //checks icount to corresponding number
        if(icount == 1)
        {
        	intel1 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel1.name = "intel1";
	        intel1.position.set(x, y, z);
	        scene.add(intel1);
        }
        if(icount == 2)
        {
        	intel2 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel2.name = "intel2";
	        intel2.position.set(x, y, z);
	        scene.add(intel2);
        }
     	if(icount == 3)
        {
        	intel3 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel3.name = "intel3";
	        intel3.position.set(x, y, z);
	        scene.add(intel3);
        }
        if(icount == 4)
        {
        	intel4 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel4.name = "intel4";
	        intel4.position.set(x, y, z);
	        scene.add(intel4);
        }
        if(icount == 5)
        {
        	intel5 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel5.name = "intel5";
	        intel5.position.set(x, y, z);
	        scene.add(intel5);
        }
        if(icount == 6)
        {
        	intel6 = new Physijs.BoxMesh(intelgeometry, intelmaterial, 4.5);
	        intel6.name = "intel6";
	        intel6.position.set(x, y, z);
	        scene.add(intel6);
        }
    }

    function createGuard(x, y, z, gcount, guardtexture)
    {
        var guardgeometry = new THREE.SphereGeometry(.3, 40, 40);
        var guardmaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:guardtexture}), .4, 0 );
        //takes gcount to summon that corresponding guard
        if(gcount == 1)
        {
        	guard1 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard1.name = "guard1";
	        guard1.position.set(x, y, z);
	        scene.add(guard1);
        }
        if(gcount == 2)
        {
        	guard2 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard2.name = "guard2";
	        guard2.position.set(x, y, z);
	        scene.add(guard2);
        }
     	if(gcount == 3)
        {
        	guard3 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard3.name = "guard3";
	        guard3.position.set(x, y, z);
	        scene.add(guard3);
        }
        if(gcount == 4)
        {
        	guard4 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard4.name = "guard4";
	        guard4.position.set(x, y, z);
	        scene.add(guard4);
        }
        if(gcount == 5)
        {
        	guard5 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard5.name = "guard5";
	        guard5.position.set(x, y, z);
	        scene.add(guard5);
        }
        if(gcount == 6)
        {
        	guard6 = new Physijs.SphereMesh(guardgeometry, guardmaterial, 1);
	        guard6.name = "guard6";
	        guard6.position.set(x, y, z);
	        scene.add(guard6);
        }
    }
    //setup player and setup corresponding collisions it may have
    function setupPlayer(x, y, z)
    {
    	var texture = new THREE.ImageUtils.loadTexture('images/player.jpg');
        var ballMaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:texture}), .4, 0 );
        var ballGeometry = new THREE.SphereGeometry( .3, 40, 40 );
        player = new Physijs.SphereMesh( ballGeometry, ballMaterial, 20);
        player.name = "player";
       	player.position.set(x, y, z - .35);
       	startx = x;
       	starty = y;

        player.addEventListener('collision', function(other_object)
        {
            if(other_object.name == 'goal')
            {	
            	if(intelLeft == 0)
            	{
            		scene.remove(mesh);
            		alert.pause();
            		victory.play();
	            	var loader = new THREE.FontLoader();

					loader.load( 'fonts/helvetiker_regular.typeface.js', function ( font ) 
                    {

    			    	var textGeo = new THREE.TextGeometry( "You win!", 
                        {

        			        font: font,

        			        size: 4,
        			        height: 2,
        			        curveSegments: .1,

        			        bevelThickness: 2,
        			        bevelSize: 5,
        			        bevelEnabled: false
    	                });

            		    var textMaterial = new THREE.MeshBasicMaterial( { color: 'green' } );

            		    victory = new THREE.Mesh( textGeo, textMaterial );
            		    victory.position.set( 0, starty + 85, 3 );
            		    victory.rotation.x = (Math.PI) / 2;
            		    victory.rotation.y = .2;
            		    scene.add( victory );

			        });
			    }
	       	}

            if(other_object.name == 'intel1')
            {
            	intelGet.play();
                scene.remove(intel1);
                speed = speed * 2;

                gup = new THREE.Vector3( 0,speed * .5,0 );
                gdown = new THREE.Vector3( 0,-speed * .5, 0 );
                gleft = new THREE.Vector3(-speed * .5, 0, 0);
                gright = new THREE.Vector3(speed * .5, 0, 0);

                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
			if(other_object.name == 'intel2')
            {
            	intelGet.play();
            	speed = speed * 2;
                scene.remove(intel2);
                gup = new THREE.Vector3( 0,speed,0 );
			    gdown = new THREE.Vector3( 0,-speed, 0 );
			    gleft = new THREE.Vector3(-speed, 0, 0);
                gright = new THREE.Vector3(speed, 0, 0);
                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
            if(other_object.name == 'intel3')
            {
            	intelGet.play();
            	speed = speed * 2;
                scene.remove(intel3);
                gup = new THREE.Vector3( 0,speed,0 );
			    gdown = new THREE.Vector3( 0,-speed, 0 );
			    gleft = new THREE.Vector3(-speed, 0, 0);
			    gright = new THREE.Vector3(speed, 0, 0);
                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
            if(other_object.name == 'intel4')
            {
            	intelGet.play();
            	speed = speed * 2;
                scene.remove(intel4);
                gup = new THREE.Vector3( 0,speed,0 );
			    gdown = new THREE.Vector3( 0,-speed, 0 );
			    gleft = new THREE.Vector3(-speed, 0, 0);
			    gright = new THREE.Vector3(speed, 0, 0);
                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
            if(other_object.name == 'intel5')
            {
            	intelGet.play();
            	speed = speed * 2;
                scene.remove(intel5);
                gup = new THREE.Vector3( 0,speed,0 );
			    gdown = new THREE.Vector3( 0,-speed, 0 );
			    gleft = new THREE.Vector3(-speed, 0, 0);
			    gright = new THREE.Vector3(speed, 0, 0);
                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
            if(other_object.name == 'intel6')
            {
            	intelGet.play();
            	speed = speed * 2;
                scene.remove(intel6);
                gup = new THREE.Vector3( 0,speed,0 );
			    gdown = new THREE.Vector3( 0,-speed, 0 );
			    gleft = new THREE.Vector3(-speed, 0, 0);
			    gright = new THREE.Vector3(speed, 0, 0);
                intelLeft--;
                scene.remove(mesh);
                updateScore();
            }
            if(other_object.name == 'guard1')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
			if(other_object.name == 'guard2')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
            if(other_object.name == 'guard3')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
            if(other_object.name == 'guard4')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
            if(other_object.name == 'guard5')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
            if(other_object.name == 'guard6')
            {
            	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
            }
 
        });
        
        scene.add( player );
        
    }
    function createGroundPlane(x, y, z)
    {
        var texture = new THREE.ImageUtils.loadTexture('images/floor.jpg');
        var planeMaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:texture}), .4, 0 );
        var planeGeometry = new THREE.PlaneGeometry( 32, 56 );
        
        groundPlane = new Physijs.BoxMesh( planeGeometry, planeMaterial, 0);
        groundPlane.name = "GroundPlane";
        groundPlane.position.set(x, y + 1, z - .5);

        cameraHUD.position.set(x,y + 1, z + 5);
        cameraHUD.lookAt(new THREE.Vector3(x, y + 1, z-.5));
        scene.add(groundPlane);
    }
    function createGoal(x, y, z)
    {
    	var texture = new THREE.ImageUtils.loadTexture('images/base.jpg');
        var goalMaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:texture}), .4, 0 );
    	var goalGeometry = new THREE.BoxGeometry( 1, 1, 1 );
		var goal = new Physijs.BoxMesh( goalGeometry, goalMaterial, 5000 );
		goal.name = "goal";
		goal.position.set(x, y, z);
		goal.rotation.x = -250;
		scene.add(goal);
    }
    function createBase(base)
    {
    	var cubeTexture = new THREE.ImageUtils.loadTexture('images/wall.jpg');
    	var guardtexture = new THREE.ImageUtils.loadTexture('images/guard.jpg');
    	var inteltexture = new THREE.ImageUtils.loadTexture('images/intel.jpg');
        var cubeMaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({map:cubeTexture}), .4, 0 );
        var icount = 1;
        var gcount = 1;
        for(var i = 0; i < base.length; i++)
        {
            for(var j = 0; j < base[i].length; j++)
            {
                var cell = base[i][j];
                
                if(cell == '#')
                {
                    var cubeGeometry = new THREE.BoxGeometry(1, 1, 1.5);
                    cube = new Physijs.BoxMesh(cubeGeometry, cubeMaterial, 0);
                    cube.name = 'wall';
                    cube.position.x = i;
                    cube.position.y = j + 1;
                    cube.position.z = 2;

                    scene.add(cube);
                }
				
                if(cell == 'X')
                {	
                    addIntel(i, j, 2, icount, inteltexture);
                    icount++;
                    intelLeft++;
                }
                
                if(cell == 'P')
                {
                    setupPlayer(startx = i, starty = j ,startz = 2);

                    camera.position.x = i;
                    camera.position.y = j;
                    camera.position.z = 2;

                    camera.rotation.x = (Math.PI/2);

                    createGroundPlane(i + 1, j, 2);
                }
                if(cell == 'B')
                {
                	createGoal(i, j, 2);
                }
                if(cell == 'G')
                {
                	createGuard(i, j, 2, gcount, guardtexture);
                	gcount++;
                }
            }
        }
    }
    
    function moveGuard(guard)
    {
    	var randomNumBetween1and4 = Math.floor(Math.random() * 4) + 1;

    	if(randomNumBetween1and4 == 1)
    	{
    		guard.setLinearVelocity(gleft);
    	}
    	if(randomNumBetween1and4 == 2)
    	{
    		guard.setLinearVelocity(gup);
    	}
    	if(randomNumBetween1and4 == 3)
    	{
    		guard.setLinearVelocity(gdown);
    	}
    	if(randomNumBetween1and4 == 4)
    	{
    		guard.setLinearVelocity(gright);
    	}
    }
    function controlGuards()
    {
    	setInterval ( moveGuard(guard1), 35000 );
        setInterval ( moveGuard(guard2), 35000 );
        setInterval ( moveGuard(guard3), 35000 );
        setInterval ( moveGuard(guard4), 35000 );
        setInterval ( moveGuard(guard5), 35000 );
        setInterval ( moveGuard(guard6), 35000 );

        guard1.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard1);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }

       	});
       	guard2.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard2);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }
       	});
       	guard3.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard3);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }
       	});
       	guard4.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard4);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }
       	});
       	guard5.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard5);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }
       	});
       	guard6.addEventListener('collision', function(other_object)
        {
	        if(other_object.name == 'wall')
            {	
	           	moveGuard(guard6);
	        }
	        if(other_object.name == 'player')
	        {
	        	scene.remove(player);
	        	setupPlayer(startx, starty, 2);
	        }
       	});
       	
    }
    var calmmusic, alert, intelGet, victory;
	function loadSounds()
	{
		calmmusic = new Audio("sounds/calm.mp3");
		alert = new Audio("sounds/alert.mp3");
		intelGet = new Audio("sounds/itemused.wav");
		victory = new Audio("sounds/victory.mp3");
	}
    window.onload = init;

