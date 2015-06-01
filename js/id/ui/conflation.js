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

      // Add a spinner while the body content loads
      spinner = body
      .append('span')
      .append('img')
      .attr('src', 'dist/img/mini-loader.gif'),

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
        var tooltipElement = bootstrap.tooltip()
          .placement('left')
          .html(true)
          .title(text);
        return tooltipElement;
      };

    function buildDisplay() {
      spinner.style('display', 'block');
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
        .style('cursor', 'pointer')
        .on('click', (function() {
          var newMode = !selection.selectAll('#conflation-body').classed('inspector-hidden');
          selection.selectAll('#conflation-body').classed('inspector-hidden', newMode);
          selection.selectAll('#more-content').classed('icon-rotate-180', newMode);
        }));

      headerSpan
        .append('span')
        .attr('class', 'icon save')
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
      pickAChallenge.style('display', 'none');
      var header = taskInfo.selectAll('div').data([challenge]).enter()
        .append('div');

      var titleArea = header.append('h3').text(function(d) {
          return d.title;
        })
        .append('span')
        .style('float', 'right')
        .style('margin-right', '-10px')
        .call(tooltip(function(d) {
          return d.help + '<br/> Difficulty: ' + d.difficulty;
        }))
        .append('span').attr('class', 'icon inspect');

      header
        .append('div')
        .attr('class', 'btnArea')
        .append('button')
        .style('font-size', '10px')
        .style('top', '-10px')
        .style('margin-left', '15px')
        .style('width', '40%')
        .style('background', '#C8C8C8')
        .text('Select a different challenge')
        .on('click', function() {
          // Mark the current task as skipped

          // Hide this pane
          titleArea.selectAll('div').data([]).exit().remove();
          taskInfo.selectAll('div').data([]).exit().remove();
          taskInstruction.style('display', 'none');
          buttonArea.selectAll('div').data([]).exit().remove();


          // Bring back the pickAChallenge dropdown
          pickAChallenge.style('display', 'block');
        });


      header.append('div').style('margin-left', '5px').html(function(d) {
        return '<span style="font-weight: bold;">Description</span>: ' + d.description + '<br/><span style="font-weight: bold;">Blurb</span>: ' + d.blurb;
      });
      header.append('hr').style('width', '75%');

      // Get a random task for this challenge
      getNewTask(challenge.slug);
    }

    function updateTask(url, payload) {
      if (payload && payload.action === 'fixed') {
        // Alert the user to make sure they save!
        var modal = iD.ui.modal(d3.selectAll('body'));

        modal.select('.modal')
          .attr('class', 'modal fillL col6');
        var introModal = modal.select('.content');

        introModal.attr('class', 'cf');

        introModal.append('div')
          .attr('class', 'modal-section')
          .append('h3')
          .text('Remember to save your fixes!');

      }
      d3.json(url)
        .header('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .send('PUT', 'action=' + payload.action, function() {
          getNewTask(payload.slug);
        });
    }

    function getNewTask(slug) {
      var taskUrl = 'http://' + apiServer + '/api/challenge/' + slug + '/task';

      d3.json(taskUrl, function(e, r) {
        var taskInfoUrl = taskUrl + '/' + r.identifier;
        taskInstruction.style('display', 'block').style('margin-left', '10px').html('<span style="font-weight: bold;">Instructions: </span>' + r.instruction);
        d3.json(taskInfoUrl + '/geometries', function(ge, gr) {
          // Remove the spinner
          spinner.style('display', 'none');

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
            'import': true,
            'text': osmid ? 'Redraw' : 'Import',
            'action': context.perform,
              'background': '#FFFFE8',
            'params': function(newId) {
              return [iD.actions.Conflate(newId, context.projection, gr), newId];
            }
          }, {
            'text': 'This is not an error',
            'action': updateTask,
            'params': [taskInfoUrl, {
              'action': 'falsepositive',
              'slug': slug,
              'label': 'Not an error'
            }]
          }, {
            'text': 'Skip',
            'action': updateTask,
            'params': [taskInfoUrl, {
              'action': 'skipped',
              'slug': slug,
              'label': 'No'
            }]
          }, {
            'text': 'I fixed it',
            'action': updateTask,
            'params': [taskInfoUrl, {
              'action': 'fixed',
              'slug': slug,
              'label': 'Yes'
            }]
          }];
          buttonArea.selectAll('div').data([]).exit().remove();
          buttonArea.selectAll('div').data(buttons).enter()
            .append('div').append('button')
            .style('background', function(d) {
              return d.background || '';
            })
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
              } else {
                d.action.apply(this, d.params);
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
