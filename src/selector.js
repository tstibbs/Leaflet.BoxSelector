L.Map.BoxSelector = L.Control.extend({
	initialize: function (map) {
	},
	
	onAdd: function (map) {
		this._map = map;
		this._mapcontainer = map._container;
		this._pane = map._panes.overlayPane;
		this._addHooks();
		
		//set up icon
		var container = L.DomUtil.create('div', 'leaflet-control-box-selector leaflet-bar leaflet-control');
		this._toggle = L.DomUtil.create('input', 'leaflet-bar-part leaflet-bar-part-single', container);
		this._toggle.type = 'checkbox';
		this._toggle.selected = false;
		this._toggle.value = false;
		var label = L.DomUtil.create('span', null, container);
		label.innerHTML = 'Selection enabled';

		//
		L.DomEvent.on(this._toggle, 'click', this._onInputClick, this);

		//ensure we tear down		
		this._map.on('unload', this._removeHooks, this);
		
		return container;
	},

	_addHooks: function () {
		L.DomEvent.on(this._mapcontainer, 'mousedown', this._onMouseDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(this._mapcontainer, 'mousedown', this._onMouseDown, this);
	},

	_onInputClick: function() {
		if (this._isEnabled()) {
			map.dragging.disable();
		} else {
			map.dragging.enable();
		}
	},
	
	_isEnabled: function() {
		return this._toggle.checked;
	},
	
	_setEnabled: function(enabled) {
		this._toggle.checked = enabled;
	},

	moved: function () {
		return this._moved;
	},

	_resetState: function () {
		this._moved = false;
	},

	_onMouseDown: function (e) {
		if (!this._isEnabled() || (e.button !== 0)) {
			console.log("drag");
			return false;
		} else {
			console.log("selection");
		}

		this._resetState();

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		L.DomEvent.on(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._moved = true;

			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._mapcontainer);
			L.DomUtil.addClass(this._mapcontainer, 'leaflet-crosshair');
		}

		this._point = this._map.mouseEventToContainerPoint(e);

		var bounds = new L.Bounds(this._point, this._startPoint),
		    size = bounds.getSize();

		L.DomUtil.setPosition(this._box, bounds.min);

		this._box.style.width  = size.x + 'px';
		this._box.style.height = size.y + 'px';
	},

	_finish: function () {
		if (this._moved) {
			L.DomUtil.remove(this._box);
			L.DomUtil.removeClass(this._mapcontainer, 'leaflet-crosshair');
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent.off(document, {
			contextmenu: L.DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},

	_onMouseUp: function (e) {
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();

		if (!this._moved) { return; }
		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		setTimeout(L.bind(this._resetState, this), 0);

		var bounds = new L.LatLngBounds(
		        this._map.containerPointToLatLng(this._startPoint),
		        this._map.containerPointToLatLng(this._point));

		this._enumerateMarkers(bounds, map._layers, function(marker) {
			if (this._allSelectedMarkers == null) {
				this._allSelectedMarkers = {};
			}
			var key = L.Util.stamp(marker);
			this._allSelectedMarkers[key] = marker; //may already be there, but just override it
		}.bind(this));
		console.log(this.getSelectedMarkers());
	},

	_enumerateMarkers: function(bounds, layers, action) {
		Object.keys(layers).forEach(function (key) {
			var layer = layers[key];
			if (layer instanceof L.Marker) {
				if (bounds.contains(layer.getLatLng())) {
					action(layer);
				}
			} else if (layer._layers != undefined) {
				this._enumerateMarkers(bounds, layer._layers, action);
			}
		}, this);
	},

	getSelectedMarkers: function() {
		var markers = Object.keys(this._allSelectedMarkers).sort().map(function(markerId) { //sort is just so the order is predictable, makes debugging easier
			return this._allSelectedMarkers[markerId];
		}.bind(this));
		return markers;
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});
