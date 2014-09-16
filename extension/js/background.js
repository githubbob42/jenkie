var Jenkie = (function () {

  var online = false;

  function refresh() {
    console.log('refresh');

    Store.getOptions().then(function (options) {
      if (!options || !options.url) return;

      Jenkins
        .getMonitorData(options.url)
        .then(function (data) {
          updateOnlineStatus(true);
          Store.saveData(data);
        })
        .catch(function () {
          updateOnlineStatus(false);
          chrome.browserAction.setIcon({ path: Icons.Offline });
        });

      chrome.alarms.create('refresh', { periodInMinutes: parseInt(options.interval || 10, 10) });
    });
  }

  function updateIcon(settings, data) {
    if (!data || !data.jobs || data.jobs.length === 0) return;

    var jobList = data.jobs;
    if (settings && settings.watchList && settings.watchList.length > 0) {
      jobList = data.jobs.filter(function watchedJobs(job) {
        return settings.watchList.indexOf(job.name) > -1;
      });
    }

    var counts = { red: 0, blue: 0, yellow: 0, grey: 0, building: 0 };
    jobList.reduce(function getStatusTotals(counts, job) {
      var status = BallColor[job.color];

      if (status.building) counts.building++;
      counts[status.color]++;
      return counts;
    }, counts);

    var building = !!counts.building;
    if (counts.red) return setIcon('red', building);
    if (counts.yellow) return setIcon('yellow', building);
    if (counts.blue) return setIcon('blue', building);
    if (counts.grey) return setIcon('grey', building);
  }

  function setIcon(color, building) {
    var path = color + (building ? '-building.png' : '.png');
        icon = { path: {
          '19': '../img/' + path,
          '38': '../img@2x/' + path
        }};
    chrome.browserAction.setIcon(icon);
  }

  function updateBadge(settings) {
    if (!settings) return;

    var watchCount = settings && settings.watchList && settings.watchList.length;

    if (watchCount > 0) {
      chrome.browserAction.setBadgeText({ text: watchCount.toString() });
      chrome.browserAction.setTitle({ title: 'Watching ' + watchCount + ' jobs' });
    } else {
      chrome.browserAction.setBadgeText({ text: '' });
      chrome.browserAction.setTitle({ title: '' });
    }

    chrome.browserAction.setBadgeBackgroundColor({ color: '#789' });
  }

  function updateOnlineStatus(status) {
    online = status;
    if (!online) setIcon('grey');
    chrome.runtime.sendMessage({ name: 'online', data: status });
  }

  function init() {
    Store.getSettings().then(updateBadge);
    refresh();
  }

  Store.onChanged('options', refresh);

  Store.onChanged('settings', function (settings, oldValue) {
    updateBadge(settings);
    if (online) {
      Store.getData().then(function (data) {
        updateIcon(settings, data);
      });
    }
  });

  Store.onChanged('data', function (data, oldValue) {
    Store.getSettings().then(function (settings) {
      updateIcon(settings, data);
      Notifier.processNotifications(settings, data, oldValue);
    });
  });

  return {
    init: init,
    refresh: refresh
  };
}());


chrome.runtime.onInstalled.addListener(Jenkie.init);
chrome.runtime.onStartup.addListener(Jenkie.init);

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'refresh') Jenkie.refresh();
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.name === 'refresh') Jenkie.refresh();
});
