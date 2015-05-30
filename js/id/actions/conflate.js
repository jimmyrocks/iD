iD.actions.Conflate = function(wayId, projection, geojson) {

  if (!wayId) return; // Todo create completely new objects

  var action = function(graph) {
    var way = graph.entity(wayId),
      nodes = _.uniq(graph.childNodes(way)),
      keyNodes = nodes.filter(function(n) {
        return graph.parentWays(n).length !== 1;
      }),
      geojsonPoints = [],
      ids,
      nodeIsKey = function(n) {
        // Function to determine if a node is a key Node
        return keyNodes.filter(function(keyNode) {
          return keyNode.id === n.id;
        }).length > 0;
      },
      newNodes = [],
      newNodeIndex = 0,
      matchedNodes = {},
      withKeyNodes = [];

    // Get the points from the geojson input
    geojsonPoints = _.uniq(geojson.features[0].geometry.coordinates[0], false, function(d) {
      return d[0].toString() + ',' + d[1].toString();
    }).map(function(coord) {
      return projection(coord);
    });

    // Loop through all the points in the geojson and add them to the way
    geojsonPoints.forEach(function(geojsonPoint) {
      var loc, node;
      // Go through all the points in the geojson obj and add them to the map
      // Don't move existing nodes (this creates issues)
      if (nodes[newNodeIndex] && nodeIsKey(nodes[newNodeIndex])) {
        newNodeIndex++;
      }

      loc = projection.invert(geojsonPoint);

      // see if there are still existing nodes left to move
      if (newNodeIndex < nodes.length) {
        // We are moving an existing node
        node = nodes[newNodeIndex].move(loc);
      } else {
        //New Nodes
        node = iD.Node({
          loc: loc
        });
      }
      graph = graph.replace(node);
      newNodes.push(node);
      newNodeIndex++;
    });

    // Let's figure out where to put those keyNodes
    keyNodes.forEach(function(kn, ki) {
      // Find the closest new node
      var dist = Infinity;
      newNodes.forEach(function(nn, ni) {
        var testDist = iD.geo.euclideanDistance(kn.loc, nn.loc);
        if (testDist < dist && ni !== newNodes.length - 1) {
          dist = testDist;
          matchedNodes[ki] = ni;
        }
      });

      // Now that we know the closest node, let's see which side of that node to put it on
      var nextNode = newNodes[matchedNodes[ki] + 1] || newNodes[0];
      var prevNode = newNodes[matchedNodes[ki] - 1] || newNodes[newNodes.length - 1];
      var nextPrev;
      if (iD.geo.euclideanDistance(prevNode.loc, kn.loc) < iD.geo.euclideanDistance(kn.loc, nextNode.loc)) {
        // It's closer to the prev node
        nextPrev = -1;
      } else {
        nextPrev = 0;
      }
      //console.log('Decider', kn, nextNode, prevNode, nn);
      matchedNodes[ki] = matchedNodes[ki] + nextPrev >= 0 ? matchedNodes[ki] + nextPrev : newNodes.length - 1;
      matchedNodes[ki] = matchedNodes[ki] === newNodes.length - 1 ? newNodes.length - 2 : matchedNodes[ki];
    });

    // Add the key nodes into the withKeyNodes array
    newNodes.forEach(function(nn, ni) {
      withKeyNodes.push(nn);
      for (var kn in matchedNodes) {
        if (matchedNodes[kn] === ni) {
          withKeyNodes.push(keyNodes[kn]);
        }
      }
    });

    // update the way to have all the new nodes
    ids = withKeyNodes.map(function(n) {
      return n.id;
    });

    // Close the loop
    if (ids[ids.length - 1] !== ids[0]) {
      ids.push(ids[0]);
    }

    // Determine which nodes we need to remove (are no longer needed)
    var nodesToRemove = _.uniq(nodes.filter(function(n) {
      return ids.indexOf(n.id) === -1;
    }));

    // Update the way
    way = way.update({
      nodes: ids
    });
    graph = graph.replace(way);

    // Actually remove the extra nodes
    nodesToRemove.forEach(function(n) {
      graph = graph.remove(n);
    });

    return graph;
  };

  return action;
};
