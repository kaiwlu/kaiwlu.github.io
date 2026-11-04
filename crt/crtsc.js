// Keep the existing browser-storage keys and saved game.
var remaindleStorage = window.localStorage;

function remainder(g, prime) {
   return ((target - g) % prime + prime) % prime;
}

// Rendering saved guesses must never validate a new turn or change statistics.
function renderGuess(g) {
   var prime = todays_primes[guesses];
   document.getElementById("guesses").innerHTML += (guesses + 1) + ". Prime: " + prime
      + "&nbsp; Guess: " + g + "&nbsp; Remainder: " + remainder(g, prime) + "<br>";
   guesses++;
}

function showFinishedGame(message) {
   document.getElementById("button").disabled = true;
   document.getElementById("guess-input").disabled = true;
   document.getElementById("curguess").innerHTML = "Click on \"New Game\" to start a new game.";
   displayStats(message || (won ? "You win!" : "You lose. This game's number was " + target + "."));
}

function finishGame(didWin, message) {
   won = didWin;
   if (!finished) {
      var statistics = JSON.parse(remaindleStorage.getItem("statistics"));
      statistics[won ? guesses : 0]++;
      remaindleStorage.setItem("statistics", JSON.stringify(statistics));
      var streaks = JSON.parse(remaindleStorage.getItem("streaks"));
      if (won) {
         streaks["current-streak"]++;
         streaks["max-streak"] = Math.max(streaks["current-streak"], streaks["max-streak"]);
      } else {
         streaks["current-streak"] = 0;
      }
      remaindleStorage.setItem("streaks", JSON.stringify(streaks));
   }

   finished = true;
   remaindleStorage.setItem("finished", "true");
   showFinishedGame(message);
}

function guess_helper(g) {
   var previous = JSON.parse(remaindleStorage.todays_guesses);
   var violation = previous.findIndex(function (oldGuess, index) {
      return g == oldGuess || remainder(g, todays_primes[index]) != 0;
   });
   var repeated = violation >= 0 && g == previous[violation];
   renderGuess(g);
   previous.push(g);
   remaindleStorage.todays_guesses = JSON.stringify(previous);

   if (document.querySelector('input[name="diffmode"]:checked').value == "hard" && violation >= 0) {
      var reason = repeated ? "your guess is the same as guess " : "your guess is not possible based on information given in guess ";
      finishGame(false, "You lose, because " + reason + (violation + 1) + ". This game's number was " + target + ".");
   } else if (g == target || guesses >= NUM_GUESSES) {
      finishGame(g == target);
   } else {
      document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[guesses];
   }
}

function guess() {
   if (finished) return;
   var g = parseInt(document.getElementById("guess-input").value);
   document.getElementById("guess-input").value = "";
   if (Number.isNaN(g) || g < 0 || g > MAX_NUM) {
      showGameMessage("Not a valid guess.");
      return;
   }
   var diffm = document.querySelector('input[name="diffmode"]:checked').value;
   var gss = JSON.parse(remaindleStorage.todays_guesses);
   if (diffm == "learner") {
      for (var i = 0; i < gss.length; i++) {
         if (remainder(g, todays_primes[i]) != 0) {
            var alertmessage = "This guess is not possible, because (target - thisguess)%"
               + todays_primes[i] + "=" + remainder(g, todays_primes[i])
               + ", but you should know enough information from guess " + (i + 1) + " to make it 0.";
            showGameMessage(alertmessage);
            return;
         }
      }
   }
   else if (diffm == "normal") {
      for (var i = 0; i < gss.length; i++) {
         if (g == gss[i]) {
            var alertmessage = "This guess is invalid because it's the same as guess "
               + (i + 1) + ".";
            showGameMessage(alertmessage);
            return;
         }
      }
   }
   else if (diffm != "hard") {
      showGameMessage("You broke the game; if you have time, would you please email Kai and tell her? Error code: 204.");
      return;
   }
   guess_helper(g);
}
function rerender() {
   document.body.dataset.dark = String(remaindleStorage.getItem("dark-mode") == "true");
}

function updateDarkMode() {
   remaindleStorage.setItem("dark-mode", document.getElementById("darkmode-checkbox").checked);
   rerender();
}

function updateDiffMode() {
   remaindleStorage.setItem("diffm", document.querySelector('input[name="diffmode"]:checked').value);
}

function updateBound() {
   var b = parseInt(document.getElementById("bound-input").value);
   document.getElementById("bound-input").value = "";
   if (Number.isNaN(b) || b < 0 || b > 1000000) {
      showGameMessage("Not a valid bound.");
      return;
   }
   NEXT_MAX_NUM = b;
   remaindleStorage.next_max_num = NEXT_MAX_NUM;
   document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
}

// constants
var MAX_NUM = 2000;
var NEXT_MAX_NUM = 2000;

// check local storage for upper bound
if (remaindleStorage.getItem("max_num") === null) {
   MAX_NUM = 2000;
   remaindleStorage.max_num = MAX_NUM;
} else {
   try {
      MAX_NUM = parseInt(remaindleStorage.max_num);
   }
   catch {
      showGameMessage("You broke the game; if you have time, would you please email Kai and tell her? Error code: 255.");
      MAX_NUM = 2000;
      remaindleStorage.max_num = MAX_NUM;
   }
}

// check local storage for next upper bound
if (remaindleStorage.getItem("next_max_num") === null) {
   NEXT_MAX_NUM = 2000;
   remaindleStorage.next_max_num = NEXT_MAX_NUM;
} else {
   try {
      NEXT_MAX_NUM = parseInt(remaindleStorage.next_max_num);
   }
   catch {
      showGameMessage("You broke the game; if you have time, would you please email Kai and tell her? Error code: 271.");
      NEXT_MAX_NUM = 2000;
      remaindleStorage.next_max_num = NEXT_MAX_NUM;
   }
}

const CPRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
var PRIMES = CPRIMES.slice();

function getGuessLimit(maximum) {
   var count = 0;
   var product = 1;
   do {
      product *= CPRIMES[count];
      count++;
   } while (product <= maximum);
   return Math.min(count + 1, 8);
}

var NUM_GUESSES = getGuessLimit(MAX_NUM);
document.getElementById("max-guess").innerHTML = MAX_NUM;
document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
document.getElementById("num-guesses").innerHTML = NUM_GUESSES;

function updateSeed() {
   // Fresh entropy for every new round, including after a page reload.
   var currentplay = Math.seedrandom();
   remaindleStorage.setItem("current-seed", currentplay);
}

function newGame() {
   if (finished != true) {
      // Restarting an unfinished round counts as a loss.
      var statistics = JSON.parse(remaindleStorage.getItem("statistics"));
      statistics[0]++;
      remaindleStorage.setItem("statistics", JSON.stringify(statistics));
      // update streak statistics
      var streaks = JSON.parse(remaindleStorage.getItem("streaks"));
      streaks["current-streak"] = 0;
      remaindleStorage.setItem("streaks", JSON.stringify(streaks));
   }
   document.getElementById("button").disabled = false;
   document.getElementById("guess-input").disabled = false;

   MAX_NUM = parseInt(remaindleStorage.next_max_num);
   remaindleStorage.max_num = MAX_NUM;
   NEXT_MAX_NUM = MAX_NUM;
   remaindleStorage.next_max_num = MAX_NUM;
   NUM_GUESSES = getGuessLimit(MAX_NUM);
   document.getElementById("max-guess").innerHTML = MAX_NUM;
   document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
   document.getElementById("num-guesses").innerHTML = NUM_GUESSES;

   updateSeed();
   const shuffled = PRIMES.sort(() => 0.5 - Math.random());
   target = Math.round(Math.random() * MAX_NUM);
   remaindleStorage.target = target;
   todays_primes = shuffled.slice(0, NUM_GUESSES);
   todays_primes.sort(function (a, b) {
      return a - b;
   });
   remaindleStorage.setItem("current-prime", JSON.stringify(todays_primes));
   remaindleStorage.setItem("finished", "false");
   finished = false;

   remaindleStorage.todays_guesses = "[]";
   document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
   document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];
   document.getElementById("guesses").innerHTML = "";
   guesses = 0;
   won = false;
}

// using https://github.com/davidbau/seedrandom
Math.seedrandom(remaindleStorage.getItem("current-seed"));

var target = 0;

// check local storage for todays target
if (remaindleStorage.getItem("target") === null) {
   target = Math.round(Math.random() * MAX_NUM);
   remaindleStorage.target = target;
} else {
   try {
      target = parseInt(remaindleStorage.target);
   }
   catch {
      showGameMessage("You broke the game; if you have time, would you please email Kai and tell her? Error code: 311.");
      target = Math.round(Math.random() * MAX_NUM);
      remaindleStorage.target = target;
   }
}

var todays_primes = [];
var guesses = 0;
var won = false;
var finished = false;

// check local storage for finish status
if (remaindleStorage.getItem("finished") === null) {
   remaindleStorage.setItem("finished", "false");
   finished = false;
} else {
   finished = (remaindleStorage.getItem("finished") == "true");
}

// check local storage for current game's primes
if (remaindleStorage.getItem("current-prime") === null) {
   const shuffled = PRIMES.sort(() => 0.5 - Math.random());
   todays_primes = shuffled.slice(0, NUM_GUESSES);
   todays_primes.sort(function (a, b) {
      return a - b;
   });
   remaindleStorage.setItem("current-prime", JSON.stringify(todays_primes));
} else {
   todays_primes = JSON.parse(remaindleStorage.getItem("current-prime"));
}

document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];

// initialize statistics/streaks if we haven't yet
if (remaindleStorage.getItem("statistics") === null) {
   remaindleStorage.setItem("statistics", JSON.stringify(new Array(9).fill(0)));
}
if (remaindleStorage.getItem("streaks") === null) {
   remaindleStorage.setItem("streaks", JSON.stringify({
      "current-streak": 0,
      "max-streak": 0
   }));
}

if (remaindleStorage.getItem("dark-mode") === null) {
   remaindleStorage.setItem("dark-mode", "false");
} else {
   document.getElementById("darkmode-checkbox").checked = (remaindleStorage.getItem("dark-mode") == "true");
   rerender();
}

if (remaindleStorage.getItem("diffm") === null) {
   remaindleStorage.setItem("diffm", document.querySelector('input[name="diffmode"]:checked').value);
} else {
   document.getElementById(remaindleStorage.getItem("diffm")).checked = true;
}


// check local storage for todays guesses
if (remaindleStorage.getItem("first") === null) {
   remaindleStorage.first = true;
   remaindleStorage.todays_guesses = "[]";
} else {
   var arr = JSON.parse(remaindleStorage.todays_guesses);
   for (var i = 0; i < arr.length; i++) {
      renderGuess(arr[i]);
   }
   if (finished) {
      won = arr.length > 0 && arr[arr.length - 1] == target;
      showFinishedGame();
   } else {
      document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[guesses];
   }
}

// Submit once when Enter is released.
var input = document.getElementById("guess-input");
input.addEventListener("keyup", function (event) {
   if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("button").click();
   }
});
