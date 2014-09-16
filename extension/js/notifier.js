var Notifier = (function () {

  // https://github.com/jenkinsci/jenkins/blob/master/core/src/main/java/hudson/model/Result.java
  var JenkinsResult = {
    SUCCESS: BallColor.blue,
    UNSTABLE: BallColor.yellow,
    FAILURE: BallColor.red,
    NOT_BUILT: BallColor.notbuilt,
    ABORTED: BallColor.aborted
  };

  var dateFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };

  function processNotifications(settings, newData, oldData) {
    if (!settings || !settings.watchList || settings.watchList.length === 0) return;
    if (!oldData || !oldData.jobs || !newData || !newData.jobs) return;

    var newJobs = newData.jobs.reduce(function (jobs, job) { 
      jobs[job.name] = job;
      return jobs;
    }, {});

    oldData.jobs.forEach(function (oldJob) {
      var job = newJobs[oldJob.name];

      if (!job || settings.watchList.indexOf(job.name) === -1) return;

      if (oldJob.color !== job.color) {
        return notify(job);
      }
      if ((oldJob.lastBuild && oldJob.lastBuild.number) !== (job.lastBuild && job.lastBuild.number)) {
        return notify(job);
      }
    });
  }

  function notify(job) {
    Store.getOptions().then(function (options) {
      var build = job.lastBuild && job.lastBuild.number && ('/' + job.lastBuild.number),
          url = options.url + '/job/' + job.name + build;

      Jenkins.getJobData(url).then(function (data) {
        var status = data.result ? JenkinsResult[data.result] : BallColor[job.color],
            items = data.changeSet && (data.changeSet.items || []).map(function (item){ 
              return {
                title: item.author && item.author.fullName, 
                message: item.msg
              };
            });

        items.reverse();  // display most recent commit message first

        // display causes if it wasn't an SCM change that triggered it
        if (items.length === 0 && data.actions) {
          var causes = data.actions
            .filter(function (action) {
              return action.causes && action.causes.length;
            })
            .map(function (action) {
              return {
                title: '',
                message: action.causes[0].shortDescription
              };
            });
          causes.reverse(); // display most recent trigger first
          items = items.concat(causes);
        }

        items.unshift({
          title: status.message,
          message: new Date(data.timestamp).toLocaleTimeString('en', dateFormatOptions)
        });

        var notification = {
          type: 'list',
          iconUrl: '../img@2x/' + status.color + (status.building ? '-building.png' : '.png'),
          title: data.fullDisplayName,
          message: '',
          items: items
        };

        console.log('notify: ' + job.name);
        chrome.notifications.create(url, notification, function () {});      
      });
    });
  }

  chrome.notifications.onClicked.addListener(function (url) {
    if (url) chrome.tabs.create({ url: url });
  });

  return {
    processNotifications: processNotifications
  };
}());
