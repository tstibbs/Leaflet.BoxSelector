import saveAs from 'file-saver';

export function gpx(fileName) {
    return function(markers) {
        var output = '';
        output += '<?xml version="1.0" encoding="UTF-8"?>';
        output += '\n<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
        for (var i = 0; i < markers.length; i++) {
            var lat = markers[i].getLatLng().lat;
            var lng = markers[i].getLatLng().lng;
				var name = markers[i].name;//for backwards compatibility
            var exportData = markers[i].exportData;
            var link = null;
            var cmt = null;
            var desc = null;
            if (exportData != null) {
                if (exportData.name != null) {
						name = exportData.name
                }
                link = exportData.link;
                cmt = exportData.cmt;
                desc = exportData.desc;
            }
            output += '\n    <wpt lat="' + lat + '" lon="' + lng + '">';
            output += '\n        <name>' + name + '</name>';
            if (link != null) {
                output += '\n        <link href="' + link.replace(/"/g, "'") + '" />';
            }
            if (cmt != null) {
                output += '\n        <cmt>' + cmt + '</cmt>';
            }
            if (desc != null) {
                output += '\n        <desc>' + desc + '</desc>';
            }
            output += '\n    </wpt>';
        }
        output += '\n</gpx>';

        var blob = new Blob([output], {type: "application/gpx+xml;charset=utf-8"});
        if (typeof fileName === 'function') {
            fileName = fileName();
        }
        saveAs(blob, fileName);
    };
}
