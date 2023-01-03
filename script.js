'use strict';

// let map, mapEvent;
class Workout{
    date=new Date();
    id=(Date().now + '').slice(-10);
    clicks=0;

    constructor(coords, distance, duration){
        this.coords=coords;
        this.distance=distance;
        this.duration=duration;
    }

    _setDescription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    
    }

    // click(){
    //     this.clicks++;
    // }
}

class Running extends Workout{
    type='running';

    constructor(coords,distance,duration,cadence){
        super(coords, distance, duration);
        this.cadence=cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        this.pace=this.duration/this.distance;

        return this.pace;
    }
}

class Cycling extends Workout{
    type='cycling';

    constructor(coords,distance,duration,elevationGain){
        super(coords, distance, duration);
        this.elevationGain=elevationGain;

        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed=this.distance/(this.duration/60);

        return this.speed;
    }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App{
    #map;
    #mapZoomLevel=13;
    #mapEvent;
    #workouts=[];

    constructor(){
        //get user's position
        this._getPositon();

        //get daa from local storage
        this._getLocalStorage();

        //bind this binds a menthod with current object
        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change', this.toggleEventField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPositon(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),() => {
                    alert('Could not get your position');
                });
        }
    }

    _loadMap(position){
        // const latitude=position.coords.latitude;
        // we can use another way as shown below to create 
        // a variable based on the latitude/longitude property of coords object
        const { latitude } = position.coords;
        const { longitude } = position.coords;

        //to check if we're getting the correct coordinates
        // console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);


        //handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
          });
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        //empty inputs
        inputDuration.value=inputCadence.value=inputDistance.value=inputElevation.value='';

        //hide form
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(()=>{form.style.display='grid'}, 1000)
    }

    toggleEventField(){
        //toggle form__row--hidden class name between cadence and elevation
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        
        const validInputs=(...inputs)=>
            inputs.every(inp=>Number.isFinite(inp));
        
        const allPositive=(...inputs)=>inputs.every(inp=>inp>0);

        //prevent default behaviour of reloading
        e.preventDefault();

        //get data from the form  
        //to get value in number and not string we put +
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng}=this.#mapEvent.latlng;
        let workout;

        //if workout is running, create a running object
        if(type==='running'){
            const cadence=+inputCadence.value;

            if(
                // !Number.isFinite(distance)||
                // !Number.isFinite(duration)||
                // !Number.isFinite(cadence)||
                !validInputs(distance,duration,cadence)
                || !allPositive(distance,duration,cadence)
            )
              return alert('Inputs have to be postive numbers!');
        
            workout=new Running({lat,lng},distance,duration,cadence);
            
        }

        //if workout is cycling, create a running object
        if(type==='cycling'){
            const elevation=+inputElevation.value;

            if(
              !validInputs(distance,duration,elevation) || 
              !allPositive(distance,duration)
            )
              return alert('Inputs have to be postive numbers!');
        
            workout=new Cycling({lat,lng},distance,duration,elevation)
        }

        //Add new object to workout array
        this.#workouts.push(workout);

        //render workout on map as a marker
        this._renderWorkoutMarker(workout);

        //render workout on list
        this._renderWorkout(workout);

        //clear input fileds + hide form
        this._hideForm();

        // console.log(mapEvent);
        
        this._setLocalStorage();
    }

            
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth:250,
                minWidth:100,
                autoClose:false,
                closeOnClick:false,
                className:`${workout.type}-popup`
            })
        ).setPopupContent(
            `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
        )
        .openPopup();
    }

    _renderWorkout(workout){
        let html=`
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${
                    workout.type==='running'?'🏃‍♂️':'🚴‍♀️'
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

        if(workout.type==='running'){
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }

        if(workout.type==='cycling'){
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;
        }

        form.insertAdjacentHTML('afterend',html);
    }

    _moveToPopup(e){
        // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
        if (!this.#map) return;

        //get the workout element
        const workoutEl=e.target.closest('.workout');
        
        if(!workoutEl) return;

        //find the particular element in workout array with id we get from workoutEl
        const workout = this.#workouts.find(
            work=>work.id===workoutEl.dataset.id
        );

        this.#map.setView(workout.coords,this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        // console.log(workout)
        //using the public interface
        // workout.click();
    }

    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        console.log(data)

        if(!data) return;

        this.#workouts=data;

        this.#workouts.forEach(work=>{
            this._renderWorkout(work);
        });
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app= new App();