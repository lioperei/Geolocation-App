var R = 6367;
var id = 0;

self.addEventListener('message', function(e) {
  if (e.data.reset){
    id = 0
    return;
  }
  let cur = e.data.currentPosition;
  let location = e.data.location;
  let dlon = toRad(location.lng - cur.lng);
  let dlat = toRad(location.lat - cur.lat);
  let a = Math.sin(dlat/2) * Math.sin(dlat/2) + 
          Math.cos(toRad(cur.lat)) * Math.cos(toRad(location.lat)) * 
          Math.sin(dlon/2) * Math.sin(dlon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt( 1 - a ));
  let d = R * c;
  self.postMessage({'pos': `${d.toFixed(2)}`, 'id': id++});
}, false);

function toRad(x) {
  return x * Math.PI / 100;
}