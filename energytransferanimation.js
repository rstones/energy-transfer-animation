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
	sketch.envStaticIntensities = [0.002, 0.02, 0.06];
	sketch.timestep = 0.01;
	sketch.totalTime = 1.0;
	sketch.qJump = new QJump(sketch.initState, sketch.hamiltonian, sketch.envJumpRates[0], sketch.timestep, sketch.totalTime);
	sketch.qJump.checkTerminationConditions = function() {
		sketch.qJump.calculationFinished = sketch.qJump.populations()[sketch.qJump.populations().length-1] > 0.99999;
	}	

	sketch.canvasWidth = 1580;
	sketch.canvasHeight = 870;

	sketch.environments = [];
	sketch.currentEnvironment = 0;
	sketch.envYCoord = 400;
	sketch.envPositions = [sketch.createVector(280,sketch.envYCoord),sketch.createVector(780,sketch.envYCoord),sketch.createVector(1280,sketch.envYCoord)]; // define centre positions
	// may need to look at actual positional data of FMO for the chromophore relative positions later on
	sketch.chromophoreRelativePositions = [sketch.createVector(-70,10), sketch.createVector(-100,100), sketch.createVector(5,120), sketch.createVector(70,80), 								sketch.createVector(-50,190), sketch.createVector(75,200), sketch.createVector(70,290)];
	sketch.complex = null;

	sketch.envJitter = [0, 1.0, 2.0];

	sketch.textBoxes = [];

	sketch.textBoxContents = ["For a very small interaction with the \nenvironment " +
					"energy can spread across \nthe molecules in a wavelike " +
					"manner. But \nsince the excitation will spend very little \n" + 							
					"time on the target state (green) it is \nunlikely to " + 
					"localize there.", 
				"When the coupling is neither too \nweak nor too strong, both synchronised \nquantum transfer and random hopping can \nbe used to transfer energy effectively. \nThe energy can spread over the molecules \nand still have a significant chance \nof quickly localizing at the target state.",
				"With a very strong coupling, random \nenergy fluctuations prevent synchronised \ntransfer of the excitation with a \nstrong tendancy for it to be localized \non single molecules. There is a random \nhopping of the excitation which \nis an inefficient way to transfer energy \ngiving long average transfer times."];

	sketch.drawHeader = function() {
		sketch.noStroke();
		sketch.fill(175);
		sketch.textSize(36);
		sketch.textAlign(sketch.LEFT);
		sketch.text("Quantum Secrets of Photosynthesis", 40, 50);
		sketch.textSize(20);
		sketch.text("Drag the light-harvesting complex into the different environments to see the effect on the\ntime for energy transfer "+
				"from the initial state (red) to the target state (green)", 80, 90);
	}
	
	// function to draw a representation of a chlorophyll molecule to take the place of the circles currently in use
	// either join together pentagons and hexagons to form it or draw ball and stick representation
	// have it transparent then can represent excitation as a glow extending from behind it (glow radius and opacity increasing as
	// population on that site increases)
	sketch.drawChlorophyll = function() {
		sketch.stroke(125);
		sketch.fill(0);
		sketch.strokeWeight(4);
		sketch.line(1000, 50, 1000,60)
		sketch.strokeWeight(2);
		sketch.ellipse(1000,50, 8,8);
	}
	
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
	sketch.Chromophore = function(relativePos, initPop, image) {
		
		this.population = initPop;
		this.relativePos = relativePos;
		this.size = 50;
		this.trapped = false;
		this.initState = false;
		this.trapState = false;
		this.image = image;
		// define things like size, fill colour etc...
	};
	
	sketch.Chromophore.prototype = {
		constructor: sketch.Chromophore,
		updatePopulation: function(newPop) {
			this.population = newPop;
		},
		// anchorPos is position to translate origin to before drawing Chromophore
		// the anchorPos will be either associated with Environment pos or mouse pos if Complex is currently being dragged
		display: function(beingDragged, jitter) {
			// draw Chromophore (start as a circle until the rest is working)
			if (beingDragged) {
				/*sketch.noStroke();
				sketch.fill(55);
				sketch.ellipse(this.relativePos.x+5, this.relativePos.y+5, this.size, this.size);
				sketch.stroke(125);
				sketch.fill(0);
				sketch.ellipse(this.relativePos.x, this.relativePos.y, this.size, this.size);
				if (!this.trapped) {
					sketch.fill(255,255*this.population);
				} else {
					sketch.fill(100,255,100,255*this.population);
				}
				sketch.ellipse(this.relativePos.x+sketch.int(xRandom), this.relativePos.y+sketch.int(yRandom), this.size, this.size);*/
				sketch.image(this.image, this.relativePos.x, this.relativePos.y, this.image.width*0.85, this.image.height*0.85);
			} else {
				var xRandom = 2.0 * Math.random() * jitter + jitter;
				var yRandom = 2.0 * Math.random() * jitter + jitter;
				/*if (this.initState) {
					sketch.stroke(255,100,100);
				} else if (this.trapState) {
					sketch.stroke(100,255,100);
				} else {
					sketch.stroke(125);
				}
				sketch.fill(0);
				sketch.ellipse(this.relativePos.x+xRandom, this.relativePos.y+yRandom, this.size, this.size);
				if (!this.trapped) {
					sketch.fill(255,255*this.population);
				} else {
					sketch.fill(100,255,100,255*this.population);
				}
				sketch.ellipse(this.relativePos.x+xRandom, this.relativePos.y+yRandom, this.size, this.size);*/
				sketch.image(this.image, this.relativePos.x+xRandom, this.relativePos.y+yRandom, this.image.width*0.7, this.image.height*0.7);
				this.drawPopulation(this.relativePos.x+xRandom, this.relativePos.y+yRandom);
			}
		},
		drawPopulation: function(xPos, yPos) {
			var radius = 60.0 * this.population;
			sketch.noStroke();
			for (var r = radius; r > 0; --r) {
				if (!this.trapped) {
					sketch.fill(250, 243, 140, 255/r);
				} else {
					sketch.fill(50, 255, 50, 255/r);
				}
				sketch.ellipse(xPos, yPos, r, r);
			}
		}
	};
	
	// constructor for a Complex object
	// consists of an array of Chromophore objects with certain relative positions
	sketch.Complex = function(relativePositions, initPops, chromophoreImages) {
		
		this.chromophores = [];
		this.relativePositions = relativePositions;
		this.anchorOffset = -150;
		this.beingDragged = false;
		this.populationTrapped = false;
		this.trappedFlash = 0;
		this.trappedFlashIncrement = 10;
		this.timer = new sketch.Timer();
		for (var i = 0; i < this.relativePositions.length; i++) {
			this.chromophores.push(new sketch.Chromophore(this.relativePositions[i], initPops[i], chromophoreImages[i]));
		}
		this.chromophores[0].initState = true;
		this.chromophores[this.chromophores.length-1].trapState = true;
	};
	
	sketch.Complex.prototype = {
		constructor: sketch.Complex,
		updatePopulations: function(pops) {
			for (var i = 0; i < this.chromophores.length; i++) {
				this.chromophores[i].updatePopulation(pops[i]);
			}
		},
		display: function(envAnchorPos, jitter) {
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
					this.chromophores[i].display(this.beingDragged, jitter);
				}
			} else {
				for (var i = 0; i < this.chromophores.length-1; i++) {
					this.chromophores[i].display(false, jitter);
				}
				var trapChromophore = this.chromophores[this.chromophores.length-1];
				trapChromophore.updatePopulation(math.abs(math.sin(2.0*math.pi*this.trappedFlash/255)));
				trapChromophore.trapped = true;
				trapChromophore.display(false, jitter);
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
	sketch.Environment = function(coupling, pos, staticIntensity) {
		
		this.coupling = coupling;
		this.pos = pos;
		this.anchorPos = this.pos; // + offset ?
		this.width = 400;
		this.height = 500;

		this.staticIntensity = staticIntensity;

		this.totalTimeSum = 0;
		this.transferEvents = 0;

	};
	
	sketch.Environment.prototype = {
		constructor: sketch.Environment,
		display: function() {
			// static effect here
			/*sketch.loadPixels();
			var d = sketch.pixelDensity();
			for (var x = this.pos.x-this.width/2; x < this.pos.x+this.width/2; x++) {
				for (var y = this.pos.y-this.height/2; y < this.pos.y+this.height/2; y++) {
					var r = 0.5;
					if (Math.random() < this.staticIntensity) {
						for (var i = 0; i < d; i++) {
							for (var j = 0; j < d; j++) {
								idx = 4 * ((y*d + j) * sketch.width*d + (x*d + i));
								sketch.pixels[idx] = 255;
								sketch.pixels[idx+1] = 0;
								sketch.pixels[idx+2] = 0;
								sketch.pixels[idx+3] = 220;
							}
						}
					}
				}
			}
			sketch.updatePixels();
			*/
			sketch.image(sketch.fmo_protein_img, this.pos.x, this.pos.y, this.width+50, this.height-80);
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
			sketch.text(this.currentTime.toFixed(2) + 'ps', -120, 270);
		},
		updateTime: function(increment) {
			this.currentTime += increment;
		},
		reset: function() {
			this.currentTime = 0;
		}
	};

	sketch.TextBox = function(anchorPos, width, height, text) {
		this.anchorPos = anchorPos;
		this.width = width;
		this.height = height;
		this.text = text;
		this.highlighted = false;
	}

	sketch.TextBox.prototype = {
		constructor: sketch.TextBox,
		display: function() {
			sketch.noStroke();
			sketch.rectMode(sketch.CENTER);
			sketch.textSize(18);
			sketch.textAlign(sketch.LEFT);
			if (this.highlighted) {
				sketch.fill(175);
				sketch.rect(this.anchorPos.x, this.anchorPos.y+380, this.width, this.height);
				sketch.fill(0);
				sketch.text(this.text, this.anchorPos.x-this.width/2+10, this.anchorPos.y+380-this.height/2+25);
			} else {
				sketch.fill(0);
				sketch.rect(this.anchorPos.x, this.anchorPos.y+380, this.width, this.height);
				sketch.fill(125);
				sketch.text(this.text, this.anchorPos.x-this.width/2+10, this.anchorPos.y+380-this.height/2+25);
			}
		}
	}

	sketch.PopUpBox = function() {

	}

	sketch.Button = function() {
	
	}

	// create constructor functions for object prototypes such as chromophores, controls, environments, text boxes etc...


	sketch.setup = function() {
		sketch.createCanvas(sketch.canvasWidth, sketch.canvasHeight);
		sketch.frameRate(25);
		sketch.smooth();
		sketch.rectMode(sketch.CENTER);
		sketch.imageMode(sketch.CENTER);
		//sketch.background(200, 0, 0);

		sketch.fmo_protein_img = sketch.loadImage("media/fmo_protein.png")
		sketch.fmo_bcl_1 = sketch.loadImage("media/fmo_bcl_1.png")
		sketch.fmo_bcl_2 = sketch.loadImage("media/fmo_bcl_2.png")
		sketch.fmo_bcl_3 = sketch.loadImage("media/fmo_bcl_3.png")
		sketch.fmo_bcl_4 = sketch.loadImage("media/fmo_bcl_4.png")
		sketch.fmo_bcl_5 = sketch.loadImage("media/fmo_bcl_5.png")
		sketch.fmo_bcl_6 = sketch.loadImage("media/fmo_bcl_6.png")
		sketch.fmo_bcl_7 = sketch.loadImage("media/fmo_bcl_7.png")
		sketch.chromophoreImages = [sketch.loadImage("media/fmo_bcl_1.png"), sketch.loadImage("media/fmo_bcl_2.png"), sketch.loadImage("media/fmo_bcl_3.png"),
					sketch.loadImage("media/fmo_bcl_4.png"), sketch.loadImage("media/fmo_bcl_5.png"), sketch.loadImage("media/fmo_bcl_6.png"),
					sketch.loadImage("media/fmo_bcl_7.png")];

		// instantiate the environments
		for (var i = 0; i < sketch.envJumpRates.length; i++) {
			sketch.environments.push(new sketch.Environment(sketch.envJumpRates[i], sketch.envPositions[i], sketch.envStaticIntensities[i]));
		}
		// instantiate the light-harvesting complex
		sketch.complex = new sketch.Complex(sketch.chromophoreRelativePositions, sketch.initState, sketch.chromophoreImages);
		// display everything at the start
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
		for (i = 0; i < sketch.environments.length; i++) {
			sketch.textBoxes.push(new sketch.TextBox(sketch.envPositions[i], 400, 200, sketch.textBoxContents[i]));
		}
	};

	sketch.draw = function() {
		sketch.background(0, 0, 0);
		sketch.drawHeader();
		if (!sketch.complex.beingDragged && !sketch.complex.populationTrapped) {
			var calculationFinished = sketch.qJump.nextTimestep(); // need to check whether calculation has terminated each time so we can reset
			var currentPopulations = sketch.qJump.populations()
			sketch.complex.updatePopulations(currentPopulations);
			sketch.complex.timer.updateTime(sketch.timestep);
		}
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
			var textBox = sketch.textBoxes[i]
			if (i == sketch.currentEnvironment) {
				textBox.highlighted = true;
			} else {
				textBox.highlighted = false;
			}
			textBox.display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment], sketch.envJitter[sketch.currentEnvironment]);
		// trap state population bar? other display stuff
		if (sketch.qJump.calculationFinished) {
			sketch.complex.populationTrapped = true;
			sketch.qJump.reset(sketch.initState);
			sketch.environments[sketch.currentEnvironment].updateAverageTime(sketch.complex.timer.currentTime);
		}
		
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
