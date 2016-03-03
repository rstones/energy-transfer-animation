var numjs = (function() {

	var ns = {};

	/*
	Requires math.js for complex numbers
	
	Also need more rigourous checks of array dimensions and array element types (should be Complex object or number)
		maybe write some generic private functions to do this. Also unit tests...
		
	Make all functions compatible with 1D and 2D arrays, throw Exception to warn otherwise	
		
	Learn how to throw Exceptions properly.
		
	Then need to make sure all functions are optimized!
	
	More comments
	*/
	
	ns.fill1DArray = function(length, val) {
		var array = [];
		var i = 0;
		while (i < length) {
			array[i++] = val;
		}
		return array;
	}

	ns.fill2DArray = function(a, val) {
		if (a.constructor === Array) {
			if (a.length != 2) {
				new Exception("zeros: array argument is not 2D");
			} else {
				var result = [];
				for (var i = 0; i < a[0]; i++) {
					result.push(ns.fill1DArray(a[1],val));
				}
				return result;
			}
		} else {
			new Exception("zeros: object that is not an array passed as argument");
		}
	}

	ns.zeros = function(a) {
		if (a.length == 1) {
			return ns.fill1DArray(a, 0);
		} else if (a.length == 2) {
			return ns.fill2DArray(a, 0);
		} else {
			new Exception("numjs.zeros: array of dimension greater than 2 passed as arg. Only 1D and 2D arrays supported.");
		}
	}

	ns.ones = function(a) {
		if (a.length == 1) {
			return ns.fill1DArray(a, 1.0);
		} else if (a.length == 2) {
			return ns.fill2DArray(a, 1.0);
		} else {
			new Exception("numjs.ones: array of shapeension greater than 2 passed as arg. Only 1D and 2D arrays supported.");
		}
	}

	// this is currently assuming that all the rows of a have the same length!
	ns.shape = function(a) {
		if (!a[0].length) { // nx1
			return [a.length];
		} else { // nxn
			return [a.length, a[0].length];
		}
	}
	
	/*
	Returns number of elements in array a
	Currently assumes all rows are same length
	*/
	ns.size = function(a) {
		var aShape = ns.shape(a);
		if (aShape.length == 1) {
			return aShape[0];
		} else if (aShape.length == 2) {
			return aShape[0]*aShape[1];
		} else {
			new Exception("numjs.size: array greater than 2D passed as arg");
		}
	}
	
	ns.checkSameShape = function(a1, a2) {
		var a1Shape = ns.shape(a1);
		var a2Shape = ns.shape(a2);
		var a1Dim = a1Shape.length;
		var a2Dim = a2Shape.length;
		if (a1Dim == a2Dim && ((a1Dim == 2 && a1Shape[0] == a2Shape[0] && a1Shape[1] == a2Shape[1]) || (a1Dim == 1 && a1Shape[0] == a2Shape[0]))) {
			return true;
		} else {
			return false;
		}
	}
	
	/*
	Takes 1D array and turns it into 2D array with that on diagonal.
	Or takes 2D array and returns diagonal of that as 1D array.
	*/
	ns.diag = function(a) {
		var aShape = ns.shape(a);
		if (aShape.length == 1) { // 1D
			result = ns.zeros([aShape[0], aShape[0]])
			for (var i = 0; i < aShape[0]; i++) {
				result[i][i] = a[i];
			}
			return result;
		} else if (aShape.length == 2) { // 2D
			var result = [];
			for (var i = 0; i < aShape[0]; i++) {
				result.push(a[i][i]);
			}
			return result;
		} else {
			new Exception("numjs.diag: invalid dimension array passed as arg");
		}
	}
	
	ns.eye = function(dim) {
		return ns.diag(ns.ones([dim]));
	}
	
	ns.linspace = function(start, end, numPts) {
		var result = [];
		//result.push(start);
		var step = end/numPts;
		for (var i = 0; i < numPts+1; i++) {
			result.push(i*step);
		}
		return result;
	}

	// calculate norm of a 1D array
	ns.norm = function(a) {
		var result = 0;
		for (var i = 0; i < a.length; i++) {
			result = math.add(result, math.pow(math.abs(a[i]),2));
		}
		return math.sqrt(result);
	}

	// currently assuming square arrays of same dimension
	// with each element being math.js complex object
	ns.add = function(a1, a2) {
		var a1Shape = ns.shape(a1);
		var a2Shape = ns.shape(a2);
		if (ns.checkSameShape(a1,a2)) {
			var result = ns.zeros(a1Shape);
			if (a1Shape.length == 2) { // 2D array
				for (var i = 0; i < a1Shape[0]; i++) {
					for (var j = 0; j < a1Shape[1]; j++) {
						result[i][j] = math.add(a1[i][j], a2[i][j]); 
					}
				}
			} else { // 1D array
				for (var i = 0; i < a1Shape[0]; i++) {
					result[i] = math.add(a1[i], a2[i]);
				}
			}
			return result;
		} else {
			new Exception("numjs.add: matrices of different dimensions");
		}
	}

	// currently assuming square arrays of same dimension
	ns.sub = function(a1, a2) {
		var a1Shape = ns.shape(a1);
		var a2Shape = ns.shape(a2);
		if (ns.checkSameShape(a1,a2)) {
			var result = ns.zeros(a1Shape);
			if (a1Shape.length == 2) { // 2D array
				for (var i = 0; i < a1Shape[0]; i++) {
					for (var j = 0; j < a1Shape[1]; j++) {
						result[i][j] = math.add(a1[i][j], math.multiply(-1.0, a2[i][j])); 
					}
				}
			} else { // 1D array
				for (var i = 0; i < a1Shape[0]; i++) {
					result[i] = math.add(a1[i], math.multiply(-1.0, a2[i]));
				}
			}
			return result;
		} else {
			new Exception("numjs.sub: matrices of different dimensions");
		}
	}

	// takes a 1D array of math.complex objects and returns the complex sum
	ns.sum = function(a) {
		var aShape = ns.shape(a);
		if (aShape.length == 1) {
			var result = math.complex(0);
			for (var i = 0; i < a.length; i++) {
				result = math.add(result, a[i]);
			}
			return result;
		} else {
			new Exception("numjs.sum: array greater than 1D passed as arg. Only 1D arrays currently supported");
		}
	}

	// for 2D array
	ns.transpose = function(a) {
		var aShape = ns.shape(a);
		if (aShape.length == 2) {
			result = ns.zeros([aShape[1], aShape[0]]);
			for (var i = 0; i < aShape[0]; i++) {
				for (var j = 0; j < aShape[1]; j++) {
					result[j][i] = a[i][j];
				}
			}
			return result;
		} else {
			new Exception("numjs.transpose: only 2D arrays supported");
		}
	}
	
	ns.conj = function(a) {
		if (a.constructor === Array) {
			var aShape = ns.shape(a);
			if (aShape.length == 2) {
				var result = [];
				for (var i = 0; i < aShape[0]; i++) {
					var row = [];
					for (var j = 0; j < aShape[1]; j++) {
						if (a[i][j].type == 'Complex') {
							row.push(math.conj(a[i][j]));
						} else if (typeof a[i][j] == 'number') {
							row.push(a[i][j]);
						} else {
							new Exception("numjs.conj: array element not Complex or Number instance");
						}
					}
					result.push(row);
				}
				return result;
			} else if (aShape.length == 1) {
				var result = [];
				for (var i = 0; i < aShape[0]; i++) {
					if (a[i].type == 'Complex') {
						result.push(math.conj(a[i]));
					} else if (typeof a[i] == 'number') {
						result.push(a[i]);
					} else {
						new Exception("numjs.conj: array element not Complex or Number instance");
					}
				}
				return result;
			} else {
				new Exception("numjs.conj: arrays greater 2D in dimension are not supported");
			}
		} else if (a.type == 'Complex') {
			return math.conj(a);
		} else {
			new Exception("numjs.conj: object passed as arg not Array or Complex object");
		}
	}
	
	// implementation of flatten for 2D array
	ns.flatten = function(a) {
		// check array is 2D
		var aShape = ns.shape(a);
		if (aShape.length == 2) {
			var flattenedArray = [];
			for (var i = 0; i < aShape[0]; i++) {
				flattenedArray = flattenedArray.concat(a[i]);
			}
			return flattenedArray;
		} else {
			new Error("numjs.flatten: array is not 2D!");
		}
	}
	
	/*
	a is array to reshape
	shape is array of shapeension to reshape a into
	*/
	ns.reshape = function(a, shape) {
		var newSize = shape[1] ? shape[0]*shape[1] : shape[0];
		var aShape = ns.shape(a);
		if (ns.size(a) == newSize) {
			if (aShape.length == 1 && shape.length == 2) { // if a is 1D and shape 2D  unflatten
				result = ns.zeros(shape);
				for (var i = 0; i < shape[0]; i++) {
					for (var j = 0; j < shape[1]; j++) {
						result[i][j] = a[i*shape[0] + j];
					}
				}
				return result;
			} else if (aShape.length == 2 && shape.length == 1) { // if a is 2D and shape is 1D call flatten
				return ns.flatten(a);
			} else if (aShape.length == 2 && shape.length == 2) { // if a is 2D and shape is 2D, flatten then put back into new shape
				var aFlat = ns.flatten(a);
				result = ns.zeros(shape);
				for (var i = 0; i < shape[0]; i++) {
					for (var j = 0; j < shape[1]; j++) {
						result[i][j] = aFlat[i*shape[0] + j];
					}
				}
				return result;
			} else {
				new Exception("numjs.reshape: cannot reshape 1D matrix to 1D matrix");
			}
		} else {
			new Exception("numjs.reshape: size of a does not match reshape size");
		}
	}
	
	// currently supports multiplication of two square 2D arrays and a square 2D array with vector from the right
	ns.dot = function(a1, a2) {
		var a1Shape = ns.shape(a1);
		var a2Shape = ns.shape(a2);
		var result = [];
		if (a1Shape.length == 2 && a2Shape.length == 2 && ns.checkSameShape(a1, a2)) {
			for (var i = 0; i < a1Shape[0]; i++) {
				var row = [];
				for (var j = 0; j < a2Shape[1]; j++) {
					var sum = 0;
					for (var k = 0; k < a1Shape[0]; k++) {
						sum = math.add(sum, math.multiply(a1[i][k], a2[k][j]));
					}
					row.push(sum);
				}
				result.push(row);
			}
		} else if (a1Shape.length == 2 && a2Shape.length == 1 && a1Shape[0] == a1Shape[1] && a1Shape[0] == a2Shape[0]) {
			for (var i = 0; i < a1Shape[0]; i++) {
				var sum = 0;
				for (var j = 0; j < a2Shape[0]; j++) {
					sum = math.add(sum, math.multiply(a1[i][j], a2[j]));
				}
				result.push(sum);
			}
		} else {
			new Exception("numjs.dot: array shapes passed cannot be multiplied or are currently not supported");
		}
		return result;
	}

	ns.factorial = function(n) {
		if (n < 0) {
			new Error("factorial: negative value passed to function!");
		}
		if (n == 0) {
			return 1.0;
		} else {
			result = 1.0;
			for (var i = 2; i <= n; i++) {
				result *= i;
			}
			return result;
		}
	}

	// implementation of matrix power (for positive powers only)
	ns.powm = function(a, n) {
		if (n < 0) {
			new Error("powm: matrix power is less than zero!");
		}
		if (n == 0) {
			return math.eye(ns.shape(a));
		} else if (n == 1) {
			return a;
		} else {
			var result = a;
			for (var i = 1; i < n; i++) {
				result = ns.dot(result, a);
			}
			return result;
		}	
	}

	// implementation of matrix exponential
	ns.expm = function(a) {
		// check a is square
		var aShape = ns.shape(a);
		if (aShape.length != 2 || aShape[0] != aShape[1]) {
			new Exception("expm: array is not square!");
		}
		// function defining nth term of exponential expansion
		var expSum = function(n) {
			if (n == 0) {
				return ns.eye(aShape[0]);
			} else {
				return math.multiply(1.0/ns.factorial(n), ns.powm(a, n));
			}
		}
		// checks whether all matrix elements are less than tolerance
		var satisfiesTol = function(M, tol) {
			for (var i = 0; i < M.length; i++) {
				for (var j = 0; j < M.length; j++) {
					var el = M[i][j];
					if ((el.type == 'Complex' && (math.abs(el.im) > tol || math.abs(el.re) > tol)) || el > tol) {
						return false;
					}
				}
			}
			return true;
		}
		// tolerance should maybe be user defined or at least depend on the magnitude of smallest
		// element of passed in array, if they are all at 0.00001 then 0.000001 isnt a good enough tol
		var tol = 0.000001;
		var sum = expSum(0);
		var prevSum = 0;
		var diff = ns.ones(aShape);
		var n = 1;
		while (!satisfiesTol(diff, tol)) {
			//console.log(n);
			prevSum = sum;
			sum = ns.add(sum, expSum(n));
			diff = ns.sub(sum, prevSum);
			n++;
		}
		return sum;
	}

	// implemenation of tensor product for 2D arrays
	ns.kron = function(a1, a2) {
		// check arrays are both 2D and have same dimension
		var a1Shape = ns.shape(a1);
		var a2Shape = ns.shape(a2);
		if (a1Shape.length!= 2 || a2Shape.length != 2 || a1Shape[0] != a2Shape[0] || a1Shape[1] != a2Shape[1]) {
			new Error("kron: arrays are not 2D or have different shapeensions!");
		}
		// calculate tensor product
		var tensorProd = [];
		for (var i = 0; i < a1Shape[0]; i++) {
			for (var j = 0; j < a2Shape[0]; j++) {
				var a1i = a1[i];
				var a2j = a2[j];
				var vectorProd = [];
				for (var k = 0; k < a1i.length; k++) {
					vectorProd = vectorProd.concat(math.multiply(a1i[k],a2j));
				}
				tensorProd.push(vectorProd);
			}
		}
		return tensorProd;
	}
	
	return ns;

})();

var openQM = (function() {

	var ns = {};
	
	ns.constructTimestepOperator = function(timestep, liouvillian) {
		return numjs.expm(math.multiply(timestep, liouvillian));
	}
	
	ns.pureDephasingOperators = function(n, dephasingRate) {
		var operators = [];
		for (var i = 0; i < n; i++) {
			var op = numjs.zeros([n,n]);
			op[i][i] = 1.0;
			operators.push([dephasingRate, op]);
		}
		return operators;
	}
	
	ns.lindbladDissipator = function(rate, operator) {
		var opShape = numjs.shape(operator);
		var I = numjs.eye(opShape[0]); // assuming operator is square!
		var opDagger = numjs.transpose(numjs.conj(operator));
		var opDaggerOp = numjs.dot(opDagger, operator)
		return math.multiply(rate, numjs.sub(numjs.kron(operator, operator), math.multiply(0.5, math.add(numjs.kron(opDaggerOp, I), numjs.kron(I, opDaggerOp)))));
	}
	
	ns.lindbladSuperOperator = function(hamiltonian, jumpOperators) {
		var hDim = numjs.shape(hamiltonian)[0]
		var I = numjs.eye(hDim);
		var L = math.multiply(math.complex(0, -1.0), numjs.sub(numjs.kron(hamiltonian, I), numjs.kron(I, hamiltonian)));
		for (var i = 0; i < hDim; i++) {
			L = numjs.add(L, ns.lindbladDissipator(jumpOperators[i][0], jumpOperators[i][1]));
		}
		return L;
	}
	
	ns.liouvillianTimeEvolution = function(initState, liouvillian, time) {
		var timestep = time[1] - time[0];
		var timestepOperator = numjs.expm(math.multiply(timestep, liouvillian));
		var dv = initState;
		var dvHistory = [];
		dvHistory.push(dv);
		for (var step in time) {
			dv = numjs.dot(timestepOperator, dv);
			dvHistory.push(dv);
		}
		return dvHistory;
	}

	ns.calculateTimeEvolution = function(n, coupling, disorder, dephasingRate, time) {
		var initState = [];
		for (var i = 0; i < Math.pow(n,2); i++) {
			initState.push(i == 0 ? math.complex(1.0,0) : math.complex(0,0));
		}
		var L = liouvillian(n, coupling, disorder, dephasingRate);
		return liouvillianTimeEvolution(initState, L, time);
	}
	
	return ns;
	
})();

var energyTransfer1DModel = (function() {

	var ns = {};
	
	ns.constructInitState = function(n) {
		var initState = [];
		// start system in highest energy state
		for (var i = 0; i < Math.pow(n,2); i++) {
			initState.push(i == n+1 ? math.complex(1.0,0) : math.complex(0,0));
		}
		return initState;
	}
	
	ns.currentState = [];
	
	ns.time = function(duration, timestep) {
		return numjs.linspace(0, duration, duration/timestep);
	}
	
	ns.liouvillian = [];
	
	ns.timestepOperator = [];
	
	ns.disorderValues = []; // must set this from processing code before first parameter update
	
	// element (0,0) will indicate ground/trap state of system
	ns.hamiltonian = function(n, coupling, disorder, disorderValues) {
		var H = numjs.diag(math.multiply(3.0*disorder, disorderValues));
		// enforce energy gradient along chain
		H[1][1] = 1.0;
		H[n-1][n-1] = -1.0;
		for (var i = 1; i < n-1; i++) { // no coherent coupling to ground/trap state
			H[i][i+1] = math.complex(coupling,0);
			H[i+1][i] = math.complex(coupling,0);
		}
		return H;
	}
	
	ns.recombinationOperators = function(n, recombinationRate) {
		var operators = [];
		for (var i = 0; i < n-1; i++) {
			var op = numjs.zeros([n,n]);
			op[0][i+1] = 1.0;
			operators.push([recombinationRate, op]);
		}
		return operators;
	}
	
	ns.trappingOperator = function(n, trappingRate) {
		var op = numjs.zeros([n,n]);
		op[0][n-1] = 1.0
		return [[trappingRate, op]]
	}
	
	ns.constructLiouvillian = function(n, coupling, disorder, dephasingRate, disorderValues, trappingRate, recombinationRate) {
		var ops = openQM.pureDephasingOperators(n, dephasingRate).concat(ns.recombinationOperators(n, recombinationRate).concat(ns.trappingOperator(n, trappingRate)));
		return openQM.lindbladSuperOperator(ns.hamiltonian(n, coupling, disorder, disorderValues), ops);
	}

	ns.updateParameters = function(n, coupling, disorder, dephasingRate, timestep, disorderValues, trappingRate, recombinationRate) {
		ns.timestepOperator = openQM.constructTimestepOperator(timestep, ns.constructLiouvillian(n, coupling, disorder, dephasingRate, disorderValues, trappingRate, recombinationRate));
		ns.currentState = ns.constructInitState(n);
	}
	
	ns.calculateNextTimestep = function() {
		ns.currentState = numjs.dot(ns.timestepOperator, ns.currentState);
	}
	
	ns.extractPopulationsFromCurrentState = function() {
		var chainLength = math.sqrt(ns.currentState.length);
		var dm = numjs.reshape(ns.currentState, [chainLength, chainLength]);
		var pops = numjs.diag(dm);
		var realPops = [];
		for (var j = 0; j < chainLength; j++) {
			realPops.push(pops[j].re);
		}
		return realPops;
	}
	
	return ns;

})();

var energyTransfer2DModel = (function() {

	var ns = {};
	
	ns.constructInitState = function(n) {
		var initState = [];
		for (var i = 0; i < Math.pow(n,2); i++) {
			initState.push(i == 0 ? math.complex(1.0,0) : math.complex(0,0));
		}
		return initState;
	}
	
	ns.currentState = [];
	
	ns.time = function(duration, timestep) {
		return numjs.linspace(0, duration, duration/timestep);
	}
	
	ns.liouvillian = [];
	
	ns.timestepOperator = [];
	
	ns.disorderValues = []; // must set this from processing code before first parameter update
	
	ns.hamiltonian = function(n, coupling, disorder, disorderValues) {
		var H = numjs.diag(math.multiply(3.0*disorder, disorderValues));
		for (var i = 0; i < n-1; i++) {
			H[i][i+1] = math.complex(coupling,0);
			H[i+1][i] = math.complex(coupling,0);
		}
		var extraCouplingIndices = [0,1,3,4];
		for (var i = 0; i < extraCouplingIndices.length; i++) {
			var ind  = extraCouplingIndices[i];
			H[ind][ind+2] = math.complex(coupling,0);
			H[ind+2][ind] = math.complex(coupling,0);
		}
		return H;
	}

	ns.constructLiouvillian = function(n, coupling, disorder, dephasingRate, disorderValues) {
		return openQM.lindbladSuperOperator(ns.hamiltonian(n, coupling, disorder, disorderValues), openQM.pureDephasingOperators(n, dephasingRate));
	}

	ns.updateParameters = function(n, coupling, disorder, dephasingRate, timestep, disorderValues) {
		ns.timestepOperator = openQM.constructTimestepOperator(timestep, ns.constructLiouvillian(n, coupling, disorder, dephasingRate, disorderValues));
		ns.currentState = ns.constructInitState(n);
	}
	
	ns.calculateNextTimestep = function() {
		ns.currentState = numjs.dot(ns.timestepOperator, ns.currentState);
	}
	
	ns.extractPopulationsFromCurrentState = function() {
		var chainLength = math.sqrt(ns.currentState.length);
		var dm = numjs.reshape(ns.currentState, [chainLength, chainLength]);
		var pops = numjs.diag(dm);
		var realPops = [];
		for (var j = 0; j < chainLength; j++) {
			realPops.push(pops[j].re);
		}
		return realPops;
	}
	
	return ns;

})();
