// Fichier : flow-switch.js
module.exports = function(RED) {
    function FlowSwitchNode(config) { // Nom de la fonction constructeur mis à jour (convention)
        RED.nodes.createNode(this, config);
        var node = this;

        node.name = config.name;
        // 'node.active' est l'état d'exécution, initialisé par 'currentState' de la config (état au démarrage).
        node.active = config.currentState === true || config.currentState === 'true';

        // Configuration pour le contrôle par message
        node.controlTopic = config.controlTopic ? config.controlTopic.trim() : "";
        node.onValue = config.onValue;
        node.offValue = config.offValue;
        node.toggleValue = config.toggleValue;

        // Champs de configuration pour le texte du statut et la transmission des messages
        node.onStatusText = config.onStatusText || "on"; // Valeur par défaut si non défini
        node.offStatusText = config.offStatusText || "off"; // Valeur par défaut si non défini
        node.passThrough = config.passThrough === true || config.passThrough === 'true';

        function updateStatus() {
            if (node.active) {
                node.status({ fill: "green", shape: "dot", text: node.onStatusText });
            } else {
                node.status({ fill: "red", shape: "ring", text: node.offStatusText });
            }
        }
        updateStatus(); // Définit le statut initial lors du déploiement

        node.on('input', function(msg, send, done) {
            let handledAsControlMessage = false;
            // let stateChangedByControl = false; // Variable non utilisée, peut être enlevée si pas de logique future

            // Vérifie si c'est un message de contrôle
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
                    // Utiliser le nouveau nom de nœud pour les messages d'erreur/avertissement si i18n est configuré
                    node.warn(RED._("flow-switch.warn.unrecognized-payload", { topic: node.controlTopic, payload: payloadStr }));
                }

                if (originalState !== node.active) {
                    // stateChangedByControl = true; // Variable non utilisée
                    updateStatus();
                }
            }

            // Gestion de la transmission des messages
            if (handledAsControlMessage) {
                if (node.passThrough) {
                    send(msg); // Transmet le message de contrôle si l'option est activée
                }
            } else { // Ce n'est pas un message de contrôle
                if (node.active) {
                    send(msg); // Transmet les messages normaux si l'interrupteur est ON
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

    // Enregistre le type de nœud avec le nouveau nom "flow-switch"
    RED.nodes.registerType("flow-switch", FlowSwitchNode); // Nom du type mis à jour

    // Endpoint HTTP Admin pour le bouton UI, URL mise à jour
    RED.httpAdmin.post("/flow-switch-admin/:id/state", RED.auth.needsPermission("flows.write"), function(req, res) {
        var runtimeNode = RED.nodes.getNode(req.params.id);
        if (runtimeNode != null) {
            try {
                var newState = req.body.state;
                // Vérification robuste du type de newState
                if (newState === true || newState === 'true' || newState === false || newState === 'false') {
                    runtimeNode.active = (newState === true || newState === 'true');
                    
                    // Utilise les textes de statut configurés par l'utilisateur
                    if (runtimeNode.active) {
                        runtimeNode.status({ fill: "green", shape: "dot", text: runtimeNode.onStatusText });
                    } else {
                        runtimeNode.status({ fill: "red", shape: "ring", text: runtimeNode.offStatusText });
                    }
                    res.sendStatus(200);
                } else {
                    res.status(400).send("Invalid state in request body. Expecting a boolean or 'true'/'false'. Received: " + newState + " (Type: " + typeof newState + ")");
                }
            } catch (err) {
                res.sendStatus(500);
                // Utiliser le nouveau nom de nœud pour les messages d'erreur si i18n est configuré
                runtimeNode.error(RED._("flow-switch.error.failed-to-toggle", { error: err.toString() }));
            }
        } else {
            res.sendStatus(404);
        }
    });

    // Si vous utilisez l'internationalisation (i18n), mettez à jour les clés ici aussi
    /*
    RED.i18n.registerMessageCatalog("en-US", "node-red", {
        "flow-switch": { // Clé principale mise à jour
            "warn": {
                "unrecognized-payload": "Control message received on topic '__topic__' with unrecognized payload: '__payload__'"
            },
            "error": {
                "failed-to-toggle": "Failed to toggle switch state: __error__"
            }
        }
    });
    */
};
