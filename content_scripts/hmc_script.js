let fechaOrigIni;
let fechaOrigFin;
let cvsData = '"Fecha","Tipo","Punto de Venta","Número Desde","Número Hasta","Cód. Autorización","Tipo Doc. Emisor","Nro. Doc. Emisor","Denominación Emisor","Tipo Cambio","Moneda","Imp. Neto Gravado","Imp. Neto No Gravado","Imp. Op. Exentas","IVA","Imp. Total"'
/**
 * Listen for messages from the background script.
 * Call "buscar".
 */
browser.runtime.onMessage.addListener(message => {
    switch (message.command) {
        case "buscar":
            buscar(message.fechaIni, message.fechaFin);
            break;
        case "getData":
            getData();
            break;
        case "saveFile":
            saveFile();
            break;
    };
});

/**
 * Busca para todos los períodos 
 * comprendidos entre las fechas ingresadas
 */
function buscar(fechaIni, fechaFin) {
    var fechaIniPart = fechaIni.split('-');
    var fechaFinPart = fechaFin.split('-');
    var fechaIniDate = new Date(fechaIniPart[0], fechaIniPart[1] - 1, fechaIniPart[2]);
    var fechaFinDate = new Date(fechaFinPart[0], fechaFinPart[1] - 1, fechaFinPart[2]);
    fechaOrigIni = fechaIniDate;
    fechaOrigFin = fechaFinDate;

    var repetir = Math.round((fechaFinDate - fechaIniDate) / (1000 * 3600 * 24) / 30);
    var msjAlert = 'Se generaron las siguientes consultas en el historial:';

    for (i = 0; i < repetir; i++) {
        fechaFinDate = new Date(fechaIniDate);
        fechaFinDate = new Date(fechaFinDate.getFullYear(), fechaFinDate.getMonth() + 1, 0);
        if (fechaFinDate > fechaOrigFin) { fechaFinDate = fechaOrigFin };

        var fechaIniForm = fechaIniDate.getDate().toString().padStart(2, 0) + '/' + (fechaIniDate.getMonth() + 1).toString().padStart(2, 0) + '/' + fechaIniDate.getFullYear();
        console.log(`fechaIniForm ${i}: ${fechaIniForm}`);
        var fechaFinForm = (fechaFinDate.getDate()).toString().padStart(2, 0) + '/' + (fechaFinDate.getMonth() + 1).toString().padStart(2, 0) + '/' + fechaFinDate.getFullYear();
        console.log(`fechaFinForm ${i}: ${fechaFinForm}`);

        // document.getElementById("fechaEmision").value = fechaIniForm + " - " + fechaFinForm;

        // document.getElementById('buscarComprobantes').click();

        //msjAlert = msjAlert + '\n' + (fechaIniForm + " - " + fechaFinForm);
        //msjAlert += `\n${fechaIniForm} - ${fechaFinForm}`;
        fechaIniDate = new Date(fechaFinDate.setDate(fechaFinDate.getDate() + 1));
    };

    //alert(msjAlert);
    document.getElementById('linkTabHistorial').click();
}

function getData() {
    var dataConsulta = document.querySelectorAll("[data-id-consulta]");
    dataConsulta.forEach(consulta => {
        var idConsulta = consulta.getAttribute("data-id-consulta")
        var url = `https://serviciosjava2.afip.gob.ar/mcmp/jsp/ajax.do?f=listaResultados&id=${idConsulta}`;
        console.log(`ejecutando ${idConsulta}`);
        fetch(url)
            .then(response => response.json())
            .then(json => {
                var data = json.datos.data;
                data.forEach(element => {
                    cvsData += `\n"${element[0]}","${element[1]}","${element[3]}","${element[4]}","${element[5]}","${element[8]}","${element[10]}","${element[11]}","${element[12]}","${element[13]}","${element[14]}","${element[15]}","${element[17]}","${element[19]}","${element[21]}","${element[23]}"`;
                });
            });
    });
}

function saveFile() {
    console.log("save file!");
    console.log(cvsData);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(cvsData);
    hiddenElement.target = '_blank';

    //provide the name for the CSV file to be downloaded  
    hiddenElement.download = `CUIT 2030073912 | ${fechaIniForm} - ${fechaFinForm}`;
    hiddenElement.click();
}