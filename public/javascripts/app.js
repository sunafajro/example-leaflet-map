/* задаем текущий режим карты */
var map_mode = 'read';

/* создаем карту, отправная точка г. Чебоксары */
var map = L.map('mapid').setView([56.12, 47.24], 13);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { 
    attribution: '© OpenStreetMap' 
}).addTo(map);

/* отслеживаем клик по кнпоке для переключения режима работы с картой */
$('#btn-mode').click(function(){
    map_mode = (map_mode == 'write') ? 'read' : 'write';
    $('.leaflet-control-custom').text((map_mode == 'write') ? 'W' : 'R');
    /* убираем маркеры с карты */
    clearMarkers();
    /* выводим маркеры по новой */
    printMarkers();
    $('.leaflet-control-custom').removeClass((map_mode == 'write') ? 'writeOff' : 'writeOn').addClass((map_mode == 'write') ? 'writeOn' : 'writeOff');
    /* Прячем блок и удаляем содержимое */
    clearMarkerForm();
});

/* запускаем отсележивание кликов по карте */
map.on('click', onMapClick);

/** 
 *  Cоздаем массив для хранения объектов маркеров
 *  Проверяем localStorage на предмет сохраненных маркеров
 *  и заполняем массив ими. 
 */
var markers_arr = loadMarkers();

/* Распечатываем маркеры на карту */
printMarkers();

/* Метод обрабатки клика по карте и добавления нового маркера */
function onMapClick(e) {
    /* если режим редактирования карты, добавляем новый указатель */
    if(map_mode == 'write') {
        var marker_obj = {
            'lat': e.latlng.lat,
            'lng': e.latlng.lng,
            'name': 'Без имени',
            'description': 'Без описания',
            'id': new Date().getTime()
        }
        /* создаем маркер */
        var marker = createMarkerOnMap(marker_obj);
        marker.openPopup();
        /* открываем форму редактирования имени и описания */
        editMarkerForm(marker);
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
                'description': data.description,
                'id': data.id
            });
        });
    }
    return result;
}

/* Метод для размещения массива маркеров на карте */
function printMarkers() {
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
    saveToLocalStorage();
    return;
}

/* Метод обработки открытия попапа маркера */
function onPopupOpen() {
    var tempMarker = this;
    /* при открытии попапа на лету обновляем данные маркера */
    $('#span_name_' + tempMarker.marker_id).text(tempMarker.marker_name);
    $('#span_description_' + tempMarker.marker_id).text(tempMarker.marker_description);
    $('#span_lat_' + tempMarker.marker_id).text(tempMarker.marker_lat.toFixed(2));
    $('#span_lng_' + tempMarker.marker_id).text(tempMarker.marker_lng.toFixed(2));
    /*  При нажатии на кнопку удалить, убираем маркер с карты и удаляем обект из массива и localStorage */
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
        saveToLocalStorage();
        /* Удаляем маркер с карты */
        map.removeLayer(tempMarker);
    });
    /* При нажатии на кнопку редактирования выводим форму редактирования имени и описания маркера */
    $("#marker-edit-button:visible").click(function () {
        editMarkerForm(tempMarker);
    });
    return;
}

/* Метод обработки события переноса маркера на карте */
function onDragMarker(e) {
    var marker = e.target;   
    var position = marker.getLatLng();
    marker.marker_lat = position.lat;
    marker.marker_lng = position.lng;
    updateMarker(marker);
    return;
}

/* Метод сохранения данные массива markers_arr в localStorage */
function saveToLocalStorage() {
    var markers = [];
    markers_arr.forEach(function(item) {
        markers.push(JSON.stringify(item));
    });
    localStorage.setItem('markers', JSON.stringify(markers));
    return;
}

/* Метод обновления координат в объекте массива markers_arr и localStorage */
function updateMarker(marker) {
    markers_arr.forEach(function(item){
        if(item.id == marker.marker_id) {
            item.name = marker.marker_name;
            item.description = marker.marker_description;
            item.lat = marker.marker_lat;
            item.lng = marker.marker_lng;
            return; 
        }
    });
    saveToLocalStorage(markers_arr);
    return;
}
/* Метод создает маркер на карте и добавляет к нему попап */
function createMarkerOnMap(data) {
    if(map_mode == 'write') {
        var draggable = { draggable: 'true' }
        var popup_string = '<b>Название:</b> <span id="span_name_' + data.id +'">none</span><br><b>Описание:</b> <span id="span_description_' + data.id +'">none</span><br><b>Координаты:</b> <span id="span_lat_' + data.id +'">0</span>, <span id="span_lng_' + data.id + '">0</span><br><a href="#" id="marker-edit-button"><span class="fa fa-pencil" aria-hidden="true"></span></a> <a href="#" id="marker-delete-button"><span class="fa fa-trash" aria-hidden="true"></span></a>';
    } else {
        var draggable = {}
        var popup_string = '<b>Название:</b> <span id="span_name_' + data.id +'">none</span><br><b>Описание:</b> <span id="span_description_' + data.id +'">none</span><br><b>Координаты:</b> <span id="span_lat_' + data.id +'">0</span>, <span id="span_lng_' + data.id + '">0</span>';
    }
    var marker = L.marker([data.lat, data.lng], draggable)
    .addTo(map)
    .bindPopup(popup_string);
    /* добавляем идентификатор маркера в сам объект маркера */
    marker.marker_id = data.id;
    marker.marker_lat = data.lat;
    marker.marker_lng = data.lng;
    marker.marker_name = data.name;
    marker.marker_description = data.description;
    /* включаем отслеживание открытия попапа маркера */
    marker.on("popupopen", onPopupOpen);
    if(map_mode == 'write') {
        /* включаем отслеживание переноса маркера */
        marker.on("drag", onDragMarker);
    }
    return marker;
}

/* Убираем все маркеры с карты */
function clearMarkers() {
    map.eachLayer(function (layer) {
        if(layer._latlng) {
            map.removeLayer(layer);
        }
    });
    return;
}

/* Метод генерирует форму редактирования имени и описания маркера */
function editMarkerForm(marker) {
    /* чистим блок и заполняем новыми полями */
    $('.form-input').empty();
    $('.form-input').append('<input id="field_marker_name" type="input" placeholder="Введите название" value="' + marker.marker_name +'">');
    $('.form-input').append('<input id="field_marker_description" type="input" placeholder="Введите описание" value="' + marker.marker_description +'">');
    $('.form-input').append('<button id="btn-save" type="submit">Сохранить</button>');
    $('.form-input').append('<button id="btn-close" type="submit">Закрыть</button>');
    /* Отслеживаем нажатие кнопки Сохранить и применяем новые данные */
    $('#btn-save').click(function(){
        marker.marker_name = $('#field_marker_name').val();
        $('#span_name_' + marker.marker_id).text(marker.marker_name);
        marker.marker_description = $('#field_marker_description').val();
        $('#span_description_' + marker.marker_id).text(marker.marker_description);          
        updateMarker(marker);
        /* Прячем блок и удаляем содержимое */
        clearMarkerForm();
    });
    /* Показываем форму */
    $('.form-input').show();
    $('#btn-close').click(function(){
        /* Прячем блок и удаляем содержимое */
        clearMarkerForm();
    });
}

/* Метод прячет блок формы и удаляет элементы внутри блока */
function clearMarkerForm() {
    $('.form-input').hide();
    $('.form-input').empty();
}