let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
    {
      mapboxToken:
        "pk.eyJ1IjoiZWxveWphd3MiLCJhIjoiY2psMXJ4NGlxMWU1ajNwbnd0aHZrZnZoZCJ9.yjkB16je6xcCMc6P_vfpeQ",
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox.streets"
    }
  ).addTo(newMap);

  updateRestaurants();
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  makeGeneratedHtmlAccessible();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const div = document.createElement("div");
  div.style.position = "relative";

  const image = document.createElement("img");
  image.src = 'img/undefined-400_1x.jpg'
  image.className = "restaurant-img";
  const options = {
    threshold: 0.3
  }
  const loadImage = () => {
  let imageurl = DBHelper.imageUrlForRestaurant(restaurant).split(".jpg");
  image_400_1x = imageurl[0] + "-400_1x." + "jpg";
  image_400_2x = imageurl[0] + "-400_2x." + "jpg";
  image_800_1x = imageurl[0] + "-800_1x." + "jpg";
  image_800_2x = imageurl[0] + "-800_2x." + "jpg";
  image.src = `${imageurl[0]}-800_1x.jpg`;
  image.srcset = `${image_400_1x} 400w, ${image_400_2x} 400w, ${image_800_1x} 800w, ${image_800_2x} 1600w`;
  }

  const handleIntersection = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0){
        loadImage(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }

  let observer;
  if (window.IntersectionObserver){
    observer = new IntersectionObserver(handleIntersection, options);
    observer.observe(image);
  } else {
    loadImage(image);
  }

  
  image.alt = `${restaurant.name} display`;
  image.tabIndex = 0;
  li.append(div);
  div.append(image);

  
  const name = document.createElement("p");
  name.innerHTML = restaurant.name;
  name.classList.add("name");
  li.append(name);

  const likeButton = document.createElement('button');
  likeButton.innerHTML = '❤';
  likeButton.classList.add('like-button');
  if(restaurant.is_favorite === 'true'){
    likeButton.classList.add('liked');
    likeButton.setAttribute('aria-label', 'Click to like')
  } else {
    likeButton.classList.remove('liked');
    likeButton.setAttribute('aria-label', 'Click to unlike')
  }
  likeButton.dataset.restaurantId = restaurant.id;
  likeButton.addEventListener('click', toggleLike);
  div.appendChild(likeButton);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("button");
  more.classList.add('details--button')
  more.innerHTML = "View Details";
  more.onclick = () => {
    const href = DBHelper.urlForRestaurant(restaurant);
    window.location = href;
  };
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

/**
 * Make generated html accessible
 */

makeGeneratedHtmlAccessible = () => {
  const elements = document.querySelectorAll(
    "nav, li, p, h1, h2, h3, h4, h5, h6, tr, footer"
  );
  return elements.forEach(el => (el.tabIndex = 0));
};


/**
 * Toggle like for all buttons
 */
toggleLike = (e) => {
  const restaurantId = e.target.dataset.restaurantId;
  const isLiked = e.target.classList.contains('liked');
  DBHelper.likeRestaurant(restaurantId, !isLiked).then(res => {
    if(res && !isLiked){
      e.target.classList.add('liked');
    } else {
      e.target.classList.remove('liked')
    }
  })
}






