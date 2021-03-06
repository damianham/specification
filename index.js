  var subSchemas = {
    'alarms': require('./schemas/groups/alarms.json'),
    'communication': require('./schemas/groups/communication.json'),
    'design': require('./schemas/groups/design.json'),
    'navigation': require('./schemas/groups/navigation.json'),
    'electrical_ac': require('./schemas/groups/electrical_ac.json'),
    'electrical_dc': require('./schemas/groups/electrical_dc.json'),
    'environment': require('./schemas/groups/environment.json'),
    'performance': require('./schemas/groups/performance.json'),
    'propulsion': require('./schemas/groups/propulsion.json'),
    'resources': require('./schemas/groups/resources.json'),
    'sensors': require('./schemas/groups/sensors.json'),
    'steering': require('./schemas/groups/steering.json'),
    'tanks': require('./schemas/groups/tanks.json')
  };


function getTv4() {
  var tv4 = require('tv4');
  var vesselSchema = require('./schemas/vessel.json');
  tv4.addSchema('https://signalk.github.io/specification/schemas/vessel.json', vesselSchema);
  var definitions = require('./schemas/definitions.json');
  tv4.addSchema('https://signalk.github.io/specification/schemas/definitions.json', definitions);

  for (var schema in subSchemas) {
    tv4.addSchema('https://signalk.github.io/specification/schemas/groups/' + schema + '.json', subSchemas[schema]);
  }
  return tv4;
}

function validateFull(tree) {
  var signalkSchema = require('./schemas/signalk.json');

  var tv4 = getTv4();
  var valid = getTv4().validateMultiple(tree, signalkSchema, true, true);
  var result = tv4.validateResult(tree, signalkSchema, true, true);
  //Hack: validateMultiple marks anyOf last match incorrectly as not valid with banUnknownProperties
  //https://github.com/geraintluff/tv4/issues/128
  valid.valid = result.valid;
  return valid;
}

function validateDelta(delta, ignoreContext) {
  var tv4 = require('tv4');
  var deltaSchema = require('./schemas/delta.json');
  var definitions = require('./schemas/definitions.json');
  tv4.addSchema('https://signalk.github.io/specification/schemas/definitions.json', definitions);

  if (ignoreContext) {
    delta.context = 'ignored the context, so place a placeholder there';
  }
  var valid = tv4.validateMultiple(delta, deltaSchema, true, true);
  return valid;
}

function validateWithSchema(msg, schemaName) { 
  var tv4 = require('tv4');
  var schema = require('./schemas/' + schemaName);
  var valid = tv4.validateResult(msg,schema, true, true);
  return valid;
}

function chaiAsPromised(chai, utils) {
  "use strict";

  var Assertion = chai.Assertion

  function checkValidFullSignalK () { 
    var result = validateFull(this._obj);
    var message = result.errors.length === 0 ? '' : result.errors[result.errors.length-1].message + ':' + result.errors[result.errors.length-1].dataPath +
      ' (' + (result.errors.length-1) + ' other errors not reported here)';
    this.assert(
      result.valid
      , message
      , 'expected #{this} to not be valid SignalK'
      );
  }
  Assertion.addProperty('validSignalK', checkValidFullSignalK);
  Assertion.addProperty('validFullSignalK', checkValidFullSignalK);
  Assertion.addProperty('validSignalKVessel', function() {
    this._obj = {
      'vessels': {
        'urn:mrn:imo:mmsi:230099999': this._obj
      }
    }
    checkValidFullSignalK.call(this);
  });
  Assertion.addProperty('validSignalKVesselIgnoringIdentity', function() {
    this._obj.mmsi = '230099999';
    this._obj = {
      'vessels': {
        'urn:mrn:imo:mmsi:230099999': this._obj
      }
    }
    checkValidFullSignalK.call(this);
  });
  Assertion.addProperty('validSignalKDelta', function () {
    var result = validateDelta(this._obj);
    var message = result.errors.length === 0 ? '' : result.errors[0].message + ':' + result.errors[0].dataPath + 
      ' (' + (result.errors.length-1) + ' other errors not reported here)';
    this.assert(
      result.valid
      , message
      , 'expected #{this} to not be valid SignalK delta'
      );
  });
  Assertion.addProperty('validSubscribeMessage', function () {
    var result = validateWithSchema(msg, 'messages/subscribe');
    var message = result.error ? result.error.message + ':' + result.error.dataPath : '';
    this.assert(
      result.valid
      , message
      , 'expected #{this} to not be valid SignalK subscribe message'
      );
  });
  Assertion.addProperty('validUnsubscribeMessage', function () {
    var result = validateWithSchema(msg, 'messages/unsubscribe');
    var message = result.error ? result.error.message + ':' + result.error.dataPath : '';
    this.assert(
      result.valid
      , message
      , 'expected #{this} to not be valid SignalK unsubscribe message'
      );
  });
  Assertion.addProperty('validDiscovery', function () {
    var result = validateWithSchema(this._obj, 'discovery');
    var message = result.error ? result.error.message + ':' + result.error.dataPath : '';
    this.assert(
      result.valid
      , message
      , 'expected #{this} to not be valid SignalK discovery document'
      );
  });
}




module.exports.validateFull = validateFull;
module.exports.validateVessel = function(vesselData) {
  return validateFull({
      'vessels': {
        'urn:mrn:imo:mmsi:230099999': vesselData
      }
    });
}
module.exports.validateDelta = validateDelta;
module.exports.chaiModule = chaiAsPromised;
module.exports.i18n = require('./i18n/');
module.exports.getTv4 = getTv4;
module.exports.subSchemas = subSchemas;
module.exports.units = require('./schemas/definitions').definitions.units;
module.exports.metadata = require('./keyswithmetadata');
