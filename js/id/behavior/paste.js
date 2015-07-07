iD.behavior.Paste = function(context) {
    var keybinding = d3.keybinding('paste');

    function omitTag(v, k) {
        return (
            k === 'phone' ||
            k === 'fax' ||
            k === 'email' ||
            k === 'website' ||
            k === 'url' ||
            k === 'note' ||
            k === 'description' ||
            k.indexOf('name') !== -1 ||
            k.indexOf('wiki') === 0 ||
            k.indexOf('addr:') === 0 ||
            k.indexOf('contact:') === 0
        );
    }

    function doPaste() {
        d3.event.preventDefault();

        var mouse = context.mouse(),
            projection = context.projection,
            viewport = iD.geo.Extent(projection.clipExtent()).polygon();

        if (!iD.geo.pointInPolygon(mouse, viewport)) return;

        var extent = iD.geo.Extent(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            newIDs = [],
            i, j;

        if (!oldIDs.length) return;

        for (i = 0; i < oldIDs.length; i++) {
            var oldEntity = oldGraph.entity(oldIDs[i]),
                action = iD.actions.CopyEntity(oldEntity.id, oldGraph, true),
                newEntities;

            extent._extend(oldEntity.extent(oldGraph));
            context.perform(action);

            // First element in `newEntities` contains the copied Entity,
            // Subsequent array elements contain any descendants..
            newEntities = action.newEntities();
            newIDs.push(newEntities[0].id);

            for (j = 0; j < newEntities.length; j++) {
                var newEntity = newEntities[j],
                    tags = _.omit(newEntity.tags, omitTag);

                context.perform(iD.actions.ChangeTags(newEntity.id, tags));
            }
        }

        // Put pasted objects where mouse pointer is..
        var center = projection(extent.center()),
            delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        context.perform(iD.actions.Move(newIDs, delta, projection));
        context.enter(iD.modes.Move(context, newIDs));
    }

    function doTagPaste() {
        // Modeled from JOSM: https://josm.openstreetmap.de/wiki/Help/Action/PasteTags
        d3.event.preventDefault();

        var mouse = context.mouse(),
            projection = context.projection,
            viewport = iD.geo.Extent(projection.clipExtent()).polygon();

        if (!iD.geo.pointInPolygon(mouse, viewport)) return;
        console.log('SelectedIDs', context.selectedIDs());
        console.log('OldIDs', context.copyIDs());

        var 
            // extent = iD.geo.Extent(),
            oldIDs = context.copyIDs(),
            oldGraph = context.copyGraph(),
            selectedIDs = context.selectedIDs(),
            tags = [],
            i, j;

        if (!oldIDs.length) return;
        if (!selectedIDs.length) return;

        for (i = 0; i < oldIDs.length; i++) {
            var oldEntity = oldGraph.entity(oldIDs[i]);
                // action = iD.actions.CopyEntity(oldEntity.id, oldGraph, true);
            console.log('Œ',oldEntity);

            // extent._extend(oldEntity.extent(oldGraph));
            // context.perform(action);

            // First element in `newEntities` contains the copied Entity,
            // Subsequent array elements contain any descendants..
            // newEntities = action.newEntities();
            // newIDs.push(newEntities[0].id);

            console.log('v', oldEntity, _.omit( oldEntity.tags, omitTag));
            tags.push(_.omit( oldEntity.tags, omitTag));
            // context.perform(iD.actions.ChangeTags(newEntity.id, tags));
        }
        console.log('tags', tags);

        for (j = 0; j < selectedIDs.length; j++) {
          console.log('j', j, selectedIDs[j]);
          var selectedEntity = context.graph().entity(selectedIDs[j]);
          console.log('selEntity', selectedEntity);
          var newTags = {}, oldTags = selectedEntity.tags;
          // Loop backwards because the first ones are more important
          for (var t = tags.length-1; t >= 0; t--) {
            for (var key in tags[t]){
              newTags[key] = tags[t][key];
            }
          }
          for (var newTag in newTags) {
            oldTags[newTag] = oldTags[newTag] || newTags[newTag];
          }
          context.perform(iD.actions.ChangeTags(selectedEntity.id, oldTags));
        }


        // Put pasted objects where mouse pointer is..
        // var center = projection(extent.center()),
            // delta = [ mouse[0] - center[0], mouse[1] - center[1] ];

        // context.perform(iD.actions.Move(newIDs, delta, projection));
        context.enter(iD.modes.Select(context, selectedIDs));
    }


    function paste() {
        keybinding.on(iD.ui.cmd('⌘V'), doPaste);
        keybinding.on(iD.ui.cmd('⌘⇧V'), doTagPaste);
        d3.select(document).call(keybinding);
        return paste;
    }

    paste.off = function() {
        d3.select(document).call(keybinding.off);
    };

    return paste;
};
