mapboxgl.accessToken = "pk.eyJ1IjoibW9oaS1nYXRlIiwiYSI6ImNsbjRsdDhvcTAxeWgycXBmcTVjYjA4em4ifQ.yaTzeNt2gbG3Z_a-SkxmTQ";
const baseMapLayers = document.querySelectorAll('.base-layer-item');
const additionalMapLayers = document.querySelectorAll('.additional-layer-item');
const sourceBtnArr = document.querySelectorAll(".source-item");
let selector = document.getElementById("field-select");
let dom = document.getElementById("chart-container");
let selectedChartDom = document.getElementById("sensor-chart-container");
const sensorBlock = document.querySelector(".sensor-block");
const numbercode = document.querySelector("#numbercode");
const coordsSensor = document.querySelector("#coords");
const humidSensor = document.querySelector("#humidValue");
const tempSensor = document.querySelector("#tempValue");
const listContainer = document.querySelector('.sensordata__list');
const legendBuilding = document.querySelector('.building-legend');
const heatmaptoggleBtn = document.getElementById('heatMapbutton');
const toggleFormBtn = document.getElementById('dataForm');
const showHeatLayer = document.getElementById('showBTN'); // old button id= showHeatmap
const hideHeatLayer = document.getElementById('hideBTN');  // old button id= hideHeatmap
let timeInput = document.getElementById('timeframe');
let pollutantInput = document.getElementById('airQuality');
let selectors = document.querySelectorAll('.form-control')

const dataSource2 = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/devicesLastHour.geojson';
const historyDataSource = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/devices_1mnth.geojson';
const walkingDataSource = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/data_cll_2023_June-August_merged_located.geojson';
const citylabDevice = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/citylab_sensors.geojson';
const subwaySource = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/railway_subway_entrance.geojson';
const busStopSource = 'https://raw.githubusercontent.com/jtuvaleva/devices/main/data/stops_2020_4326.geojson';

let activeLayer = 'TEMP-layer';
let activeSource = 'airthings';
let selectedTime = '2023-03-13T09:00:00';
let selectedSensor = 'AT22229480';
let plotMain;
const sourceAlias = ['airthings', 'citylab'];
const sourceArray = {
  "airthings": ['TEMP', 'NO2', 'SO2', 'HUMIDITY'],
  "citylab":  ['ppl_lsum', 'ppl_rsum'],
};
var isHeatmapLayerVisibile = false

const interpolatedheatCoords = [  // conrdinates for the targeted area in Sofia so that we use it in the interpolated heat map layer
			
{ lat: 42.62475099, lon: 23.35468471 },
{ lat: 42.62380373, lon: 23.36358194 },
{ lat: 42.62121763, lon: 23.43745619 },
{ lat: 42.62341172, lon: 23.44284 },
{ lat: 42.62917619, lon: 23.4470754 },
{ lat: 42.6632617, lon: 23.45753998 },
{ lat: 42.70762427, lon: 23.44972493 },
{ lat: 42.70852087, lon: 23.4401832 },
{ lat: 42.71776845, lon: 23.42535838 },
{ lat: 42.71957938, lon: 23.41971847 },
{ lat: 42.71991419, lon: 23.41398558 },
{ lat: 42.71916886, lon: 23.40584728 },
{ lat: 42.72118169, lon: 23.39145357 },
{ lat: 42.72288818, lon: 23.38667219 },
{ lat: 42.72639099, lon: 23.38171697 },
{ lat: 42.74733166, lon: 23.36034117 },
{ lat: 42.74984914, lon: 23.3557087 },
{ lat: 42.75139265, lon: 23.35176385 },
{ lat: 42.76053081, lon: 23.31108845 },
{ lat: 42.76908526, lon: 23.28666668 },
{ lat: 42.76192585, lon: 23.27068285 },
{ lat: 42.75961633, lon: 23.26693414 },
{ lat: 42.71405281, lon: 23.23144729 },
{ lat: 42.71294815, lon: 23.23040863 },
{ lat: 42.7110515, lon: 23.23046634 },
{ lat: 42.68966592, lon: 23.23039598 },
{ lat: 42.68768262, lon: 23.2321381 },
{ lat: 42.68492373, lon: 23.23702728 },
{ lat: 42.67871959, lon: 23.24847353 },
{ lat: 42.67709648, lon: 23.24952721 },
{ lat: 42.67485927, lon: 23.24988299 },
{ lat: 42.67285102, lon: 23.25041485 },
{ lat: 42.66363006, lon: 23.26157155 },
{ lat: 42.66124835, lon: 23.263082 },
{ lat: 42.66012181, lon: 23.26449571 },
{ lat: 42.65894472, lon: 23.26817213 },
{ lat: 42.62475099, lon: 23.35468471 }
];

const customValueToColor = `
  vec3 customValueToColor(float value) {
    return vec3(0.0, 1.0 - value, value);
  }
`;


const fieldSelectArray = {
  "airthings": `<option value="TEMP">Temperature</option>
                    <option value="NO2">NO2</option>
                    <option value="SO2">SO2</option>
                    <option value="HUMIDITY">Humidity</option>`,
  "citylab":  `<option value="ppl_lsum">People L Sum</option>
  <option value="ppl_rsum">People R Sum</option>`,
}

//функции getMean и average - для осреднения значения для графика
const getMean = (arr, featureName) => Object.keys(arr).map(key => {
  return [key, arr[key].reduce((a, b) => a + (b[featureName] || 0), 0)/arr[key].length]
});

const average = list => list.reduce((prev, curr) => prev + curr) / list.length;

//функция для создания массива с датами
const getDatesInRange = (min, max) => {
  return Array(Math.ceil((max-min)/3600000)).fill(0).map((_, i) => new Date((new Date(min)).setHours(min.getHours() + i )))
}

//функция для переключения между векторной и спутниковой подложкой
const showSatelliteLayer = (layer) => {
	let layerId = layer.target.value;
	const visibleOption = layerId === "satellite" ? "visible": "none";
	map.setLayoutProperty("satellite", 'visibility', visibleOption);
}


const showUrbanLayer = (layer) => {
	const clickedLayer = layer.target.value;

	const visibility = map.getLayoutProperty(`${clickedLayer}-layer`, 'visibility');

	if (visibility === 'visible') {
		map.setLayoutProperty(`${clickedLayer}-layer`, 'visibility', 'none');
		if (clickedLayer !== 'building'){ 
			map.setLayoutProperty(`${clickedLayer}-label`, 'visibility', 'none');
		} else {
			legendBuilding.classList.add("hidden");
			legendBuilding.classList.remove("flex-col");
		};
	} else {

		map.setLayoutProperty(`${clickedLayer}-layer`, 'visibility', 'visible');
		if (clickedLayer !== 'building') {
			map.setLayoutProperty(`${clickedLayer}-label`, 'visibility', 'visible')
		} else {
			legendBuilding.classList.remove("hidden");
			legendBuilding.classList.add("flex-col");
		};
	}
};


const addSource = (mapInstanse, name, jsonData) => {
	return mapInstanse.addSource(name, {
	  type: 'geojson',
	  data: jsonData
	});
}
	
const addLabelLayer = (mapInstanse, layerName, sourceId, fieldName, textColor, visibility='visible') => {
	return mapInstanse.addLayer({
		"id": `${layerName}-label`,
		"type": "symbol",
		"source": sourceId,
		paint: {
			"text-halo-color": "white",
			"text-halo-width": 1,
			"text-color": textColor,
		},
		layout: {
			"text-allow-overlap": false,
			"text-field": ["get", fieldName],
			'text-variable-anchor': ['top'],
			"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
			"text-size": textColor === "#424242" ? 12 : 10,
			"text-padding": 10,
			'visibility':visibility
		},
	});
}

//обновление графика для выбранного датчика
const updateSelectedSensorChart = async(selectedId, sourceArr, source) => {
	const data = source === 'airthings' ?  await plotAirthings() : await plotCityLab(); 

	const plotSelectedSensor = Object.entries(data).map(([key, item]) => {
	  const filtered = item.find((el) => el.id === selectedId || el.deviceId === selectedId);
	  return [key, typeof filtered!== 'undefined' ? filtered[activeLayer.split('-')[0]]:0]
	});
  
	selectedSensorChart.setOption({
	  xAxis: {
		type: "time",
		min: plotSelectedSensor[0][0],
		max: plotSelectedSensor[plotSelectedSensor.length - 1][0],
		boundaryGap: 20,
		axisLabel: {
		  showMinLabel: false,
		  show: true,
		  hideOverlap: true,
		  formatter: '{dd}/{MM}/{yy}\n{hh}:{mm}'
		}
	  },
	  dataset: [{
		source: plotSelectedSensor,
		dimensions: ['date', 'value'],
	  },
	  {
        id: 'filteredBar',
        source: [[selectedTime, plotSelectedSensor.filter((item) => item[0] ===selectedTime).map(item => item[1])]],
        dimensions: ['date', 'value'],
      },
	  ]
	}, { replaceMerge: ['dataset', 'xAxis'] });
  } 

const getHistoryData = async function(sourceId){
	const sourceName = sourceId === 'airthings' ? historyDataSource: walkingDataSource;
	const response = await fetch(sourceName)
								.then(res => res.json())
								.then(data => data.features.reduce(function(h, obj) {
									h[obj.properties.Time] = (h[obj.properties.Time] || []).concat(obj.properties);
									return h; 
								}, {}));
	return response;
};

const plotOption = async (source, activeLayerName, selectedTime, selectedSensor) => {
	const data = source === 'airthings' ?  await plotAirthings() : await plotCityLab(); 

	const plotSelectedSensor = Object.entries(data).map(([key, item]) => {
		const filtered = item.length>0 ? item.find((el) => el.id === selectedSensor || el.deviceId === selectedSensor): [];
		return [key, filtered['TEMP']]
	});

	const pointSelected = {
		name: "Temperature Selected",
		datasetIndex: 1,
		type: 'scatter',
		itemStyle: {
		  color: "#7a1b0c",
		  borderWidth: 3,
		  borderColor: '#7a1b0c'
		},
		z: 10,
		encode: {
		  x: 0, y:1, tooltip: [1], itemName: [0]
		},
		emphasis: {
		  disabled: false,
		  scale: 2,
		},
		tooltip: {
		  trigger: "item",
		  formatter: (params) => {
			const [dayStr, value] = params.value;
  
			return `<div>
					  <p style="padding:0;margin:0;font-weight:bold;">${params.seriesName}</p>
					  <p style="padding:0;margin:0;">${new Date (dayStr).toLocaleString('en-En', {year: 'numeric',
					  month: 'numeric', 
					  day: 'numeric', 
					  hour: '2-digit', 
					  minute:'2-digit', 
					  hour12: false})} - ${value ? value.toFixed(3) : value}</p>
					</div>`
		  }
		}
	};

	const yAxis = {
		type: "value",
		axisLabel: {
		  showMinLabel: false,
		  showMaxLabel: false,
		},
	};

	const grid = {
		top: 0,
		bottom: 75,
	}

	const axisLabel = {
		showMinLabel: false,
		show: true,
		hideOverlap: true,
		formatter: '{dd}/{MM}/{yy}\n{hh}:{mm}'
	};

	const allOption = {
		grid: {...grid},
		xAxis: {
		  type: "time",
		  min: getMean(data, activeLayerName)[0][0],
		  max: getMean(data, activeLayerName)[getMean(data, activeLayerName).length - 1][0],
		  boundaryGap: 20,
		  axisLabel: {...axisLabel}
		},
		tooltip: {
		  show: true,
		  triger: 'item'
		},
		yAxis: {...yAxis},
		dataset: [{
		  source: getMean(data, activeLayerName),
		  dimensions: ['date', 'value'],
		},
		{
		  id: 'filteredBar',
		  source: [[selectedTime, average(getMean(data, activeLayerName).filter((item) => item[0] ===selectedTime).map(item => item[1]))]],
		  dimensions: ['date', 'value'],
		},
		],
		dataZoom: [
		  {
			startValue: '16/03/2023'
		  },
		  {
			type: 'inside'
		  }
		],
		series: [
		  {
			name: "Value",
			type: 'line',
			smooth: true,
			itemStyle: {
			  color: "#2b83ba"
			},
			showSymbol: true,
			symbol:'circle',
			symboleSize: 0.01, 
			areaStyle: {
			},
			emphasis: {
			  disabled: false,
			  scale: 2,
			  itemStyle: {
				color: "#323232"
			  }
			},
			encode: {
			  x: 0, y:1, tooltip: [1], itemName: [0]
			},
			tooltip: {
			  trigger: "item",
			  formatter: (params) => {
				const [dayStr, value] = params.value;
	  
				return `<div>
						  <p style="padding:0;margin:0;font-weight:bold;">${params.seriesName}</p>
						  <p style="padding:0;margin:0;">${new Date (dayStr).toLocaleString('en-En', {year: 'numeric',
						  month: 'numeric', 
						  day: 'numeric', 
						  hour: '2-digit', 
						  minute:'2-digit', 
						  hour12: false})} - ${value.toFixed(3)}</p>
						</div>`
			  }
			}
		  },
		  {...pointSelected}
		]
	};
	const selectedOption = {
		grid: {...grid},
		xAxis: {
		  type: "time",
		  min: plotSelectedSensor[0][0],
		  max: plotSelectedSensor[plotSelectedSensor.length - 1][0],
		  boundaryGap: 20,
		  axisLabel: {...axisLabel}
		},
		tooltip: {
		  show: true,
		  triger: 'item'
		},
		yAxis: {...yAxis},
		dataset: [{
		  source: plotSelectedSensor,
		  dimensions: ['date', 'value'],
		},
			{
			  id: 'filteredBar',
			  source: [[selectedTime, plotSelectedSensor.filter((item) => item[0] ===selectedTime).map(item => item[1])]],
			  dimensions: ['date', 'value'],
			},
		],
		dataZoom: [
		  {
			startValue: '16/03/2023'
		  },
		  {
			type: 'inside'
		  }
		],
		series: [
		  {
			name: "Value",
			type: 'line',
			smooth: true,
			lineStyle: {
			  color: "#377335"
			},
			itemStyle: {
			  color: "#377335"
			},
			areaStyle: {
			  color: "#377335"
			},
			showSymbol: true,
				symbol:'circle',
				symboleSize: 0.01,
			emphasis: {
			  itemStyle: {
				shadowBlur: 10,
				shadowOffsetX: 0,
				symboleSize: 10,
				shadowColor: '#000000'
			  }
			},
			encode: {
			  x: 0, y:1, tooltip: [1], itemName: [0]
			},
			tooltip: {
			  trigger: "item",
			  formatter: (params) => {
				const [dayStr, value] = params.value;
	  
				return `<div>
						  <p style="padding:0;margin:0;font-weight:bold;">${params.seriesName}</p>
						  <p style="padding:0;margin:0;">${new Date (dayStr).toLocaleString('en-En', {year: 'numeric',
						  month: 'numeric', 
						  day: 'numeric', 
						  hour: '2-digit', 
						  minute:'2-digit', 
						  hour12: false})} - ${value.toFixed(3)}</p>
						</div>`
			  }
			}
		  },
		  {...pointSelected}	
		]
	  };
	return [allOption, selectedOption]
}

const checkAndalert = () => { // alert meesage for change of layer when having a visible one
	if (hideHeatLayer.style.display === 'block') {
        alert('Please hide the current layer before changing the time/pollutant.');   
    }
};

const getpollutantValues = () => {  // Get random values for now when clikcing on a certain point on the map
	const generateRandomValue = () => (Math.random() * 200).toFixed(4) 

	const pollutants =  {}

	for (const pollutant of ['O3', 'NO2', 'SO2', 'PM10']) {
		const value1 = generateRandomValue();
		const value2 = generateRandomValue();

		const smallerValue = Math.min(value1, value2);
		const biggerValue = Math.max(value1, value2);
		const averageValue = (( parseFloat(smallerValue) + parseFloat(biggerValue) ) / 2).toFixed(4)

		pollutants[pollutant] = {
			smaller: smallerValue,
			bigger: biggerValue,
			average: averageValue,
		};

	}
	
	return pollutants
}

const checkIfInArea = (clickedCoordinates) =>{// a func that checks if the current clicked coords are with in the targeted area we specified in Sofia
	
	const targetedArea = [] // getting the cords in a list instead of a dict
	for(const cord of interpolatedheatCoords){  
		targetedArea.push([cord.lon, cord.lat])
	}
	
	const clickedCoords = [clickedCoordinates.lng, clickedCoordinates.lat] 

	const clicledPoint = turf.point(clickedCoords)// Turf point from the clicked coordinates
	const polygon = turf.polygon([targetedArea]);// Turf polygon from the coordinates in the targeted area
	const isInside = turf.booleanPointInPolygon(clicledPoint, polygon); // returns a boolean whether the click is inside the area or not

	return isInside //boolean TRUE/FALSE


}




const map = new mapboxgl.Map({
	container: 'map',
	zoom: 11,
	center: [23.32509, 42.696],
	style: 'mapbox://styles/mapbox/light-v11'
  });

map.doubleClickZoom.disable();

baseMapLayers.forEach(el => el.onclick = showSatelliteLayer);

additionalMapLayers.forEach(el => el.onclick = showUrbanLayer);


const plotAirthings = async() => {
	const data = await getHistoryData('airthings');
	return Object.keys(data)
		.sort()
		.reduce((accumulator, key) => {
		  accumulator[key] = data[key];
		  return accumulator;
		}, {});
}

const plotCityLab = async() => {
	const data = await getHistoryData('citylab');
	return Object.keys(data)
		.sort()
		.reduce((accumulator, key) => {
		  accumulator[key] = data[key];
		  return accumulator;
		}, {});
}



//инициализация контейнера для графика
let allSensorsChart = echarts.init(dom, null, {
	renderer: "canvas",
	useDirtyRect: false
});

let selectedSensorChart = echarts.init(selectedChartDom, null, {
	renderer: "canvas",
	useDirtyRect: false
});

plotOption(activeSource, 'TEMP', selectedTime, selectedSensor)
	.then(option => {
		const [allOption, selectedOption] = option;
		if (allOption && typeof allOption === "object") {
			allSensorsChart.setOption(allOption);
		}

		selectedSensorChart.setOption(selectedOption)
});




map.on("load", async function () {
	addSource(map, 'sensorsCoords', dataSource2);
	addSource(map, 'sensorsHistory', historyDataSource);
	addSource(map, 'sensorsCityLabCoords', citylabDevice);
	addSource(map, 'sensorsPedHistory', walkingDataSource);
	addSource(map, 'subwaySource', subwaySource);
  	addSource(map, 'busStopSource', busStopSource);
  

	map.addLayer({
		'id': 'subway-layer',
		'type': 'circle',
		'source': 'subwaySource',
		'layout': {
			'visibility':'none'
		},
		'paint': {
			'circle-radius': 4,
			'circle-stroke-width': 1,
			'circle-stroke-color': '#d5d5d5',
			'circle-color': '#8f030c',
		},
	});

	map.addLayer({
		'id': 'bus-stop-layer',
		'type': 'circle',
		'source': 'busStopSource',
		'layout': {
			'visibility':'none'
		},
		'paint': {
			'circle-radius': 3,
			'circle-stroke-width': 1,
			'circle-stroke-color': '#d5d5d5',
			'circle-color': '#003aa6',
		},
	});


	map.addLayer({
		'id': 'ppl_lsum-layer',
		'type': 'circle',
		'source': 'sensorsPedHistory',
		'layout': {
			'visibility':'none'
		},
		'paint': {
			'circle-radius': 6,
			'circle-stroke-width': 2,
			'circle-stroke-color': '#d5d5d5',
			'circle-color': [
			'interpolate',
			['linear'],
			['get', 'ppl_lsum'],
			0,
			'#fde0dd',
			10,
			'#f768a1',
			25,
			'#870884',
			50,
			'#3b0639'
			],
		},
	});

	map.addLayer({
		'id': 'ppl_rsum-layer',
		'type': 'circle',
		'source': 'sensorsPedHistory',
		'layout': {
			'visibility':'none'
		},
		'paint': {
			'circle-radius': 6,
			'circle-stroke-width': 2,
			'circle-stroke-color': '#d5d5d5',
			'circle-color': [
			'interpolate',
			['linear'],
			['get', 'ppl_rsum'],
			0,
			'#fde0dd',
			10,
			'#f768a1',
			25,
			'#7a0177',
			],
		},
	});

	
	map.addLayer({
	  'id': 'TEMP-layer',
	  'type': 'circle',
	  'source': 'sensorsHistory',
	  'layout': {
		'visibility':'visible'
	  },
	  'paint': {
		'circle-radius': 6,
		'circle-stroke-width': 2,
		'circle-stroke-color': '#d5d5d5',
		'circle-color': [
		  'interpolate',
		  ['linear'],
		  ['get', 'TEMP'],
		  0,
		  '#2b83ba',
		  15,
		  '#91cba8',
		  18,
		  '#ddf1b4',
		  20,
		  '#fedf99',
		  25,
		  '#f59053',
		  30,
		  '#d7191c',
		  ],
	  },
	  'filter': ['==', ['get', 'Time'], selectedTime]
	});
  
	map.addLayer({
	  'id': 'NO2-layer',
	  'type': 'circle',
	  'source': 'sensorsHistory',
	  'layout': {
		'visibility':'none'
	  },
	  'paint': {
	  'circle-radius': 6,
	  'circle-stroke-width': 2,
	  'circle-stroke-color': '#d5d5d5',
	  'circle-color': [
		'interpolate',
		['linear'],
		['get', 'NO2'],
		0,
		'#fef0d9',
		10,
		'#fdd39a',
		12,
		'#fca66d',
		16,
		'#fedf99',
		20,
		'#f2724a',
		30,
		'#d93b29',
		],
	  }
	});
  
	map.addLayer({
	  'id': 'SO2-layer',
	  'type': 'circle',
	  'source': 'sensorsHistory',
	  'layout': {
		'visibility':'none'
	  },
	  'paint': {
	  'circle-radius': 6,
	  'circle-stroke-width': 2,
	  'circle-stroke-color': '#d5d5d5',
	  'circle-color': [
		'interpolate',
		['linear'],
		['get', 'SO2'],
		0,
		'#ffffcc',
		10,
		'#b4e1b9',
		12,
		'#67c4be',
		16,
		'#39a0bf',
		20,
		'#2b70b1',
		30,
		'#253494',
		],
	  }
	});
  
	map.addLayer({
	  'id': 'HUMIDITY-layer',
	  'type': 'circle',
	  'source': 'sensorsHistory',
	  'layout': {
		'visibility':'none'
	  },
	  'paint': {
	  'circle-radius': 6,
	  'circle-stroke-width': 2,
	  'circle-stroke-color': '#d5d5d5',
	  'circle-color': [
		'interpolate',
		['linear'],
		['get', 'HUMIDITY'],
		0,
		'#f1eef6',
		20,
		'#c7d0e5',
		25,
		'#91b6d6',
		28,
		'#579dc8',
		32,
		'#2382b4',
		35,
		'#045a8d',
		],
	  }
	});






	addLabelLayer(map, "bus-stop", "busStopSource", "name", '#8a8888',  visibility='none');
	addLabelLayer(map, "subway", "subwaySource", "name", '#737272',  visibility='none');
	addLabelLayer(map, "citylab", "sensorsCityLabCoords", "deviceId", '#424242',visibility='none');
	addLabelLayer(map, "airthings", "sensorsCoords", "deviceId", '#424242');

	
	showHeatLayer.addEventListener('click', async () => {
		var timeHour = new Date(slider.value).getHours()
		var selectedTime = (timeHour < 10 ? `0${timeHour}:00`: `${timeHour}:00`)
		var selectedPollutant = selector.value
		console.log(selectedTime)
		console.log(selectedPollutant)

		const layerId = `airquality-heat-${selectedPollutant}-${selectedTime}`;
		const geoJsonUrl = `https://raw.githubusercontent.com/GATE-Institute-Future-Cities/sofia-sensors/master/pollutantsData/${selectedPollutant}geojson/prediction_20231112_${selectedTime}_${selectedPollutant}.geojson`;
		
		if(!geoJsonUrl){
			throw new Error("This Item currently dosen't have any data")
		}
		
		const response = await fetch(geoJsonUrl);
		const geoJsonData = await response.json();

		if(!map.getLayer(layerId)){
			
			// Extract points from GeoJSON features
			const points = geoJsonData.features.map(feature => ({
				lng: feature.geometry.coordinates[0],
				lat: feature.geometry.coordinates[1],
				val: feature.properties.value,
			}));
	
			const layer = interpolateHeatmapLayer.create({
				layerId: layerId,
				points: points, // the points are cordinates and the values we got from the geojson file
				roi: interpolatedheatCoords, // Coords of the targerted area we want
				framebufferFactor: 0.08, // reseloution of the layer the number is between 0-10 the higher the reseloution the slower it gets
				opacity:0.4, // the intensity of the colors
				p:2,
	
	
			});
			map.addLayer(layer);

		}
		
		map.setLayoutProperty(layerId, 'visibility', 'visible');
		isHeatmapLayerVisibile = true // set the visibility to true


		console.log(selector.value)

		map.on('click', function(e){ // this is the popup upon clicking on any point on the map WHILE THE HEATMAP LAYER IS ON RETRIVES INFO ONLY FOR THE SELECTED POLLUTANT

			const coordinates = map.unproject(e.point); // coordinates of the clicked point from the user
			const features = map.queryRenderedFeatures(e.point);
			const sensorsSource = features[0].source // getting the features clicked source so that the popup doesn't show up when clicking on the sensors


			if(isHeatmapLayerVisibile && checkIfInArea(coordinates) && sensorsSource != 'sensorsCoords'){ // checking if a heatmap layer is active and if the clicked coords are with in the Sofia Area

				const features = geoJsonData.features; //the features of the current layer
				
				const closestFeature = turf.nearestPoint([coordinates.lng, coordinates.lat], { type: 'FeatureCollection', features }); // Find the closest features to the clicked coordinates
				const clickedValue = closestFeature.properties.value;// Extract the value from the closest feature
		
	
				const popupBox = `<h3 id="popupTitle">Heat Map</h3>
				<p id="value">Value: <spam>${clickedValue}</spam></p>
				<p id="singlePollutant">Selected Pollutant: <spam>${pollutantInput.options[pollutantInput.selectedIndex].text}</spam></p>
				<p id="singleTime">Selected Time: <spam>${timeInput.options[timeInput.selectedIndex].text}</spam></p>
				<p id="coordinates">Coordinates: 
				<spam>lng(${coordinates.lng})</spam>
				<spam>lat(${coordinates.lat})</spam>
				</p>
				`
				new mapboxgl.Popup()
				.setLngLat(coordinates)
				.setHTML(popupBox)
				.addTo(map)
	
			
			}
		
		})

	});

		// Hide Layer Button
	hideHeatLayer.addEventListener('click', () => {
		isHeatmapLayerVisibile = false
		const selectedTime = timeInput.value;
		const selectedPollutant = pollutantInput.value;
		const layerId = `airquality-heat-${selectedPollutant}-${selectedTime}`;

		
		map.setLayoutProperty(layerId, 'visibility', 'none');//hide layer
		hideHeatLayer.style.display = 'none'; //hide the hide layer btn
		showHeatLayer.style.display = 'block'; // show the show layer btn
	});
	


	sourceBtnArr.forEach((btn) => {
		btn.addEventListener("click", async (e) => {
		  map.setLayoutProperty(activeSource+'-label', 'visibility', 'none');
		  activeSource = e.target.value;
		  if (map.getLayer("selected-sensor")) {
			map.removeLayer("selected-sensor");
		  }
		  map.setLayoutProperty(activeSource+'-label', 'visibility', 'visible');
		  selector.innerHTML = fieldSelectArray[activeSource];
		  activeLayer = activeSource=== 'airthings' ? 'TEMP-layer': 'ppl_lsum-layer';
		  selectedTime = activeSource=== 'airthings' ? '2023-03-14T10:00:00': '2023-06-30T10:00:00';
		  document.getElementById('slider').value = selectedTime;
		  plotMain = activeSource=== 'airthings' ? await plotAirthings(): await plotCityLab();
		  const selectedData = getMean(plotMain,  activeLayer.split('-')[0]);

		  map.setFilter(activeLayer, ['==', ['get', 'Time'], selectedTime])
		  selectedSensor = activeSource=== 'airthings'? 'AT22229480':'C1';

		  allSensorsChart.setOption({
			xAxis: {
			  type: "time",
			  min: selectedData[0][0],
			  max: selectedData[selectedData.length - 1][0],
			  boundaryGap: 20,
			  axisLabel: {
				showMinLabel: false,
				show: true,
				hideOverlap: true,
				formatter: '{dd}/{MM}/{yy}\n{hh}:{mm}'
			  }
			},
			dataZoom: [
				{
				  startValue: '06/04/2023'
				},
				{
				  type: 'inside'
				}
			  ],
			dataset: [{
			  source: selectedData,
			  dimensions: ['date', 'value'],
			},
			{
			  id: 'filteredBar',
			  source: [[ selectedTime, average(selectedData.filter((item) => item[0] === selectedTime).map(item => item[1]))]],
			  dimensions: ['time', 'value']
			}
			]
		  }, { replaceMerge: ['dataset', 'xAxis'] });

		  updateSelectedSensorChart(selectedSensor, sourceArray, activeSource);
	
	
		  Object.values(sourceArray).flat().forEach(item => {
			if (item === activeLayer.split('-')[0]) {
			  map.setLayoutProperty(activeLayer, 'visibility', 'visible');
			} else {
			  map.setLayoutProperty(item+'-layer', 'visibility', 'none')
			}
		  })
		})
	  })
	  
	selector.addEventListener('change',  async function(e) {
		activeLayer = this.value+'-layer';

		const plotData = activeSource === 'airthings' ? await plotAirthings(): await plotCityLab();

		allSensorsChart.setOption({
			dataset: [{
			source: getMean(plotData, this.value),
			dimensions: ['date', 'value'],
			},
			{
			id: 'filteredBar',
			source: [[ selectedTime, average(getMean(plotData, this.value).filter((item) => item[0] === selectedTime).map(item => item[1]))]],
			dimensions: ['time', 'value']
			}
			]
		}, { replaceMerge: 'dataset' });

		updateSelectedSensorChart(selectedSensor, sourceArray, activeSource);

	sourceArray[activeSource].forEach(item => {
		if (item === this.value) {
		map.setLayoutProperty(this.value+'-layer', 'visibility', 'visible');
		} else {
		map.setLayoutProperty(item+'-layer', 'visibility', 'none')
		}
	})
	}, false);

	map.on('click', function(e){ // this is the popup upon clicking on any point on the map

		const cordinates = map.unproject(e.point); // current clicked coords
		const features = map.queryRenderedFeatures(e.point);
		const sensorsSource = features[0].source // getting the features clicked source so that the popup doesn't show up when clicking on the sensors

		if (checkIfInArea(cordinates) && !isHeatmapLayerVisibile && sensorsSource != 'sensorsCoords') { // checking if a heatmap layer is active and if the clicked coords are with in the Sofia Area and if the source is different from the sensors coords

            var pollutantValues = getpollutantValues(); // random value generator for all the values
			var popupBox = '<h3 id="popupTitle">Pollutants</h3>' // html content of the popup
			for (var pollutant in pollutantValues){
				popupBox  += '<p id="pollutantName">' + pollutant + ' : '  + '</p>' + 

				'<p>' + pollutantValues[pollutant].smaller + ' - ' +
				pollutantValues[pollutant].bigger + ' (EST: ' +
				pollutantValues[pollutant].average + ') </p>'
			}

			new mapboxgl.Popup()
			.setLngLat(cordinates)
			.setHTML(popupBox)
			.addTo(map)
		}
	})
	
	//добавление инфы про датчик при клике на него
	map.on("click", (e) => {
	  let bbox = [
		[e.point.x - 3, e.point.y - 3],
		[e.point.x + 3, e.point.y + 3],
	  ];
  
	  let features = map.queryRenderedFeatures(bbox, {
		layers: ["TEMP-layer", "NO2-layer", "SO2-layer", "HUMIDITY-layer", 'ppl_lsum-layer', 'ppl_lsum-layer'], //, 'PeopleLMed-layer', 'PeopleLMin-layer'
	  });
  
	  if (map.getLayer("selected-sensor")) {
		map.removeLayer("selected-sensor");
	  }
  
	  if (features.length > 0) {
		sensorBlock.classList.remove("hidden");
  
		const dataInfo = Object.entries(features[0].properties).filter(([key, value]) => ['longitude', 'latitude','lat', 'lon', 'id', 'deviceId','name'].includes(key));
		selectedSensor = features[0].properties.id || features[0].properties.deviceId;
		// sensorOptionContainer.value = selectedSensor;
  
		// plotMain = activeSource=== 'airthings' ? plotAirthings : plotCityLab;
		updateSelectedSensorChart(selectedSensor, sourceArray, activeSource);
  
		listContainer.innerHTML = null;
		dataInfo.forEach(([key, value]) => {
		  const itemTemplate = document.querySelector('#item-template').content;
		  const itemElement = itemTemplate.querySelector('.info__item').cloneNode(true);
		  itemElement.innerHTML = `<span class="bold-text">${key}: </span><span id=${key}>${isNaN(value) ? value: value.toFixed(3)}</span`;
		  listContainer.append(itemElement);
		})

		const selectedSource = features[0].layer.id.includes('ppl')? "sensorsCityLabCoords" : "sensorsCoords";
  
		map.addLayer({
		  "id": "selected-sensor",
		  "type": "circle",
		  "source": selectedSource,
		  "paint": {
			"circle-color": "green",
			"circle-radius": 8,
			'circle-stroke-width': 2,
			'circle-stroke-color': '#d5d5d5',
		  },
		  "filter": ["==", 'deviceId', selectedSensor],
		});
		map.moveLayer('selected-sensor', null);
  
	  } else {
		sensorBlock.classList.add("hidden");
		if (map.getLayer("selected-sensor")) {
		  map.removeLayer("selected-sensor");
		}  
	  }
	});
	
	//смена стиля курсора
	map.on("mouseenter", "sensors-layer", () => {
	  map.getCanvas().style.cursor = "pointer";
	});
	   
	map.on("mouseleave", "sensors-layer", () => {
	  map.getCanvas().style.cursor = "";
	});
  });
  
allSensorsChart.on('click', function(params) {
	selectedTime =  params.data[0];
	map.setFilter(activeLayer, ['==', ['get', 'Time'], selectedTime])
  
   document.getElementById('slider').value = selectedTime;
  
   allSensorsChart.setOption({
	  dataset: [
	  {
		id: 'filteredBar',
		source: [params.data],
		dimensions: ['time', 'value']
	  }
	  ]
	});
	
	  selectedSensorChart.setOption({
	  dataset: [
	  {
		id: 'filteredBar',
		source: [params.data],
		dimensions: ['time', 'value']
	  }
	  ]
	});
  });

selectedSensorChart.on('click', async function(params) {
	selectedTime =  params.data[0];
	map.setFilter(activeLayer, ['==', ['get', 'Time'], selectedTime]);
	const plotData = activeSource === 'airthings' ? await plotAirthings(): await plotCityLab();
  
   document.getElementById('slider').value = selectedTime;
  
	selectedSensorChart.setOption({
	  dataset: [
	  {
		id: 'filteredBar',
		source: [params.data],
		dimensions: ['time', 'value']
	  }
	  ]});
	
	  allSensorsChart.setOption({
	  dataset: [
	  {
		id: 'filteredBar',
		source: [[ selectedTime, average(getMean(plotData, activeLayer.split('-')[0]).filter((item) => item[0] === selectedTime).map(item => item[1]))]],
		dimensions: ['time', 'value']
	  }
	  ]
	});
  });
  
	
document.getElementById('slider').addEventListener('input', async (event) => {
	selectedTime = event.target.value+':00';

	map.setFilter(activeLayer, ['==', ['get', 'Time'], selectedTime]);
	const plotData = activeSource === 'airthings' ? await plotAirthings(): await plotCityLab();

	allSensorsChart.setOption({
		dataset: [{
		source: getMean(plotData, activeLayer.split('-')[0]),
		dimensions: ['date', 'value'],
		},
		{
		id: 'filteredBar',
		source: [[ selectedTime, average(getMean(plotData, activeLayer.split('-')[0]).filter((item) => item[0] === selectedTime).map(item => item[1]))]],
		dimensions: ['time', 'value']
		}
		]
	}, { replaceMerge: 'dataset' });

	selectedSensorChart.setOption({
		dataset: [
		{
		id: 'filteredBar',
		source: [[ selectedTime, average(getMean(plotData, activeLayer.split('-')[0]).filter((item) => item[0] === selectedTime).map(item => item[1]))]],
		dimensions: ['time', 'value'],
		}
		]
	});
});

window.addEventListener("resize", allSensorsChart.resize);

window.addEventListener("resize", selectedSensorChart.resize);