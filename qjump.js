/*
	Object to carry out quantum jump trajectory calculations for a simple system with time independent 
	jump rates. Termination conditions can be defined by overriding the terminationConditions function.
	This object depends on the script num.js for linear algebra calculations.
*/
var QJump = function(initialState, hamiltonian, jumpRates, timestep, totalTime) {

	this.currentState = initialState;
	this.hamiltonian = hamiltonian;
	this.jumpRates = jumpRates;
	this.timestep = timestep;
	this.totalTime = totalTime
	this.timeLeft = totalTime;
	this.calculationFinished = false;
	this.totalJumpRate = numjs.sum(this.jumpRates);

	// returns waiting time
	// this is the simplest waiting time distribution with time independent rates (check this is physical for our system)
	this.waitingTime = function() {
		return (-1.0 / this.totalJumpRate) * math.log(Math.random());
	}
	
	this.currentWaitingTime = this.waitingTime();
	this.nonHermitianHamiltonian = math.add(this.hamiltonian, math.multiply(math.complex(0,-0.5), numjs.diag(this.jumpRates)));
	this.timeEvolutionOperator = numjs.expm(math.multiply(math.complex(0,-1), math.multiply(this.nonHermitianHamiltonian, this.timestep)));
	
	// evolves wavefunction for single timestep, updating currentState
	// (according to Schrodinger eqn? I think there may be an extra term needed. See Breuer and Petruccione)
	this.evolveForTimestep = function() {
		var nextState = numjs.dot(this.timeEvolutionOperator, this.currentState);
		this.currentState = math.multiply(nextState, math.pow(numjs.norm(nextState),-1)); // this normalisation is only needed if we include a dissipative term in the timestep operator?
	}

	// based on amplitudes for each site, rate to jump to each site etc...
	// reset current state to new state decided by jump
	this.selectJump = function() {
		// calculate population of each state and normalization
		var pops = [];
		var normalization = 0
		for (var i = 0; i < this.currentState.length; i++) {
			pops.push(math.pow(math.abs(this.currentState[i]), 2));
			normalization += this.jumpRates[i]*pops[i];
			
		}
		// calculate p_j for each state
		var jumpProbs = [];
		for (var i = 0; i < this.currentState.length; i++) {
			jumpProbs.push(this.jumpRates[i] * pops[i] / normalization);
		}
		// divide [0,1] into K sub-intervals each with length p_j
		// pick random number r between [0,1]
		// see which interval r is in
		var r = Math.random();
		var jumpState = 0;
		var probSum = 0;
		for (var i = 0; i < jumpProbs.length; i++) {
			probSum += jumpProbs[i];
			if (r < probSum) {
				jumpState = i;
				break;
			}
		}
		var nextState = numjs.zeros([this.currentState.length]);
		nextState[jumpState] = 1.0;
		this.currentState = nextState; 
		//console.log("selected jump to state " + jumpState);
	}

	// this should be overridden by the user to set custom termination conditions such as checking for population reaching a certain level
	// on certain states
	// default behaviour is to check if totalTime has been reached
	this.checkTerminationConditions = function() {
		this.calculationFinished = this.timeLeft < 0;
	}

	// will return true when calculation has terminated
	// still need to add population check for a certain state (maybe can override a function called terminationCondition to set custom conditions?)
	// also checks termination conditions (final time reached, or certain amount of population has reached trap state etc)
	this.nextTimestep = function() {
		if (this.currentWaitingTime > 0 && !this.calculationFinished) {
			this.evolveForTimestep();
			this.currentWaitingTime -= this.timestep;
			this.totalTime -= this.timestep;
		} else if (this.currentWaitingTime < 0 && !this.calculationFinished) {
			this.selectJump();
			this.currentWaitingTime = this.waitingTime()
		}
		this.checkTerminationConditions();
		return this.calculationFinished;
	}

	this.populations = function() {
		var result = [];
		for (var i = 0; i < this.currentState.length; i++) {
			result.push(math.pow(math.abs(this.currentState[i]),2));
		}
		return result;
	}

	this.reset = function(initState) {
		this.calculationFinished = false;
		this.timeLeft = totalTime;
		this.currentState = initState;
		this.currentWaitingTime = this.waitingTime();
	}
	
	this.setJumpRates = function(newJumpRates) {
		this.jumpRates = newJumpRates;
		this.totalJumpRate = numjs.sum(newJumpRates);
	}
};
