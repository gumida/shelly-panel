const Applet = imports.ui.applet;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Soup = imports.gi.Soup;
const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;

const ICON_SLEEP = "🌙";
const ICON_ACTIVE = "☀️";

let _httpSession;
if (Soup.MAJOR_VERSION >= 3) {
    _httpSession = new Soup.Session();
} else {
    _httpSession = new Soup.SessionAsync();
    Soup.Session.prototype.send_and_read_async = function(msg, priority, cancellable, callback) {
        this.send_message(msg);
    }
}

class ShellyPanelApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);
        this.set_applet_tooltip(_("Click to refresh"));
        this.set_applet_label("...");
        this.lastUpdate = null;

        // Bind settings
        this.settings.bind("api-endpoint", "apiEndpoint", this._onSettingsChanged);
        this.settings.bind("refresh-interval", "refreshInterval", this._onSettingsChanged);
        this.settings.bind("datetime-format", "datetimeFormat", this._onSettingsChanged);
        this.settings.bind("use-fahrenheit", "useFahrenheit", this._onSettingsChanged);
        this.settings.bind("use-eu-format", "useEuFormat", this._onSettingsChanged);

        this._updateLoop();
    }

    _formatNumber(value, decimals = 1) {
        if (this.useEuFormat) {
            return value.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    _onSettingsChanged() {
        this._removeTimeout();
        this._updateLoop();
    }

    _updateLoop() {
        this._fetchData();
        this._timeout = Mainloop.timeout_add_seconds(this.refreshInterval, Lang.bind(this, this._updateLoop));
    }

    _fetchData() {
        if (!this.apiEndpoint) {
            global.log("ShellyPanel: Missing API endpoint configuration");
            this.set_applet_label("Config Err");
            this.set_applet_tooltip(_("Please configure API endpoint in applet settings"));
            return;
        }

        let message = Soup.Message.new('GET', this.apiEndpoint);
        if (!message) {
            global.logError("ShellyPanel: Could not create Soup message");
            this.set_applet_label("Err");
            return;
        }

        _httpSession.send_and_read_async(message, Soup.MessagePriority.NORMAL, null, (session, result) => {
            let statusCode = Soup.MAJOR_VERSION >= 3 ? message.get_status() : message.status_code;
            if (!message || statusCode !== 200) {
                global.logError("ShellyPanel: HTTP request failed with status " + statusCode);
                this.set_applet_label("Err");
                this.set_applet_tooltip(_("Error fetching data"));
                return;
            }

            try {
                let bytes = _httpSession.send_and_read_finish(result);
                if (!bytes) {
                    global.logError("ShellyPanel: Empty response received");
                    this.set_applet_label("Empty");
                    this.set_applet_tooltip(_("Empty response received from device"));
                    return;
                }

                let rawResponse;
                if (Soup.MAJOR_VERSION >= 3) {
                    let byteArray = ByteArray.fromGBytes(bytes);
                    rawResponse = ByteArray.toString(byteArray);
                } else {
                    rawResponse = ByteArray.toString(bytes);
                }

                let response = JSON.parse(rawResponse);
                if (!response || typeof response !== 'object') {
                    throw new Error('Invalid response format');
                }

                let power = Number(response.apower);
                let voltage = Number(response.voltage);
                let current = Number(response.current);

                if (isNaN(power) || isNaN(voltage) || isNaN(current) || 
                    !response.temperature || 
                    (typeof response.temperature.tC !== 'number' && typeof response.temperature.tF !== 'number')) {
                    throw new Error('Invalid data types in response');
                }

                let formattedValue = power === 0 ? 
                    ICON_SLEEP : 
                    ICON_ACTIVE + " " + this._formatNumber(Math.abs(power)) + " W";
                
                this.lastUpdate = new Date();
                this.set_applet_label(formattedValue);
                
                let formattedDate = GLib.DateTime.new_from_unix_local(this.lastUpdate.getTime() / 1000)
                    .format(this.datetimeFormat);
                
                let tempValue = this.useFahrenheit ? response.temperature.tF : response.temperature.tC;
                let tempUnit = this.useFahrenheit ? "°F" : "°C";
                
                this.set_applet_tooltip(
                    _("Power: ") + this._formatNumber(power) + " W\n" +
                    _("Voltage: ") + this._formatNumber(voltage) + " V\n" +
                    _("Current: ") + this._formatNumber(current, 3) + " A\n" +
                    _("Temperature: ") + this._formatNumber(tempValue) + " " + tempUnit + "\n" +
                    _("Last updated: ") + formattedDate
                );
            } catch (e) {
                global.logError("ShellyPanel: Error processing response: " + e.toString());
                this.set_applet_label("Data Err");
                this.set_applet_tooltip(_("Error processing data: ") + e.message);
            }
        });
    }

    on_applet_clicked(event) {
        this._fetchData();
    }

    on_applet_removed_from_panel() {
        this._removeTimeout();
        if (_httpSession) {
            _httpSession.abort();
            _httpSession = null;
        }
    }

    _removeTimeout() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new ShellyPanelApplet(metadata, orientation, panel_height, instance_id);
}
