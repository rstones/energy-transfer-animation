var energyTransferAnimation = new p5(function(sketch) {
	
	sketch.setup = function() {
		sketch.createCanvas(400,200);
		// generate Hamiltonian and quantum jump data in new worker thread
		// loading screen
		// draw three environments, pigment complex, controls etc
	};

	sketch.draw = function() {
		
	};
	
	// constructor function for Chromophore object prototype
	// how represent chromphore? a circle? a simplistic ball and stick representation? or a space filled representation
	sketch.Chromophore = function() {
		
	}
	
	// constructor function for Environment object prototype
	// a single parameter should quantify system-environment coupling for a particular instance, to control both quantum jump calculations
	// and the representation of the environment for the animation (maybe some spring/coiled stretchy cord simulations?)
	sketch.Environment = function() {

	}

	// create constructor functions for object prototypes such as chromophores, controls, environments, text boxes etc...

}, 'energy-transfer-animation');
