/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    var button = document.getElementById("hmc-fechas-btn");
    button.addEventListener("click", (e) => {
        /**
         * Insert the page-hiding CSS into the active tab,
         * then get the beast URL and
         * send a "beastify" message to the content script in the active tab.
         */
        function hackMisComprobantes(tabs) {
            browser.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                var fecha_ini = document.getElementById('hmc-fecha-ini').value;
                var fecha_fin = document.getElementById('hmc-fecha-fin').value;
                browser.tabs.sendMessage(tab.id, {
                    command: "buscar",
                    fechaIni: fecha_ini,
                    fechaFin: fecha_fin
                }).then(
                    browser.tabs.sendMessage(tab.id, {
                        command: "getIdsConsulta"
                    })
                ).then(
                    browser.tabs.sendMessage(tab.id, {
                        command: "getData"
                    })
                ).then(
                    browser.tabs.sendMessage(tab.id, {
                        command: "saveFile"
                    })
                );
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