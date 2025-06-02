# Node-RED Contrib Flow Switch

A Node-RED node that acts as a switch to control the passage of messages, with a UI button directly on the node and the ability to control it via incoming messages.

[Image of an example of the flow-switch node in Node-RED]

## Features

* **Integrated UI Button:** Toggle the node's state (ON/OFF) directly from the Node-RED editor by clicking the node's button.
* **Message Control:** Change the node's state by sending a message with a specific `msg.topic` and `msg.payload`.
* **Configurable Deploy State:**
    * Choose to initialize the node with a specific state (ON or OFF) upon each deployment.
    * Or, retain the node's last active state before deployment.
* **Customizable Status Texts:** Define the texts displayed below the node for the ON and OFF states.
* **Control Message Passthrough:** Option to allow the control message to pass through to the node's output after it has acted on the switch.
* **Internationalization:** Support for English (en-US) and Canadian French (fr-CA) for the configuration interface.

## Installation

To install this node:

1.  **Via npm (Recommended):**
    * Navigate to your Node-RED user directory (typically `~/.node-red`).
    * Run the following command:
        ```bash
        npm install @bkmj/node-red-contrib-flow-switch
        ```
    * Restart Node-RED.

    *(Note: If this package is not yet published to npm, you would typically install it by cloning the Git repository directly into your `~/.node-red/nodes` directory and then restarting Node-RED.)*

## Configuration

When you add a `flow-switch` node to your flow, you can configure the following properties in its edit panel:

* **Name:** An optional name for this node instance.
* **Behavior on Deploy:**
    * `Use 'Initial state on deploy' value`: The node will adopt the state defined below upon each deployment.
    * `Keep last active state`: The node will remember its last active state (ON/OFF) before deployment and restore it.
* **Initial state on deploy:** The state (on/off) the node will adopt if the above option is selected.
* **Pass through control message?:** If checked, the message that was used to control the switch will be forwarded to the node's output. Otherwise, it is consumed.

### Status Display (under the node)
* **Text if ON:** The text to display below the node when the switch is ON (default: "on").
* **Text if OFF:** The text to display below the node when the switch is OFF (default: "off").

### Control by Message
* **Control Topic:** The `msg.topic` the node will listen to for commands (default: "control").
* **Control Values (`msg.payload`):**
    * **for ON:** The `msg.payload` that will activate the switch (default: "on").
    * **for OFF:** The `msg.payload` that will deactivate the switch (default: "off").
    * **for Toggle:** The `msg.payload` that will invert the switch's state (default: "toggle").

## Usage

### Via the UI Button
Click the button on the right side of the node in the Node-RED editor to change the switch's active state. The status under the node will update.

### By Message
1.  Configure the "Control Topic" in the node's edit panel (e.g., `cmnd/mySwitch/state`).
2.  Configure the "Control Values" for ON, OFF, and Toggle actions.
3.  Send a message to the `flow-switch` node with:
    * `msg.topic` matching the configured "Control Topic".
    * `msg.payload` matching one of the configured "Control Values".

**Example:**
If "Control Topic" is `control` and "Value for ON" is `true`:
An incoming message with `msg.topic = "control"` and `msg.payload = true` will turn the switch ON.

### Flow Behavior
* If the switch is **ON**, incoming messages (that are not control messages) are passed to the output.
* If the switch is **OFF**, incoming messages (that are not control messages) are blocked.
* Control messages are consumed by the node (do not pass to the output) unless the "Pass through control message?" option is checked.

## Development

### Language Files
Translations are managed in the `locales` directory.
* `locales/en-US/flow-switch.json` for English.
* `locales/fr-CA/flow-switch.json` for Canadian French.

Feel free to contribute with other translations!

## License

This project is licensed under the Apache-2.0 License.
