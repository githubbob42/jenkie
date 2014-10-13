var Monitor = (function ($) {

  function Monitor() {
    this.options = {
      url: ko.observable(),
      interval: ko.observable(5)
    };
    this.settings = {
      watchList: ko.observable(),
      currentView: ko.observable(),
      displayDownstream: ko.observable()
    };
    this.data = {
      views: ko.observableArray(),
      jobs: ko.observableArray()
    };

    this.jobList = ko.computed(function () {
      if (!this.settings.currentView()) return [];

      var viewJobs = ko.unwrap(this.settings.currentView().jobs) || [];
      return this.data.jobs().filter(function (job) {
        return viewJobs.indexOf(job.name) > -1;
      });
    }, this);

    this.data.views.subscribe(function (views) {
      views.push({ name: 'Currently Watching', jobs: this.settings.watchList });

      if (this.settings.currentView()) {
        var name = this.settings.currentView().name,
            found = ko.utils.arrayFirst(views, function (view) {
              return view.name === name;
            });
        this.settings.currentView(found || views[0]);
      } else {
        this.settings.currentView(views[0]);
      }
    }, this);

    this.isWatchingAll = ko.computed(function () {
      if (!this.settings.currentView() || this.jobList().length === 0) return false;

      var watchList = this.settings.watchList();

      return this.jobList().reduce(function (watching, job) {
        return watching && !!~watchList.indexOf(job.name);
      }, true);
    }, this);

    this.settings.watchList.subscribe(function (jobs) {
      Store.saveSettings({ watchList: jobs });
    });
    this.settings.currentView.subscribe(function (view) {
      Store.saveSettings({ defaultView: view.name });
    });
  }

  Monitor.prototype.toggleWatch = function (job) {
    var jobs = this.settings.watchList() || [],
        found = jobs.indexOf(job.name);

    if (found !== -1) {
      jobs.splice(found, 1);
    } else {
      jobs.push(job.name);
    }
    this.settings.watchList(jobs);
  };

  Monitor.prototype.toggleAll = function () {
    if (this.isWatchingAll()) {
      this.settings.watchList([]);
    } else {
      var list = this.jobList().map(function (job) {
        return job.name;
      });
      this.settings.watchList(list);
    }
  };

  Monitor.prototype.openJobTab = function (job) {
    if (!job || !job.name) return;
    var url = this.options.url() + '/job/' + job.name + '/' + (job.lastBuild && job.lastBuild.number || '');
    chrome.tabs.create({ url: url });
  };

  Monitor.prototype.clickHandler = function (monitor, event) {
    var job = ko.dataFor(event.target);

    if ($(event.target).closest('.job, .watch').is('.watch')) {
      this.toggleWatch.call(monitor, job);
    } else {
      this.openJobTab.call(monitor, job);
    }
    return false;
  };

  Monitor.prototype.saveOptions = function () {
    var options = {
      url: (this.url() || '').trim().replace(/\/+$/, ''),
      interval: this.interval()
    };

    if (options.url.length > 0) {
      Store.saveOptions(options).then(window.close);
    }
    return false;
  };

  return Monitor;
}(jQuery));
