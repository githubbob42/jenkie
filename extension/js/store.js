var Store = (function() {

  function set(key, value) {
    return new Promise(function (resolve, reject) {
      var data = {};
      data[key] = value;
      chrome.storage.local.set(data, resolve);
    })
    .then(function () {
      return value;
    });
  }

  function get(key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.get(key, function (data) {
        resolve(data && data[key]);
      });
    });
  }

  function upsert(key, changes) {
    return get(key).then(function (current) {
      var updated = $.extend({}, current, changes);
      return set(key, updated);
    });
  }

  function remove(key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.remove(key, resolve);
    });
  }

  var handlers = {};

  function onChanged(key, handler) {
    if (!handlers[key]) handlers[key] = [];
    handlers[key].push(handler);
  }

  chrome.storage.onChanged.addListener(function (changes) {
    Object.keys(handlers).filter(function (key) {
      if (changes[key]) {
        handlers[key].forEach(function (handler) {
          handler(changes[key].newValue, changes[key].oldValue);
        });
      }
    });
  });

  return {
    saveOptions: upsert.bind(null, 'options'),
    getOptions: get.bind(null, 'options'),
    saveSettings: upsert.bind(null, 'settings'),
    getSettings: get.bind(null, 'settings'),
    saveData: set.bind(null, 'data'),
    getData: get.bind(null, 'data'),
    onChanged: onChanged
  };
}());
