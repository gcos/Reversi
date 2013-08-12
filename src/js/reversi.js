
var Reversi = function() {

	var self = this;

	/**
	 * Initialize the game.
	 * 
	 * @param {Object} container The container where the game adds itself to
	 * @public
	 */
	this.initialize = function(container){
		// Create stats area
		this.stats = document.createElement("div");
		this.stats.className = "gameStats";
		container.appendChild(this.stats);

		// Populate stats area
		var whiteStatIcon = document.createElement("div");
		whiteStatIcon.id = "whiteStatIcon";
		whiteStatIcon.className = "statIcon";
		this.stats.appendChild(whiteStatIcon);
		var whiteStatCount = document.createElement("div");
		whiteStatCount.id = "whiteStatCount";
		whiteStatCount.className = "statCount";
		this.stats.appendChild(whiteStatCount);
		var blackStatIcon = document.createElement("div");
		blackStatIcon.id = "blackStatIcon";
		blackStatIcon.className = "statIcon";
		this.stats.appendChild(blackStatIcon);
		var blackStatCount = document.createElement("div");
		blackStatCount.id = "blackStatCount";
		blackStatCount.className = "statCount";
		this.stats.appendChild(blackStatCount);

		// Create canvas
		this.canvas = document.createElement("canvas");
		this.canvas.className = "matrixContainer";
		this.canvas.width = "480";
		this.canvas.height = "480";
		container.appendChild(this.canvas);

		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.cellSize = this.width / 8;
		this.turn = "w";
		this.score = {w: 2, b: 2};
		this.model = {
				1: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0},
				2: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0},
				3: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0},
				4: { 1: 0,  2: 0,  3: 0,  4:"w", 5:"b", 6: 0,  7: 0,  8: 0},
				5: { 1: 0,  2: 0,  3: 0,  4:"b", 5:"w", 6: 0,  7: 0,  8: 0},
				6: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0},
				7: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0},
				8: { 1: 0,  2: 0,  3: 0,  4: 0,  5: 0,  6: 0,  7: 0,  8: 0}
		};

		var self = this;
		this.canvas.addEventListener("click", function(event){
			self.clickHandler.call(self, event);
		});

		this.updateBoardView();
		this.updateStatsView();
		this.updateValidMovesView(this.findValidMoves(this.turn));
	};

	/**
	 * Handle mouse click.
	 * 
	 * @param {Object} event The MouseClick event
	 * @private
	 */
	this.clickHandler = function(event) {
		var relativeX = event.clientX - this.canvas.offsetLeft;
		var relativeY = event.clientY - this.canvas.offsetTop;
		var cellX = Math.floor(relativeX / this.cellSize) + 1;
		var cellY = Math.floor(relativeY / this.cellSize) + 1;

		if(this.performFlips(cellX, cellY, this.turn)) {
			var oppositeColor = this.turn == "w" ? "b" : "w";
			var validMoves = this.findValidMoves(oppositeColor);

			if(validMoves.length > 0) {
				// The opposite color has valid moves, switch turn
				this.turn = oppositeColor;
			}
			else {
				// Cannot switch turn, find valid moves for current turn 
				validMoves = this.findValidMoves(this.turn);
			}

			this.calculateScore();
			this.updateBoardView();
			this.updateStatsView();
			this.updateValidMovesView(validMoves);
		}
	};

	//////////////////////////////////////////////////////////////////////
	//
	//			Model functions
	//
	//////////////////////////////////////////////////////////////////////

	/**
	 * Find the valid moves for a color.
	 * 
	 * @param {String} color The color ("w" or "b")
	 * @returns {Array} the list of valid moves (as points {x, y})
	 * @private
	 */
	this.findValidMoves = function(color) {
		var results = [];

		for(var i in this.model) {
			var row = this.model[i];

			for(var j in row) {
				var validFlips = this.findValidFlips(i, j, color);

				validFlips && results.push({x: i, y: j});
			}
		}

		return results;
	};

	/**
	 * Find the valid flips for a color in a certain cell
	 * (the cells of opposite color that can be enclosed 
	 * in the current color and flipped).
	 * 
	 * @param {Number} cellX The X coordinate of the cell
	 * @param {Number} cellY The Y coordinate of the cell
	 * @param {String} color The color ("w" or "b")
	 * @returns {Array} the list of valid flips (as points {x, y} of the same color
	 *  which enclose opposite color cells between them and {cellX, cellY})
	 * @private
	 */
	this.findValidFlips = function(cellX, cellY, color) {
		var model = this.model;
		var oppositeColor = color == "w" ? "b" : "w";
		var adjacentOpposites = [];
		var results = [];
		var i, j;

		cellX = parseInt(cellX);
		cellY = parseInt(cellY);

		// Cannot place over another piece
		if(model[cellX][cellY] != 0) {
			return null;
		}

		// Search for adjacent cells of opposite color 
		for(i = cellX - 1; i <= cellX + 1; i++) {
			for(j = cellY - 1; j <= cellY + 1; j++) {
				if( (i != cellX || j != cellY) &&
						model.hasOwnProperty(i) &&
						model[i].hasOwnProperty(j) &&
						model[i][j] == oppositeColor ) {
					adjacentOpposites.push({x: i, y: j});
				}
			}
		}

		// Cannot place if there is no adjacent opposite color
		if(adjacentOpposites.length == 0) {
			return null;
		}

		// If there are adjacent cells of opposite color
		for(i = 0, len = adjacentOpposites.length; i < len; i++) {
			var adjX = adjacentOpposites[i].x;
			var adjY = adjacentOpposites[i].y;

			// The 2 points {cellX, cellY} and {adjX, adjY} form a line;
			// search the line for current color in order to enclose the opposite color
			var diffX = adjX - cellX, diffY = adjY - cellY;
			var tempX = adjX, tempY = adjY;
			while( model.hasOwnProperty(tempX) &&
					model[tempX].hasOwnProperty(tempY) &&
					model[tempX][tempY] == oppositeColor ) {
				tempX += diffX;
				tempY += diffY;
			}
			if( model.hasOwnProperty(tempX) &&
					model[tempX].hasOwnProperty(tempY) &&
					model[tempX][tempY] == color ){
				results.push({x: tempX, y: tempY});
			}
		}

		if(results.length > 0) {
			return results;
		}

		return null;
	};

	/**
	 * Perform a new move: place a color in an empty cell and flip 
	 * the opposite color's cells according to the game rules.
	 *  
	 * @param {Number} cellX The X coordinate of the cell
	 * @param {Number} cellY The Y coordinate of the cell
	 * @param {String} color The color ("w" or "b")
	 * @returns {Boolean} true - operation succeeded / false - otherwise
	 * @private
	 */
	this.performFlips = function(cellX, cellY, color) {
		var model = this.model;
		var results = this.findValidFlips(cellX, cellY, color);

		cellX = parseInt(cellX);
		cellY = parseInt(cellY);

		if(!results) {
			return;
		}

		for(var k = 0, len = results.length; k < len; k++) {
			var compl = results[k];

			// Make sure there's a straight line between the points
			if( (compl.x - cellX) == 0 ||
					(compl.y - cellY) == 0 ||
					Math.abs(compl.x - cellX) == Math.abs(compl.y - cellY) ) {
				// Step through all cells between {compl.x, compl.y} and {cellX, cellY}
				// and flip them (switch from opposite color to color)
				var diffX = compl.x - cellX, diffY = compl.y - cellY;
				(diffX > 0) && (diffX = 1);
				(diffX < 0) && (diffX = -1);
				(diffY > 0) && (diffY = 1);
				(diffY < 0) && (diffY = -1);
				var tempX = compl.x, tempY = compl.y;

				while(tempX != cellX || tempY != cellY) {
					model[tempX][tempY] = color;
					tempX -= diffX;
					tempY -= diffY;
				}
			}
		}

		// Place the piece at {cellX, cellY}
		model[cellX][cellY] = color;

		return true;
	};

	/**
	 * Calculate the score for each color, as the number of cells each color has.
	 * 
	 * @private
	 */
	this.calculateScore = function() {
		// Reset score
		this.score.w = 0;
		this.score.b = 0;

		// Calculate number of pieces for each color
		for(var i in this.model) {
			var row = this.model[i];

			for(var j in row) {
				(this.model[i][j] == "w") && this.score.w++;
				(this.model[i][j] == "b") && this.score.b++;
			}
		}
	};

	//////////////////////////////////////////////////////////////////////
	//
	//			View functions
	//
	//////////////////////////////////////////////////////////////////////

	/**
	 * Update the board: draw the grid and place the pieces.
	 * 
	 * @private
	 */
	this.updateBoardView = function() {
		var context = this.canvas.getContext("2d");

		// Store the current transformation matrix
//		context.save();
		// Use the identity matrix while clearing the canvas
//		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, this.width, this.height);
		// Restore the transform
//		context.restore();

		this.drawBoard();

		for(var i in this.model) {
			var row = this.model[i];

			for(var j in row) {
				if(this.model[i][j] == "w" || this.model[i][j] == "b"){
					this.drawPiece(i, j, this.model[i][j]);
				}
			}
		}
	};

	/**
	 * Draw the grid lines.
	 * 
	 * @private
	 */
	this.drawBoard = function() {
		var context = this.canvas.getContext("2d");
		context.beginPath();

		for(var x = 0; x <= this.width; x += this.cellSize) {
			context.moveTo(x, 0);
			context.lineTo(x, this.height);
		}


		for(var y = 0; y <= this.height; y += this.cellSize) {
			context.moveTo(0, y);
			context.lineTo(this.width, y);
		}

		context.lineWidth = 1;
		context.strokeStyle = "#000000";
		context.stroke();
	};

	/**
	 * Draw a piece.
	 * 
	 * @param {Number} cellX The X coordinate of the cell
	 * @param {Number} cellY The Y coordinate of the cell
	 * @param {String} color The piece color ("w" or "b")
	 * @private
	 */
	this.drawPiece = function(cellX, cellY, color) {
		var context = this.canvas.getContext("2d");
		var radius = (this.cellSize - 10) / 2;
		var step = radius / 5;
		var centerX = (cellX - 1) * this.cellSize  + this.cellSize / 2;
		var centerY = (cellY - 1) * this.cellSize  + this.cellSize / 2;
		var colors = {
				w: {color1: "#B3B3B3", color2: "#FFFFFF"},
				b: {color1: "#303030", color2: "#000000"}
		};

		// Create radial gradient
		var gradient = context.createRadialGradient(centerX + step, centerY + step, 1, centerX, centerY, radius + step * 2);
		gradient.addColorStop(0, colors[color].color1);
		gradient.addColorStop(1, colors[color].color2);

		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = gradient;
		context.fill();
		context.lineWidth = 2;
		context.strokeStyle = colors[color].color2;
		context.stroke();
	};

	/**
	 * Update the valid moves for a color.
	 * 
	 * @param {Array} validMoves The list of valid moves
	 * @private
	 */
	this.updateValidMovesView = function(validMoves) {
		for(var i = 0, len = validMoves.length; i < len; i++) {
			this.drawValidMove(validMoves[i].x, validMoves[i].y);
		}
	};

	/**
	 * Draw a valid move.
	 * 
	 * @param {Number} cellX The X coordinate of the cell
	 * @param {Number} cellY The Y coordinate of the cell
	 * @private
	 */
	this.drawValidMove = function(cellX, cellY) {
		var context = this.canvas.getContext("2d");
		var radius = 3;
		var centerX = (cellX - 1) * this.cellSize  + this.cellSize / 2;
		var centerY = (cellY - 1) * this.cellSize  + this.cellSize / 2;

		context.beginPath();
		context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
		context.fillStyle = "#E3DC1B";
		context.fill();
		context.lineWidth = 2;
		context.strokeStyle = "#8F8A00";
		context.stroke();
	};

	/**
	 * Update the statistics area: score for each color, active turn.
	 * 
	 * @private
	 */
	this.updateStatsView = function() {
		// Update piece count for each color
		var whiteStatCount = this.stats.querySelector("#whiteStatCount");
		var whiteCount = document.createTextNode(this.score.w);
		whiteStatCount.innerHTML = "";
		whiteStatCount.appendChild(whiteCount);
		var blackStatCount = this.stats.querySelector("#blackStatCount");
		var blackCount = document.createTextNode(this.score.b);
		blackStatCount.innerHTML = "";
		blackStatCount.appendChild(blackCount);

		// Update active turn
		var whiteStatIcon = this.stats.querySelector("#whiteStatIcon");
		whiteStatIcon.className = "statIcon";
		var blackStatIcon = this.stats.querySelector("#blackStatIcon");
		blackStatIcon.className = "statIcon";
		this.turn == "w" ? whiteStatIcon.className += " activeTurn" : blackStatIcon.className += " activeTurn";

		// Check game over
		if(this.score.w + this.score.b == 64) {
			var message = "It's a tie !";
			(this.score.w > this.score.b) && (message = "White won !");
			(this.score.w < this.score.b) && (message = "Black won !");

			alert(message);
		}
	};

	return {
		initialize: function() {
			self.initialize.apply(self, arguments);
		}
	};
};