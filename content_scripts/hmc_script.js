const urlApiAfipBase = "https://serviciosjava2.afip.gob.ar/mcmp/jsp/ajax.do?f=";
const archivoNombresColumnas = ["Fecha","Tipo","Punto de Venta","Numero Desde","Numero Hasta","Cod. Autorizacion","Tipo Doc. Emisor","Nro. Doc. Emisor","Denominacion Emisor","Tipo Cambio","Moneda","Imp. Neto Gravado","Imp. Neto No Gravado","Imp. Op. Exentas","IVA","Imp. Total"];

var fechaOrigIni;
var fechaOrigFin;
var mesesConsulta;
var idsConsulta;
var tipoConsultaNombre;
var tipoArchivoSeparador;
var datosArchivo;
/**
 * Listen for messages from the background script.
 * Call "doTheMagic".
 */
browser.runtime.onMessage.addListener(message => {
    switch (message.command) {
        case "doTheMagic":
            doTheMagic(message.fechaIni, message.fechaFin, message.tipoConsulta, message.tipoArchivo);
            break;
    };
});

/**
 * Busca para todos los períodos 
 * comprendidos entre las fechas ingresadas
 */
async function doTheMagic(fechaIni, fechaFin, tipoConsulta, tipoArchivo) {
    switch (tipoArchivo) {
        case "csv":
            tipoArchivoSeparador = ",";
            break;
        case "plain":
            tipoArchivoSeparador = "\t";
            break;
        default:
            tipoArchivoSeparador = ",";
            break;
    }

    datosArchivo = archivoNombresColumnas.join(tipoArchivoSeparador);

    var fechaIniPart = fechaIni.split('-');
    var fechaFinPart = fechaFin.split('-');
    var fechaIniDate = new Date(fechaIniPart[0], fechaIniPart[1] - 1, fechaIniPart[2]);
    var fechaFinDate = new Date(fechaFinPart[0], fechaFinPart[1] - 1, fechaFinPart[2]);
    fechaOrigIni = fechaIniDate;
    fechaOrigFin = fechaFinDate;

    switch (tipoConsulta) {
        case "E":
            tipoConsultaNombre = "Emitidos";
            break;
        case "R":
            tipoConsultaNombre = "Recibidos";
        default:
            break;
    }

    mesesConsulta = Math.round((fechaFinDate - fechaIniDate) / (1000 * 3600 * 24) / 30);
    idsConsulta = [];

    for (i = 0; i < mesesConsulta; i++) {
        fechaFinDate = new Date(fechaIniDate);
        fechaFinDate = new Date(fechaFinDate.getFullYear(), fechaFinDate.getMonth() + 1, 0);

        if (fechaFinDate >= fechaOrigFin) { fechaFinDate = fechaOrigFin };

        var fechaIniDay = fechaIniDate.getDate().toString().padStart(2, 0);
        var fechaIniMonth = (fechaIniDate.getMonth() + 1).toString().padStart(2, 0);
        var fechaIniYear = fechaIniDate.getFullYear()
        var fechaFinDay = (fechaFinDate.getDate()).toString().padStart(2, 0);
        var fechaFinMonth = (fechaFinDate.getMonth() + 1).toString().padStart(2, 0);
        var fechaFinYear = fechaFinDate.getFullYear()
        var fechaEmisionBusqueda = `${fechaIniDay}%2F${fechaIniMonth}%2F${fechaIniYear}+-+${fechaFinDay}%2F${fechaFinMonth}%2F${fechaFinYear}`;

        var url = `${urlApiAfipBase}generarConsulta&t=${tipoConsulta}&fechaEmision=${fechaEmisionBusqueda}&tiposComprobantes=`
        var idConsulta = await makeConsulta(url);

        idsConsulta.push(idConsulta);

        fechaIniDate = new Date(fechaFinDate.setDate(fechaFinDate.getDate() + 1));
    };

    await downloadFile();
    await saveFile(tipoArchivo);
}

async function makeConsulta(url) {
    let responseConsulta = await fetch(url);
    let json = await responseConsulta.json();

    return await json.datos.idConsulta;
}

/**
 * Here is where the magic happens
 */
async function downloadFile() {

    for (let i = 0; i < mesesConsulta; i++) {
        var url = `${urlApiAfipBase}listaResultados&id=${idsConsulta[i]}`;
        var responseListaResultados = await fetch(url);
        var json = await responseListaResultados.json();
        var data = await json.datos.data;
        data.forEach(element => {
            var datosArray = [element[0], element[1], element[3], element[4], element[5], element[8], element[10], element[11], element[12], element[13], element[14], element[15], element[17], element[19], element[21], element[23]];
            var data = datosArray.join(tipoArchivoSeparador);
            datosArchivo += `\n${data}`;
        });
    };

}

async function saveFile(tipoArchivo) {
    var file = `data:text/${tipoArchivo};charset=utf-8,` + datosArchivo;
    var encodedUri = encodeURI(file);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);

    var fechaIniForm = fechaOrigIni.getDate().toString().padStart(2, 0) + '-' + (fechaOrigIni.getMonth() + 1).toString().padStart(2, 0) + '-' + fechaOrigIni.getFullYear();
    var fechaFinForm = (fechaOrigFin.getDate()).toString().padStart(2, 0) + '-' + (fechaOrigFin.getMonth() + 1).toString().padStart(2, 0) + '-' + fechaOrigFin.getFullYear();

    var nombre = document.querySelector("#usernav .text-primary").textContent;
    link.setAttribute("download", `${nombre} - ${tipoConsultaNombre} - ${fechaIniForm} - ${fechaFinForm}`);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "my_data.csv".
}