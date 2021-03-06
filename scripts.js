$(document).ready(function () {
	setDatePicker(moment())
});


mapboxgl.accessToken = 'pk.eyJ1IjoiZ3NlcHVsdmVkYTk2IiwiYSI6ImNrYTQ2cm9wMjBtM2IzZG12eWFmNm1zMW0ifQ.w4BLAhSp5wKs4LrRQmBbTg';
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/gsepulveda96/ck9x8kqvf16h71ip8tuuvk97i',
	center: [-94.64, 37.68],
	zoom: 4,
	minZoom: 3,
	maxZoom: 10
});


function setDatePicker(dateSelected) {
	var formattedDate = dateSelected.format('YYYY-MM-DD').toString();
	console.log( 'Trying ' + formattedDate);
	countyURL = 'https://raw.githubusercontent.com/jorge-sepulveda/covid-time-map/master/src/pyscraper/outputFiles/counties/' + formattedDate + '.json'

	$.getJSON(countyURL, function() {
		document.getElementById('mapdate').value = formattedDate;
		document.getElementById('mapdate').max = formattedDate;
		maxDate = formattedDate;
		reloadData()
	}).fail(function() {
		setTimeout(setDatePicker, 1000, dateSelected.subtract(1,'d'))
	})
	
}

function validateDate() {
	var lowDate = moment('2020-01-20', 'YYYY-MM-DD')
	var highDate = moment(maxDate, 'YYYY-MM-DD')
	var dateToCheck = moment($("#mapdate").val(), 'YYYY-MM-DD')
	if (dateToCheck > lowDate && dateToCheck <= highDate) {
		reloadData(mortalButtonSelected)
	} else {
		alert('Date not available: ' + dateToCheck.format('MMM Do YYYY').toString())
		document.getElementById('mapdate').value = currentDateSelected;
		return;
	}
}

function reloadData(mortalButtonSelected) {
	dateToLoad = moment($("#mapdate").val()).format('YYYY-MM-DD').toString();
	console.log('loading ' + dateToLoad);
	currentDateSelected = dateToLoad
	console.log(currentDateSelected)

	stateURL = 'https://raw.githubusercontent.com/jorge-sepulveda/covid-time-map/master/src/pyscraper/outputFiles/states/' + currentDateSelected + '.json'
	countyURL = 'https://raw.githubusercontent.com/jorge-sepulveda/covid-time-map/master/src/pyscraper/outputFiles/counties/' + currentDateSelected + '.json'
	$.when(
		$.getJSON(countyURL, function (data) {
			countyData = data;
		}),
		$.getJSON(stateURL, function (data) {
			stateData = data;
		})
	).then(function (cData, sData) {
		if (cData && sData) {
			mortalButtonSelected ? drawDeathMap() : drawCasesMap();
		} else {
			alert('something went horribly wrong')
		}
	});
}

function drawCasesMap() {
	dateValue = moment($("#mapdate").val());
	dateToLoad = dateValue.format("YYYY-MM-DD").toString()
	console.log('Cases: loading ' + dateToLoad);
	currentDateSelected = dateToLoad

	var newStateExpression = ['match', ['get', 'STATE']];
	var newCountyExpression = ['match', ['get', 'fips']];

	stateData[currentDateSelected].forEach(function (row) {
		number = (row['infection_rate'])
		var color = (number > 1000) ? "#AE8080" :
			(number > 500) ? "#D18080" :
			(number > 100) ? "#FC8B8B" :
			(number > 10) ? "#FDC4C4" :
			(number > 1) ? "#FDE6E6" :
			"#FFFFFF";
		newStateExpression.push(row['STATE'], color);
	});
	countyData[currentDateSelected].forEach(function (row) {
		number = (row['infection_rate'])
		var color = (number > 1000) ? "#AE8080" :
			(number > 500) ? "#D18080" :
			(number > 100) ? "#FC8B8B" :
			(number > 10) ? "#FDC4C4" :
			(number > 1) ? "#FDE6E6" :
			"#FFFFFF";
		newCountyExpression.push(row['fips'], color);
	});

	newStateExpression.push('rgba(255,255,255,1)');
	newCountyExpression.push('rgba(255,255,255,1)');

	map.setPaintProperty('covid-state', 'fill-color', newStateExpression)
	map.setPaintProperty('covid-county', 'fill-color', newCountyExpression)
}

function drawDeathMap() {

	dateValue = moment($("#mapdate").val());
	dateToLoad = dateValue.format("YYYY-MM-DD").toString()
	console.log('Death: loading ' + dateToLoad);
	currentDateSelected = dateToLoad

	var newStateExpression = ['match', ['get', 'STATE']];
	var newCountyExpression = ['match', ['get', 'fips']];

	stateData[currentDateSelected].forEach(function (row) {
		number = (row['death_rate'])
		var color = (number > 100) ? "#54278f" :
			(number > 75) ? "#756bb1" :
			(number > 50) ? "#9e9ac8" :
			(number > 10) ? "#bcbddc" :
			(number > 1) ? "#dadaeb" :
			"#f2f0f7";
		newStateExpression.push(row['STATE'], color);
	});
	countyData[currentDateSelected].forEach(function (row) {
		number = (row['death_rate'])
		var color = (number > 100) ? "#54278f" :
			(number > 75) ? "#756bb1" :
			(number > 50) ? "#9e9ac8" :
			(number > 10) ? "#bcbddc" :
			(number > 1) ? "#dadaeb" :
			"#f2f0f7";
		newCountyExpression.push(row['fips'], color);
	});

	newStateExpression.push('rgba(255,255,255,1)');
	newCountyExpression.push('rgba(255,255,255,1)');
	
	map.setPaintProperty('covid-state', 'fill-color', newStateExpression)
	map.setPaintProperty('covid-county', 'fill-color', newCountyExpression)
}

map.on('load', function () {
	map.addSource('county-lines', {
		type: 'vector',
		url: 'mapbox://gsepulveda96.countylines'
	});

	map.addSource('state-lines', {
		type: 'vector',
		url: 'mapbox://gsepulveda96.statelines'
	});

	console.log(map.getStyle().layers);
	// Add layer from the vector tile source with countyData-driven style

	map.addLayer({
		'id': 'covid-state',
		'type': 'fill',
		'source': 'state-lines',
		'source-layer': 'state-lines'
	}, 'road-minor-low')

	map.addLayer({
		'id': 'covid-county',
		'type': 'fill',
		'source': 'county-lines',
		'source-layer': 'county-lines',
		'paint': {
			'fill-outline-color': '#ffffff',
		}
	}, 'covid-state');

	map.addLayer({
		'id': 'statelines',
		'type': 'line',
		'source': 'state-lines',
		'source-layer': 'state-lines',
		'paint': {
			'line-color': '#000000',
			'line-width': 1
		}
	}), 'state-label';

	mortalButtonSelected = false;
	reloadData(mortalButtonSelected)

	map.on('mousemove', 'covid-county', function (e) {
		map.getCanvas().style.cursor = 'pointer';
		var coordinates = e.features[0].geometry.coordinates.slice();
		// Single out the first found feature.
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}
		var feature = e.features[0];
		selectedCounty = countyData[currentDateSelected].filter(county => county.fips === feature.properties.fips);

		document.getElementById("info-box").innerHTML = (feature.properties.NAME + ' County' + '</br>' +
			'Population: ' + feature.properties.POPESTIMATE2019 + '</br>' +
			'Cases: ' + selectedCounty[0]['confirmed'] + '</br>' +
			'Infection Rate: ' + selectedCounty[0]['infection_rate'].toFixed(2) + '/100,000 People</br>' +
			'Deaths: ' + selectedCounty[0]['deaths'] + '</br>' +
			'Mortality Rate: ' + selectedCounty[0]['death_rate'].toFixed(2) + '/100,000 People')
	});
	map.on('mouseleave', 'covid-county', function () {
		map.getCanvas().style.cursor = '';
		document.getElementById("info-box").innerHTML = "Hover over the map to see info"
	});

	map.on('mousemove', 'covid-state', function (e) {
		map.getCanvas().style.cursor = 'pointer';
		var coordinates = e.features[0].geometry.coordinates.slice();
		var description = e.features[0].properties.description;
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}
		var feature = e.features[0];
		selectedState = stateData[currentDateSelected].filter(state => state.STATE === feature.properties.STATE);

		document.getElementById("info-box").innerHTML = (feature.properties.NAME + '</br>' +
			'Population: ' + feature.properties.POPESTIMATE2019 + '</br>' +
			'Cases: ' + selectedState[0]['confirmed'] + '</br>' +
			'Infection Rate: ' + selectedState[0]['infection_rate'].toFixed(2) + '/100,000 People</br>' +
			'Deaths: ' + selectedState[0]['deaths'] + '</br>' +
			'Death Rate: ' + selectedState[0]['death_rate'].toFixed(2) + '/100,000 People')
	});

	map.on('mouseleave', 'covid-county', function () {
		map.getCanvas().style.cursor = '';
		document.getElementById("info-box").innerHTML = "Hover over the map to see info"
	});

	map.dragRotate.disable();

	//Toggle County Button
	var link = document.createElement('a');
	link.href = '#';
	link.className = ''
	link.textContent = 'Toggle Counties'
	//Mortality Rate Button
	var mortalButton = document.createElement('a')
	mortalButton.href = '#'
	mortalButton.className = ''
	mortalButton.textContent = 'Mortality Rate'

	link.onclick = function (e) {
		e.preventDefault();
		e.stopPropagation();

		if (this.className === 'active') {
			map.setLayoutProperty('covid-state', 'visibility', 'visible');
			this.className = '';
		} else {
			map.setLayoutProperty('covid-state', 'visibility', 'none');
			this.className = 'active'
		}
	}

	mortalButton.onclick = function (e) {
		e.preventDefault();
		e.stopPropagation();

		if (this.className === 'active') {
			this.className = '';
			mortalButtonSelected = false;
			validateDate();
			document.getElementById('cases-legend').style.display = 'block';
			document.getElementById('mortality-legend').style.display = 'none';

		} else {
			mortalButtonSelected = true;
			this.className = 'active'
			validateDate();
			document.getElementById('cases-legend').style.display = 'none';
			document.getElementById('mortality-legend').style.display = 'block';
		}
	}

	var layers = document.getElementById('menu');
	layers.appendChild(link);
	layers.appendChild(mortalButton);
});