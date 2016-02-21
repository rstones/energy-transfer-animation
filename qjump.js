var QJump = function(initialState, hamiltonian, jumpRates, timestep, totalTime) {

	this.currentState = initialState;
	this.hamiltonian = hamiltonian;
	this.jumpRates = jumpRates;
	this.timestep = timestep;
	this.totalTime = totalTime
	this.timeLeft = totalTime;
	this.calculationFinished = false;
	
	// generate a 1D array of random numbers between 0 and 1 with length numTimeSteps
	//this.generateRandomNumberArray = function(numTimeSteps) {
	//	var result = [];
	//	for (var i = 0; i < numTimeSteps; i++) {
	//		result.push(Math.random());
	//	}
	//	return result;
	//}

	//this.randomNumbers = this.generateRandomNumberArray(Math.round(this.time/this.timestep));
	
	// returns waiting time
	// this is the simplest waiting time distribution with time independent rates (check this is physical for our system)
	this.waitingTime = function() {
		return (-1.0 / this.totalJumpRate) * math.log(Math.random());
	}
	
	// sums elements in a 1D array A
	this.sum = function(A) {
		var count = 0;
		for (var i=A.length; i--;) {
			count += A[i];
		}
		return count;
	}

	// implement matrix multiplication function for a 2D array A and a 1D array B
	this.multiply = function(A, B) {
		
	}
	
	// exponentiate 2D matrix A
	this.expm = function(A) {

	}
	
	// calculate norm of a vector V
	this.norm = function(V) {
		var result = 0;
		for (var i = 0; i < V.length; i++) {
			result += Math.pow(V[i],2);
		}
		return Math.sqrt(result);
	}

	// create a 1D array of zeros with length n
	this.zeroVector = function(n) {
		var result = [];
		for (var i = 0; i < n; i++) {
			result.push(0);
		}
		return result;
	}
	
	this.totalJumpRate = this.sum(this.jumpRates);
	this.currentWaitingTime = this.waitingTime()
	// calculate time evolution operator exp(-i*H*\delta_t)	once here
	
	// evolves wavefunction for single timestep, updating currentState
	// (according to Schrodinger eqn? I think there may be an extra term needed. See Breuer and Petruccione)
	this.evolveForTimestep = function() {
		var nextState = this.multiply(this.timeEvolutionOperator, this.currentState);
		this.currentState =  nextState / this.norm(nextState);
	}

	// based on amplitudes for each site, rate to jump to each site etc...
	// reset current state to new state decided by jump
	this.selectJump = function() {
		// calculate population of each state and normalization
		var pops = [];
		var normalization = 0
		for (var i = 0; i < this.currentState.length; i++;) {
			pops.push(Math.pow(this.currentState[i], 2));
			normalization += this.jumpRates[i]*pops[i];
			
		}
		// calculate p_j for each state
		var jumpProbs = [];
		for (var i = 0; i < this.currentState.length; i++) {
			jumpProbs.push(this.jumpRates * pops[i] / normalization);
		}
		// divide [0,1] into K sub-intervals each with length p_j
		// pick random number rbetween [0,1]
		// see which interval r is in
		var r = Math.random();
		var jumpState = 0;
		var probSum = 0;
		for (var i = 0; i < this.jumpProbs.length; i++) {
			probSum += pops[i];
			if (r < probSum) {
				jumpState = i;
				break;
			}
		}
		var nextState = this.zeroVector(this.currentState.length);
		nextState[jumpState] = 1.0;
		this.currentState = nextState;  
	}

	// this should be overridden by the user to set custom termination conditions such as checking for population reaching a certain level
	// on certain states
	// default behaviour is to check if totalTime has been reached
	this.checkTerminationConditions = function() {
		this.calculationFinished = this.timeLeft < 0;
	}

	// will return false when calculation has terminated
	// still need to add population check for a certain state (maybe can override a function called terminationCondition to set custom conditions?)
	// also checks termination conditions (final time reached, or certain amount of population has reached trap state etc)
	this.nextTimestep = function() {
		if (this.currentwaitingTime > 0 && !this.calculationFinished) {
			this.evolveForTimestep();
			this.currentWaitingTime -= this.timestep;
			this.totalTime -= this.timestep;
		} else if (this.currentWaitingTime < 0 && !this.calculationFinished) {
			this.selectJump();
			this.currentWaitingTime = this.waitingTime()
		}
		this.checkTerminationConditions();
		return !this.calculationFinished;
	}
};
