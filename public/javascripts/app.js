/* задаем текущий режим карты */
var map_mode = 'read';

/* создаем карту, отправная точка Чебоксары */
var map = L.map('mapid').setView([56.12, 47.24], 13);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
    attribution: '© OpenStreetMap' 
}).addTo(map);

/* создаем кнопку изменения режима карты */
CustomButton = L.Control.extend({
    options: {
        position: 'topleft' 
    },
    onAdd: function(map) {
        var btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        btn.value = "Edit";
        btn.onclick = function(){
            if(map_mode == 'read') {
                map_mode = 'write';
            } else {
                map_mode = 'read';
            }
        }

        return btn;
    },
});

/* добавляем кнопку изменения режима карты */
map.addControl(new CustomButton());

/* запускаем отселживание кликов по карте */
map.on('click', onMapClick);

/* загружаем имеющиес маркеры из локального хранилища */
loadMarkers();

/* функция обрабатки клика по карте */
function onMapClick(e) {
    /* если режим редактирования карты, добавляем новый указатель */
    if(map_mode == 'write') {
        var marker_obj = {
            'lat': e.latlng.lat.toFixed(2),
            'lng': e.latlng.lng.toFixed(2),
            'name': 'Без имени',
            'description': 'Без описания',
            'id': new Date().getTime(),
        }
        /* создаем маркер */
        var marker = L.marker([marker_obj.lat, marker_obj.lng], { draggable: true })
        .addTo(map)
        .bindPopup('<b>Название:</b> ' + marker_obj.name + '<br><b>Описание:</b> ' + marker_obj.description + '<br><b>Координаты:</b> ' + marker_obj.lat + ', ' + marker_obj.lng + '<br><a href="#" id="marker-delete-button">Del</a>');
        /* добавляем данные маркера в сам объект маркера */
        marker.popupdata = marker_obj;
        /* включаем отслеживание удаления маркера */
        marker.on("popupopen", onPopupOpen);
        /* сохраняем маркер в хранилище */
        storeMarker(marker_obj);
    }
}

/* функция загрузки маркеров из локального хранилища */
function loadMarkers() {
    var markers = localStorage.getItem("markers");
    if(!markers){
        return;
    } else {
        markers = JSON.parse(markers);
        markers.forEach(function(entry) {
            var data = JSON.parse(entry);
            var marker_obj = {
                'lat': data.lat,
                'lng': data.lng,
                'name': data.name,
                'description': data.name,
                'id': data.id,
            }

            var marker = L.marker([data.lat, data.lng], { draggable: true })
            .addTo(map)
            .bindPopup('<b>Название:</b> ' + data.name + '<br><b>Описание:</b> ' + data.description + '<br><b>Координаты:</b> ' + data.lat + ', ' + data.lng + '<br><a href="#" id="marker-delete-button">Delete</a>');
            marker.popupdata = marker_obj;
            marker.on("popupopen", onPopupOpen);
            marker.on("drag", onDragMarker);
            return marker;
        });
    }
}

/* функция добавления маркера в локальное хранилище */
function storeMarker(marker) {
    var markers = localStorage.getItem("markers");
    if(!markers) {
        markers = new Array();
        markers.push(JSON.stringify(marker));
    } else {
        markers = JSON.parse(markers);
        markers.push(JSON.stringify(marker));
    }
    localStorage.setItem('markers', JSON.stringify(markers));
}

/* функция удаления маркера с карты */
function onPopupOpen() {
    var tempMarker = this;
    $("#marker-delete-button:visible").click(function () {
        var markers = localStorage.getItem("markers");        
        if(markers) {
            markers = JSON.parse(markers);
            var i = 0;
            markers.forEach(function(entry) {
                var data = JSON.parse(entry);
                if(data.lat == tempMarker._latlng.lat && data.lng == tempMarker._latlng.lng) {
                    markers.splice(i, 1);
                }
                i++;
            });
            localStorage.setItem('markers', JSON.stringify(markers));
        }
        map.removeLayer(tempMarker);
    });
}

/* функция переноса маркера на карте */
function onDragMarker(e) {
    var marker = e.target;
    marker.unbindPopup();    
    var position = marker.getLatLng();
    marker.popupdata.lat = position.lat.toFixed(2);
    marker.popupdata.lng = position.lng.toFixed(2);
    marker.bindPopup('<b>Название:</b> ' + marker.popupdata.name + '<br><b>Описание:</b> ' + marker.popupdata.description + '<br><b>Координаты:</b> ' + marker.popupdata.lat + ', ' + marker.popupdata.lng + '<br><a href="#" id="marker-delete-button">Delete</a>');
    marker.on("popupopen", onPopupOpen);
}