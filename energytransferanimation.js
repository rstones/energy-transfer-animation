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

	sketch.canvasWidth = 1320;
	sketch.canvasHeight = 520;

	sketch.environments = [];
	sketch.currentEnvironment = 0;
	sketch.envYCoord = 260;
	sketch.envPositions = [sketch.createVector(210,sketch.envYCoord),sketch.createVector(660,sketch.envYCoord),sketch.createVector(1110,sketch.envYCoord)]; // define centre positions
	// may need to look at actual positional data of FMO for the chromophore relative positions later on
	sketch.chromophoreRelativePositions = [sketch.createVector(-70,0), sketch.createVector(-100,90), sketch.createVector(25,110), sketch.createVector(50,20), 								sketch.createVector(-50,180), sketch.createVector(75,190), sketch.createVector(70,280)];
	sketch.complex = null;

	sketch.envJitter = [0, 1.0, 2.0];

	sketch.textBoxes = [];

	sketch.envInteractionText = ["weak", "medium", "strong"];

	sketch.box1Text = ["Observations\n" +
				"1.  The excitation can be found on several molecules at the same time\n" + 
				"2.  The excitation moves between molecules in a synchronised, wavelike way\n" +
				"3.  On average it takes a long time for the excitation to reach the target molecule",
				"Observations:\n" +
				"1.  The excitation can be found on several molecules at once for a short time periods\n" + 
				"2.  Sudden jumps localize the excitation on one molecule\n" +
				"3.  On average the excitation reaches the target molecule very quickly",
				"Observations:\n" +
				"1.  The excitation is found on only one molecule almost all the time\n" + 
				"2.  The excitation moves between molecules through sudden random jumps\n" +
				"3.  On average it takes a long time for the excitation to reach the target molecule but not as long as for the weak coupling"];
	sketch.box2Text = ["Weak interaction\n" +
				"For a very small interaction with the surroundings " +
				"energy can spread across the molecules in a wavelike " +
				"manner. But since the excitation will spend very little " + 							
				"time on the target molecule (green) it is unlikely to " + 
				"localize there. Energy transfer is slow in this case and the " +
				"captured energy may end up being lost.",
				"Medium interaction\n" +
				"When the interaction is neither too weak nor too strong, both synchronised quantum transfer and random hopping can be used to transfer energy effectively. The energy can spread over the molecules and still have a significant chance of quickly localizing at the target state. This gives the excitation the best chance of reaching the target molecule before it is lost.",
				"Strong interaction\n" +
				"With a very strong interaction, random energy fluctuations prevent synchronised transfer of the excitation with a strong tendancy for it to be localized on single molecules. The excitation is transferred through random hopping which is very inefficient and leads to long average transfer times."];

	sketch.timerFont;

	sketch.drawHeader = function() {
		sketch.noStroke();
		sketch.fill(175);
		sketch.textAlign(sketch.LEFT);
		sketch.textFont("Helvetica");
		sketch.textSize(36);
		sketch.text("Quantum Secrets of Photosynthesis Lab", 40, 50);
		sketch.textSize(20);
		sketch.text("Experiment by dragging the light-harvesting molecules into the different environments to see the effect on the\ntime for energy transfer "+
				"from the initial state (red) to the target state (green). Write down your observations of\nhow the energy moves between the molecules "+
				"then click to see if they agree with ours.", 80, 80);
	}
	
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
				sketch.image(this.image, this.relativePos.x, this.relativePos.y, this.image.width*0.85, this.image.height*0.85);
			} else {
				var xRandom = 2.0 * Math.random() * jitter + jitter;
				var yRandom = 2.0 * Math.random() * jitter + jitter;
				sketch.image(this.image, this.relativePos.x+xRandom, this.relativePos.y+yRandom, this.image.width*0.7, this.image.height*0.7);
				this.drawPopulation(this.relativePos.x+xRandom, this.relativePos.y+yRandom);
			}
		},
		drawPopulation: function(xPos, yPos) {
			var radius = 70.0 * (1 - math.exp(-3.0*this.population)); //this.population > 0.005 ? 20 + 60.0 * this.population : 0;
			sketch.noStroke();
			for (var r = radius; r > 0; --r) {
				if (!this.trapped) {
					sketch.fill(250, 243, 140, 255/r);
				} else {
					sketch.fill(0,150,0, 255/r); //sketch.fill(50, 255, 50, 255/r);
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
				sketch.cursor(sketch.HAND);
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
	sketch.Environment = function(coupling, pos, staticIntensity, envLabel, box1Text, box2Text) {
		
		this.coupling = coupling;
		this.pos = pos;
		this.anchorPos = this.pos; // + offset ?
		this.width = 400;
		this.height = 500;

		this.staticIntensity = staticIntensity;

		this.totalTimeSum = 0;
		this.transferEvents = 0;
		this.displayInfoButton = false; // only display info button when complex is in this environment
		this.infoButton = new sketch.InfoButton(this.pos.x-this.width/2+48, this.pos.y+this.height/2-35, 40, 25, null);
		this.envLabel = envLabel;
		this.displayPopup = false;
		this.box1Text = box1Text;
		this.box2Text = box2Text;
	};
	
	sketch.Environment.prototype = {
		constructor: sketch.Environment,
		display: function() {
			sketch.image(sketch.fmo_protein_img, this.pos.x, this.pos.y-20, this.width+50, this.height-80);
			sketch.stroke(125);
			sketch.noFill();
			sketch.rect(this.pos.x, this.pos.y, this.width, this.height, 10);
			sketch.noStroke();
			sketch.fill(125);
			sketch.textAlign(sketch.RIGHT);
			sketch.textSize(15);
			sketch.textFont(sketch.timerFont);
			sketch.textFont("Helvetica");
			sketch.text("average\ntransfer time", this.pos.x+this.width/2 - 190, this.pos.y+this.height/2 - 42);
			sketch.textAlign(sketch.RIGHT);
			sketch.text(this.envLabel+" interaction", this.pos.x+this.width/2-40, this.pos.y-this.height/2+38, 60, 40);
			sketch.textSize(52);
			sketch.textFont(sketch.timerFont);
			var averageTime = (this.totalTimeSum/this.transferEvents).toFixed(2)
			averageTimeToPrint = averageTime < 10.0 ? "0"+averageTime : averageTime;
			sketch.text((this.transferEvents > 0 ? averageTimeToPrint : "00.00") + 'ps', this.pos.x+this.width/2 - 20, this.pos.y+this.height/2 - 20);
			this.displayInfoButton ? this.infoButton.display() : null;
		},
		updateAverageTime: function(time) {
			this.totalTimeSum += time;
			this.transferEvents += 1;
		},
		openClosePopupBox: function() {
			this.displayPopup ? this.displayPopup = false : this.displayPopup = true;
		},
		displayPopupBox: function(currentEnv) {
			var box = 1;
			for (var i = 0; i < sketch.envPositions.length; i++) {
				sketch.textFont("Helvetica");
				if (i != currentEnv) {
					sketch.fill(150, 150, 150, 220);
					sketch.rect(sketch.envPositions[i].x, sketch.envPositions[i].y, this.width, this.height, 10);
					sketch.fill(20, 20, 20);
					sketch.text(box == 1 ? this.box1Text : this.box2Text, sketch.envPositions[i].x,
							sketch.envPositions[i].y, this.width-50, this.height-50);
					box = 2;
				}
			}
		}
	};

	sketch.Timer = function() {
		this.size = 32;
		this.currentTime = 0;
	};

	sketch.Timer.prototype = {
		constructor: sketch.Timer,
		display: function(envAnchorPos) {
			sketch.rect(-60, 260, 120, 35, 5);
			sketch.noStroke();
			sketch.fill(125);
			sketch.textAlign(sketch.LEFT);
			sketch.textSize(this.size);
			sketch.textFont(sketch.timerFont);
			var timeToPrint = this.currentTime < 10 ? "0"+this.currentTime.toFixed(2) : this.currentTime.toFixed(2);
			sketch.text(timeToPrint + 'ps', -110, 271);
		},
		updateTime: function(increment) {
			this.currentTime += increment;
		},
		reset: function() {
			this.currentTime = 0;
		}
	};

	sketch.InfoButton = function(xPos, yPos, xSize, ySize, popupBox) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.xSize = xSize;
		this.ySize = ySize;
		this.popupBox = popupBox;
	}

	sketch.InfoButton.prototype = {
		constructor: sketch.InfoButton,
		display: function() {
			sketch.noStroke();
			if (this.mouseOver()) {
				sketch.fill(0,70,0);
				sketch.cursor(sketch.HAND);
			} else {
				sketch.fill(0,150,0);	
			}
			sketch.rect(this.xPos, this.yPos, this.xSize+15, this.ySize, 5);
			if (this.mouseOver()) {
				sketch.fill(0,150,0);
			} else {
				sketch.fill(0,70,0);
			}
			sketch.textSize(42);
			sketch.textFont(sketch.timerFont);
			sketch.textFont("Helvetica");
			sketch.textAlign(sketch.CENTER);
			if (sketch.environments[sketch.currentEnvironment].displayPopup) {
				sketch.text("close", this.xPos, this.yPos+6);
			} else {
				sketch.text("info >", this.xPos, this.yPos+6);
			}
		},
		mouseOver: function() {
			return sketch.mouseX > this.xPos-this.xSize/2 && sketch.mouseX < this.xPos+this.xSize/2 
					&& sketch.mouseY > this.yPos-this.ySize/2 && sketch.mouseY < this.yPos+this.ySize/2
		}
	}

	sketch.preload = function() {
		sketch.timerFont = sketch.loadFont("media/digital-7 (mono).ttf");
	};

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
			sketch.environments.push(new sketch.Environment(sketch.envJumpRates[i], sketch.envPositions[i], sketch.envStaticIntensities[i],
					sketch.envInteractionText[i], sketch.box1Text[i], sketch.box2Text[i]));
		}
		// instantiate the light-harvesting complex
		sketch.complex = new sketch.Complex(sketch.chromophoreRelativePositions, sketch.initState, sketch.chromophoreImages);
		// display everything at the start
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment]);
		//for (i = 0; i < sketch.environments.length; i++) {
		//	sketch.textBoxes.push(new sketch.TextBox(sketch.envPositions[i], 400, 200, sketch.textBoxContents[i]));
		//}
	};

	sketch.draw = function() {
		sketch.background(0, 0, 0);
		//sketch.drawHeader();
		// do next timestep of qjump calculation and update graphics
		if (!sketch.complex.beingDragged && !sketch.complex.populationTrapped) {
			var calculationFinished = sketch.qJump.nextTimestep(); // need to check whether calculation has terminated each time so we can reset
			var currentPopulations = sketch.qJump.populations()
			sketch.complex.updatePopulations(currentPopulations);
			sketch.complex.timer.updateTime(sketch.timestep);
		}
		sketch.cursor(sketch.ARROW); // reset cursor before drawing stuff
		// display stuff
		for (var i = 0; i < sketch.environments.length; i++) {
			sketch.environments[i].display();
			if (i == sketch.currentEnvironment) {
				sketch.environments[i].displayInfoButton = true;
			} else {
				sketch.environments[i].displayInfoButton = false;
			}
		}
		sketch.complex.display(sketch.envPositions[sketch.currentEnvironment], sketch.envJitter[sketch.currentEnvironment]);
		// test whether to display popup box
		if (sketch.environments[sketch.currentEnvironment].displayPopup) {
				sketch.environments[sketch.currentEnvironment].displayPopupBox(sketch.currentEnvironment);
			}
		// cursor to HAND when mouse over complex and not pressed
		if (sketch.complex.mouseOver(sketch.envPositions[sketch.currentEnvironment])) {
			sketch.cursor(sketch.HAND);		
		}
		// reset qjump calculations and update average time
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
			sketch.environments[sketch.currentEnvironment].displayPopup = false;
		}
		if (sketch.environments[sketch.currentEnvironment].infoButton.mouseOver()) {
			sketch.environments[sketch.currentEnvironment].openClosePopupBox();
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
