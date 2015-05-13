iD.ConflationLayer = function() {
  var enable = true,
    geojson;

  function render(_) {
    console.log('0 set to', _);
    console.log('This is where we do stuff with that sidebar!', _);
    // render.enable(true);
  }

  render.enable = function(_) {
    console.log('a set to', _);
    if (!arguments.length) return enable;
    enable = _;
    console.log('b set to', _);
    return render;
  };

  render.geojson = function(_) {
    console.log('1 set to', _);
    if (!arguments.length) return geojson;
    geojson = _;
    return render;
  };

  render.id = 'layer-conflation';

  return render;
};
