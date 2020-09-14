# ObisReader

A basic example project demonstrating how to read OBIS data from a smart-meter and saving them into a MongoDB. Including simple steps to ship the solution to a Raspberry Pi and make it run as a systemd service.

OBIS data is read and extracted using the great package [smartmeter-obis](https://www.npmjs.com/package/smartmeter-obis).

A live example for creating a simple dashboard with the persisted OBIS data can be found here: [PowerBoard](https://powerboard.appspot.com).

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

For easy and secure configuration I use [secure-config](https://www.npmjs.com/package/@tsmx/secure-config) in this project. Two configurations can be used for testing/developing and production use. For that, create two configuration files `config.json` and `config-production.json` under `/conf` following the given example file. It is recommended that you encrypt secret credentials like username and password for the database connection. For more details on how to use secure-config also refer to this [article](https://tsmx.net/secure-config/). 

- hint: define a transport of type `LocalFileTransport` in the development config and use the delivered example SML file under `/test/ed300l.dat` so you don't need a permanent connection to your smart-meter when developing
- hint: set `intervals.persistValuesMinutes` to `-1` in a development configuration to ignore this interval and always generate and store both - the `obisValue` and `obisActual` - when reading data

## Running on a Raspberry Pi

To run the OBIS reader on a Raspberry I suggest the following steps:

1. Connect to your Raspberry as `pi`.
   ```
   ssh pi@raspberrypi
   ```
2. Create a new user.
   ```
   sudo adduser obis
   ```
3. Grant the new user the right to read from the smartmeter connector. For most USB connected readers available under `/dev/ttyUSBx` this is done by adding the user to the group `dialout`.
   ```
   sudo usermod -a -G dialout obis
   ```
4. As user `obis` create a new directory for the OBIS reader solution `/home/obis/obisreader`.
   ```
   ssh obis@raspberrypi
   mkdir obisreader
   ```
5. "Ship" the solution from your development machine to the Raspberry. This could be easily done using rsync.
   ```
   rsync -av -e ssh --exclude='node_modules/' ObisReader/ obis@raspberrypi:/home/obis/obisreader
   ```
   Excluding the node_modules folder saves a LOT of time!
6. On the Raspberry as user `obis` in `/home/obis/obisreader` install the needed NodeJS packages.
   ```
   npm install
   ```
7. Do a test run: 
   ```
   node /home/obis/obisreader/app.js
   ```
8. As user `pi` create a service for the app by creating a systemd service file.
   ```
   sudo nano /lib/systemd/system/obisreader.service
   ```
   With the following content:
   ```
   [Unit]
   Description=ObisReader - reading and persisteing OBIS data from your smart-meter
   After=network.target

   [Service]
   Environment=NODE_ENV="production"
   Type=simple
   User=obis
   ExecStart=/usr/bin/node /home/obis/obisreader/app.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
9. Start the service and enable it.
   ```
   sudo systemctl start obisreader
   sudo systemctl enable obisreader
   ```
ObisReader is now running as a service.

## Further data usage examples

Using MongoDB's query and aggregation functions a lot of useful analysis of the persisted data can be done. Some useful examples...

Get the average power consumption for each hour of the day: 

```
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

Get the average power consumption over the last `minutes`: 

```
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

Get the maximum power consumption of the current day:

```
let today = new Date();
today.setHours(0, 0, 0, 0);
obisActuals
   .find({ date: { '$gte': today } })
   .sort({ powerCurrent: -1 })
   .limit(1)
   .exec((err, result) => {...});
```

Get the minimum power consumption of the current day:

```
let today = new Date();
today.setHours(0, 0, 0, 0);
obisActuals
   .find({ date: { '$gte': today } })
   .sort({ powerCurrent: 1 })
   .limit(1)
   .exec((err, result) => {...});
```



