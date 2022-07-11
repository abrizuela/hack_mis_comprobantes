const urlMiscomprobantes = 'https://serviciosjava2.afip.gob.ar/mcmp/jsp/mostrarMenu.do';

function reportError(error) {
    var errorMessage = document.querySelector("#hmc-message");
    errorMessage.classList.remove("hidden");
    if (error === 'Error: Could not establish connection. Receiving end does not exist.') {
        error = 'No está logueado en la página de AFIP';
    }
    errorMessage.textContent = error;
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    function makeValidations(url, fechaIni, fechaFin) {
        if (url != urlMiscomprobantes) {
            return [false, "Debe estar en la página de AFIP de 'Mis Comprobantes'"];
        }

        if (fechaIni === '' || fechaFin === '') {
            return [false, "Las fechas son obligatorias"];
        }

        if (fechaIni > fechaFin) {
            return [false, "La 'Fecha desde' no puede ser posterior a la 'Fecha hasta'"];
        }

        return [true, "Haciendo magia..."];
    }

    function hackMisComprobantes() {
        browser.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            var fechaIni = document.getElementById('hmc-fecha-ini').value;
            var fechaFin = document.getElementById('hmc-fecha-fin').value;
            var tipoConsulta = document.querySelector('input[name="hmc-tipo-consulta"]:checked').value;
            var tipoArchivo = document.querySelector('input[name="hmc-tipo-archivo"]:checked').value;

            var [isValid, message] = makeValidations(tab.url, fechaIni, fechaFin);

            if (isValid) {
                button.value = message;
                button.classList.add("working");
                browser.tabs.sendMessage(tab.id, {
                    command: "doTheMagic",
                    fechaIni: fechaIni,
                    fechaFin: fechaFin,
                    tipoConsulta: tipoConsulta,
                    tipoArchivo: tipoArchivo
                })
                    .catch(reportError);
            } else {
                reportError(message);
            }
        });
    }


    var button = document.getElementById("hmc-hack-btn");
    button.addEventListener("click", hackMisComprobantes);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: "/content_scripts/hmc_script.js" })
    .then(listenForClicks)
    .catch(reportError);

let hoy = new Date();
document.getElementById('hmc-fecha-ini').value = `${hoy.getFullYear()}-01-01`;
document.getElementById('hmc-fecha-fin').value = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, 0)}-${hoy.getDate().toString().padStart(2, 0)}`;