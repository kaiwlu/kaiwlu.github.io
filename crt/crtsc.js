function guess_helper(g) {
   var li = "";
   var val = 0;

   if (g != target) {
      val = (target - g + todays_primes[guesses] * 1000) % todays_primes[guesses];
   }
   li = (guesses + 1) + ". Prime: " + todays_primes[guesses] + "&nbsp Guess: " + g + "&nbsp Remainder: " + val + "<br>";
   document.getElementById("guesses").innerHTML += li;
   guesses++;

   var diffm = document.querySelector('input[name="diffmode"]:checked').value;
   if (diffm == "hard") {
      var gss = JSON.parse(localStorage.todays_guesses);
      for (var i = 0; i < gss.length; i++) {
         if (g == gss[i] || ((target - g + todays_primes[i] * 1000) % todays_primes[i]) != 0) {
            if (!finished) {
               // update game statistics
               var statistics = JSON.parse(localStorage.getItem("statistics"));
               statistics[0]++;
               localStorage.setItem("statistics", JSON.stringify(statistics));
               // update streak statistics
               var streaks = JSON.parse(localStorage.getItem("streaks"));
               streaks["current-streak"] = 0;
               localStorage.setItem("streaks", JSON.stringify(streaks));
               // update today's guesses
               gss.push(g);
               localStorage.todays_guesses = JSON.stringify(gss);

               finished = true;
               localStorage.setItem("finished", "true");
               var lose_reason = g == gss[i] ? "your guess is the same as guess " + (i + 1) : "your guess is not possible based on information given in guess " + (i + 1);
               var result_string =
                  "You lose, because " + lose_reason + ". \nThis game's number was " + target + ".";
               document.getElementById("button").disabled = true;
               document.getElementById("guess-input").disabled = true;
               document.getElementById("curguess").innerHTML = "Click on \"New Game\" to start a new game.";
               document.getElementById("curguess").style.color = (localStorage.getItem("dark-mode") == "true") ? "#fff7ee" : "#615e59";

               displayStats(result_string);
               return;
            }
         }
      }
   }

   if ((g != target) && (guesses < NUM_GUESSES)) {
      document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[guesses];
      return;
   }
   won = (g == target);

   // update statistics
   if (finished != true) {
      // update guess statistics
      var statistics = JSON.parse(localStorage.getItem("statistics"));
      statistics[won ? guesses : 0]++;

      localStorage.setItem("statistics", JSON.stringify(statistics));
      // update streak statistics
      var streaks = JSON.parse(localStorage.getItem("streaks"));
      if (won) {
         streaks["current-streak"]++;
         streaks["max-streak"] = Math.max(streaks["current-streak"], streaks["max-streak"]);
      } else {
         streaks["current-streak"] = 0;
      }
      localStorage.setItem("streaks", JSON.stringify(streaks));
   }

   finished = true;
   localStorage.setItem("finished", "true");

   // Game is over (either guess was correct, or we're out of guesses).
   var result_string = won ?
      "You win!" :
      "You lose. This game's number was " + target + ".";
   document.getElementById("button").disabled = true;
   document.getElementById("guess-input").disabled = true;
   document.getElementById("curguess").innerHTML = "Click on \"New Game\" to start a new game.";
   document.getElementById("curguess").style.color = (localStorage.getItem("dark-mode") == "true") ? "#fff7ee" : "#615e59";

   displayStats(result_string);
}

function stats() {
   displayStats("");
}

function displayStats(result_string) {
   result_string += "<canvas id=\"stats\" style=\"height: 300px; width: 100%;\"></canvas>";
   result_string += "<div id=\"streak\" style=\"display: flex; color: black;\"></div>";
   document.getElementById("result").innerHTML = result_string;

   var statistics = JSON.parse(localStorage.getItem("statistics"));
   var streaks = JSON.parse(localStorage.getItem("streaks"));
   var games_played = statistics.reduce((a, b) => a + b)
   var wins = statistics.slice(1).reduce((a, b) => a + b)
   var winpercent = (games_played == 0) ? "N/A" : Math.floor(100 * wins / games_played) + "%";
   var streak_string = "";
   streak_string += "<div id=\"played\" style=\"flex: 1;\">Played<div style=\"font-size: 2em\">" + games_played + "</div></div>";
   streak_string += "<div id=\"winpercent\" style=\"flex: 1\">Win Percentage<div style=\"font-size: 2em\">" + winpercent + "</div></div>";
   streak_string += "<div id=\"curstreak\" style=\"flex: 1\">Current Streak<div style=\"font-size: 2em\">" + streaks["current-streak"] + "</div></div>";
   streak_string += "<div id=\"maxstreak\" style=\"flex: 1\">Max Streak<div style=\"font-size: 2em\">" + streaks["max-streak"] + "</div></div>";
   document.getElementById("streak").innerHTML = streak_string;

   loadStats();
   $('#result').modal('show');

}

function loadStats() {
   var statistics = JSON.parse(localStorage.getItem("statistics"));
   //
   const labels = [1, 2, 3, 4, 5, 6, 7, 8];
   const data = {
      labels: labels,
      datasets: [{
         barPercentage: .9,
         minBarLength: 20,
         data: statistics.slice(1)
      }]
   };
   Chart.register(ChartDataLabels);
   const config = {
      plugins: [ChartDataLabels],
      type: 'bar',
      data: data,
      options: {
         indexAxis: "y",
         scales: {
            x: {
               display: false
            }
         },
         plugins: {
            legend: {
               display: false
            },

            title: {
               text: "Guess Distribution",
               font: {
                  size: 24,
                  family: 'Helvetica Neue'
               },
               display: true
            },
            tooltip: {
               enabled: false
            },
            datalabels: {
               anchor: "end",
               align: "left",
               // only display label if > 0
               display: function (context) {
                  var index = context.dataIndex;
                  var value = context.dataset.data[index];
                  return value > 0;
               }
            }
         },
      }
   };

   const myChart = new Chart(document.getElementById("stats"), config);
}

function guess() {
   var g = document.getElementById("guess-input").value;
   document.getElementById("guess-input").value = "";
   try {
      g = parseInt(g);
      if (isNaN(g)) { throw err; }
      if (g < 0 || g > MAX_NUM) { throw err; }
   } catch (err) {
      alert("Not a valid guess.");
      return;
   }
   if (g > MAX_NUM || g < 0) {
      alert("Not a valid guess.");
      return;
   }
   var diffm = document.querySelector('input[name="diffmode"]:checked').value;
   var gss = JSON.parse(localStorage.todays_guesses);
   if (diffm == "learner") {
      for (var i = 0; i < gss.length; i++) {
         if (((target - g + todays_primes[i] * 1000) % todays_primes[i]) != 0) {
            var alertmessage = "This guess is not possible, because (target - thisguess)%"
               + todays_primes[i] + "=" + (target - g + todays_primes[i] * 1000) % todays_primes[i]
               + ", but you should know enough information from guess " + (i + 1) + " to make it 0.";
            alert(alertmessage);
            return;
         }
      }
   }
   else if (diffm == "normal") {
      for (var i = 0; i < gss.length; i++) {
         if (g == gss[i]) {
            var alertmessage = "This guess is invaid because it's the same as guess "
               + (i + 1) + ".";
            alert(alertmessage);
            return;
         }
      }
   }
   else if (diffm == "hard") {
   }
   else {
      alert("You broke the game; if you have time, would you please email Kai and tell her? Error code: 204.");
   }
   guess_helper(g);
   var arr = JSON.parse(localStorage.todays_guesses);
   arr.push(g);
   localStorage.todays_guesses = JSON.stringify(arr);
}



function rerender() {
   var body = document.getElementsByTagName("body")[0];
   var darkmode = localStorage.getItem("dark-mode") == "true";
   body.style.backgroundColor = (darkmode ? "#5a5961" : "#eeeeff");
   body.style.color = (darkmode ? "#eeeeff" : "#5a5961");
   document.getElementById("curguess").style.color = darkmode ? "#fff7ee" : "#615e59";
}

function updateDarkMode() {
   localStorage.setItem("dark-mode", document.getElementById("darkmode-checkbox").checked);
   rerender();
}

function updateDiffMode() {
   localStorage.setItem("diffm", document.querySelector('input[name="diffmode"]:checked').value);
}

function updateBound() {
   var b = document.getElementById("bound-input").value;
   document.getElementById("bound-input").value = "";
   try {
      b = parseInt(b);
      if (isNaN(b)) { throw err; }
      if (b < 0 || b > 1000000) { throw err; }
   } catch (err) {
      alert("Not a valid bound.");
      return;
   }
   if (b < 0 || b > 1000000) {
      alert("Not a valid bound.");
      return;
   }
   NEXT_MAX_NUM = b;
   localStorage.next_max_num = NEXT_MAX_NUM;
   document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
}

// constants
var MAX_NUM = 2000;
var NEXT_MAX_NUM = 2000;

// check local storage for upper bound
if (localStorage.getItem("max_num") === null) {
   MAX_NUM = 2000;
   localStorage.max_num = MAX_NUM;
} else {
   try {
      MAX_NUM = parseInt(localStorage.max_num);
   }
   catch {
      alert("You broke the game; if you have time, would you please email Kai and tell her? Error code: 255.");
      MAX_NUM = 2000;
      localStorage.max_num = MAX_NUM;
   }
}

// check local storage for next upper bound
if (localStorage.getItem("next_max_num") === null) {
   NEXT_MAX_NUM = 2000;
   localStorage.next_max_num = NEXT_MAX_NUM;
} else {
   try {
      NEXT_MAX_NUM = parseInt(localStorage.next_max_num);
   }
   catch {
      alert("You broke the game; if you have time, would you please email Kai and tell her? Error code: 271.");
      NEXT_MAX_NUM = 2000;
      localStorage.next_max_num = NEXT_MAX_NUM;
   }
}

//
var PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const CPRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];

// always use pacific time
var d = new Date();
var pstDate = d.toLocaleString("en-us", {
   timeZone: "America/Los_Angeles"
});
var nd = new Date(pstDate);

var NUM_GUESSES = 0;
var prod = 1;
while (true) {
   prod *= CPRIMES[NUM_GUESSES];
   NUM_GUESSES++;
   if (prod > MAX_NUM) {
      break;
   }
}
NUM_GUESSES++;
NUM_GUESSES = Math.min(NUM_GUESSES, 8);
var NUM_PRIMES = NUM_GUESSES;

//
document.getElementById("max-guess").innerHTML = MAX_NUM;
document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
document.getElementById("num-guesses").innerHTML = NUM_GUESSES;

function getSeed() {
   // get (and probably set) seed (if not exist)
   try {
      return localStorage.getItem("current-seed");
   } catch {
      // if current-seed does not exist
      return updateSeed();
   }
}

function updateSeed() {
   var currentplay = nd.getMinutes() + '/' + nd.getSeconds() + '/' + nd.getMilliseconds();
   localStorage.setItem("current-seed", currentplay);
   return currentplay;
}

function newGame() {
   // start a new game
   if (finished != true) {
      // I guess restarting means losing
      // update guess statistics
      var statistics = JSON.parse(localStorage.getItem("statistics"));
      statistics[0]++;
      localStorage.setItem("statistics", JSON.stringify(statistics));
      // update streak statistics
      var streaks = JSON.parse(localStorage.getItem("streaks"));
      streaks["current-streak"] = 0;
      localStorage.setItem("streaks", JSON.stringify(streaks));
   }
   document.getElementById("button").disabled = false;
   document.getElementById("guess-input").disabled = false;

   MAX_NUM = parseInt(localStorage.next_max_num);
   localStorage.max_num = MAX_NUM;
   NEXT_MAX_NUM = MAX_NUM;
   localStorage.next_max_num = MAX_NUM;
   NUM_GUESSES = 0;
   prod = 1;
   while (true) {
      prod *= CPRIMES[NUM_GUESSES];
      NUM_GUESSES++;
      if (prod > MAX_NUM) {
         break;
      }
   }
   NUM_GUESSES++;
   NUM_GUESSES = Math.min(NUM_GUESSES, 8);
   NUM_PRIMES = NUM_GUESSES;
   document.getElementById("max-guess").innerHTML = MAX_NUM;
   document.getElementById("next-max-guess").innerHTML = NEXT_MAX_NUM;
   document.getElementById("num-guesses").innerHTML = NUM_GUESSES;

   const shuffled = PRIMES.sort(() => 0.5 - Math.random());
   target = Math.round(Math.random() * MAX_NUM);
   localStorage.target = target;
   todays_primes = shuffled.slice(0, NUM_PRIMES);
   todays_primes.sort(function (a, b) {
      return a - b;
   });
   localStorage.setItem("current-prime", JSON.stringify(todays_primes));
   localStorage.setItem("finished", "false");
   finished = false;

   localStorage.todays_guesses = "[]";
   document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
   document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];
   document.getElementById("guesses").innerHTML = "";
   guesses = 0;
   won = false;
   Math.seedrandom(getSeed());
}

// using https://github.com/davidbau/seedrandom
Math.seedrandom(getSeed());

var target = 0;

// check local storage for todays target
if (localStorage.getItem("target") === null) {
   target = Math.round(Math.random() * MAX_NUM);
   localStorage.target = target;
} else {
   try {
      target = parseInt(localStorage.target);
   }
   catch {
      alert("You broke the game; if you have time, would you please email Kai and tell her? Error code: 311.");
      target = Math.round(Math.random() * MAX_NUM);
      localStorage.target = target;
   }
}

var todays_primes = []
var guesses = 0;
var won = false;
var finished = false;

// check local storage for finish status
if (localStorage.getItem("finished") === null) {
   localStorage.setItem("finished", "false");
   finished = false;
} else {
   finished = (localStorage.getItem("finished") == "true");
}

// check local storage for current game's primes
if (localStorage.getItem("current-prime") === null) {
   const shuffled = PRIMES.sort(() => 0.5 - Math.random());
   todays_primes = shuffled.slice(0, NUM_PRIMES);
   todays_primes.sort(function (a, b) {
      return a - b;
   });
   localStorage.setItem("current-prime", JSON.stringify(todays_primes));
} else {
   todays_primes = JSON.parse(localStorage.getItem("current-prime"));
}

document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];

// initialize statistics/streaks if we haven't yet
if (localStorage.getItem("statistics") === null) {
   localStorage.setItem("statistics", JSON.stringify(new Array(9).fill(0)));
}
if (localStorage.getItem("streaks") === null) {
   localStorage.setItem("streaks", JSON.stringify({
      "current-streak": 0,
      "max-streak": 0
   }));
}

if (localStorage.getItem("dark-mode") === null) {
   localStorage.setItem("dark-mode", "false");
} else {
   document.getElementById("darkmode-checkbox").checked = (localStorage.getItem("dark-mode") == "true");
   rerender();
}

if (localStorage.getItem("diffm") === null) {
   localStorage.setItem("diffm", document.querySelector('input[name="diffmode"]:checked').value);
} else {
   document.getElementById(localStorage.getItem("diffm")).checked = true;
}


// check local storage for todays guesses
if (localStorage.getItem("first") === null) {
   localStorage.first = true;
   localStorage.todays_guesses = "[]";
} else {
   var arr = JSON.parse(localStorage.todays_guesses);
   for (var i = 0; i < arr.length; i++) {
      guess_helper(arr[i]);
   }
}

// Shamelessly stolen from w3schools like a proper programmer.
var input = document.getElementById("guess-input");
input.addEventListener("keyup", function (event) {
   if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("button").click();
   }
});