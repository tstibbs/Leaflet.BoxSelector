var group = new L.LayerGroup();

var markers = [
	[51.503984, -0.118253],
	[51.497466, -0.124905],
	[51.506061, -0.116966],
	[51.499102, -0.124648],
	[51.503797, -0.143649],
	[51.530535, -0.153362],
	[51.500784, -0.143052],
	[51.497770, -0.101477]
];

markers.forEach(function(element) {
	L.marker(element).addTo(group);
});

// var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	// attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
// });

var map = L.map('map', {
	center: [51.515, -0.13],
	zoom: 13,
	layers: [/*streets,*/ group],
	boxZoom: false
});

(new L.Map.BoxSelector()).addTo(map);
