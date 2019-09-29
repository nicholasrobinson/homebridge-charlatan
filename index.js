"use strict";

var Service, Characteristic, HomebridgeAPI;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  HomebridgeAPI = homebridge;
  homebridge.registerAccessory("homebridge-charlatan", "CharlatanSwitch", function(log, config) {
    return new CharlatanSwitch(log, config, homebridge);
  });
}

function CharlatanSwitch(log, config, homebridgeApi) {
  this.log = log;
  this.name = config.name;
  this._api = homebridgeApi;
  this._bridge = config.overrides ? config.overrides.bridge : null;
  this._overrideAccessories = config.overrides && config.overrides.accessories ? config.overrides.accessories : null;

  this._accessoryInformation = new Service.AccessoryInformation();
  this._accessoryInformation.setCharacteristic(Characteristic.Manufacturer, 'HomeBridge Charlatan')
  this._accessoryInformation.setCharacteristic(Characteristic.Model, 'NSR-001')
  this._accessoryInformation.setCharacteristic(Characteristic.SerialNumber, 'NR00069');

  this._service = new Service.GarageDoorOpener(this.name);
  this._service.getCharacteristic(Characteristic.TargetDoorState).on('set', this._setState.bind(this));
  this._service.getCharacteristic(Characteristic.TargetDoorState).on('get', this._getState.bind(this));  
  this._service.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
  this._service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
}

CharlatanSwitch.prototype.getServices = function () {
  return [this._accessoryInformation, this._service];
}

CharlatanSwitch.prototype._setState = function (value, callback) {
  this.log("Setting state to " + value);
  if (value == Characteristic.TargetDoorState.CLOSED) {

    this.log("*** Closing logic goes here ***");
    this.setOverriddenAccessoryCharacteristics(false);

    callback();
    this._service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
  }
  else if (value == Characteristic.TargetDoorState.OPEN) {

    this.log("*** Opening logic goes here ***");
    this.setOverriddenAccessoryCharacteristics(true);

    callback();
    this._service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
  }
}

CharlatanSwitch.prototype._getState = function (callback) {
  this.log("Getting state");
  var err = null;
  var isOpen = true;

  if (isOpen) {
    callback(err, Characteristic.CurrentDoorState.OPEN);
  }
  else {
    callback(err, Characteristic.CurrentDoorState.CLOSED);
  }
}

CharlatanSwitch.prototype.setOverriddenAccessoryCharacteristics = function (value) {
  this._overrideAccessories.forEach(overrideAccessory => {
    var accessory = this.getBridgedAccessoryByName(overrideAccessory.name);
    if (accessory) {
      var service = accessory.getService(overrideAccessory.name);
      if (service) {
        service.setCharacteristic(Characteristic.On, value);
      }
    }
  });
}

CharlatanSwitch.prototype.getBridgedAccessoryByName = function(name) {
  for (var i = 0;  i < this._bridge.bridgedAccessories.length; i++) {
    if (this._bridge.bridgedAccessories[i].displayName == name) {
      return this._bridge.bridgedAccessories[i];
    }
  }
  return null;
}
