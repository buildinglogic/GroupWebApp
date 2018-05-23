var hardColorNumber = 6;
var easyColorNumber = 3;
var colorNumber = hardColorNumber;

var colors = generateRandomColor(colorNumber);
var colorPicked = chooseRandomColor(colorNumber);

var h1Display = document.querySelector("h1");
var colorDisplay = document.querySelector("#rgbDisplay");
var resetDisplay = document.querySelector("#reset");
var messageDisplay = document.querySelector("#message")
var modeButtons = document.querySelectorAll(".mode");
var squareDisplay = document.querySelectorAll(".square");


// set h1 display with picked color rgb string
colorDisplay.textContent = colorPicked;

// handle "easy" or "hard" mode swtich buttons
for(var i = 0; i < modeButtons.length; i++) {
	modeButtons[i].addEventListener("click", function() {
		modeButtons[0].classList.remove("selected");
		modeButtons[1].classList.remove("selected");
		this.classList.add("selected");
		this.textContent === "Easy" ? colorNumber = easyColorNumber : colorNumber = hardColorNumber;
		resetWithColorNumber();
	});
}

// reset the game 
resetDisplay.addEventListener("click", resetWithColorNumber);

// define event for each block for "click"
for(var i = 0; i < squareDisplay.length; i++) {
	squareDisplay[i].style.background = colors[i];

	squareDisplay[i].addEventListener("click", function() {
		if(this.style.background === colorPicked) {
			colorAll(colorPicked);
			messageDisplay.textContent = "CORRECT";
			resetDisplay.textContent = "Play Again";
		}else {
		// change the current div to the background color
			this.style.background = "#232323";
			messageDisplay.textContent = "Try Again" 
		}
	});
}

// reset the game under either mode: easy - colorNumber=3; hard - colorNumber=6
function resetWithColorNumber() {
	colors = generateRandomColor(colorNumber);
	colorPicked = chooseRandomColor(colorNumber);

	h1Display.style.background = "steelblue";
	for(var i = 0; i < hardColorNumber; i++) {
		if(colors[i]) {
			squareDisplay[i].style.display = "block";
			squareDisplay[i].style.background = colors[i];
		} else {
			squareDisplay[i].style.display = "none";
		}
	}

	colorDisplay.textContent = colorPicked;
	resetDisplay.textContent = "New Colors";
	messageDisplay.textContent = "";
}

// define function to color all backgrounds when right color chosen
function colorAll(tColor) {
	for(var i = 0; i < squareDisplay.length; i++) {
		squareDisplay[i].style.background = tColor;
	}
	h1Display.style.background = tColor;	
}

// generate n random colors; return a list of strings (rgb)
function generateRandomColor(n) {
	var colorArray = [];
	for(var i = 0; i < n; i++) {
		var oneColor = "rgb(";
		for(var j = 0; j < 3; j++) {
			oneColor += Math.floor(Math.random() * 256);
			if(j != 2) {
				oneColor += ", ";
			} else {
				oneColor += ")";
			}
		}
		colorArray.push(oneColor);
	}
	return colorArray;
}

// choose from 0 to n - 1; return one color rgb string
function chooseRandomColor(n) {
	return colors[Math.floor(Math.random() * n)];
}



