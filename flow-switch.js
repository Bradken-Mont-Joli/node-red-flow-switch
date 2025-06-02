// Fichier : flow-switch.js
module.exports = function(RED) {
    // --- Chargement du catalogue de messages pour i18n ---
    var fs = require('fs');
    var path = require('path');
    var localesPath = path.join(__dirname, "locales");

    if (RED && typeof RED.i18n !== 'undefined' && typeof RED.i18n.registerMessageCatalog === 'function') {
        if (fs.existsSync(localesPath)) {
            try {
                RED.i18n.registerMessageCatalog("flow-switch", localesPath);
                console.log("[flow-switch] Message catalog successfully registered from:", localesPath);
            } catch (e) {
                console.error("[flow-switch] Error registering message catalog:", e);
                console.warn("[flow-switch] i18n may not work as expected due to an error during registration.");
            }
        } else {
            console.warn("[flow-switch] Locales directory not found at:", localesPath, "- Message catalog not registered. i18n will rely on default texts or show keys.");
        }
    } else {
        console.warn("[flow-switch] RED.i18n.registerMessageCatalog is not available. Skipping message catalog registration. All translations will be unavailable.");
    }
    // --- Fin du chargement du catalogue ---

    function FlowSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.name = config.name;

        // Lire le mode de déploiement et les états configurés
        node.deployMode = config.deployMode || "initialState"; // Valeur par défaut si non défini
        var deployStateBool = config.deployState === true || config.deployState === 'true';
        var activeButtonStateBool = config._activeButtonState === true || config._activeButtonState === 'true';

        // Initialiser l'état actif du nœud (node.active) en fonction du deployMode
        if (node.deployMode === "lastState") {
            // Si le mode est de conserver le dernier état, initialiser avec _activeButtonState
            // (qui était l'état du bouton dans l'éditeur lors du dernier déploiement/sauvegarde)
            node.active = activeButtonStateBool;
        } else {
            // Sinon (mode "initialState" ou par défaut), initialiser avec deployState
            node.active = deployStateBool;
        }

        node.controlTopic = config.controlTopic ? config.controlTopic.trim() : "";
        node.onValue = config.onValue;
        node.offValue = config.offValue;
        node.toggleValue = config.toggleValue;

        var defaultOnTextValue = "on";
        var i18nOnText = (RED && RED.i18n) ? RED._("defaults.onText") : defaultOnTextValue;
        node.onStatusText = config.onStatusText || (i18nOnText === "defaults.onText" ? defaultOnTextValue : i18nOnText);

        var defaultOffTextValue = "off";
        var i18nOffText = (RED && RED.i18n) ? RED._("defaults.offText") : defaultOffTextValue;
        node.offStatusText = config.offStatusText || (i18nOffText === "defaults.offText" ? defaultOffTextValue : i18nOffText);
        
        node.passThrough = config.passThrough === true || config.passThrough === 'true';

        function updateStatus() {
            if (node.active) {
                node.status({ fill: "green", shape: "dot", text: node.onStatusText });
            } else {
                node.status({ fill: "red", shape: "ring", text: node.offStatusText });
            }
        }
        updateStatus(); // Définit le statut initial basé sur node.active

        node.on('input', function(msg, send, done) {
            let handledAsControlMessage = false;

            if (node.controlTopic && msg.hasOwnProperty('topic') && msg.topic === node.controlTopic) {
                handledAsControlMessage = true;
                const originalState = node.active;
                const payloadStr = String(msg.payload);

                if (payloadStr === node.onValue) {
                    node.active = true;
                } else if (payloadStr === node.offValue) {
                    node.active = false;
                } else if (payloadStr === node.toggleValue) {
                    node.active = !node.active;
                } else {
                    let warnMsgKey = "warn.unrecognizedPayload";
                    let warnMsgFallback = `Unrecognized payload for control topic ${node.controlTopic}: ${payloadStr}`;
                    let warnMsg = (RED && RED.i18n) ? RED._(warnMsgKey, { topic: node.controlTopic, payload: payloadStr }) : warnMsgFallback;
                    if (warnMsg === warnMsgKey) warnMsg = warnMsgFallback;
                    node.warn(warnMsg);
                }

                if (originalState !== node.active) {
                    updateStatus();
                }
            }

            if (handledAsControlMessage) {
                if (node.passThrough) {
                    send(msg);
                }
            } else {
                if (node.active) {
                    send(msg);
                }
            }

            if (done) {
                done();
            }
        });

        node.on('close', function() {
            node.status({});
        });
    }

    RED.nodes.registerType("flow-switch", FlowSwitchNode);

    RED.httpAdmin.post("/flow-switch-admin/:id/state", RED.auth.needsPermission("flows.write"), function(req, res) {
        var runtimeNode = RED.nodes.getNode(req.params.id);
        if (runtimeNode != null) {
            try {
                var newStateFromEditor = req.body.state; // Ceci est la valeur de _activeButtonState depuis l'éditeur
                var newStateBool;

                if (newStateFromEditor === true || newStateFromEditor === 'true') {
                    newStateBool = true;
                } else if (newStateFromEditor === false || newStateFromEditor === 'false') {
                    newStateBool = false;
                } else {
                    console.error("[flow-switch] Invalid state received from editor. Expected boolean or 'true'/'false'. Received:", newStateFromEditor, "(Type:", typeof newStateFromEditor, ")");
                    let errorMsgKey = "error.invalidState";
                    let errorMsgFallback = `Invalid state: ${newStateFromEditor}`;
                    let errorMsg = (RED && RED.i18n) ? RED._(errorMsgKey, { state: newStateFromEditor, type: typeof newStateFromEditor }) : errorMsgFallback;
                    if (errorMsg === errorMsgKey) errorMsg = errorMsgFallback;
                    res.status(400).send(errorMsg);
                    return;
                }
                
                runtimeNode.active = newStateBool; // L'état actif du runtime est mis à jour par le bouton de l'éditeur
                
                if (runtimeNode.active) {
                    runtimeNode.status({ fill: "green", shape: "dot", text: runtimeNode.onStatusText });
                } else {
                    runtimeNode.status({ fill: "red", shape: "ring", text: runtimeNode.offStatusText });
                }
                res.sendStatus(200);
            } catch (err) {
                console.error("[flow-switch] Error processing state change from editor:", err);
                let errorFailedToggleKey = "error.failedToToggle";
                let errorFailedToggleFallback = `Failed to toggle: ${err.toString()}`;
                let errorFailedToggle = (RED && RED.i18n) ? RED._(errorFailedToggleKey, { error: err.toString() }) : errorFailedToggleFallback;
                if (errorFailedToggle === errorFailedToggleKey) errorFailedToggle = errorFailedToggleFallback;
                runtimeNode.error(errorFailedToggle);
                res.sendStatus(500);
            }
        } else {
            console.error("[flow-switch] Runtime node not found for ID:", req.params.id);
            res.sendStatus(404);
        }
    });
};
