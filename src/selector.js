L.Map.BoxSelector = L.Control.extend({
	options: {
		actions: {
			alert: function(selectedMarkers) {
				var output = "";
				for (var i = 0; i < selectedMarkers.length; i++) {
					output += selectedMarkers[i]._leaflet_id;//.getLatLng();
					output += ",\n";
				}
				alert(output);
			}
		}
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},
	
	onAdd: function (map) {
		this._map = map;
		this._mapcontainer = map._container;
		this._pane = map._panes.overlayPane;
		this._addHooks();
		
		//set up select icon
		var container = L.DomUtil.create('div', 'leaflet-control-box-selector leaflet-bar leaflet-control boxselector-control');
		this._toggleElement = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single boxselector-icon', container);
		this._toggleElement.href = '#';
		var iconWrapper = L.DomUtil.create('div', 'icon-wrapper', this._toggleElement);
		var icon = L.DomUtil.create('div', 'icon', iconWrapper);
		
		//set up dropdown icon
		var dropdownButton = L.DomUtil.create('div', 'boxselector-dropdown-button', container);
		var dropdownIcon = L.DomUtil.create('span', '', dropdownButton);
		dropdownIcon.innerHTML = 'V';
		L.DomEvent.on(dropdownButton, 'click', this.expandCollapse, this)
		
		//set up drop down (hidden to start with)
		this._expanded = false;
		this._dropdown = L.DomUtil.create('div', 'boxselector-dropdown boxselector-dropdown-hidden', container);
		for (var actionId in this.options.actions) {
			var dropdownEntry = L.DomUtil.create('div', 'boxselector-dropdown-entry', this._dropdown);
			dropdownEntry.actionId = actionId;
			var label = L.DomUtil.create('span', '', dropdownEntry);
			label.innerHTML = actionId;
			label.actionId = actionId;

			L.DomEvent.on(dropdownEntry, 'click', this._actionItemClick, this);
		}
		
		L.DomEvent.on(this._toggleElement, 'click', this._toggle, this);

		//ensure we tear down		
		this._map.on('unload', this._removeHooks, this);
		
		return container;
	},
	
	expandCollapse: function() {
		if (this._expanded) {
			L.DomUtil.addClass(this._dropdown, 'boxselector-dropdown-hidden');
			L.DomUtil.removeClass(this._dropdown, 'boxselector-dropdown-expanded');
			this._expanded = false;
		} else {
			L.DomUtil.addClass(this._dropdown, 'boxselector-dropdown-expanded');
			L.DomUtil.removeClass(this._dropdown, 'boxselector-dropdown-hidden');
			this._expanded = true;
		}
	},
	
	_actionItemClick: function(e) {
		var actionItemElement = e.target;
		var actionId = actionItemElement.actionId;
		var action = this.options.actions[actionId];
		action(this.getSelectedMarkers());
	},

	_addHooks: function () {
		L.DomEvent.on(this._mapcontainer, 'mousedown', this._onMouseDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(this._mapcontainer, 'mousedown', this._onMouseDown, this);
	},

	_toggle: function() {
		this._setEnabled(!this._isEnabled());
		if (this._isEnabled()) {
			//enable selection
			map.dragging.disable();
			L.DomUtil.addClass(this._toggleElement, 'enabled');
		} else {
			//disable selection
			map.dragging.enable();
			L.DomUtil.removeClass(this._toggleElement, 'enabled');
			this._allSelectedMarkers = {};//clear our existing selection
		}
	},
	
	_isEnabled: function() {
		return this._selectionEnabled;
	},
	
	_setEnabled: function(enabled) {
		this._selectionEnabled = enabled;
	},

	moved: function () {
		return this._moved;
	},

	_resetState: function () {
		this._moved = false;
	},

	_onMouseDown: function (e) {
		if (!this._isEnabled() || (e.button !== 0)) {
			return false;
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
