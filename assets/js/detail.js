"use strict";

import { api_key, imageBaseURL, fetchDataFromServer } from "./api.js";
import { sidebar } from "./sidebar.js";
import { createMovieCard } from "./movie-card.js";

const movieId = window.localStorage.getItem("movieId");
const pageContent = document.querySelector("[page-content]");

// Inject search form and footer styles into head
const style = document.createElement("style");
style.textContent = `
    .search-container {
        margin: 20px;
    }
    .search-input {
        padding: 8px;
        font-size: 16px;
        width: 300px;
    }
    .search-button {
        padding: 8px 16px;
        font-size: 16px;
        cursor: pointer;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        margin-right: 10px;
    }
    .search-button:hover {
        background-color: #45a049;
    }
    .search-button-alt {
        padding: 8px 16px;
        font-size: 16px;
        cursor: pointer;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: bold;
    }
    .search-button-alt:hover {
        background-color: #45a049;
    }
    .countdown {
        color: red;
        font-size: 16px;
        margin-left: 10px;
        display: inline-block;
    }
    .warning {
        color: #ff4500;
        font-size: 16px;
        margin-left: 10px;
        display: none;
    }
    .footer {
        margin: 20px;
        padding: 20px;
        text-align: center;
    }
`;
document.head.appendChild(style);

// Create and append search form (first Download button)
const searchContainer = document.createElement("div");
searchContainer.classList.add("search-container");
const form = document.createElement("form");
form.onsubmit = (event) => event.preventDefault();
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.name = "query";
searchInput.classList.add("search-input");
searchInput.placeholder = "Enter search term (e.g., movie name)";
searchInput.required = true;
form.appendChild(searchInput);

// First Download button
const searchButton = document.createElement("button");
searchButton.type = "submit";
searchButton.classList.add("search-button");
searchButton.textContent = "Download";
const countdown1 = document.createElement("span");
countdown1.classList.add("countdown");
countdown1.style.display = "none";
const warning = document.createElement("div");
warning.classList.add("warning");
warning.textContent = "Go to footer for another download option";
form.appendChild(searchButton);
form.appendChild(countdown1);
form.appendChild(warning);
searchContainer.appendChild(form);
pageContent.appendChild(searchContainer);

// Create footer for second Download button
const footer = document.createElement("footer");
footer.classList.add("footer");
const searchButtonAlt = document.createElement("button");
searchButtonAlt.type = "button";
searchButtonAlt.classList.add("search-button-alt");
searchButtonAlt.textContent = "GO TO THE FIRST LINK";
const countdown2 = document.createElement("span");
countdown2.classList.add("countdown");
countdown2.style.display = "none";
footer.appendChild(searchButtonAlt);
footer.appendChild(countdown2);
// Footer will be appended after all content

// Check if the page is loaded as a new tab (via query parameter)
const urlParams = new URLSearchParams(window.location.search);
const isNewTab = urlParams.get('newTab') === 'true';
if (isNewTab) {
    // Hide the first Download button in the new tab
    searchButton.style.display = 'none';
    // Optionally, hide the entire search container if you don't want the input either
    // searchContainer.style.display = 'none';
}

// Search function with countdown
function delayedGoogleSearch(countdownElement, seconds, callback = null) {
    const userInput = searchInput.value;
    const additionalInfo =
        '+(mkv|mp4|avi|mov|mpg|wmv|divx|mpeg) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml) intitle:index.of -inurl:(listen77|mp3raid|mp3toss|mp3drug|index_of|index-of|wallywashis|downloadmana)';
    const searchQuery = `${userInput} ${additionalInfo}`.trim();
    
    let timeLeft = seconds;
    countdownElement.style.display = "inline-block";
    countdownElement.textContent = `Waiting ${timeLeft}s`;
    
    const interval = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = `Waiting ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            countdownElement.style.display = "none";
            if (callback) {
                callback(searchQuery);
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            }
        }
    }, 1000);
}

// Event listener for first Download button
searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    delayedGoogleSearch(countdown1, 17, () => {
        // After 17 seconds, open the same page in a new tab with newTab=true query parameter
        const newTab = window.open(`${window.location.href}?newTab=true`, '_blank');
        // Ensure the new tab is focused and scroll to footer
        if (newTab) {
            newTab.focus();
            // Use setTimeout as a fallback since load event may not work reliably
            setTimeout(() => {
                newTab.document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
            }, 2000); // 2-second delay to allow page load
        }
        // In the current tab, show warning and scroll to footer
        warning.style.display = "inline-block";
        setTimeout(() => {
            warning.style.display = "none";
        }, 5000); // Hide warning after 5 seconds
        footer.scrollIntoView({ behavior: "smooth" });
    });
});

// Event listener for second button (20s)
searchButtonAlt.addEventListener("click", (event) => {
    event.preventDefault();
    delayedGoogleSearch(countdown2, 20);
});

sidebar();

const getGenres = function (genreList) {
    const newGenreList = [];
    for (const { name } of genreList) newGenreList.push(name);
    return newGenreList.join(", ");
};

const getCasts = function (castList) {
    const newCastList = [];
    for (let i = 0, len = castList.length; i < len && i < 10; i++) {
        const { name } = castList[i];
        newCastList.push(name);
    }
    return newCastList.join(", ");
};

const getDirectors = function (crewList) {
    const directors = crewList.filter(({ job }) => job === "Director");
    const directorList = [];
    for (const { name } of directors) directorList.push(name);
    return directorList.join(", ");
};

const filterVideos = function (videoList) {
    return videoList.filter(
        ({ type, site }) => (type === "Trailer" || type === "Teaser") && site === "YouTube"
    );
};

fetchDataFromServer(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${api_key}&append_to_response=casts,videos,images,releases`,
    function (movie) {
        const {
            backdrop_path,
            poster_path,
            title,
            release_date,
            runtime,
            vote_average,
            releases: { countries: [{ certification }] },
            genres,
            overview,
            casts: { cast, crew },
            videos: { results: videos },
        } = movie;

        document.title = `${title} - Tvflix`;

        // Auto-populate search input with the current movie title
        searchInput.value = title;

        const movieDetail = document.createElement("div");
        movieDetail.classList.add("movie-detail");
        movieDetail.innerHTML = `
            <div 
                class="backdrop-image" 
                style="background-image: url('${imageBaseURL}${ "w1280" || "original" }${backdrop_path || poster_path}')">
            </div>
            <figure class="poster-box movie-poster">
                <img src="${imageBaseURL}w342${poster_path}" alt="${title} poster" class="img-cover" />
            </figure>
            <div class="detail-box">
                <div class="detail-content">
                    <h1 class="heading">${title}</h1>
                    <div class="meta-list">
                        <div class="meta-item">
                            <img src="./assets/images/star.png" width="20" height="20" alt="rating" />
                            <span class="span">${vote_average.toFixed(1)}</span>
                        </div>
                        <div class="separator"></div>
                        <div class="meta-item">${runtime}m</div>
                        <div class="separator"></div>
                        <div class="meta-item">${release_date.split("-")[0]}</div>
                        <div class="meta-item card-badge">${certification}</div>
                    </div>
                    <p class="genre">${getGenres(genres)}</p>
                    <p class="overview">${overview}</p>
                    <ul class="detail-list">
                        <div class="list-item">
                            <p class="list-name">Starring</p>
                            <p>${getCasts(cast)}</p>
                        </div>
                        <div class="list-item">
                            <p class="list-name">Directed By</p>
                            <p>${getDirectors(crew)}</p>
                        </div>
                    </ul>
                </div>
                <div class="title-wrapper">
                    <h3 class="title-large">Trailer and Clips</h3>
                </div>
                <div class="slider-list">
                    <div class="slider-inner"></div>
                </div>
            </div>
        `;

        for (const { key, name } of filterVideos(videos)) {
            const videoCard = document.createElement("div");
            videoCard.classList.add("video-card");
            videoCard.innerHTML = `
                <iframe width="500" height="294" src="https://www.youtube.com/embed/${key}?&theme=dark&color=white&rel=0" frameborder="0" allowfullscreen="1" title="${name}" class="img-cover" loading="lazy"></iframe>
            `;
            movieDetail.querySelector(".slider-inner").appendChild(videoCard);
        }

        pageContent.appendChild(movieDetail);

        fetchDataFromServer(
            `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${api_key}&page=1`,
            addSuggestedMovies
        );
    }
);

const addSuggestedMovies = function ({ results: movieList }) {
    const movieListElem = document.createElement("section");
    movieListElem.classList.add("movie-list");
    movieListElem.ariaLabel = "You May Also Like";
    movieListElem.innerHTML = `
        <div class="title-wrapper">
            <h3 class="title-large">You May Also Like</h3>
        </div>
        <div class="slider-list">
            <div class="slider-inner"></div>
        </div>
    `;

    for (const movie of movieList) {
        const movieCard = createMovieCard(movie);
        movieCard.addEventListener("click", () => {
            searchInput.value = movie.title;
            window.localStorage.setItem("movieId", movie.id);
            // window.location.reload(); // Uncomment if navigation is desired
        });
        movieListElem.querySelector(".slider-inner").appendChild(movieCard);
    }
    pageContent.appendChild(movieListElem);

    // Append footer after all content
    pageContent.appendChild(footer);
};