
var test = null;

var state = document.getElementById('content-capture');

var myVal = ""; // Drop down selected value of reader 
var disabled = true;
var startEnroll = false;

var currentFormat = Fingerprint.SampleFormat.PngImage;
var deviceTechn = {
               0: "Unknown",
               1: "Optical",
               2: "Capacitive",
               3: "Thermal",
               4: "Pressure"
            }

var deviceModality = {
               0: "Unknown",
               1: "Swipe",
               2: "Area",
               3: "AreaMultifinger"
            }

var deviceUidType = {
               0: "Persistent",
               1: "Volatile"
            }

var FingerprintSdkTest = (function () {
    function FingerprintSdkTest() {
        var _instance = this;
        this.operationToRestart = null;
        this.acquisitionStarted = false;
        this.sdk = new Fingerprint.WebApi;
        this.sdk.onDeviceConnected = function (e) {
            // Detects if the deveice is connected for which acquisition started
            showMessage("Escanea tu dedo");
        };
        this.sdk.onDeviceDisconnected = function (e) {
            // Detects if device gets disconnected - provides deviceUid of disconnected device
            showMessage("Dispositivo Desconectado");
        };
        this.sdk.onCommunicationFailed = function (e) {
            // Detects if there is a failure in communicating with U.R.U web SDK
            showMessage("La comunicacion falló")
        };
        this.sdk.onSamplesAcquired = function (s) {
            // Sample acquired event triggers this function
                sampleAcquired(s);
        };
        this.sdk.onQualityReported = function (e) {
            // Quality of sample aquired - Function triggered on every sample acquired
                document.getElementById("qualityInputBox").value = Fingerprint.QualityCode[(e.quality)];
        }

    }

    FingerprintSdkTest.prototype.startCapture = function () {
        if (this.acquisitionStarted) // Monitoring if already started capturing
            return;
        var _instance = this;
        showMessage("");
        this.operationToRestart = this.startCapture;
        this.sdk.startAcquisition(currentFormat, myVal).then(function () {
            _instance.acquisitionStarted = true;

            //Disabling start once started
            disableEnableStartStop();

        }, function (error) {
            showMessage(error.message);
        });
    };
    FingerprintSdkTest.prototype.stopCapture = function () {
        if (!this.acquisitionStarted) //Monitor if already stopped capturing
            return;
        var _instance = this;
        showMessage("");
        this.sdk.stopAcquisition().then(function () {
            _instance.acquisitionStarted = false;

            //Disabling stop once stoped
            disableEnableStartStop();

        }, function (error) {
            showMessage(error.message);
        });
    };

    FingerprintSdkTest.prototype.getInfo = function () {
        var _instance = this;
        return this.sdk.enumerateDevices();
    };

    FingerprintSdkTest.prototype.getDeviceInfoWithID = function (uid) {
        var _instance = this;
        return  this.sdk.getDeviceInfo(uid);
    };

    
    return FingerprintSdkTest;
})();

function showMessage(message){
    var _instance = this;
    //var statusWindow = document.getElementById("status");
    x = state.querySelectorAll("#status");
    if(x.length != 0){
        x[0].innerHTML = message;
    }
}

window.onload = function () {
    localStorage.clear();
    test = new FingerprintSdkTest();
    readersDropDownPopulate(true); //To populate readers for drop down selection
    disableEnable(); // Disabling enabling buttons - if reader not selected
    enableDisableScanQualityDiv("content-reader"); // To enable disable scan quality div
    disableEnableExport(true);
};

function onStart() {
    assignFormat();
    test.startCapture(); 
}

function onStop() {
    test.stopCapture();
}

function onGetInfo() {
    var allReaders = test.getInfo();    
    allReaders.then(function (sucessObj) {
        populateReaders(sucessObj);
    }, function (error){
        showMessage(error.message);
    });
}
function onDeviceInfo(id, element){
    var myDeviceVal = test.getDeviceInfoWithID(id);
    myDeviceVal.then(function (sucessObj) {
            console.log('sucessObj', sucessObj);
            var deviceId = sucessObj.DeviceID;
            var uidTyp = deviceUidType[sucessObj.eUidType];
            var modality = deviceModality[sucessObj.eDeviceModality];
            var deviceTech = deviceTechn[sucessObj.eDeviceTech];
            //Another method to get Device technology directly from SDK
            //Uncomment the below logging messages to see it working, Similarly for DeviceUidType and DeviceModality
            //console.log(Fingerprint.DeviceTechnology[sucessObj.eDeviceTech]);            
            //console.log(Fingerprint.DeviceModality[sucessObj.eDeviceModality]);
            //console.log(Fingerprint.DeviceUidType[sucessObj.eUidType]);
            var retutnVal = //"Device Info -"
                 "Id : " +  deviceId
                +"<br> Uid Type : "+ uidTyp
                +"<br> Device Tech : " +  deviceTech
                +"<br> Device Modality : " +  modality;

            document.getElementById(element).innerHTML = retutnVal;

        }, function (error){
            showMessage(error.message);
        });

}
function onClear() {
         var vDiv = document.getElementById('imagediv');
         vDiv.innerHTML = "";
         localStorage.setItem("imageSrc", "");
         localStorage.setItem("wsq", "");
         localStorage.setItem("raw", "");
         localStorage.setItem("intermediate", "");

         disableEnableExport(true);
}

function toggle_visibility(ids) {
    document.getElementById("qualityInputBox").value = "";
    onStop();
    enableDisableScanQualityDiv(ids[0]); // To enable disable scan quality div
    for (var i=0;i<ids.length;i++) {        
       var e = document.getElementById(ids[i]);
        if(i == 0){
            e.style.display = 'block';
            state = e;
            disableEnable();
        }
       else{
            e.style.display = 'none';
       }
   }
}


$("#save").on("click",function(){
    if(localStorage.getItem("imageSrc") == "" || localStorage.getItem("imageSrc") == null || document.getElementById('imagediv').innerHTML == ""){
        alert("Error -> Fingerprint not available");
    }else{
        var vDiv = document.getElementById('imageGallery');
        if(vDiv.children.length < 5){
            var image = document.createElement("img");
            image.id = "galleryImage";
            image.className = "img-thumbnail";
            image.src = localStorage.getItem("imageSrc");
            vDiv.appendChild(image);

            localStorage.setItem("imageSrc"+vDiv.children.length,localStorage.getItem("imageSrc"));
        }else{
            document.getElementById('imageGallery').innerHTML = "";
            $("#save").click();
        }
    }
});

function populateReaders(readersArray) {
        var _deviceInfoTable = document.getElementById("deviceInfo");
        _deviceInfoTable.innerHTML = "";
        if(readersArray.length != 0){
            _deviceInfoTable.innerHTML += "<h4>Available Readers</h4>"
            for (i=0;i<readersArray.length;i++){ 
                _deviceInfoTable.innerHTML += 
                "<div id='dynamicInfoDivs' align='left'>"+
                    "<div data-toggle='collapse' data-target='#"+readersArray[i]+"'>"+
                        "<img src='images/info.png' alt='Info' height='20' width='20'> &nbsp; &nbsp;"+readersArray[i]+"</div>"+
                        "<p class='collapse' id="+'"' + readersArray[i] + '"'+">"+onDeviceInfo(readersArray[i],readersArray[i])+"</p>"+
                    "</div>";
            }
        }
    };

function sampleAcquired(s){   
            if(currentFormat == Fingerprint.SampleFormat.PngImage){   
            // If sample acquired format is PNG- perform following call on object recieved 
            // Get samples from the object - get 0th element of samples as base 64 encoded PNG image         
                localStorage.setItem("imageSrc", "");                
                var samples = JSON.parse(s.samples);            
                localStorage.setItem("imageSrc", "data:image/png;base64," + Fingerprint.b64UrlTo64(samples[0]));
                if(state == document.getElementById("content-capture")){ 
                    var vDiv = document.getElementById('imagediv');
                    vDiv.innerHTML = "";
                    var image = document.createElement("img");
                    image.id = "image";
                    image.src = localStorage.getItem("imageSrc");
                    vDiv.appendChild(image); 
                }

                disableEnableExport(false);
            }

            else if(currentFormat == Fingerprint.SampleFormat.Raw){  
                // If sample acquired format is RAW- perform following call on object recieved 
                // Get samples from the object - get 0th element of samples and then get Data from it.
                // Returned data is Base 64 encoded, which needs to get decoded to UTF8,
                // after decoding get Data key from it, it returns Base64 encoded raw image data
                localStorage.setItem("raw", "");
                var samples = JSON.parse(s.samples);
                var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
                var decodedData = JSON.parse(Fingerprint.b64UrlToUtf8(sampleData));
                localStorage.setItem("raw", Fingerprint.b64UrlTo64(decodedData.Data));

                var vDiv = document.getElementById('imagediv').innerHTML = '<div id="animateText" style="display:none">RAW Sample Acquired <br>'+Date()+'</div>';
                setTimeout('delayAnimate("animateText","table-cell")',100); 

                disableEnableExport(false);
            }

            else if(currentFormat == Fingerprint.SampleFormat.Compressed){  
                // If sample acquired format is Compressed- perform following call on object recieved 
                // Get samples from the object - get 0th element of samples and then get Data from it.
                // Returned data is Base 64 encoded, which needs to get decoded to UTF8,
                // after decoding get Data key from it, it returns Base64 encoded wsq image
                localStorage.setItem("wsq", "");
                var samples = JSON.parse(s.samples);
                var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
                var decodedData = JSON.parse(Fingerprint.b64UrlToUtf8(sampleData));
                localStorage.setItem("wsq","data:application/octet-stream;base64," + Fingerprint.b64UrlTo64(decodedData.Data));

                var vDiv = document.getElementById('imagediv').innerHTML = '<div id="animateText" style="display:none">WSQ Sample Acquired <br>'+Date()+'</div>';
                setTimeout('delayAnimate("animateText","table-cell")',100);   

                disableEnableExport(false);
            }

            else if(currentFormat == Fingerprint.SampleFormat.Intermediate){  
                // If sample acquired format is Intermediate- perform following call on object recieved 
                // Get samples from the object - get 0th element of samples and then get Data from it.
                // It returns Base64 encoded feature set
                localStorage.setItem("intermediate", "");
                var samples = JSON.parse(s.samples);
                var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
                localStorage.setItem("intermediate", sampleData);

                var vDiv = document.getElementById('imagediv').innerHTML = '<div id="animateText" style="display:none">Intermediate Sample Acquired <br>'+Date()+'</div>';
                setTimeout('delayAnimate("animateText","table-cell")',100); 

                disableEnableExport(false);
            }

            else{
                alert("Format Error");
                //disableEnableExport(true);
            }    
}

function readersDropDownPopulate(checkForRedirecting){ // Check for redirecting is a boolean value which monitors to redirect to content tab or not
    myVal = "";
    var allReaders = test.getInfo();
    allReaders.then(function (sucessObj) {        
        var readersDropDownElement = document.getElementById("readersDropDown");
        readersDropDownElement.innerHTML ="";
        //First ELement
        var option = document.createElement("option");
        option.selected = "selected";
        option.value = "";
        option.text = "Selecciona Lector";
        readersDropDownElement.add(option);
        for (i=0;i<sucessObj.length;i++){ 
            var option = document.createElement("option");
            option.value = sucessObj[i];
            option.text = 'Digital Persona (' + sucessObj[i] + ')';
            readersDropDownElement.add(option);
        }

    //Check if readers are available get count and  provide user information if no reader available, 
    //if only one reader available then select the reader by default and sennd user to capture tab
    checkReaderCount(sucessObj,checkForRedirecting);

    }, function (error){
        showMessage(error.message);
    });
}

function checkReaderCount(sucessObj,checkForRedirecting){
   if(sucessObj.length == 0){
    alert("No se detectaron lectores. Por favor conecta un lector.");
   }else if(sucessObj.length == 1){
        document.getElementById("readersDropDown").selectedIndex = "1";
        if(checkForRedirecting){
            toggle_visibility(['content-capture','content-reader']);    
            enableDisableScanQualityDiv("content-capture"); // To enable disable scan quality div
            setActive('Capture','Reader'); // Set active state to capture
        }
   }

    selectChangeEvent(); // To make the reader selected
}

function selectChangeEvent(){
    var readersDropDownElement = document.getElementById("readersDropDown");
    myVal = readersDropDownElement.options[readersDropDownElement.selectedIndex].value;
    disableEnable();
    onClear();
    document.getElementById('imageGallery').innerHTML = "";

    //Make capabilities button disable if no user selected
    if(myVal == ""){
        $('#capabilities').prop('disabled', true);
    }else{
        $('#capabilities').prop('disabled', false);
    }
}

function populatePopUpModal(){
    var modelWindowElement = document.getElementById("ReaderInformationFromDropDown");
    modelWindowElement.innerHTML = "";
    if(myVal != ""){
        onDeviceInfo(myVal,"ReaderInformationFromDropDown");
    }else{
        modelWindowElement.innerHTML = "Por favor selecciona un lector";
    }
}

//Enable disable buttons
function disableEnable(){

    if(myVal != ""){
        disabled = false;
        $('#start').prop('disabled', false);
        $('#stop').prop('disabled', false);
        showMessage("");
        disableEnableStartStop();
    }else{
        disabled = true;
        $('#start').prop('disabled', true);
        $('#stop').prop('disabled', true);
        showMessage("Por favor selecciona un lector");
        onStop();
    }
}


// Start-- Optional to make GUi user frindly 
//To make Start and stop buttons selection mutually exclusive
$('body').click(function(){disableEnableStartStop();});

function disableEnableStartStop(){
     if(!myVal == ""){
        if(test.acquisitionStarted){
            $('#start').prop('disabled', true);
            $('#stop').prop('disabled', false);
        }else{
            $('#start').prop('disabled', false);
            $('#stop').prop('disabled', true); 
        }
    }
}

// Stop-- Optional to make GUI user freindly


function enableDisableScanQualityDiv(id){
    if(id == "content-reader"){
        document.getElementById('Scores').style.display = 'none';
    }else{
        document.getElementById('Scores').style.display = 'block';
    }
}


function setActive(element1,element2){
    document.getElementById(element2).className = "";

    // And make this active
   document.getElementById(element1).className = "active";

}



// For Download and formats starts

function onImageDownload(){
    if(currentFormat == Fingerprint.SampleFormat.PngImage){
        if(localStorage.getItem("imageSrc") == "" || localStorage.getItem("imageSrc") == null || document.getElementById('imagediv').innerHTML == "" ){
           alert("No image to download");
        }else{
            //alert(localStorage.getItem("imageSrc"));
            downloadURI(localStorage.getItem("imageSrc"), "sampleImage.png", "image/png");
        }
    }

    else if(currentFormat == Fingerprint.SampleFormat.Compressed){
         if(localStorage.getItem("wsq") == "" || localStorage.getItem("wsq") == null || document.getElementById('imagediv').innerHTML == "" ){
           alert("WSQ data not available.");
        }else{
            downloadURI(localStorage.getItem("wsq"), "compressed.wsq","application/octet-stream");
        }
    }

    else if(currentFormat == Fingerprint.SampleFormat.Raw){
         if(localStorage.getItem("raw") == "" || localStorage.getItem("raw") == null || document.getElementById('imagediv').innerHTML == "" ){
           alert("RAW data not available.");
        }else{

            downloadURI("data:application/octet-stream;base64,"+localStorage.getItem("raw"), "rawImage.raw", "application/octet-stream");
        }
    }

    else if(currentFormat == Fingerprint.SampleFormat.Intermediate){
         if(localStorage.getItem("intermediate") == "" || localStorage.getItem("intermediate") == null || document.getElementById('imagediv').innerHTML == "" ){
           alert("Intermediate data not available.");
        }else{

            downloadURI("data:application/octet-stream;base64,"+localStorage.getItem("intermediate"), "FeatureSet.bin", "application/octet-stream");
        }
    }

    else{
        alert("Nothing to download.");
    }
}


function downloadURI(uri, name, dataURIType) {
    if (IeVersionInfo() > 0){ 
    //alert("This is IE " + IeVersionInfo());
    var blob = dataURItoBlob(uri,dataURIType);
    window.navigator.msSaveOrOpenBlob(blob, name);

    }else {
        //alert("This is not IE.");
        var save = document.createElement('a');
        save.href = uri;
        save.download = name;
        var event = document.createEvent("MouseEvents");
            event.initMouseEvent(
                    "click", true, false, window, 0, 0, 0, 0, 0
                    , false, false, false, false, 0, null
            );
        save.dispatchEvent(event);
    }
}

dataURItoBlob = function(dataURI, dataURIType) {
    var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: dataURIType});
}


function IeVersionInfo() {
  var sAgent = window.navigator.userAgent;
  var IEVersion = sAgent.indexOf("MSIE");

  // If IE, return version number.
  if (IEVersion > 0) 
    return parseInt(sAgent.substring(IEVersion+ 5, sAgent.indexOf(".", IEVersion)));

  // If IE 11 then look for Updated user agent string.
  else if (!!navigator.userAgent.match(/Trident\/7\./)) 
    return 11;

  // Quick and dirty test for Microsoft Edge
  else if (document.documentMode || /Edge/.test(navigator.userAgent))
    return 12;

  else
    return 0; //If not IE return 0
}


$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();   
});

function checkOnly(stayChecked)
{
    disableEnableExport(true);
    onClear();
    onStop();
with(document.myForm)
  {
  for(i = 0; i < elements.length; i++)
    {
    if(elements[i].checked == true && elements[i].name != stayChecked.name)
      {
      elements[i].checked = false;
      }
    }
    //Enable disable save button
    for(i = 0; i < elements.length; i++)
    {
    if(elements[i].checked == true)
      {
        if(elements[i].name =="PngImage"){
            disableEnableSaveThumbnails(false);
        }else{
            disableEnableSaveThumbnails(true);
        }
      }
    }
  }
}         

function assignFormat() {
    currentFormat = Fingerprint.SampleFormat.PngImage;
}


function disableEnableExport(val){
    if(val){
        $('#saveImagePng').prop('disabled', true);
    }else{
        $('#saveImagePng').prop('disabled', false); 
    }
}


function disableEnableSaveThumbnails(val){
    if(val){
        $('#save').prop('disabled', true);
    }else{
        $('#save').prop('disabled', false); 
    }
}


function delayAnimate(id,visibility)
{
   document.getElementById(id).style.display = visibility;
}

// Configuración de Entorno
const API_BASE_URL = "http://45.239.108.2:3001"; 
const API_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjkyLCJwZXJmaWxfaWQiOjQxLCJpYXQiOjE3ODQxNTI5NTF9.bLa26R39PbtkAuOJgVBG4p1WOxexKd_u591TAX1Qdm0"; // Reemplaza esto con tu token textual largo

let huellasCapturadas = []; 

// --- LÓGICA DE INTERFAZ Y PESTAÑAS ---

function setTabActive(activeId) {
    const tabs = ['Reader', 'Capture', 'RegistrarTab'];
    tabs.forEach(tab => {
        const el = document.getElementById(tab);
        if(el) el.className = (tab === activeId) ? "active" : "";
    });
}

setInterval(() => {
    const stateReg = document.getElementById('content-registrar');
    if (stateReg && stateReg.style.display === 'block') {
        const imgSrc = localStorage.getItem("imageSrc");
        const vDivReg = document.getElementById('imagediv-registrar');
        if (!imgSrc) {
            vDivReg.innerHTML = "";
        } else if (vDivReg.innerHTML === "" || !vDivReg.querySelector('img') || vDivReg.querySelector('img').src !== imgSrc) {
            vDivReg.innerHTML = `<img id="image-reg" src="${imgSrc}" style="max-width: 100%;">`;
        }
    }
}, 300);

function limpiarRegistrar() {
    const vDivReg = document.getElementById('imagediv-registrar');
    if(vDivReg) vDivReg.innerHTML = "";
}

// --- VALIDACIONES Y FORMATEO ---

function validarRUT(rut) {
    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rut)) return false;
    let tmp = rut.split('-');
    let digitoVerificador = tmp[1].toLowerCase();
    let rutNumerico = parseInt(tmp[0], 10);
    let m = 0, s = 1;
    for (; rutNumerico; rutNumerico = Math.floor(rutNumerico / 10)) {
        s = (s + rutNumerico % 10 * (9 - m++ % 6)) % 11;
    }
    const dvEsperado = s ? (s - 1).toString() : 'k';
    return dvEsperado === digitoVerificador;
}

const rutInput = document.getElementById('rut_cliente');
if (rutInput) {
    rutInput.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/[^0-9kK]/g, '');
        if (valor.length > 0) {
            let cuerpo = valor.slice(0, -1).replace(/[kK]/g, ''); 
            let finalChar = valor.slice(-1); 
            valor = (cuerpo + finalChar).substring(0, 9);
        }
        if (valor.length > 1) {
            const cuerpo = valor.slice(0, -1);
            const dv = valor.slice(-1).toUpperCase();
            e.target.value = `${cuerpo}-${dv}`;
        } else {
            e.target.value = valor.toUpperCase();
        }
        const rutCompleto = e.target.value;
        const errorSpan = document.getElementById('rut_error');
        errorSpan.style.display = (rutCompleto.length > 0 && !validarRUT(rutCompleto)) ? 'inline' : 'none';
    });
}

const recepcionInput = document.getElementById('id_recepcion');
if (recepcionInput) {
    recepcionInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

// --- SERVICIOS FETCH ---

async function buscarEnrolamientoPorHuella(huella) {
    if (!API_BEARER_TOKEN) throw new Error('No se configuró el token.');
    const response = await fetch(`${API_BASE_URL}/enrolamientoHuella/buscar`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${API_BEARER_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ huella })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor (Status: ${response.status})`);
    }
    if (!response.ok) throw new Error("Error al buscar (Status: " + response.status + ")");
    return await response.json(); 
}

async function crearEnrolamientoHuella(data) {
    if (!API_BEARER_TOKEN) throw new Error('No se configuró el token.');
    const response = await fetch(`${API_BASE_URL}/enrolamientoHuella/registrar`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${API_BEARER_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Error al registrar (Status: " + response.status + ")");
    return await response.json();
}

async function firmarRecepcionBackend(idRecepcion, base64Huella) {
    if (!API_BEARER_TOKEN) throw new Error('No se configuró el token de autenticación.');

    const response = await fetch(`${API_BASE_URL}/recepcionMuestra/${idRecepcion}`, {
        method: "PATCH",
        headers: {
            'Authorization': `Bearer ${API_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firmaCliente: base64Huella,
            type: "ENROLAMIENTO" 
        })
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Error al firmar la recepción en el servidor.");
    }
    return await response.json();
}

// --- MECÁNICA DE MÚLTIPLES HUELLAS ---

function actualizarMiniaturas() {
    for (let i = 1; i <= 3; i++) {
        const thumb = document.getElementById(`thumb-${i}`);
        if (huellasCapturadas[i-1]) {
            thumb.innerHTML = `<img src="${huellasCapturadas[i-1]}" />`;
            thumb.style.borderColor = "#0ea5e9"; 
            thumb.style.background = "#f0f9ff";
        } else {
            thumb.innerHTML = i;
            thumb.style.borderColor = "#cbd5e1"; 
            thumb.style.background = "#f8fafc";
        }
    }
}

function confirmarHuellaIndividual() {
    const huellaActual = localStorage.getItem("imageSrc");
    
    if (!huellaActual) {
        Swal.fire("Atención", "No has escaneado ninguna huella.", "warning");
        return;
    }
    if (huellasCapturadas.length >= 3) {
        Swal.fire("¡Listo!", "Ya capturaste las 3 tomas.", "info");
        return;
    }

    huellasCapturadas.push(huellaActual);
    actualizarMiniaturas();
    
    onClear();
    limpiarRegistrar();

    Swal.fire({
        title: "Toma Exitosa",
        text: `Llevas ${huellasCapturadas.length} de 3 tomas.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false
    });
}

function reiniciarTomas() {
    huellasCapturadas = [];
    actualizarMiniaturas();
    onClear();
    limpiarRegistrar();
}

// --- CONTROLADORES DE LA UI ---

function simularHuella(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        localStorage.setItem("imageSrc", base64Image);
        const vDiv = document.getElementById('imagediv');
        if (vDiv) vDiv.innerHTML = `<img id="image" src="${base64Image}" style="max-width: 100%;">`;
        event.target.value = "";
    };
    reader.readAsDataURL(file);
}

async function enviarHuella() {
    const idRecepcion = document.getElementById("id_recepcion").value.trim();
    const huellaCruda = localStorage.getItem("imageSrc");

    const regexRecepcion = /^\d+$/;

    if (!idRecepcion || !regexRecepcion.test(idRecepcion)) {
        alert("Atención: Ingrese un ID de Recepción válido (Ej: 209). Solo ingrese números.");
        return;
    }
    if (!huellaCruda) {
        alert("Atención: No hay huella capturada. Por favor escanee o simule una huella primero.");
        return;
    }

    const huellaLimpia = huellaCruda.includes(",") ? huellaCruda.split(",")[1] : huellaCruda;

    try {
        const rawResponse = await buscarEnrolamientoPorHuella(huellaLimpia);
        const matchData = rawResponse.data ? rawResponse.data : rawResponse;

        if (matchData && matchData.match) {
            
            await firmarRecepcionBackend(idRecepcion, huellaLimpia);

            alert(`Firma Exitosa.\nCliente: ${matchData.nombre}\nRecepción Firmada: #${idRecepcion}`);
            
            onClear(); 
            document.getElementById("id_recepcion").value = "";
        } else {
            alert(`Firma Rechazada: ${matchData.mensaje || 'La huella no coincide con nuestros registros.'}`);
        }
    } catch (error) {
        console.error("Error en enviarHuella:", error);
        alert(error.message || "Falla de red: No se pudo conectar al servidor o la recepción no existe.");
    }
}

async function registrarHuella() {
    const rutCliente = document.getElementById("rut_cliente").value.trim();
    const nombreCliente = document.getElementById("nombre_cliente").value.trim();

    if (!rutCliente || !nombreCliente) { Swal.fire("Faltan Datos", "Complete RUT y Nombre.", "warning"); return; }
    if (!validarRUT(rutCliente)) { Swal.fire("RUT Inválido", "Verifique el formato.", "error"); return; }
    
    if (huellasCapturadas.length !== 3) { 
        Swal.fire("Incompleto", "Captura las 3 tomas requeridas.", "warning"); 
        return; 
    }

    Swal.fire({ title: 'Registrando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const huellasLimpias = huellasCapturadas.map(huella => 
            huella.includes(",") ? huella.split(",")[1] : huella
        );

        const dtoRegistro = {
            nombre: nombreCliente,
            rut: rutCliente,
            huella1: huellasLimpias[0],
            huella2: huellasLimpias[1],
            huella3: huellasLimpias[2]
        };

        await crearEnrolamientoHuella(dtoRegistro);
        
        Swal.fire("Enrolamiento Exitoso", "El cliente ha sido registrado con sus 3 huellas correctamente.", "success");
        reiniciarTomas();
        document.getElementById("rut_cliente").value = ""; 
        document.getElementById("nombre_cliente").value = "";
    } catch (error) {
        console.error("Error DETALLADO:", error);
        Swal.fire("Error", error.message, "error");
    }
}

window.alert = function(message) {
    Swal.fire({
        title: "Aviso del Lector",
        text: message,
        icon: "info",
        confirmButtonColor: '#0ea5e9'
    });
};

window.showMessage = function(message) {
    const globalStatusDiv = document.getElementById("global-status");
    if (globalStatusDiv) {
        if (message) {
            globalStatusDiv.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">info</span> ${message}`;
        } else {
            globalStatusDiv.innerHTML = "";
        }
    }
};

window.disableEnable = function() {
    if (myVal != "") {
        disabled = false;
        showMessage("");
    } else {
        disabled = true;
        showMessage("Lector no seleccionado. Por favor asigne uno en la pestaña Dispositivos.");
        onStop();
    }
};

window.disableEnableStartStop = function() {
};
