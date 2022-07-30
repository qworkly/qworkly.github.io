// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// placemaker stuff
import { getDatabase, ref, onValue } from 'firebase/database';
var placeList = null;
var metric = false;

// Document elements
const unitsButton = document.getElementById('units');

const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;
async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: 'AIzaSyCfPHmzqTxo-Ht_voZtQc4647zJCPw7mPE',
    authDomain: 'fir-web-codelab-9bce9.firebaseapp.com',
    projectId: 'fir-web-codelab-9bce9',
    storageBucket: 'fir-web-codelab-9bce9.appspot.com',
    messagingSenderId: '368265046194',
    appId: '1:368265046194:web:d838ab0daccc96d8f341ab',
    measurementId: 'G-RC726EWM77',
    // databaseURL: 'https://fir-web-codelab-9bce9-default-rtdb.firebaseio.com/',
    databaseURL: 'https://placemaker-cloud.firebaseio.com/', // placemaker development
  };

  // Make sure Firebase is initilized
  try {
    if (firebaseConfig && firebaseConfig.apiKey) {
      initializeApp(firebaseConfig);
    }
    auth = getAuth();

    // firebase database testcode
    // get the value at l/75E31E70-EBDC-4289-A987-69EBBD587A75
    // current testing url https://firebase-gtk-web-start-s9mpbe.stackblitz.io/?list=4882AEAA-B779-40AF-859F-755033AB00A3
    // https://js-nt5udq.stackblitz.io/?list=4882AEAA-B779-40AF-859F-755033AB00A3

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let listUUID = urlParams.get('list');
    /*
    console.log('queryString');
    console.log(queryString);
    console.log(listUUID);
    */

    const db = getDatabase();
    const listLocation = 'l/' + listUUID;
    const testRef = ref(db, listLocation);
    onValue(testRef, (snapshot) => {
      placeList = snapshot.val();
      updateTable();
      console.log('placeList');
      console.log(placeList);
    });
  } catch (e) {
    console.log('error:', e);
    document.getElementById('app').innerHTML =
      '<h1>Welcome to the Codelab! Add your Firebase config object to <pre>/index.js</pre> and refresh to get started</h1>';
    throw new Error(
      'Welcome to the Codelab! Add your Firebase config object from the Firebase Console to `/index.js` and refresh to get started'
    );
  }

  function updateTable() {
    const listHTML = getListHTML();
    document.getElementById('guestbook-container').innerHTML = listHTML;
  }

  function getPlace(placeUUID) {
    const places = placeList.d.p;
    const place = places[placeUUID];
    console.log('Place:');
    console.log(place);
    return place;
  }

  function getListHTML() {
    const items = placeList.d.i;
    let returnString = '';
    returnString += '<table class="list-table">';
    returnString += '<thead>';
    returnString += '<tr>';
    returnString += '<th class="number">Number</th>';
    returnString += '<th class="stop">Stop</th>';
    returnString += '<th class="checked">Checked</th>';
    returnString += '<th class="time-and-distance">Time &<br>Distance</th>';
    returnString += '</tr>';
    returnString += '</thead>';
    returnString += '<tbody>';

    let itemLength = items.length;
    for (var i = 0; i < itemLength; i++) {
      returnString += '<tr>';
      returnString += '<td class="number">' + (i + 1) + '.</td>';
      returnString += getPlaceHTMLSnippet(items[i].p);
      returnString +=
        '<td class="checked">' + getStopCheckedHTMLSnipped(i) + '</td>';
      returnString +=
        '<td class="time-and-distance">' +
        getStopDistanceAndTravelTime(i) +
        '</td>';
      returnString += '</tr>';
    }
    returnString += '</tbody>';
    returnString += '</table>';
    return returnString;
  }

  function getPlaceHTMLSnippet(place_uuid) {
    var returnString = '';
    const place = getPlace(place_uuid);
    returnString += '<td class="stop">';
    returnString += place.n + '<br>';
    returnString += place.a + '<br>';
    if (place.o != null) {
      returnString += 'Notes: ' + place.o + '<br>';
    }
    if (place.f != null) {
      returnString += 'Phone: ' + place.f + '<br>';
    }
    if (place.h != null) {
      returnString += 'Hours or Tracking Number: ' + place.h + '<br>';
    }
    if (place.w != null) {
      returnString +=
        'Website: <a href="' + place.w + '">' + place.w + '</a><br>';
    }
    returnString += '</td>';
    return returnString;
  }

  function getStopCheckedHTMLSnipped(i) {
    if (isStopChecked(i)) {
      const checkedTimeLocalString = getStopCheckedTime(i);
      return 'Checked<br>' + checkedTimeLocalString;
    } else {
      return '';
    }
  }

  function isStopChecked(i) {
    const comments = placeList.c;
    if (i >= 0 && i < comments.length) {
      const checked = comments[i].c;
      if (checked == true) {
        return true;
      }
    }
    return false;
  }

  function getStopDistanceAndTravelTime(i) {
    const itemArray = placeList.d.i;
    var returnString = '';
    if (i >= 0 && i < itemArray.length) {
      if (i == 0) {
        return 'Start';
      }
      const travelDistance = itemArray[i].d;
      if (metric) {
        returnString += getDistanceHTMLSnippetInKM(travelDistance);
      } else {
        returnString += getDistanceHTMLSnippetInMiles(travelDistance);
      }
      const travelTime = itemArray[i].t;
      const hours = Math.floor(travelTime / 3600);
      if (hours > 0) {
        returnString += hours + 'h ';
      }
      const minutes = Math.round((travelTime % 3600) / 60);
      returnString += minutes + 'm';
    }
    return returnString;
  }

  function getDistanceHTMLSnippetInMiles(travelDistance) {
    var returnString = '';
    const distanceInMiles = travelDistance / 1609.34;
    if (distanceInMiles > 100) {
      // return integer
      const distanceInMilesRounded = Math.round(distanceInMiles);
      returnString +=
        distanceInMilesRounded.toLocaleString('en-US') + ' mi<br>';
    } else if (distanceInMiles >= 0.2) {
      // xxx.x
      const distanceInMilesRoundedToTenths =
        Math.round(distanceInMiles * 10) / 10;
      returnString += distanceInMilesRoundedToTenths + ' mi<br>';
    } else {
      const distanceInFeet = travelDistance * 3.28084;
      const distanceInFeetString = Math.round(distanceInFeet);
      returnString += distanceInFeetString + ' ft<br>';
    }
    return returnString;
  }

  function getDistanceHTMLSnippetInKM(travelDistance) {
    var returnString = '';
    const distanceInKM = travelDistance / 1000;
    if (distanceInKM > 100) {
      // return integer
      const distanceInKMRounded = Math.round(distanceInKM);
      returnString += distanceInKMRounded.toLocaleString('en-US') + ' km<br>';
    } else if (distanceInKM >= 0.5) {
      // xxx.x
      const distanceInKMRoundedToTenths = Math.round(distanceInKM * 10) / 10;
      returnString += distanceInKMRoundedToTenths + ' km<br>';
    } else {
      const distanceInMetersString = Math.round(travelDistance);
      returnString += distanceInMetersString + ' m<br>';
    }
    return returnString;
  }

  function getStopCheckedTime(i) {
    const extendedAttributes = placeList.d.x.i;
    if (i >= 0 && i < extendedAttributes.length) {
      const checkedArray = extendedAttributes[i];
      const eventArray = checkedArray.el;
      if (eventArray[eventArray.length - 1]) {
        const lastEvent = eventArray[eventArray.length - 1];
        const lastUnixTimeStamp = lastEvent.d;
        console.log(lastUnixTimeStamp);
        const dt = new Date(lastUnixTimeStamp).toLocaleString();
        return dt;
      }
    }
    return '';
  }

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  // Initialize the FirebaseUI widget using Firebase
  const ui = new firebaseui.auth.AuthUI(getAuth());

  // Listen to RSVP button clicks
  unitsButton.addEventListener('click', () => {
    metric = !metric;
    if (metric) {
      unitsButton.textContent = 'miles';
    } else {
      unitsButton.textContent = 'km';
    }
    updateTable();
  });
}
main();
