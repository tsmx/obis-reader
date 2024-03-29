# obis-reader

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tsmx/obis-reader/git-build.yml?branch=master)](https://img.shields.io/github/actions/workflow/status/tsmx/obis-reader/git-build.yml?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/obis-reader/badge.svg?branch=master)](https://coveralls.io/github/tsmx/obis-reader?branch=master)

> Read OBIS data from your smart-meter and store it in a MongoDB.

A simple service for reading OBIS data from a smart-meter and saving it into a MongoDB. Including simple steps to ship the solution to a Raspberry Pi and make it run as a systemd service.

OBIS data is read and extracted using the great package [smartmeter-obis](https://www.npmjs.com/package/smartmeter-obis).

A live example of a simple dashboard with the persisted OBIS data can be found here: [PowerBoard](https://powerboard.appspot.com).

## Technical Equipment

What you need is:
- a smart-meter with an interface providing measured data in the OBIS protocol (either push or pull), e.g. EMH ED300L
- a optical (infrared) or other reader device connected to your smart-meter, e.g. a Read/Write IR optical connector with USB plug

## Functionality

In this example the OBIS data is read into two entities stored in two different collections.

- `obisActual` 
  - current power consumption
  - typically read in a very short interval, e.g. every 3 seconds, specified by the configuration parameter `obis.requestInterval` (please consult the manual of your smart-meter for the lowest possible rates)
  - stored for the last 24 hours in a sliding window (uses MongoDB's TTL index feature)
- `obisValue`  
  - current consumption and overall balance
  - typically stored in a larger interval, e.g. every 5 minutes, specified by the configuration parameter `intervals.persistValuesMinutes`
  - stored without any TTL limit

## Configuration

The repo comes along with the following configuration files:

```bash
conf/
├── config.js                     # small helper for logging out which config is loaded
├── config.json                   # configuration for dev environment, reading OBIS data from a static file
└── sample-config-production.json # configuration example for a production config, reading OBIS data from a USB device
```

With the provided `config.json` you can start obis-reader and it will read OBIS data from the static file `test/ed300l.dat` without the need of having an OBIS device attached to your development machine. `sample-config-production.json` contains a production configuration blueprint for reading OBIS data from an USB device instead of a file.

For easy and secure configuration I use [secure-config](https://www.npmjs.com/package/@tsmx/secure-config) in this project. Different configurations can be used for testing/developing (NODE_ENV not set) and production (NODE_ENV === 'production') use. For that, edit/create two configuration files `config.json` and `config-production.json` under `/conf` following the given example files. It is recommended that you encrypt secret credentials like username and password for the database connection, at least for the production stage. For more details on how to use secure-config also refer to this [article](https://tsmx.net/secure-config/).


**Hint:** Set `intervals.persistValuesMinutes` to `-1` in a development configuration to ignore this interval and always generate and store both - the `obisValue` and `obisActual` - when reading data.

## Running on a Raspberry Pi

To run the OBIS reader on a Raspberry I suggest the following steps. 

Note that it is assumed to run in production mode on the Raspberry, thus we'll set the `NODE_ENV` environment variable accordingly and use `config-production.json` as the configuration file. So be sure to have this created and set-up properly.

1. Connect to your Raspberry as `pi`.
   ```bash
   ssh pi@raspberrypi
   ```
2. Create a new user.
   ```bash
   sudo adduser obis
   ```
3. Grant the new user the right to read from the smartmeter connector. For most USB connected readers available under `/dev/ttyUSBx` this is done by adding the user to the group `dialout`.
   ```bash
   sudo usermod -a -G dialout obis
   ```
4. As user `obis` create a new directory for the OBIS reader solution `/home/obis/obis-reader`.
   ```bash
   ssh obis@raspberrypi
   mkdir obis-reader
   ```
5. "Ship" the solution from your development machine to the Raspberry. This could be easily done using rsync.
   ```bash
   rsync -av -e ssh --exclude='node_modules/' obis-reader/ obis@raspberrypi:/home/obis/obis-reader
   ```
   Excluding the node_modules folder saves a LOT of time!
6. On the Raspberry as user `obis` in `/home/obis/obis-reader` install the needed NodeJS packages for productive use.
   ```bash
   npm install --production
   ```
7. Do a test run: 
   ```bash
   node /home/obis/obis-reader/app.js
   ```
8. As user `pi` create a service for the app by creating a systemd service file.
   ```bash
   sudo nano /lib/systemd/system/obis-reader.service
   ```
   With the following content:
   ```bash
   [Unit]
   Description=obis-reader - reading and persisting OBIS data from your smart-meter
   After=network.target

   [Service]
   Environment=NODE_ENV="production"
   # configuration encryption key
   Environment=CONFIG_ENCRYPTION_KEY="YOUR_KEY"
   Type=simple
   User=obis
   # set working dir to make secure-config working properly
   WorkingDirectory=/home/obis/obis-reader
   ExecStart=/usr/bin/node /home/obis/obis-reader/app.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
9. Start the service and enable it.
   ```bash
   sudo systemctl start obis-reader
   sudo systemctl enable obis-reader
   ```
obis-reader is now running as a service.

## Further data usage examples

By using MongoDB's query functions and aggregation framework, a lot of useful analysis of the persisted data can be done. Some useful examples...

### Average power consumption for each hour of the day

```js
obisValues.aggregate(
   [
      { $group: 
         { 
            _id: { $hour: { date: '$date' } }, 
            consumptionMeasures: { $sum: 1 }, 
            consumptionAvg: { $avg: '$powerCurrent' } 
         } 
      },
      { $sort: { _id: 1 } }
   ],
   (err, result) => {...});
```

### Average power consumption over the last x minutes

```js
obisActuals.aggregate(
   [
      { $match: { date: { '$gte': new Date(Date.now() - 1000 * 60 * minutes) } } },
      { 
         $group: 
         { 
            _id: { $dateToString: { format: '%Y%m%dT%H%M', date: '$date' } },
            consumptionMeasures: { $sum: 1 }, 
            consumptionAvg: { $avg: '$powerCurrent' } 
         } 
      },
      { $sort: { _id: -1 } },
      { $limit: minutes }
   ],
   (err, result) => {...});
```

### Maximum power consumption of the current day

```js
let today = new Date();
today.setHours(0, 0, 0, 0);
obisActuals
   .find({ date: { '$gte': today } })
   .sort({ powerCurrent: -1 })
   .limit(1)
   .exec((err, result) => {...});
```

### Minimum power consumption of the current day

```js
let today = new Date();
today.setHours(0, 0, 0, 0);
obisActuals
   .find({ date: { '$gte': today } })
   .sort({ powerCurrent: 1 })
   .limit(1)
   .exec((err, result) => {...});
```



