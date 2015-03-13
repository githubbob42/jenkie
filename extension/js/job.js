/*jshint multistr:true */

$(function (BallColor) {

  // map jenkins colors to bootstrap contextual classes
  var StatusMap = {
    blue: 'success',
    yellow: 'warning',
    red: 'danger',
    grey: ''
  };

  ko.components.register('job', {
    viewModel: function (params) {
      var watched = params.watched,
          jobs = params.jobs,
          job = params.job,
          ball = BallColor[job.color];

      this.jobs = jobs;
      this.watched = watched;

      this.name = job.name;
      this.color = ball.color;
      this.queued = job.inQueue;
      this.building = ball.building;
      this.buildStatus = StatusMap[ball.color];
      this.jobStatus = ball.building ? 'warning' : this.buildStatus;

      this.isWatched = ko.computed(function () {
        return ko.utils.arrayFirst(watched(), function (watched) {
          return watched === job.name;
        });
      }, this);

      var downstreamProjectNames = job.downstreamProjects.map(function (project) {
        return project.name;
      });

      this.hasDisplayedParent = ko.computed({
        read: function () {
          var matchingUpstream = jobs().filter(function (job) {
            return !!~params.job.upstreamProjects.indexOf(job.name);
          });
          if (matchingUpstream.length > 0) return true;

          var matchingDownstream = jobs().filter(function (job) {
            return job.downstreamProjects.filter(function (project) {
              return project.name === params.job.name;
            })[0];
          });
          if (matchingDownstream.length > 0) return true;

          return false;
        }
      });

      this.children = ko.computed({
        read: function () {
          var matchingUpstream = jobs().filter(function (job) {
            return !!~job.upstreamProjects.indexOf(params.job.name);
          });

          var matchingDownstream = jobs().filter(function (job) {
            return !!~downstreamProjectNames.indexOf(job.name);
          });

          return matchingUpstream.concat(matchingDownstream).sort(function (a, b) {
            return a.name - b.name;
          });
        },
        deferEvaluation: true
      });
    },
    template:
      '<div data-bind="attr: { class: \'job list-group-item list-group-item-\' + jobStatus }, css: { \'has-parent\': hasDisplayedParent }">\
        <div class="watch">\
          <div class="btn btn-default" title="toggle notification" data-bind="css: { active: isWatched }">\
            <span class="glyphicon glyphicon-bell"></span>\
          </div>\
        </div>\
        <span data-bind="text: name"></span>\
        <span class="label" data-bind="if: building, css: \'label-\' + buildStatus">building</span>\
        <span class="label" data-bind="if: queued, css: \'label-info\'">queued</span>\
        <div class="children" data-bind="visible: children().length > 0">\
          <!-- ko foreach: { data: children, as: \'child\' } -->\
          <job params="jobs: $parent.jobs, watched: $parent.watched, job: child"></job>\
          <!-- /ko -->\
        </div>\
      </div>'
  });

}(BallColor));
