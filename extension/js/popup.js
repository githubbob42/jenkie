var isOnline = ko.observable();
var showOptions = ko.observable(false);
var monitor = new Monitor();

$(function () {

  function initOptions(options) {
    if (options) {
      monitor.options.url(options.url);
      monitor.options.interval(options.interval);
    } else {
      showOptions(true);
    }
  }

  function initSettings(settings) {
    if (settings) {
      monitor.settings.watchList(settings.watchList || []);
      monitor.settings.currentView({ name: settings.defaultView });
      monitor.settings.showTreeView(settings.showTreeView || false);
    }
  }

  function initData(data) {
    if (data) {
      monitor.data.views(data.views || []);
      monitor.data.jobs(data.jobs || []);
    } else {
      showOptions(true);
    }
  }

  ko.applyBindings(monitor);

  Store.getOptions().then(initOptions);
  Store.getSettings().then(initSettings);
  Store.getData().then(initData);
  Store.onChanged('data', initData);

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.name === 'online') isOnline(message.data);
  });
  chrome.runtime.sendMessage({ name: 'refresh' });
});
