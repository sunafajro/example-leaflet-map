/* задаем текущий режим карты */
var map_mode = 'read';

/* создаем карту, отправная точка г. Чебоксары */
var map = L.map('mapid').setView([56.12, 47.24], 13);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
    attribution: '© OpenStreetMap' 
}).addTo(map);

/* создаем кнопку изменения режима карты */
CustomButton = L.Control.extend({
    /* указываем место для размещения кнопки */
    options: {
        position: 'topleft' 
    },
    /* метод создающий и возвращающий кнопку */
    onAdd: function(map) {
        var btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom writeOff');
        /* отслеживаем клик по кнпоке для переключения режима работы с картой */
        btn.onclick = function(){
            if(map_mode == 'read') {
                map_mode = 'write';
                $('.leaflet-control-custom').removeClass('writeOff').addClass('writeOn');
            } else {
                map_mode = 'read';
                $('.leaflet-control-custom').removeClass('writeOn').addClass('writeOff');
            }
        }
        return btn;
    },
});

/* добавляем кнопку изменения режима работы карты */
map.addControl(new CustomButton());

/* запускаем отсележивание кликов по карте */
map.on('click', onMapClick);

/** 
 *  Cоздаем массив для хранения объектов маркеров
 *  Проверяем localStorage на предмет сохраненных маркеров
 *  и заполняем массив ими. 
 */
var markers_arr = loadMarkers();

/* Распечатываем маркеры на карту */
printMarkers(markers_arr);

/* Метод обрабатки клика по карте и добавления нового маркера */
function onMapClick(e) {
    /* если режим редактирования карты, добавляем новый указатель */
    if(map_mode == 'write') {
        var marker_obj = {
            'lat': e.latlng.lat,
            'lng': e.latlng.lng,
            'name': 'Без имени',
            'description': 'Без описания',
            'id': new Date().getTime(),
        }
        /* создаем маркер */
        createMarkerOnMap(marker_obj);
        /* сохраняем маркер в хранилище */
        storeMarker(marker_obj);
    }
    return;
}

/* Метод загрузки маркеров из локального хранилища */
function loadMarkers() {
    var result = [];
    var markers = localStorage.getItem("markers");
    if(markers){
        markers = JSON.parse(markers);
        markers.forEach(function(entry) {
            var data = JSON.parse(entry);
            result.push({
                'lat': data.lat,
                'lng': data.lng,
                'name': data.name,
                'description': data.name,
                'id': data.id,
            });
        });
    }
    return result;
}

/* Метод для размещения массива маркеров на карте */
function printMarkers(markers_arr) {
    markers_arr.forEach(function(data) {
        /* Добавляем маркер на карту и присоединяем к нему попап */
        createMarkerOnMap(data);
    });
    return;
}

/* Метов добавления маркера в локальное хранилище */
function storeMarker(marker) {
    /* Добавляем маркер в основной массив markers_arr */
    markers_arr.push(marker);
    /* Сохраняем массив в localStorage */
    saveToLocalStorage(markers_arr);
    return;
}

/* Метод обработки открытия попапа маркера */
function onPopupOpen() {
    var tempMarker = this;
    /* при открытии попапа на лету обновляем данные о координатах маркера */
    $('#span_lat_' + tempMarker.marker_id).text(tempMarker.marker_lat.toFixed(2));
    $('#span_lng_' + tempMarker.marker_id).text(tempMarker.marker_lng.toFixed(2));
    if(map_mode != 'write') {
        $('#marker-edit-button').hide();
        $('#marker-delete-button').hide();
    } else {
        $('#marker-edit-button').show();
        $('#marker-delete-button').show();
    }
    /* Если произошел клик по ссылке удалить */
    $("#marker-delete-button:visible").click(function () {      
        var i = 0;
        /* Убираем маркер из массива markers_arr */
        markers_arr.forEach(function(item) {
            if(item.id == tempMarker.marker_id) {
                markers_arr.splice(i, 1);
                return;
            }
            i++;
        });
        /* Сохраняем актуальный массив markers_arr в localStorage */
        saveToLocalStorage(markers_arr);
        /* Удаляем маркер с карты */
        map.removeLayer(tempMarker);
    });
    return;
}

/* Метод обработки события переноса маркера на карте */
function onDragMarker(e) {
    var marker = e.target;   
    var position = marker.getLatLng();
    marker.marker_lat = position.lat;
    marker.marker_lng = position.lng;
    updateMarkerLatlng(marker);
    return;
}

/* Метод сохранения данные массива markers_arr в localStorage */
function saveToLocalStorage(markers_arr) {
    var markers = [];
    markers_arr.forEach(function(item) {
        markers.push(JSON.stringify(item));
    });
    localStorage.setItem('markers', JSON.stringify(markers));
    return;
}

/* Метод обновления координат в объекте массива markers_arr и localStorage */
function updateMarkerLatlng(marker) {
    var i = 0;
    markers_arr.forEach(function(item){
        if(item.id = marker.marker_id) {
            markers_arr[i].lat = marker.marker_lat;
            markers_arr[i].lng = marker.marker_lng;
            saveToLocalStorage(markers_arr);
            return; 
        }
        i++;
    });
    return;
}
/* Метод создает маркер на карте и добавляет к нему попап */
function createMarkerOnMap(data) {
    var marker = L.marker([data.lat, data.lng], { draggable: true })
    .addTo(map)
    .bindPopup('<b>Название:</b> ' + data.name + '<br><b>Описание:</b> ' + data.description + '<br><b>Координаты:</b> <span id="span_lat_' + data.id +'"></span>, <span id="span_lng_' + data.id + '"></span><br><a href="#" id="marker-edit-button"><span class="fa fa-pencil" aria-hidden="true"></span></a> <a href="#" id="marker-delete-button"><span class="fa fa-trash" aria-hidden="true"></span></a>');
    /* добавляем идентификатор маркера в сам объект маркера */
    marker.marker_id = data.id;
    marker.marker_lat = data.lat;
    marker.marker_lng = data.lng;
    /* включаем отслеживание открытия попапа маркера */
    marker.on("popupopen", onPopupOpen);
    /* включаем отслеживание переноса маркера */
    marker.on("drag", onDragMarker);
    return;
}