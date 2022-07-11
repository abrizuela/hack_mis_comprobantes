/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    var button = document.getElementById("hmc-hack-btn");
    button.addEventListener("click", (e) => {
        function hackMisComprobantes(tabs) {
            browser.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                var fechaIni = document.getElementById('hmc-fecha-ini').value;
                var fechaFin = document.getElementById('hmc-fecha-fin').value;
                var tipoConsulta = document.querySelector('input[name="hmc-tipo-consulta"]:checked').value;
                var tipoArchivo  =document.querySelector('input[name="hmc-tipo-archivo"]:checked').value;

                browser.tabs.sendMessage(tab.id, {
                    command: "doTheMagic",
                    fechaIni: fechaIni,
                    fechaFin: fechaFin,
                    tipoConsulta: tipoConsulta,
                    tipoArchivo: tipoArchivo
                });
            });
        }

        /**
         * Just log the error to the console.
         */
        function reportError(error) {
            console.error(`Could not Hack Mis Comprobantes: ${error}`);
        }

        /**
         * Get the active tab,
         * then call "()" or "reset()" as appropriate.
         */

        browser.tabs.query({ active: true, currentWindow: true })
            .then(hackMisComprobantes)
            .catch(reportError);
    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message
 */
function reportExecuteScriptError(error) {
    document.querySelector("#hmc-message").classList.remove("hidden");
    console.error(`Failed to execute Hack Mis Comprobantes content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: "/content_scripts/hmc_script.js" })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);