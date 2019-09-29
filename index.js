"use strict";

var Service, Characteristic, HomebridgeAPI;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-charlatan", "Charlatan", Charlatan);
}

function Charlatan(log, config) {
  this.log = log;
  this.name = config.name;
  this._bridge = config.overrides ? config.overrides.bridge : null;
  this._overrideAccessories = config.overrides && config.overrides.accessories ? config.overrides.accessories : null;

  this._accessoryInformation = new Service.AccessoryInformation();
  this._accessoryInformation.setCharacteristic(Characteristic.Manufacturer, 'HomeBridge Charlatan')
  this._accessoryInformation.setCharacteristic(Characteristic.Model, 'NSR-001')
  this._accessoryInformation.setCharacteristic(Characteristic.SerialNumber, 'NR00069');

  this._service = null;
  switch(config.service) {
    case "GarageDoorOpener":
      this._service = new Service.GarageDoorOpener(this.name);
      this._service.getCharacteristic(Characteristic.TargetDoorState).on('set', this._setState.bind(this));
      this._service.getCharacteristic(Characteristic.TargetDoorState).on('get', this._getState.bind(this));
      this._service.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
      this._service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
      break;
    default:
      throw new Error("Your config.json has specified an unsupported Charlatan service.");
  }
}

Charlatan.prototype.getServices = function () {
  return [this._accessoryInformation, this._service];
}

Charlatan.prototype._setState = function (value, callback) {
  this.log("Setting state to " + value);
  this.setOverriddenAccessoryCharacteristics(value);
  this._service.setCharacteristic(Characteristic.CurrentDoorState, value);
  callback();
}

Charlatan.prototype._getState = function (callback) {
  callback(null, this._service.getCharacteristic(Characteristic.CurrentDoorState));
}

Charlatan.prototype.setOverriddenAccessoryCharacteristics = function (state) {
  this._overrideAccessories.forEach(overrideAccessory => {
    var onstate;
    switch (state) {
      case Characteristic.CurrentDoorState.CLOSED:
        onstate = !overrideAccessory.onState;
        break;
      case Characteristic.CurrentDoorState.OPEN:
      default:
        onstate = overrideAccessory.onState;
        break;
    }
    var accessory = this.getBridgedAccessoryByName(overrideAccessory.name);
    if (accessory) {
      var service = accessory.getService(overrideAccessory.name);
      service.characteristics.forEach(characteristic => {
        if (characteristic instanceof Characteristic.On) {
          service.setCharacteristic(Characteristic.On, onstate);
        }
      });
    }
  });
}

Charlatan.prototype.getBridgedAccessoryByName = function(name) {
  for (var i = 0;  i < this._bridge.bridgedAccessories.length; i++) {
    if (this._bridge.bridgedAccessories[i].displayName == name) {
      return this._bridge.bridgedAccessories[i];
    }
  }
  for (var i = 0;  i < this._bridge._hiddenAccessories.length; i++) {
    if (this._bridge._hiddenAccessories[i].displayName == name) {
      return this._bridge._hiddenAccessories[i];
    }
  }
  return null;
}
