let currentSong = new Audio();

let currFolder;

let songs
let displayName;

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


async function getSongs(folder) {
    currFolder = folder;
    //first fetch the directory then add the text of that directory in respone var
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`)
    let response = await a.text();
    //make a div and add text of response in div
    let div = document.createElement("div");
    div.innerHTML = response;
    //will just skim the anchor tags and href
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    let songUL = document.querySelector(".songLists").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""

    for (const song of songs) {
        // Replace %20 with space for display purposes
        displayName = song.replaceAll("%20", " ");
        const { firstPart, secondPart } = splitName(displayName);

        // Show all the songs and artists in the playlist
        songUL.innerHTML += `<li> 
            <i class="fa-solid fa-music music-icon"></i>
            <div class="songsInfo">
                <div class="songName">${secondPart}</div>
                <div class="artistName">${firstPart}</div>
            </div>
            <i class="play-now fa-solid fa-play invert"></i>
        </li>`;
    }
    //Attach event listener to each song
    Array.from(document.querySelector(".songLists").getElementsByTagName("li")).forEach((e,index) => {
        e.addEventListener("click", () => {
            // const songName = e.querySelector(".songsInfo").firstElementChild.innerHTML;
            const songName = songs[index]; // Use the index to get the correct song name
            playMusic(songName);
        })

    })
}
async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0];

            let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
            let response = await a.json();
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

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0])
        });
    });
}


const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    //automatically add a song
    if (!pause) {
        currentSong.play();
        play.innerHTML = `<i class="btn-pause fa-solid fa-pause"></i>`;
    }


    document.querySelector(".played-song").innerHTML = decodeURI(track);
    document.querySelector(".start-time").innerHTML = "00:00";
    document.querySelector(".end-time").innerHTML = "00:00";

    if(!track)
    {
        document.querySelector(".played-song").innerHTML = "";
    }


}


//get the href of all songs
async function main() {
    await getSongs();
    playMusic(songs[0], true)

    //display the albums on the page
    displayAlbums()


    //Attach event listener to play, next, previous

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

    //listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".start-time").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}`;
        document.querySelector(".end-time").innerHTML = `${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    //event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration) * percent / 100;
    })

    //add event listener to menu
    document.querySelector("#menubar").addEventListener("click", e => {
        document.querySelector(".left").style.left = "0"
    })
    //add event listener to close
    document.querySelector(".close").addEventListener("click", e => {
        document.querySelector(".left").style.left = "-120%"
    })


    //add event listener to previous and next
    previous.addEventListener("click", () => {
        console.log("Previous Clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])

        if (index - 1 >= 0) {
            playMusic(songs[index - 1])
        }

    })
    next.addEventListener("click", () => {
        console.log("Next Clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])

        if (index + 1 < songs.length) {
            playMusic(songs[index + 1])
        }

    })
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
    })




}

main();
