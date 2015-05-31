iD.ui.Conflation = function(context) {
  var dispatch = d3.dispatch('falsePositive', 'skip', 'save', 'cancel');

  var apiServer = 'localhost:25000';

  function conflation(selection) {

    // Build the wrapper for the conflation tasks
    var wrapper = selection
      .append('div')
      .attr('class', 'conflation-pane'),

      // Add a header so people know what the area is for
      header = wrapper
      .append('div')
      .attr('class', 'header fillL'),

      // Add a body area (where all the tools can be found)
      body = wrapper
      .append('div')
      .style('height', 'inherit')
      .style('background', '#F6F6F6')
      .attr('id', 'conflation-body')
      .attr('class', 'header fillL'),

      // The area for the information about the task
      taskInfo = body
      .append('div')
      .attr('class', 'conflation-panel'),

      // Dropdown box
      pickAChallenge = body
      .append('div')
      .attr('class', 'conflation-panel')
      .style('display', 'none')
      .text('Pick a challenge: '),

      // Area for instructions from the task
      taskInstruction = body
      .append('div')
      .attr('class', 'conflation-panel'),

      // Area for the Conflation task buttons
      buttonArea = body
      .append('div')
      .attr('class', 'btnArea'),

      // The dropdown box itself and the function that runs when it is changed
      options,
      change = function() {
        var selectedIndex = challengeDropDown.property('selectedIndex'),
          data = options[0][selectedIndex].__data__;
        setChallenge(data);
      },
      challengeDropDown = pickAChallenge.append('select').on('change', change),

      tooltip = function(text) {
        return bootstrap.tooltip()
          .placement('left')
          .html(true)
          .title(text);
      };

    function buildDisplay() {
      // Create the header
      header
        .append('button')
        .attr('class', 'fr')
        .on('click', function() {
          context.background().toggleConflationLayer(false);
        })
        .append('span')
        .attr('class', 'icon close');

      var headerSpan = header
        .append('div')
        .on('click', (function() {
          console.log('clicky');
          selection.selectAll('#conflation-body').classed('inspector-hidden', false);
          selection.selectAll('#more-content').classed('inspector-hidden', true);
        }));

      headerSpan
        .append('span')
        .attr('class', 'icon save icon-rotate-180')
        .attr('id', 'more-content')
        .style('float', 'left')
        .style('margin-top', '20px');

      headerSpan
        .append('h3')
        .text(t('conflation.title'));

      // Get the list of challenges
      d3.json('http://' + apiServer + '/api/challenges', function(e, r) {
        if (!e) {
          // Populate the dropdown
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
          // Default to the first challenge in the list and only change challenges if the user asks to change 
          setChallenge(r[0]);
        }
      });
    }

    function disableConflation() {
      wrapper.style('display', context.background().hasConflationLayer() ? 'block' : 'none');
    }

    function setChallenge(challenge) {
      console.log('setting challenge', challenge);
      // Populate the taskInfo box:
      taskInfo.selectAll('div').data([]).exit().remove();
      var header = taskInfo.selectAll('div').data([challenge]).enter()
        .append('div');

      header.append('h3').text(function(d) {
          return d.title;
        })
        .append('span')
        .style('float', 'right')
        .style('margin-right', '-10px')
        .call(tooltip(function(d) {
          return d.help + '<br/> Difficulty: ' + d.difficulty;
        }))
        .append('span').attr('class', 'icon inspect');

      header.append('div').style('margin-left', '5px').html(function(d) {
        return '<span style="font-weight: bold;">Description</span>: ' + d.description + '<br/><span style="font-weight: bold;">Blurb</span>: ' + d.blurb;
      });
      header.append('hr').style('width', '75%');

      // Get a random task for this challenge
      getNewTask(challenge.slug);
    }

    function getNewTask(slug) {
      var taskUrl = 'http://' + apiServer + '/api/challenge/' + slug + '/task';

      d3.json(taskUrl, function(e, r) {
        taskInstruction.style('margin-left', '5px').html('<span style="font-weight: bold;">Instructions: </span>' + r.instruction);
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
            'text': 'This is not an error'
          }, {
            'text': 'Skip'
          }, {
            'text': 'I fixed it'
          }, {
            'id': osmid,
            'import': true,
            'text': 'Import / Redraw',
            'action': context.perform,
            'params': function(newId) {
              return [iD.actions.Conflate(newId, context.projection, gr), newId];
            }
          }];
          buttonArea.selectAll('div').data([]).exit().remove();
          buttonArea.selectAll('div').data(buttons).enter()
            .append('div').append('button')
            .text(function(d) {
              return d.text;
            })
            .on('click', function(d) {
              if (d.import) {
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
              }
            });
        });
      });
    }

    context.background()
      .on('change', _.debounce(disableConflation, 500));

    disableConflation();

    buildDisplay();
  }

  return d3.rebind(conflation, dispatch, 'on');
};
