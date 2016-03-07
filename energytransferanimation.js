var energyTransferAnimation = new p5(function(sketch) {
	
	sketch.initState = [math.complex(1.0,0), 0, 0, 0, 0, 0, 0];
	// hamiltonian from Ishizaki and Fleming, PNAS, 106, 17255 (2009)
	sketch.hamiltonian = [[12410.0, 87.7, -5.5, 5.9, -6.7, 13.7, 9.9],
							[87.7, 12530.0, -30.8, -8.2, -0.7, -11.8, -4.3],
							[-5.5, -30.8, 12210.0, 53.5, 2.2, 9.6, -6.0],
							[5.9, -8.2, 53.5, 12320.0, 70.7, 17.0, 63.3],
							[-6.7, -0.7, 2.2, 70.7, 12480.0, -81.1, 1.3],
							[13.7, -11.8, 9.6, 17.0, -81.1, 12630.0, -39.7],
							[9.9, -4.3, -6.0, 63.3, 1.3, -39.7, 12440.0]];
	sketch.hamiltonian = [[8.0, 8.0, 4.0, 0, 0, 0, 0],
							[8.0, 0, 8.0, 4.0, 0, 0, 0],
							[4.0, 8.0, 0, 8.0, 4.0, 0, 0],
							[0, 4.0, 8.0, 0, 8.0, 4.0, 0],
							[0, 0, 4.0, 8.0, 0, 8.0, 4.0],
							[0, 0, 0, 4.0, 8.0, 0, 8.0],
							[0, 0, 0, 0, 4.0, 8.0, -8.0]];
	sketch.envJumpRates = [[0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.1], [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0], [8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 10.0]];
	sketch.timestep = 0.005;
	sketch.totalTime = 1.0;
	sketch.qJump = new QJump(sketch.initState, sketch.hamiltonian, sketch.envJumpRates[0], sketch.timestep, sketch.totalTime);
	sketch.qJump.checkTerminationConditions = function() {
		sketch.qJump.calculationFinished = sketch.qJump.populations()[sketch.qJump.populations().length-1] > 0.99999;
	}	

	sketch.canvasWidth = 1500;
	sketch.canvasHeight = 600;

	sketch.environments = [];
	sketch.currentEnvironment = 0;
	sketch.envPositions = [sketch.createVector(300,300),sketch.createVector(750,300),sketch.createVector(1200,300)]; // define centre positions
	// may need to look at actual positional data of FMO for the chromophore relative positions later on
	sketch.chromophoreRelativePositions = [sketch.createVector(0,0), sketch.createVector(-100,100), sketch.createVector(20,120), sketch.createVector(100,100), 								sketch.createVector(-50,190), sketch.createVector(75,200), sketch.createVector(-25,300)];
	sketch.complex = null;
	
	/*
		Need to start with basic environments (without visuals to signify different coupling) and
		complex that can be drag-n-dropped into the different environments which will then change the
		energy transfer animation.

		Environments: 3 rectangles, center positioned
		Complex: 2D array of circles with fixed relative positioning, the absolute position anchors to the position of the environment
			it is currently associated with plus an offset unique to each environment to make positioning general for later
	*/ 	
	
	// constructor function for Chromophore object prototype
	// how represent chromphore? a circle? a simplistic ball and stick representation? or a space filled representation
	sketch.Chromophore = function(relativePos, initPop) {
		
		this.population = initPop;
		this.relativePos = relativePos;
		this.size = 50;
		this.trapped = false;
		// define things like size, fill colour etc...
	};
	
	sketch.Chromophore.prototype = {
		constructor: sketch.Chromophore,
		updatePopulation: function(newPop) {
			this.population = newPop;
		},
		// anchorPos is position to translate origin to before drawing Chromophore
		// the anchorPos will be either associated with Environment pos or mouse pos if Complex is currently being dragged
		display: function(beingDragged) {
			// draw Chromophore (start as a circle until the rest is working)
			// need to work out best way to define position since we are going to be dragging the whole Complex around
			// fill with opacity scaled by population
			if (beingDragged) {
				sketch.noStroke();
				sketch.fill(55);
				sketch.ellipse(this.relativePos.x+5, this.relativePos.y+5, this.size, this.size);

			}
			sketch.stroke(125);
			sketch.fill(0);
			sketch.ellipse(this.relativePos.x, this.relativePos.y, this.size, this.size);
			if (!this.trapped) {
				sketch.fill(255,255*this.population);
			} else {
				sketch.fill(100,255,0,255*this.population);
			}
			sketch.ellipse(this.relativePos.x, this.relativePos.y, this.size, this.size);
		}
	};
	
	// constructor for a Complex object
	// consists of an array of Chromophore objects with certain relative positions
	sketch.Complex = function(relativePositions, initPops) {
		
		this.chromophores = [];
		this.relativePositions = relativePositions;
		this.anchorOffset = -150;
		this.beingDragged = false;
		this.populationTrapped = false;
		this.trappedFlash = 0;
		this.trappedFlashIncrement = 5;
		this.timer = new sketch.Timer();
		for (var i = 0; i < this.relativePositions.length; i++) {
			this.chromophores.push(new sketch.Chromophore(this.relativePositions[i], initPops[i]));
		}
	};
	
	sketch.Complex.prototype = {
		constructor: sketch.Complex,
		updatePopulations: function(pops) {
			for (var i = 0; i < this.chromophores.length; i++) {
				this.chromophores[i].updatePopulation(pops[i]);
			}
		},
		display: function(envAnchorPos) {
			if (this.beingDragged) {
				anchorPos = sketch.createVector(sketch.mouseX, sketch.mouseY);
			} else {
				anchorPos = envAnchorPos;
			}
			sketch.translate(anchorPos.x, anchorPos.y+this.anchorOffset);
			sketch.strokeWeight(2);
			sketch.stroke(0);
			if (!this.populationTrapped) {
				for (var i = 0; i < this.chromophores.length; i++) {
					this.chromophores[i].display(this.beingDragged);
				}
			} else {
				for (var i = 0; i < this.chromophores.length-1; i++) {
					this.chromophores[i].display(false);
				}
				var trapChromophore = this.chromophores[this.chromophores.length-1];
				trapChromophore.updatePopulation(math.abs(math.sin(2.0*math.pi*this.trappedFlash/255)));
				trapChromophore.trapped = true;
				trapChromophore.display(false);
				trapChromophore.trapped = false;
				this.trappedFlash += this.trappedFlashIncrement;
				if (this.trappedFlash > 500) {
					this.trappedFlash = 0;
					this.populationTrapped = false;
					this.timer.reset();
				}
			}
			this.timer.display()
			// check if mouseOver then highlight if so?
			
			sketch.translate(-anchorPos.x, -(anchorPos.y+this.anchorOffset));
		},
		mouseOver: function(currentEnvPos) {
			// if mouse over chromophore area (do i need to save current position and dimensions?)
			// return true
			// also need to make it work for touch!
			if (sketch.mouseX > currentEnvPos.x-120 && sketch.mouseX < currentEnvPos.x+120 && sketch.mouseY > currentEnvPos.y+this.anchorOffset && sketch.mouseY < currentEnvPos.y-this.anchorOffset) {
				return true;
			}
		},
		drag: function() {
			this.beingDragged = true;
			// if mouse down and mouseOver are true then set beingDragged to true and centre position of Complex follows mouse (and add shadow effect)
		},
		drop: function() {
			// if beingDragged is true while mouse released find nearest environment and send it there (with a nice spring effect?)
			// then set beingDragged to false
			this.beingDragged = false;
		}
	};
	
	// constructor function for Environment object prototype
	// a single parameter should quantify system-environment coupling for a particular instance, to control both quantum jump calculations
	// and the representation of the environment for the animation (maybe some spring/coiled stretchy cord simulations?)
	sketch.Environment = function(coupling, pos) {
		
		this.coupling = coupling;
		this.pos = pos;
		this.anchorPos = this.pos; // + offset ?
		this.width = 400;
		this.height = 500;

		this.totalTimeSum = 0;
		this.transferEvents = 0;

	};
	
	sketch.Environment.prototype = {
		constructor: sketch.Environment,
		display: function() {
			sketch.stroke(125);
			sketch.noFill();
			sketch.rect(this.pos.x, this.pos.y, this.width, this.height);
			sketch.noStroke();
			sketch.fill(125);
			sketch.textSize(16);
			sketch.textAlign(sketch.LEFT);
			sketch.text('average transfer time:', this.pos.x+this.width/2 - 300, this.pos.y+this.height/2 - 20);
			sketch.textSize(24);
			sketch.textAlign(sketch.RIGHT);
			sketch.text((this.transferEvents > 0 ? (this.totalTimeSum/this.transferEvents).toFixed(2) : 0) + 'ps', this.pos.x+this.width/2 - 20, this.pos.y+this.height/2 - 20);
		},
		updateAverageTime: function(time) {
			this.totalTimeSum += time;
			this.transferEvents += 1;
		}
	};

	sketch.Timer = function() {
		this.size = 24;
		this.currentTime = 0;
	};

	sketch.Timer.prototype = {
		constructor: sketch.Timer,
		display: function(envAnchorPos) {
			sketch.noStroke();
			sketch.fill(125);
			sketch.textAlign(sketch.LEFT);
			sketch.textSize(this.size);
			sketch.text(this.currentTime.toFixed(2) + 'ps', -120, 240);
		},
		updateTime: function(increment) {
			this.currentTime += increment;
		},
		reset: function() {
			this.currentTime = 0;
		}
	};

	sketch.TextBox = function() {

	}

	sketch.PopUpBox = function() {

	}

	sketch.Button = function() {
	
	}

	// create constructor functions for object prototypes such as chromophores, controls, environments, text boxes etc...


	sketch.setup = function() {
		sketch.createCanvas(sketch.canvasWidth, sketch.canvasHeight);
		sketch.smooth();
		sketch.rectMode(sketch.CENTER);
		sketch.background(200);
		// instantiate the environments
		for (var i = 0; i < sketch.envJumpRates.length; i++) {
			sketch.environments.push(new sketch.Environment(sketch.envJumpRates[i], sketch.envPositions[i]));
		}
		// instantiate the light-harvesting complex
		sketch.complex = new sketch.Complex(sketch.chromophoreRelativePositions, sketch.initState);
		// display everything at the start
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
	};

	sketch.draw = function() {
		sketch.background(0);
		if (!sketch.complex.beingDragged && !sketch.complex.populationTrapped) {
			var calculationFinished = sketch.qJump.nextTimestep(); // need to check whether calculation has terminated each time so we can reset
			var currentPopulations = sketch.qJump.populations()
			sketch.complex.updatePopulations(currentPopulations);
			sketch.complex.timer.updateTime(sketch.timestep);
		}
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
		// trap state population bar? other display stuff
		if (sketch.qJump.calculationFinished) {
			console.log("resetting calculation");
			sketch.complex.populationTrapped = true;
			sketch.qJump.reset(sketch.initState);
			sketch.environments[sketch.currentEnvironment].updateAverageTime(sketch.complex.timer.currentTime);
		}
		//sketch.noFill();
		//sketch.curve(0,0, 600,300, 800,300, 0,0);
		//sketch.curve(1600,730, 800,300, 900,400, 1600,600);
		
	};

	sketch.mousePressed = function() {
		if (sketch.complex.mouseOver(sketch.envPositions[sketch.currentEnvironment]) && !sketch.complex.beingDragged) {
			sketch.complex.drag();
			sketch.complex.timer.reset();
		}
	};

	sketch.mouseReleased = function() {
		if (sketch.complex.beingDragged) {
			// find nearest env
			var nearestEnvDistance = sketch.width; // largest possible distance from an environment to initialise
			var nearestEnvIndex = 0;
			for (var i = 0; i < sketch.envPositions.length; i++) {
				var currentEnvPos = sketch.envPositions[i];
				var d = math.sqrt(math.pow(math.abs(sketch.mouseX - currentEnvPos.x),2) + math.pow(math.abs(sketch.mouseY - currentEnvPos.y),2)); // Pythagoras' theorem
				if (d < nearestEnvDistance) {
					nearestEnvDistance = d;
					nearestEnvIndex = i;
				}
			}
			sketch.currentEnvironment = nearestEnvIndex;
			// restart animation in new environment
			sketch.qJump.setJumpRates(sketch.environments[nearestEnvIndex].coupling);
			sketch.qJump.reset(sketch.initState);
			sketch.complex.drop();
		}
	};
	
}, 'energy-transfer-animation');
