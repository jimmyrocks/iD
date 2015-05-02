iD.ConflationLayer = function() {
  var enable =  true;

  function render(_) {
    // render.enable(true);
  }

  render.enable = function(_) {
    console.log('enable?', _);
    if (!arguments.length) return enable;
    enable = _;
    console.log('returning', _);
    return render;
  };

  render.disable = function(_) {
    if (!arguments.length) return enable;
    return render.enable(!_);
  };

  render.id = 'layer-conflation';

  return render;
};
