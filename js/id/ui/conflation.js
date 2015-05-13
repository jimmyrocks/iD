iD.ui.Conflation = function(context) {
  var dispatch = d3.dispatch('falsePositive', 'skip', 'save', 'cancel'),
    list;

  var apiServer = 'localhost:25000';

  function conflation(selection) {
    var wrapper = selection
      .append('div')
      .attr('class', 'conflation-pane');

    var header = wrapper
      .append('div')
      .attr('class', 'header fillL');

    header
      .append('button')
      .attr('class', 'fr')
      .on('click', function() {
        context.background().toggleConflationLayer(false);
      })
      .append('span')
      .attr('class', 'icon close');

    header
      .append('h3')
      .text(t('conflation.title'));

    var body = wrapper
      .append('div')
      .attr('class', 'header fillL');


    var welcomeScreen = body.append('div');

    welcomeScreen.append('h2').text('Welcome to MapRoulette Conflation!');
    var pickAChallenge = body.append('div').text('Pick a challenge');

    var options, change = function() {
      var selectedIndex = challengeDropDown.property('selectedIndex'),
        data = options[0][selectedIndex].__data__;
        var taskUrl = 'http://' + apiServer + '/api/challenge/' + data.slug + '/task';
        d3.json(taskUrl, function(e,r) {
          welcomeScreen.style('display', 'none');
          d3.json(taskUrl + '/' + r.identifier + '/geometries', function(ge, gr) {
            console.log(gr);
            console.log(gr.features[0].properties.osmid);
            context.zoomToEntity('w' + gr.features[0].properties.osmid, true);
          });
          console.log(r);
        });

    };
    var challengeDropDown = pickAChallenge.append('select').on('change', change);

    d3.json('http://' + apiServer + '/api/challenges', function(e, r) {
      console.log(e, r);
      if (!e) {
        options = challengeDropDown.selectAll('option')
          .data(r);

        options
          .enter()
          .append('option')
          .value(function(d) {
            return d.slug;
          })
          .text(function(d) {
            return d.title;
          });
      }
    });


    function disableConflation() {
      wrapper.style('display', context.background().hasConflationLayer() ? 'block' : 'none');
    }

    context.background()
      .on('change', _.debounce(disableConflation, 500));

    disableConflation();

  }

  return d3.rebind(conflation, dispatch, 'on');
};
