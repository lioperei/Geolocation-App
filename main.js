var currentPosition = {};
var dropPositions = [];
var cur;
var map;
var overlay;
var error;
var distance;
var details;

window.onload = function () {
  initialize();
}

function initialize() {
  cur = document.getElementById('current');
  overlay = document.getElementById('overlay');
  error = document.getElementById('uploadError');
  document.getElementById('go').addEventListener('click', goClick);
  details = document.getElementById('details');
  getCurrentLocation();
  distance = new Worker('distance.js');
  distance.addEventListener('message', function(e) {
    showDistance(e.data);
  }, false);
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      currentPosition.lat = position.coords.latitude;
      currentPosition.lng = position.coords.longitude;
      error.textContent = '';
      showLocation(currentPosition);
      getLocationDetails([currentPosition], true);
    }, () => {
      error.textContent = 'Geolocation declined';  
    })
  } else {
    cur.innerHTML = 'Geolocation is not supported by this browser';
  }
}

function goClick() {
  let latVal = parseFloat(document.getElementById('lat').value);
  let lngVal = parseFloat(document.getElementById('lng').value);
  if (latVal && lngVal) {
    if (latVal < -90 || lat > 90 || lngVal < -180 || lngVal > 180) {
      error.textContent = 'Invalid latitude or longitude value';
    } else {
      currentPosition.lat = latVal;
      currentPosition.lng = lngVal;
      showLocation(currentPosition);
    }
  } else {
    error.textContent = 'Please enter in a number';
  }
}

function showLocation(location) {
  map = new google.maps.Map(document.getElementById('map'), {
    center: location,
    zoom: 12
  });
  addMarker(location);
}

function addMarker(pos) {
  new google.maps.Marker({
    position: pos,
    map: map
  });
}

function getDistance(position){
  distance.postMessage({currentPosition, 'location': position});
}

function showDistance(data){
  let d = document.getElementById('distance');
  d.textContent = `Distance between current and dropped location is ${data} km`;
}

function dropHandler(ev) {
  ev.preventDefault();
  overlay.style['display'] = 'none';
  let m =  document.getElementById('map');
  m.style['boxShadow'] = 'none';
  let error = document.getElementById('uploadError');
  error.textContent = '';
  let file;
  if (ev.dataTransfer.items) {
    if (ev.dataTransfer.items[0].kind === 'file') {
      file = ev.dataTransfer.items[0].getAsFile();
    }
  } else {
    if (ev.dataTransfer.files.length >= 1) {
      file = ev.dataTransfer.files[0];
    }
  }
  if (file && file.type === 'text/plain') {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      let reader = new FileReader();
      reader.onload = (function(f) {
          return function(event) {
            let positions = new Array();
            let contents = event.target.result;
            let lines = contents.split('\n');
            lines.forEach(line => {
              if(line.length > 0){
                let coords = line.replace(/\s/g,'').split(',');
                let pos = {'lat': parseFloat(coords[0]), 'lng': parseFloat(coords[1])};
                positions.push(pos);
                addMarker(pos);
              }
            });
            getLocationDetails(positions, false);
            getDistance(positions[0]);
            dropPositions.concat(positions);
          };
        })(file);
      reader.readAsText(file);
    } else {
      error.textContent('The File APIs are not fully supported in this browser.');
    }
  } else {
    error.textContent = 'Please drop a text file';
  }
}

function getLocationDetails(positions, current) {
  positions.forEach(pos => {
    let xhr = new XMLHttpRequest();
    let requestString = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1`;
    xhr.onreadystatechange = function () { renderDetails(this, current) };
    xhr.open('GET', requestString, true);
    xhr.send();
  });
}

function renderDetails(xhr, current) {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      let place = JSON.parse(xhr.responseText);
      let parent;
      if (current) {
        parent = document.getElementById('currentPosition');
        parent.innerHTML = "";
        let header = document.createElement('h3');
        header.textContent = "Current Position";
        parent.appendChild(header);
      } else {
        parent = document.getElementById('drop');
        if ( parent.childElementCount == 0) {
          let dropContainer = document.getElementById('dropPositions');
          let header = document.getElementById('dropHeader');
          header.textContent = "Dropped Position(s)";
          dropContainer.appendChild(header);
        }
      }
      let list = document.createElement('ul')
      Object.keys(place.address).map( function(key) {
        let li = document.createElement('li');
        let title = key.replace('_', ' ').split(' ').map(function(x) {
          return x.charAt(0).toUpperCase() + x.slice(1);
        }).join(' ');
        li.innerHTML = `<b>${title}</b>: ${place.address[key]}`;
        list.appendChild(li);
      });
      parent.appendChild(list);
    } else {
      error.textContent = "Error retrieving details";
    }
  }
}

function dragEnterHandler(ev) {
  ev.preventDefault();
  overlay.style['display'] = 'block';
}

function dragLeaveHandler(ev) {
  ev.preventDefault();
  overlay.style['display'] = 'none';
}

function dragOverHandler(ev) {
  ev.preventDefault();
}

function dragEnterDefault(ev) {
  ev.preventDefault();
}

function dragEnterDropzone(ev) {
  ev.preventDefault;
  let map = document.getElementById('map');
  map.style['box-shadow'] = '0px 0px 27px 0px rgba(0,0,0,0.75)';
}

function dragLeaveDropzone(ev) {
  ev.preventDefault;
  let map = document.getElementById('map');
  map.style['box-shadow'] = 'none';
}
