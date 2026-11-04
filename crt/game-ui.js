/* Final Workbench presentation; the engine retains its rules and saved-data format. */
(() => {
    const byId = (id) => document.getElementById(id);
    const format = (value) => Number(value).toLocaleString("en-US");
    const descriptions = {
        learner: "Guesses that contradict an earlier clue are rejected, so you can try again.",
        normal: "Repeated guesses are not allowed. Other guesses use a turn.",
        hard: "A repeated guess or one that contradicts an earlier clue ends the game."
    };
    const dialog = byId("result");

    function render() {
        const historyText = [...byId("guesses").childNodes].map((node) => node.textContent).join("\n");
        const history = [...historyText.matchAll(/(\d+)\.\s*Prime:\s*(\d+)\s*Guess:\s*(\d+)\s*Remainder:\s*(-?\d+)/g)];
        const count = history.length;
        const maximum = Number(byId("max-guess").textContent);
        const total = Number(byId("num-guesses").textContent);
        const current = byId("curguess").textContent.match(/Current Prime:\s*(\d+)/)?.[1];
        const primes = byId("info").textContent.split(":")[1]?.match(/\d+/g) || [];
        const complete = !current;

        byId("prime-value").textContent = current || (window.won ? "✓" : "—");
        byId("round-title").textContent = complete ? (window.won ? "Puzzle solved." : "Round complete.") : "What’s your next guess?";
        byId("range-caption").textContent = complete ? "Start a new game to play again." : `An integer between 0 and ${format(maximum)}.`;
        byId("turn-label").textContent = complete ? `${count} of ${total} guesses used` : `Guess ${count + 1} of ${total}`;
        byId("guess-input").max = maximum;
        byId("visible-num-guesses").textContent = total;
        byId("visible-next-bound").textContent = format(byId("next-max-guess").textContent);
        byId("bound-input").placeholder = format(byId("next-max-guess").textContent);
        byId("history-count").textContent = `${count} ${count === 1 ? "guess" : "guesses"}`;
        byId("history-empty").hidden = count !== 0;
        byId("history-rows").replaceChildren(...history.map((match) => {
            const row = document.createElement("tr");
            match.slice(1).forEach((value, index) => {
                const cell = document.createElement(index === 0 ? "th" : "td");
                if (index === 0) cell.scope = "row";
                cell.textContent = format(value);
                row.append(cell);
            });
            return row;
        }));
        byId("prime-track").replaceChildren(...primes.map((prime, index) => {
            const item = document.createElement("li");
            item.textContent = prime;
            item.className = index < count ? "used" : (!complete && index === count ? "current" : "");
            item.setAttribute("aria-label", `Prime ${prime}${index < count ? ", used" : item.className === "current" ? ", current" : ", upcoming"}`);
            if (item.className === "current") item.setAttribute("aria-current", "step");
            return item;
        }));
        const last = history.at(-1);
        const announcement = `${last ? `Guess ${last[1]}: ${format(last[3])}, remainder ${last[4]}. ` : ""}${complete ? byId("round-title").textContent : `Current prime ${current}. ${total - count} guesses left.`}`;
        if (byId("round-announcement").textContent !== announcement) byId("round-announcement").textContent = announcement;
        renderSettings();
    }

    function renderSettings() {
        const mode = document.querySelector('input[name="diffmode"]:checked').value;
        byId("mode-description").textContent = descriptions[mode];
        const dark = byId("darkmode-checkbox").checked;
        document.body.dataset.dark = String(dark);
        const toggle = byId("theme-toggle");
        const label = `Switch to ${dark ? "light" : "dark"} mode`;
        toggle.setAttribute("aria-pressed", String(dark));
        toggle.setAttribute("aria-label", label);
        toggle.title = label;
        toggle.firstElementChild.textContent = dark ? "☀️" : "🌙";
    }

    window.showGameMessage = (message) => {
        byId("form-feedback").textContent = message;
    };
    window.submitGuess = () => {
        const input = byId("guess-input");
        if (input.disabled) return;
        const value = input.value.trim();
        const number = Number(value);
        byId("form-feedback").textContent = "";
        if (!value || !Number.isInteger(number) || number < 0 || number > Number(input.max)) {
            byId("form-feedback").textContent = `Enter a whole number between 0 and ${format(input.max)}.`;
            input.focus();
            return;
        }
        // Normalize exponent notation before the original engine's parseInt.
        input.value = String(number);
        window.guess();
    };
    window.startNewGame = () => {
        byId("form-feedback").textContent = "";
        byId("guess-input").value = "";
        window.newGame();
        byId("guess-input").focus();
    };
    window.applyBound = () => {
        const input = byId("bound-input");
        const value = input.value.trim();
        const number = Number(value);
        if (!value || !Number.isInteger(number) || number < 0 || number > 1000000) {
            byId("bound-feedback").textContent = "Enter a whole number from 0 to 1,000,000.";
            return;
        }
        input.value = String(number);
        window.updateBound();
        byId("bound-feedback").textContent = `Saved. Your next game will use 0–${format(number)}.`;
    };
    window.toggleAppearance = () => {
        byId("darkmode-checkbox").checked = !byId("darkmode-checkbox").checked;
        window.updateDarkMode();
        renderSettings();
    };

    // A native dialog and HTML bars replace the external modal and chart libraries.
    window.displayStats = (message = "") => {
        const statistics = JSON.parse(remaindleStorage.getItem("statistics"));
        const streaks = JSON.parse(remaindleStorage.getItem("streaks"));
        const winsByGuess = statistics.slice(1);
        const played = statistics.reduce((sum, count) => sum + count, 0);
        const wins = winsByGuess.reduce((sum, count) => sum + count, 0);
        const largest = Math.max(1, ...winsByGuess);
        byId("game-outcome").textContent = message;
        byId("game-outcome").hidden = !message;
        byId("stat-played").textContent = format(played);
        byId("stat-rate").textContent = played ? `${Math.floor(100 * wins / played)}%` : "—";
        byId("stat-current").textContent = format(streaks["current-streak"]);
        byId("stat-best").textContent = format(streaks["max-streak"]);
        byId("statistics-empty").textContent = played ? `${format(wins)} ${wins === 1 ? "win" : "wins"} · ${format(played - wins)} ${played - wins === 1 ? "loss" : "losses"}` : "Finish a game to start your statistics.";
        byId("guess-distribution").replaceChildren(...winsByGuess.map((count, index) => {
            const row = document.createElement("li");
            row.setAttribute("aria-label", `${index + 1} ${index === 0 ? "guess" : "guesses"}: ${count} ${count === 1 ? "win" : "wins"}`);
            const label = document.createElement("span");
            label.textContent = index + 1;
            const track = document.createElement("span");
            track.className = "distribution-track";
            const bar = document.createElement("span");
            bar.className = "distribution-bar";
            bar.style.width = `${100 * count / largest}%`;
            track.append(bar);
            const value = document.createElement("span");
            value.textContent = format(count);
            value.className = "distribution-count";
            row.append(label, track, value);
            return row;
        }));
        if (!dialog.open) dialog.showModal();
    };
    window.stats = () => window.displayStats();
    byId("close-statistics").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    byId("bound-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            window.applyBound();
        }
    });
    byId("settings-panel").addEventListener("change", renderSettings);
    document.addEventListener("DOMContentLoaded", () => {
        new MutationObserver(render).observe(byId("legacy-state"), { childList: true, subtree: true, characterData: true });
        render();
        if (dialog.open) byId("close-statistics").focus();
    }, { once: true });
})();
