// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  segments: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches(".card.podracer")) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate();
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  // DONE - Get player_id and track_id from the store
  const player_id = store.player_id;
  const track_id = store.track_id;
  // render starting UI
  const tracks = await getTracks();
  renderAt(
    "#race",
    renderRaceStartView(tracks.filter((track) => track.id == store.track_id)[0])
  );

  try {
    // Done - invoke the API call to create the race, then save the result
    const race = await createRace(player_id, track_id);
    console.log(race);

    // Done - update the store with the race id
    store.race_id = race.ID - 1;
    store.segments = race.Track.segments.length;
    // For the API to work properly, the race id should be race id - 1

    // Done - call the async function runCountdown
    await runCountdown();

    // Done - call the async function startRace
    console.log("store.race_id = " + store.race_id);

    await startRace(store.race_id);

    // Done - call the async function runRace
    await runRace(store.race_id);
  } catch (error) {
    console.error("Problem with creating or starting the race:", error);
  }
}

function runRace(raceID) {
  return new Promise((resolve) => {
    // Done - use Javascript's built in setInterval method to get race info every 500ms
    const raceInterval = setInterval(async () => {
      // Done add error handling for the Promise
      try {
        // Done - if the race info status property is "in-progress", update the leaderboard.
        const res = await getRace(raceID);

        if (res.status === "in-progress") {
          // If the race info status property is "in-progress", update the leaderboard
          console.log(res);
          renderAt("#leaderBoard", raceProgress(res.positions));
          // Done - if the race info status property is "finished".
        } else if (res.status === "finished") {
          // If the race info status property is "finished", stop the interval, render the results view, and resolve the promise
          clearInterval(raceInterval); // to stop the interval from repeating
          renderAt("#race", resultsView(res.positions)); // to render the results view
          reslove(res); // resolve the promise
        }
      } catch (error) {
        console.error("Error while getting race info:", error);
        clearInterval(raceInterval);
        resolve(null); // Resolve with null in case of error
      }
    }, 500);
  });
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      // Done - use Javascript's built in setInterval method to count down once per second
      const countdownInterval = setInterval(() => {
        // run this DOM manipulation to decrement the countdown for the user
        document.getElementById("big-numbers").innerHTML = --timer;
        // Done - if the countdown is done, clear the interval, resolve the promise, and return
        if (timer === 0) {
          // If the countdown is done, clear the interval, resolve the promise, and return
          clearInterval(countdownInterval);
          resolve();
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectPodRacer(target) {
  console.log("selected a pod", target.id);

  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  // Done - save the selected racer to the store
  console.log("target.id :" + target.id);

  store.player_id = target.id;

  console.log("store.player_id AFTER UPDATE :" + store.player_id);
}
function handleSelectTrack(target) {
  console.log("selected a track", target.id);

  // remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  // Done - save the selected track id to the store
  store.track_id = target.id;
}

function handleAccelerate() {
  // Done - Invoke the API call to accelerate
  accelerate(store.race_id)
    .then(() => console.log("Accelerate button clicked"))
    .catch((error) => console.error("Problem with accelerating:", error));
}

function renderRacerCars(racers) {
  console.log(racers);

  if (!racers.length) {
    return `
              <h4>Loading Racers...</4>
          `;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
          <ul id="racers">
              ${results}
          </ul>
      `;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
          <li class="card podracer" id="${id}">
              <h3>${driver_name}</h3>
              <p>${top_speed}</p>
              <p>${acceleration}</p>
              <p>${handling}</p>
          </li>
      `;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
              <h4>Loading Tracks...</4>
          `;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
          <ul id="tracks">
              ${results}
          </ul>
      `;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
          <li id="${id}" class="card track">
              <h3>${name}</h3>
          </li>
      `;
}

function renderCountdown(count) {
  return `
          <h2>Race Starts In...</h2>
          <p id="big-numbers">${count}</p>
      `;
}

function renderRaceStartView(track, racers) {
  return `
          <header>
              <h1>Race: ${track.name}</h1>
          </header>
          <main id="two-columns">
              <section id="leaderBoard">
                  ${renderCountdown(3)}
              </section>
  
              <section id="accelerate">
                  <h2>Directions</h2>
                  <p>Click the button as fast as you can to make your racer go faster!</p>
                  <button id="gas-peddle">Click Me To Win!</button>
              </section>
          </main>
          <footer></footer>
      `;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
          <header>
              <h1>Race Results</h1>
          </header>
          <main>
              ${raceProgress(positions)}
              <a href="/race">Start a new race</a>
          </main>
      `;
}

function raceProgress(positions) {
  let userPlayer = positions.find((e) => e.id === store.player_id);
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
  });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:3001";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

  // Done - Make a fetch call (with error handling!) to each of the following API endpoints

function getTracks() {
  // Done request to `${SERVER}/api/tracks`
  return fetch(`${SERVER}/api/tracks`, {
    method: "GET",
    ...defaultFetchOpts(),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("Failed to fetch tracks");
    })

    .catch((err) => console.error("Problem with getTracks request:", err));
}

function getRacers() {
  // Done request to `${SERVER}/api/cars`
  return fetch(`${SERVER}/api/cars`, {
    method: "GET",
    ...defaultFetchOpts(),
  })
    .then((res) => {
      console.log(res);

      if (!res.ok) {
        throw new Error("Failed to fetch racers");
      }
      return res.json();
    })
    .catch((err) => console.error("Problem with getRacers request:", err));
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const id = store.race_id;
  const body = { id, track_id, player_id };
  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    dataType: "jsonp",
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log("Problem with createRace request::", err));
}

function getRace(id) {
  // Done request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`, {
    method: "GET",
    ...defaultFetchOpts(),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch race");
      }
      return res.json();
    })
    .catch((err) => console.error("Problem with getRace request:", err));
}
function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((err) => console.log("Problem with getRace request:", err));
}

function accelerate(id) {
  // Done request to `${SERVER}/api/races/${id}/accelerate`
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((err) => console.error("Problem with accelerate request:", err));
}
