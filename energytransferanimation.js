var energyTransferAnimation = new p5(function(sketch) {
	
	sketch.initState = [1., 0, 0, 0, 0, 0, 0];
	sketch.hamiltonian = [[],[],[],[],[],[],[]];
	sketch.jumpRates = [];
	sketch.timestep = 0.001;
	sketch.totalTime = 10.0;
	sketch.qJump = 0//new QJump(sketch.initState, sketch.hamiltonian, sketch.jumpRates, sketch.timestep, sketch.totalTime);

	sketch.envCouplingVals = [0, 10, 100];
	sketch.environments = [];
	sketch.currentEnvironment = 0;
	sketch.envPositions = [sketch.createVector(300,300),sketch.createVector(600,300),sketch.createVector(900,300)]; // define centre positions
	sketch.chromophoreRelativePositions = [sketch.createVector(0,0),sketch.createVector(-100,100),sketch.createVector(20,120),sketch.createVector(100,100),sketch.createVector(-50,150),
						sketch.createVector(75,200),sketch.createVector(-25,300)];
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
		// define things like size, fill colour etc...
	};
	
	sketch.Chromophore.prototype = {
		constructor: sketch.Chromophore,
		updatePopulation: function(newPop) {
			this.population = newPop;
		},
		// anchorPos is position to translate origin to before drawing Chromophore
		// the anchorPos will be either associated with Environment pos or mouse pos if Complex is currently being dragged
		display: function() {
			// draw Chromophore (start as a circle until the rest is working)
			// need to work out best way to define position since we are going to be dragging the whole Complex around
			// fill with opacity scaled by population
			sketch.fill(255,0,0,255*this.population);
			sketch.ellipse(this.relativePos.x, this.relativePos.y, this.size, this.size);
		}
	};
	
	// constructor for a Complex object
	// consists of an array of Chromophore objects with certain relative positions
	sketch.Complex = function(relativePositions, initPops) {
		
		this.chromophores = [];
		this.relativePositions = relativePositions;
		for (var i = 0; i < this.relativePositions.length; i++) {
			this.chromophores.push(new sketch.Chromophore(initPops[i]));
		}
	};
	
	sketch.Complex.prototype = {
		constructor: sketch.Complex,
		updatePopulations: function(pops) {
			for (var i = 0; i < this.chromophores.length; i++) {
				this.chromophores[i].updatePopulation(pops[i]);
			}
		},
		display: function(anchorPos) {
			// translate origin to currently selected environment
			// call display functions common to all chromophores so as to avoid calling multiple times in every Chromophore.display
			sketch.translate(anchorPos[0], anchorPos[1]);
			sketch.strokeWeight(2);
			sketch.stroke(0);
			for (var i = 0; i < this.chromophores.length; i++) {
				this.chromophores[i].display();
			}
			// any extra bits to display?
			// translate back? need to find out how translate works...
		}
	};
	
	// constructor function for Environment object prototype
	// a single parameter should quantify system-environment coupling for a particular instance, to control both quantum jump calculations
	// and the representation of the environment for the animation (maybe some spring/coiled stretchy cord simulations?)
	sketch.Environment = function(pos) {

		this.pos = pos;
		this.anchorPos = this.pos; // + offset ?
		this.width = 300;
		this.height = 500;

	};
	
	sketch.Environment.prototype = {
		constructor: sketch.Environment,
		display: function() {
			sketch.rect(this.pos.x, this.pos.y, this.width, this.height); 
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
		sketch.createCanvas(1000,1000);
		sketch.smooth();
		sketch.rectMode(sketch.CENTER);
		// generate Hamiltonian and quantum jump data in new worker thread
		// create qjump object to do the calculations
		// loading screen
		// draw three environments, pigment complex, controls etc
		for (var i = 0; i < sketch.envCouplingVals.length; i++) {
			sketch.environments.push(new sketch.Environment(sketch.envCouplingVals[i], sketch.envPositions[i]));
		}
		sketch.complex = new sketch.Complex(sketch.chromophoreRelativePositions, sketch.initState);
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
	};

	sketch.draw = function() {
		//var calculationFinished = sketch.qJump.nextTimestep(); // need to check whether calculation has terminated each time so we can reset
		//sketch.complex.updatePopulations(qJump.populations());
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
		// trap state population bar? other display stuff
		//if (calculationFinished) {
			// reset
		//}
	};
	
}, 'energy-transfer-animation');
