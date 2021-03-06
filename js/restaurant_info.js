let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap();
  makeGeneratedHtmlAccessible();
  const reviewForm = document.querySelector("#review-form");
  reviewForm.addEventListener("submit", submitReviewForm);
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    const root = "/mws-restaurant-app/";
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        window.location = root;
        alert("oops, something went wrong");
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.className = "restaurant-img";
  let imageurl = DBHelper.imageUrlForRestaurant(restaurant).split(".jpg");
  image_400_1x = imageurl[0] + "-400_1x." + "jpg";
  image_400_2x = imageurl[0] + "-400_2x." + "jpg";
  image_800_1x = imageurl[0] + "-800_1x." + "jpg";
  image_800_2x = imageurl[0] + "-800_2x." + "jpg";
  image.src = image_400_1x;
  image.srcset = `${image_400_1x} 400w, ${image_400_2x} 400w, ${image_800_1x} 800w, ${image_800_2x} 1600w`;
  image.alt = `${restaurant.name} display`;
  image.tabIndex = 0;

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  makeGeneratedHtmlAccessible();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
// fillReviewsHTML = (reviews = self.restaurant.reviews) => {
fillReviewsHTML = () => {
  let reviews;
  DBHelper.fetchReviewsById(self.restaurant.id).then(res => {
    reviews = res;
    const container = document.getElementById("reviews-container");
    const title = document.createElement("h2");
    title.innerHTML = "Reviews";
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement("p");
      noReviews.innerHTML = "No reviews yet!";
      noReviews.classList.add('no-reviews')
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById("reviews-list");
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, isOffline = false) => {
  const li = document.createElement("li");
  const div = document.createElement("div");
  div.classList.add("greyed-out-review");
    if(isOffline){
      div.classList.add("offline");
    }
  li.appendChild(div);

  const name = document.createElement("p");
  name.innerHTML = review.name;
  div.appendChild(name);

  const date = document.createElement("p");
  date.innerHTML = getDateString(review.updatedAt);
  // date.innerHTML = review.dateString;
  div.appendChild(date);

  const rating = document.createElement("p");
  rating.classList.add("yellow-rating");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 * Make generated html accessible
 */

makeGeneratedHtmlAccessible = () => {
  const elements = document.querySelectorAll(
    "nav, li, p, h1, h2, h3, h4, h5, h6, tr, footer"
  );
  return elements.forEach(el => (el.tabIndex = 0));
};

const submitReviewForm = e => {
  e.preventDefault();
  const name = e.target.name.value;
  const rating = e.target.rating.value;
  const comments = e.target.comments.value;
  if(!name || !rating || !comments){
    alert('Review form is incomplete')
    return;
  } else {
    e.target.name.value = '';
    e.target.rating.value = '';
    e.target.comments.value = '';
  }
  const review = { restaurant_id: self.restaurant.id, name, rating, comments };

  //if offline save and wait for a network connection to be established
  if(!navigator.onLine){
    return DBHelper.addRestaurantReviewOffline(review).then(review => addReviewHtmlToDom(review, true))
  }

  DBHelper.addRestaurantReview(review).then(addReviewHtmlToDom);
  // window.location = `/restaurant.html?id=${self.restaurant.id}`;
};

const getDateString = date => {
  const dateObject = new Date(date);
  const getMonthString = (month) => {
    switch (month) {
      case 1:
        return "January";
      case 2:
        return "February";
      case 3:
        return "March";
      case 4:
        return "April";
      case 5:
        return "May";
      case 6:
        return "June";
      case 7:
        return "July";
      case 8:
        return "August";
      case 9:
        return "September";
      case 10:
        return "October";
      case 11:
        return "November";
      case 12:
        return "December";
      default:
        return "";
    }
  };
  return `${getMonthString(dateObject.getMonth())} ${dateObject.getDate()}, ${dateObject.getFullYear()}`;
};

const addReviewHtmlToDom = (review, isOffline=false) => {
  review = {...review, updatedAt: Date.now()}
  const newReview = createReviewHTML(review, isOffline);
  const noReviews = document.querySelector('.no-reviews');
  if(noReviews){
    noReviews.remove();
  }

  const reviewsContainer = document.querySelector('#reviews-container');
  const reviewsList = document.querySelector('#reviews-list');

  reviewsList.insertBefore(newReview, reviewsList.firstChild);
  reviewsContainer.appendChild(reviewsList);
}