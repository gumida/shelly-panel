# Shelly Solar Power Monitor

A Cinnamon applet specifically designed for monitoring solar power production through Shelly devices. Displays real-time power generation with intuitive icons: ☀️ for active production and 🌙 during inactive periods.

## Features

- Real-time solar power production monitoring
- Visual indicators: ☀️ during power generation, 🌙 during inactive periods
- Always displays positive values for easier reading of production data
- Configurable refresh interval
- Temperature display (Celsius/Fahrenheit)
- Support for European/US number formats
- Customizable date/time format
- Click-to-refresh functionality

## Compatibility

- **Desktop Environment**: Cinnamon 6.4+
- **Shelly Devices**: Gen2 and Gen3 devices (using the new RPC API)
  - Tested with: Shelly 1PM Mini Gen3
  - Not compatible with Gen1 devices (different API format)

## Installation

1. Clone this repository or download the files to your local machine
2. Copy the `shelly-panel@gumida` folder to `~/.local/share/cinnamon/applets/`
3. Enable the applet through Cinnamon's applet settings
4. Configure your Shelly device's API endpoint in the applet settings

## Configuration

- **API Endpoint**: URL of your Shelly device (e.g., `http://192.168.1.1/rpc/Switch.GetStatus?id=0`)
- **Refresh Interval**: How often to fetch new data (5-3600 seconds)
- **Temperature Unit**: Choose between Celsius and Fahrenheit
- **Number Format**: Choose between European (1.234,56) and US (1,234.56) formats
- **Date/Time Format**: Customize how timestamps are displayed

## Development

Feel free to contribute to this project by submitting issues or pull requests on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Icon attribution: [Eco electric icons created by manshagraphics - Flaticon](https://www.flaticon.com/free-icons/eco-electric)

## Author

Created by gumida ([GitHub](https://github.com/gumida/shelly-panel))
