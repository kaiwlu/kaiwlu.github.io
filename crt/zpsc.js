function norm_power(n, p) {
   // returns power of p found in n
   if (n == 0) {
     // hopefully shouldnt get here
     return -1;
   }
   var k = 0;
   while (n % p == 0) {
     n = n / p;
     k++;
   }
   return k;
 }

function sample_from_distribution(dist) {
   // should probably test this
   var tot = 0;
   for (var p in dist) {
      tot += dist[p];
   }
   var r = tot * Math.random();
   var sum = 0;
   for (var p in dist) {
      sum += dist[p];
      if (sum >= r) {
         return parseInt(p);
      }
   }
}

function guess_helper(g) {
   var li = "";
   var val = 0;
   var pow = -1;
   if (g != target) {
     pow = norm_power(Math.abs(g - target), todays_primes[guesses]);
     if (pow == 0) {
       val = 1;
     } else {
       val = Math.pow(todays_primes[guesses], pow);
     }
   }
   li = (guesses + 1) + ". Prime: " + todays_primes[guesses] + "&nbsp Guess: " + g + "&nbsp Prime power: " + val + "<br>";
   document.getElementById("guesses").innerHTML += li;
   guesses++;

   if ((g != target) && (guesses < NUM_GUESSES)) {
      document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[guesses];
      return;
   }
   won = (g == target);

   // update statistics
   if (finished != true) {
      // update guess statistics
      var statistics = JSON.parse(localStorage.getItem("zpstatistics"));
      statistics[won ? guesses : 0]++;

      localStorage.setItem("zpstatistics", JSON.stringify(statistics));
      // update streak statistics
      var streaks = JSON.parse(localStorage.getItem("zpstreaks"));
      if (won) {
         streaks["current-streak"]++;
         streaks["max-streak"] = Math.max(streaks["current-streak"], streaks["max-streak"]);
      } else {
         streaks["current-streak"] = 0;
      }
      localStorage.setItem("zpstreaks", JSON.stringify(streaks));
   }

   finished = true;
   localStorage.setItem("zpfinished", "true");

   // Game is over (either guess was correct, or we're out of guesses).
   var result_string = won ?
      "You win!" :
      "You lose. This game's number was " + target + ".";
   document.getElementById("button").disabled = true;
   document.getElementById("guess-input").disabled = true;
   document.getElementById("curguess").innerHTML = "Click on \"New Game\" to start a new game.";
   document.getElementById("curguess").style.color = (localStorage.getItem("zpdark-mode") == "true") ? "#fff7ee" : "#615e59";

   displayStats(result_string);
}

function stats() {
   displayStats("");
}

function displayStats(result_string) {
   result_string += "<canvas id=\"stats\" style=\"height: 300px; width: 100%;\"></canvas>";
   result_string += "<div id=\"streak\" style=\"display: flex; color: black;\"></div>";
   document.getElementById("result").innerHTML = result_string;

   var statistics = JSON.parse(localStorage.getItem("zpstatistics"));
   var streaks = JSON.parse(localStorage.getItem("zpstreaks"));
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
   var statistics = JSON.parse(localStorage.getItem("zpstatistics"));
   //
   const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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

   guess_helper(g);
   var arr = JSON.parse(localStorage.zptodays_guesses);
   arr.push(g);
   localStorage.zptodays_guesses = JSON.stringify(arr);
}



function rerender() {
   var body = document.getElementsByTagName("body")[0];
   var darkmode = localStorage.getItem("zpdark-mode") == "true";
   body.style.backgroundColor = (darkmode ? "#5a5961" : "#eeeeff");
   body.style.color = (darkmode ? "#eeeeff" : "#5a5961");
   document.getElementById("curguess").style.color = darkmode ? "#fff7ee" : "#615e59";
}

function updateDarkMode() {
   localStorage.setItem("zpdark-mode", document.getElementById("darkmode-checkbox").checked);
   rerender();
}

function getSeed() {
   // get (and probably set) seed (if not exist)
   if (localStorage.getItem("zpcurrent-seed") === null) {
      // if current-seed does not exist
      return updateSeed();
   } else {
      return localStorage.getItem("zpcurrent-seed");
   }
}

function updateSeed() {
   var currentplay = nd.getMinutes() + '/' + nd.getSeconds() + '/' + nd.getMilliseconds();
   localStorage.setItem("zpcurrent-seed", currentplay);
   return currentplay;
}

function newGame() {
   // start a new game
   if (finished != true) {
      // I guess restarting means losing
      // update guess statistics
      var statistics = JSON.parse(localStorage.getItem("zpstatistics"));
      statistics[0]++;
      localStorage.setItem("zpstatistics", JSON.stringify(statistics));
      // update streak statistics
      var streaks = JSON.parse(localStorage.getItem("zpstreaks"));
      streaks["current-streak"] = 0;
      localStorage.setItem("zpstreaks", JSON.stringify(streaks));
   }
   // create new list of primes
   todays_primes = [];
   for (var i = 0; i < NUM_GUESSES; i++) {
      todays_primes.push(sample_from_distribution(DISTRIBUTION));
    }
    todays_primes.sort(function(a, b) {
      return a - b;
    });
   localStorage.setItem("zpcurrent-prime", JSON.stringify(todays_primes));
   // update status variables
   localStorage.setItem("zpfinished", "false");
   finished = false;
   localStorage.zptodays_guesses = "[]";
   guesses = 0;
   won = false;
   updateSeed();
   Math.seedrandom(getSeed());
   // update display and buttons
   document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
   document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];
   document.getElementById("guesses").innerHTML = "";
   document.getElementById("button").disabled = false;
   document.getElementById("guess-input").disabled = false;
}

// constants
var MAX_NUM = 1000;
var NUM_GUESSES = 10;
var NUM_PRIMES = 10;
//
document.getElementById("max-guess").innerHTML = MAX_NUM;
document.getElementById("num-guesses").innerHTML = NUM_GUESSES;
//
var PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227];
var MY_PRIMES = PRIMES.slice(0, NUM_PRIMES);
var DISTRIBUTION = {}
for (var i = 0; i < MY_PRIMES.length; i++) {
   var p = MY_PRIMES[i];
   DISTRIBUTION[p] = 1.0 / p;
}

// always use pacific time
var d = new Date();
var pstDate = d.toLocaleString("en-us", {
   timeZone: "America/Los_Angeles"
});
var nd = new Date(pstDate);

// using https://github.com/davidbau/seedrandom
Math.seedrandom(getSeed());

var target = 0;

// check local storage for todays target
if (localStorage.getItem("zptarget") === null) {
   target = Math.round(Math.random() * MAX_NUM);
   localStorage.zptarget = target;
} else {
   try {
      target = parseInt(localStorage.zptarget);
   }
   catch {
      alert("You broke the game; if you have time, would you please email Kai and tell her? Error code: 311.");
      target = Math.round(Math.random() * MAX_NUM);
      localStorage.zptarget = target;
   }
}

var todays_primes = []
var guesses = 0;
var won = false;
var finished = false;

// check local storage for finish status
if (localStorage.getItem("zpfinished") === null) {
   localStorage.setItem("zpfinished", "false");
   finished = false;
} else {
   finished = (localStorage.getItem("zpfinished") == "true");
}

// check local storage for current game's primes
if (localStorage.getItem("zpcurrent-prime") === null) {
   for (var i = 0; i < NUM_GUESSES; i++) {
      todays_primes.push(sample_from_distribution(DISTRIBUTION));
    }
    todays_primes.sort(function(a, b) {
      return a - b;
    });
   localStorage.setItem("zpcurrent-prime", JSON.stringify(todays_primes));
} else {
   todays_primes = JSON.parse(localStorage.getItem("zpcurrent-prime"));
}

document.getElementById("info").innerHTML = "This game's Primes: " + todays_primes.join(", ");
document.getElementById("curguess").innerHTML = "Current Prime: " + todays_primes[0];

// initialize statistics/streaks if we haven't yet
if (localStorage.getItem("zpstatistics") === null) {
   localStorage.setItem("zpstatistics", JSON.stringify(new Array(11).fill(0)));
}
if (localStorage.getItem("zpstreaks") === null) {
   localStorage.setItem("zpstreaks", JSON.stringify({
      "current-streak": 0,
      "max-streak": 0
   }));
}

if (localStorage.getItem("zpdark-mode") === null) {
   localStorage.setItem("zpdark-mode", "false");
} else {
   document.getElementById("darkmode-checkbox").checked = (localStorage.getItem("zpdark-mode") == "true");
   rerender();
}

// check local storage for todays guesses
if (localStorage.getItem("zpfirst") === null) {
   localStorage.zpfirst = true;
   localStorage.zptodays_guesses = "[]";
} else {
   var arr = JSON.parse(localStorage.zptodays_guesses);
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