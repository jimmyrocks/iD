iD.ui.Conflation = function(context) {
  var dispatch = d3.dispatch('falsePositive', 'skip', 'save', 'cancel');

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
    var pickAChallenge = body.append('div').text('Pick a challenge: ');
    var taskInstruction = body.append('div');
    var buttonArea = body.append('div').attr('class', 'btnArea');

    var options, change = function() {
      var selectedIndex = challengeDropDown.property('selectedIndex'),
        data = options[0][selectedIndex].__data__;
      var taskUrl = 'http://' + apiServer + '/api/challenge/' + data.slug + '/task';
      d3.json(taskUrl, function(e, r) {
        taskInstruction.text(r.instruction);
        welcomeScreen.style('display', 'none');
        d3.json(taskUrl + '/' + r.identifier + '/geometries', function(ge, gr) {

          // Probably a new function or so
          var osmid;
          if (gr.features[0].properties.osmid) {
            osmid = gr.features[0].properties.osmid;
            osmid = osmid ? 'w' + osmid : 'w-1'; //TODO: don't always assume way
            gr.features.splice(0, 1);
          }

          // draw all other features to draw
          context.background().setConflationGeoJSON(gr);
          if (osmid) {
            context.zoomToEntity(osmid, true);
          } else {
            context.map().centerZoom(d3.geo.centroid(gr), context.map().zoom());
          }

          // Draw some buttons
          var buttons = [{
            'id': osmid,
            'text': 'ok',
            'action': context.perform,
            'params': function(newId) {
              return [iD.actions.Conflate(newId, context.projection, gr), newId];
            }
          }];
          buttonArea.selectAll('button').data([]).exit().remove();
          buttonArea.selectAll('button').data(buttons).enter()
            .append('button')
            .text(function(d) {
              return d.text;
            })
            .on('click', function(d) {
              // Add the osmid if it doesn't exist
              if (!d.id) {
                var way = iD.Way({
                  tags: {
                    area: 'yes'
                  }
                }); //TODO more than just areas
                context.perform(iD.actions.AddEntity(way));
                d.id = way.id;
              }

              d.action.apply(this, d.params(d.id));
            });

          //
        });
      });

    };
    var challengeDropDown = pickAChallenge.append('select').on('change', change);

    d3.json('http://' + apiServer + '/api/challenges', function(e, r) {
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
