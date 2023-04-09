'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');
const btnMenu = document.querySelector('.menu');
const btnLine = document.querySelector('.btn__menu');
const btnCheckbox = document.querySelector('.btn__check');

// /////////////////////////////////////////////////////////////////////////////////

// console.log(btn);

// function revealSidebar() {
// }
// btnMenu.addEventListener('click', revealSidebar);
// /////////////////////////////////////////////////////////////////////////////////
class Workut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  // to check error of local storage
  // click = 0;
  // clicks() {
  //   this.click++;
  // }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
    return this.pace;
  }
}

class Cycling extends Workut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
    return this.speed;
  }
}

/////////////////////////////////////////////////
// APPLICATION ARCHETECTURE/////////////////////
class App {
  #map;
  #mEvent;
  #zoomLevel = 15;
  #workouts = [];
  constructor() {
    // Set to initial position
    this._getposition();

    // Load data from local storage
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._goToWorkout.bind(this));
  }

  // GET POSITION/////////////////////////////////////////////////////
  _getposition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      alert(`Can't load map without permission`);
    });
  }

  // LOAD MAP/////////////////////////////////////////////////////////
  _loadMap(position) {
    const { latitude: lat, longitude: lng } = position.coords;
    const cords = [lat, lng];

    this.#map = L.map('map').setView(cords, this.#zoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // Show existing Data
    this.#workouts.forEach(wo => this._setMarker(wo));
  }

  // FORM TOGGLE////////////////////////////////////////////////////
  _showForm(mapE) {
    // ***************************************************************
    btnCheckbox.checked = true;
    // ***************************************************************
    this.#mEvent = mapE;
    form.style.display = 'grid';
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputElevation.value =
      inputCadence.value =
      inputDuration.value =
      inputDistance.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
  }

  // SWITCH BW RUNNING AND CICLING/////////////////////////////////
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // ADD WORKOUT FORM Visible//////////////////////////////////////
  _newWorkout(e) {
    e.preventDefault();

    const inputValid = function (...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    };
    const posNum = (...inputs) => inputs.every(inp => inp > 0);

    // Take Values form Fields
    const workoutType = inputType.value;
    const distanceValue = +inputDistance.value;
    const durationValue = +inputDuration.value;
    const elevationValue = +inputElevation.value;
    const cadenceValue = +inputCadence.value;
    const { lat, lng } = this.#mEvent.latlng;
    let workout;

    // Workout is Cycling
    if (workoutType === 'cycling') {
      const elevationGain = +elevationValue;

      // Checking Input elevation
      if (
        !inputValid(distanceValue, durationValue, elevationGain) ||
        !posNum(distanceValue, durationValue)
      )
        return alert(`Pelese Enter a valid positive number`);

      // create object for cycling
      workout = new Cycling(
        [lat, lng],
        distanceValue,
        durationValue,
        elevationGain
      );

      // push workout in workouts array
      this.#workouts.push(workout);
      // Ste Marker on the Map
      this._setMarker(workout);
    }

    // Workout is running
    if (workoutType === 'running') {
      const cadence = +cadenceValue;

      // Check Input cadance
      if (
        !inputValid(distanceValue, durationValue, cadence) ||
        !posNum(distanceValue, durationValue, cadence)
      )
        return alert(`Pelese Enter a valid positive number`);

      // create object for cycling
      workout = new Running([lat, lng], distanceValue, durationValue, cadence);

      // push workout in workouts array
      this.#workouts.push(workout);
      // Ste Marker on the Map
      this._setMarker(workout);
    }

    //rander Workout
    this._randerWorkout(workout);

    // Clear Input fields + hide form
    this._hideForm();

    // Add data to local storage
    this._setLocalStorage();
  }

  _setMarker(wo) {
    const cords = wo.coords;
    L.marker(cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          minWidth: 100,
          maxWidth: 250,
          className: `${wo.type}-popup`,
        })
      )
      .setPopupContent(
        `${wo.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${wo.description}`
      )
      .openPopup();
  }

  // RanderWorkout Function
  _randerWorkout(wo) {
    let html = `
        <li class="workout workout--${wo.type}" data-id=${wo.id}>
        <h2 class="workout__title">${wo.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            wo.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${wo.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${wo.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (wo.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${wo.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${wo.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    if (wo.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${wo.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${wo.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  // GO TOT WORKOUT/////////////////////////////////////////
  _goToWorkout(e) {
    // if (!e.target.children.classList.contains('workout')) return;
    let workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(wo => wo.id === workoutEl.dataset.id);
    // console.log(workout.coords);

    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.clicks();
  }

  // Store data in local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Load data in local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    // console.log(this.#workouts);
    this.#workouts.forEach(wo => this._randerWorkout(wo));
  }

  resetLocalstorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
