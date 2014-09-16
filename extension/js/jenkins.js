var Jenkins = (function ($) {

  function getMonitorData(url) {
    return Promise.all([
      getViews(url),
      getJobs(url)
    ])
    .then(function (results) {
      return $.extend({ timestamp: +new Date() }, results[0], results[1]);
    });
  }

  function getJobData(url) {
    return getJSON(url + '/api/json');
  }

  function getJobs(url) {
    return getJSON(url + '/api/json?tree=jobs[name,color,lastBuild[number],downstreamProjects[name,color]]');
  }

  function getViews(url) {
    return getJSON(url + '/api/json?tree=views[name]')
      .then(function (data) {
        if (data.views.length > 1) data.views.shift(); // removing duplicate default view

        var jobs = data.views.map(function (view) {
          return getViewJobs(url, view.name).then(function (jobs) {
            view.jobs = jobs;
          });
        });

        return Promise.all(jobs).then(function () {
          data.views = data.views.filter(function (view) {
            return view.jobs.length > 0;
          });
          return data;
        });
      });
  }

  function getViewJobs(url, viewName) {
    return getJSON(url + '/view/' + viewName.replace(' ', '%20') + '/api/json?tree=name,jobs[name]')
      .then(function (data) {
        return data.jobs.map(function (job) {
          return job.name;
        });
      });
  }

  function getJSON(url) {
    return Promise.resolve($.getJSON(url)).catch(function () {
      throw new Error('error connecting to Jenkins: ' + url);
    });
  }

  return {
    getMonitorData: getMonitorData,
    getJobData: getJobData
  };
}(jQuery));
