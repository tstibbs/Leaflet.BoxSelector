L.Control.BoxSelector.Actions.gpx = function(fileName) {
	return function(markers) {
		var output = '';
		output += '<?xml version="1.0" encoding="UTF-8"?>';
		output += '\n<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
		for (var i = 0; i < markers.length; i++) {
			var lat = markers[i].getLatLng().lat;
			var lng = markers[i].getLatLng().lng;
			var name = markers[i].name;
			output += '\n    <wpt lat="' + lat + '" lon="' + lng + '">';
			output += '\n        <name>' + name + '</name>';
			output += '\n    </wpt>';
		}
		output += '\n</gpx>';

		var blob = new Blob([output], {type: "application/gpx+xml;charset=utf-8"});
		saveAs(blob, fileName); // requires https://unpkg.com/file-saver@1.3.3/FileSaver.min.js
	}
}
