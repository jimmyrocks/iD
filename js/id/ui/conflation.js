iD.ui.Conflation = function(context) {
  var dispatch = d3.dispatch('falsePositive', 'skip', 'save', 'cancel'),
    list;

  function conflation(selection) {
    var header = selection
      .append('div')
      .attr('class', 'header fillL');

    header
      .append('button')
      .attr('class', 'fr')
      .on('click', function() {
        dispatch.cancel();
      })
      .append('span')
      .attr('class', 'icon close');

    header
      .append('h3')
      .text('MapRoulette Conflation Tools');

    var body = selection
      .append('div')
      .attr('class', 'body fillL');

    function disableConflation() {
      window.xContext = context;
      console.log('disableConflation', iD.ConflationLayer().enable());
      header.style('display', iD.ConflationLayer().enable() ? 'block' : 'none');
    }

    context.background()
      .on('change', _.debounce(disableConflation, 500));

    disableConflation();

  }

  return d3.rebind(conflation, dispatch, 'on');
};
