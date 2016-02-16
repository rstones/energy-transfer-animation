var QJump = function(initialState, hamiltonian, jumpRates, time) {

	this.currentState = initialState;
	this.hamiltonian = hamiltonian;
	this.jumpRates = jumpRates;
	this.timestep = time[1] - time[0]; // check timestep is positive!
	this.time = time
	
	// generate a 1D array of random numbers between 0 and 1 with length numTimeSteps
	this.generateRandomNumberArray = function(numTimeSteps) {
		
	}

	this.randomNumbers = this.generateRandomNumberArray(this.time.length);
	
	// args
	// @eta is random number between 0 and 1
	// returns
	// waiting time
	// this is the simplest waiting time distribution with time independent rates (check this is physical for our system)
	this.waitingTime = function(eta, totalRate) {
		return (-1.0 / totalRate) * math.log(eta);
	}

	this.currentWaitingTime = this.waitingTime(this.randomNumbers.pop(), numjs.sum(this.jumpRates)); // maybe implement summation method here and dont use numjs
	
	// evolves wavefunction for single timestep, updating currentState
	// (according to Schrodinger eqn? I think there may be an extra term needed. See Breuer and Petruccione)
	this.evolveForTimestep = function() {

	}

	// based on amplitudes for each site, rate to jump to each site etc...
	// reset current state to new state decided by jump
	this.selectJump = function(currentState) {

	}

	// decides whether next timestep of deterministic evolution falls within current waiting time
	// if so it calls this.evolveForTimestep() which updates currentState
	// otherwise it calls this.selectJump() which selects jump and updates currentState to collapsed state then picks new waiting time
	// also checks termination conditions (final time reached, or certain amount of population has reached trap state etc)
	this.nextTimestep = function() {
		
	}
};
