let currentSong = new Audio();
let currFolder;
let songs;
let displayName;


const mediaQuery2 = window.matchMedia("(max-width: 500px)");

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function splitName(name) {
    const parts = name.split('-');
    if (parts.length !== 2) {
        throw new Error('Invalid input: Name must contain exactly one hyphen.');
    }
    const [firstPart, secondPart] = parts;
    return {
        firstPart: firstPart.trim(),
        secondPart: secondPart.trim().replace('.mp3', '')
    };
}

function handleTabletChange(e) {
    if (e.matches) {
        // Screen width is less than or equal to 768px
        document.querySelector(".left").style.width = "100%";
    } else {
        // Screen width is greater than 768px
        document.querySelector(".left").style.width = "";
    }
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5501/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songLists ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        displayName = song.replaceAll("%20", " ");
        const { firstPart, secondPart } = splitName(displayName);
        songUL.innerHTML += `<li> 
            <i class="fa-solid fa-music music-icon"></i>
            <div class="songsInfo">
                <div class="songName">${secondPart}</div>
                <div class="artistName">${firstPart}</div>
            </div>
            <i class="play-now fa-solid fa-play invert"></i>
        </li>`;
    }
    Array.from(document.querySelectorAll(".songLists li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            const songName = songs[index];
            playMusic(songName);
        });
    });
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5501/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0]; // Move `folder` inside the loop
            let a = await fetch(`http://127.0.0.1:5501/songs/${folder}/info.json`);
            let response = await a.json(); // Move `response` inside the loop
            console.log(response);
            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                <div class="play-button items-center">
                    <i class="fa-solid fa-play"></i>
                </div>
                <img src="/songs/${folder}/cover.jpeg" alt="">
                <h4>${response.title}</h4>
                <p>${response.description}</p>
            </div>`;
        }
    }

    document.querySelectorAll(".card").forEach(e => {
        e.addEventListener("click", async function() { // Use function() to correctly access `this`
            console.log('Card clicked:', this);
            await getSongs(`songs/${this.dataset.folder}`);
            playMusic(songs[0]);

            let albumUL = document.querySelector(".album-name ul");
            if (!albumUL) {
                console.error('Element .album-name ul not found');
                return;
            }
            albumUL.innerHTML = "";
            albumUL.innerHTML += `<li>
               <img class="album-image" src="/songs/${this.dataset.folder}/cover.jpeg" alt=""></li>
                <li><h4 class="album-artist">${this.querySelector('h4').innerText}</h4>
            </li>`;

            if (mediaQuery2.matches) {
                document.querySelector(".left").style.left = "0%";
                document.querySelector(".left").style.width = "100%";
            } else {
                document.querySelector(".left").style.left = "0%";
            }
        });
    });
}




const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play();
        document.getElementById("play").innerHTML = `<i class="btn-pause fa-solid fa-pause"></i>`;
    }

    document.querySelector(".played-song").innerHTML = decodeURI(track);
    document.querySelector(".start-time").innerHTML = "00:00";
    document.querySelector(".end-time").innerHTML = "00:00";

    if (!track) {
        document.querySelector(".played-song").innerHTML = "";
    }
}

async function main() {
    await displayAlbums();

    const playButton = document.getElementById("play");

    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.innerHTML = `<i class="btn-pause fa-solid fa-pause"></i>`;
        } else {
            currentSong.pause();
            playButton.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".start-time").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}`;
        document.querySelector(".end-time").innerHTML = `${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration) * percent / 100;
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    mediaQuery2.addListener(handleTabletChange);
    handleTabletChange(mediaQuery2);
}

main();
