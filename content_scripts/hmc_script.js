var fechaOrigIni;
var fechaOrigFin;
var mesesConsulta;
var idsConsulta;
var cvsData = '"Fecha","Tipo","Punto de Venta","Numero Desde","Numero Hasta","Cod. Autorizacion","Tipo Doc. Emisor","Nro. Doc. Emisor","Denominacion Emisor","Tipo Cambio","Moneda","Imp. Neto Gravado","Imp. Neto No Gravado","Imp. Op. Exentas","IVA","Imp. Total"'
/**
 * Listen for messages from the background script.
 * Call "buscar".
 */
browser.runtime.onMessage.addListener(message => {
    switch (message.command) {
        case "buscar":
            buscar(message.fechaIni, message.fechaFin);
            break;
        case "downloadFile":
            downloadFile();
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

    mesesConsulta = Math.round((fechaFinDate - fechaIniDate) / (1000 * 3600 * 24) / 30);

    for (i = 0; i < mesesConsulta; i++) {
        fechaFinDate = new Date(fechaIniDate);
        fechaFinDate = new Date(fechaFinDate.getFullYear(), fechaFinDate.getMonth() + 1, 0);

        if (fechaFinDate >= fechaOrigFin) { fechaFinDate = fechaOrigFin };

        var fechaIniForm = fechaIniDate.getDate().toString().padStart(2, 0) + '/' + (fechaIniDate.getMonth() + 1).toString().padStart(2, 0) + '/' + fechaIniDate.getFullYear();
        var fechaFinForm = (fechaFinDate.getDate()).toString().padStart(2, 0) + '/' + (fechaFinDate.getMonth() + 1).toString().padStart(2, 0) + '/' + fechaFinDate.getFullYear();

        document.getElementById("fechaEmision").value = fechaIniForm + " - " + fechaFinForm;

        document.getElementById('buscarComprobantes').click();

        fechaIniDate = new Date(fechaFinDate.setDate(fechaFinDate.getDate() + 1));
    };

    document.getElementById('linkTabHistorial').click();
}

/**
 * Here is where the magic happens
 */
async function downloadFile() {
    const urlConsulta = "https://serviciosjava2.afip.gob.ar/mcmp/jsp/ajax.do?f=listaConsultas&t=R";
    let responseListaConsulta = await fetch(urlConsulta);
    let json = await responseListaConsulta.json();
    let datos = json.datos;
    idsConsulta = [];
    for (let i = 0; i < datos.length; i++) {
        idsConsulta.push(datos[i].codigo);
    };

    for (let i = 0; i < mesesConsulta; i++) {
        var url = `https://serviciosjava2.afip.gob.ar/mcmp/jsp/ajax.do?f=listaResultados&id=${idsConsulta[i]}`;
        var responseListaResultados = await fetch(url);
        var json2 = await responseListaResultados.json();
        var data = await json2.datos.data;
        data.forEach(element => {
            cvsData += `\n"${element[0]}","${element[1]}","${element[3]}","${element[4]}","${element[5]}","${element[8]}","${element[10]}","${element[11]}","${element[12]}","${element[13]}","${element[14]}","${element[15]}","${element[17]}","${element[19]}","${element[21]}","${element[23]}"`;
        });
    };
    saveFile()
}

function saveFile() {
    cvsData = 'data:text/csv;charset=utf-8,\n' + cvsData;
    var encodedUri = encodeURI(cvsData);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    var fechaIniForm = fechaOrigIni.getDate().toString().padStart(2, 0) + '-' + (fechaOrigIni.getMonth() + 1).toString().padStart(2, 0) + '-' + fechaOrigIni.getFullYear();
    var fechaFinForm = (fechaOrigFin.getDate()).toString().padStart(2, 0) + '-' + (fechaOrigFin.getMonth() + 1).toString().padStart(2, 0) + '-' + fechaOrigFin.getFullYear();

    var nombre = document.querySelector("#usernav .text-primary").textContent;
    link.setAttribute("download", `${nombre} | ${fechaIniForm} - ${fechaFinForm}`);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "my_data.csv".
}