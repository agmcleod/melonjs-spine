(function() {
  spine.Bone.yDown = true;
  me.Spine = {};
  me.Spine.Entity = me.ObjectEntity.extend({
    init: function(x, y, settings) {
      this.debugged = false;
      if(isNullOrUndefined(settings['atlas']) || isNullOrUndefined(settings['imagePath']) || isNullOrUndefined(settings['spineData'])) {
        throw "Ensure atlas, imagePath and spineData are specified in the settings hash";
      }
      var image = me.loader.getImage(settings['imagePath']);
      this.settings = settings;
      this.time = me.timer.getTime();
      this.initSpineObjects(x, y);
      this.parent(x, y, this.settings);
      this.anchorPoint.x = 0.5;
      this.anchorPoint.y = 0.5;
      
      this.vertices = Array(8);
      this.isRenderable = true;
    },

    draw: function(context, rect) {
      this.parent(context, rect);
      var drawOrder = this.skeleton.drawOrder;
      for (var i = 0, n = drawOrder.length; i < n; i++) {
        var slot = drawOrder[i];
        var attachment = slot.attachment;
        if (!(attachment instanceof spine.RegionAttachment)) continue;
        var image = attachment.rendererObject.page.rendererObject;

        context.save();
        context.globalAlpha = slot.a;
        /* var sourceAngle = attachment.rotation;
        var xpos = ~~this.skeleton.getRootBone().x, ypos = ~~this.skeleton.getRootBone().y;

        var w = attachment.regionWidth, h = attachment.regionHeight;
        var angle = this.angle + sourceAngle;

        if ((this.scaleFlag) || (angle!==0)) {
          // translate to the defined anchor point
          context.translate(xpos, ypos);
          // scale
          if (this.scaleFlag) {
            context.scale(this.scale.x, this.scale.y);
          }
          if (angle!==0) {
            context.rotate(angle);
          }

          if (sourceAngle!==0) {
            // swap w and h for rotated source images
            w = this.height, h = this.width;
          }
        }

        context.drawImage(image,
                attachment.regionOffsetX, attachment.regionOffsetY,
                w, h,
                xpos, ypos,
                w, h); */
        
        attachment.computeVertices(this.skeleton.x, this.skeleton.y, slot.bone, this.vertices);
        var sx = attachment.uvs[4]*image.width, sy = attachment.uvs[5]*image.height;
        var sw = attachment.uvs[0]*image.width - sx, sh = attachment.uvs[1]*image.height - sy;
        var dx = this.vertices[0]+this.skeleton.getRootBone().x, dy = this.vertices[1]+this.skeleton.getRootBone().y;
        var dw = (this.vertices[4]+this.skeleton.getRootBone().x)-dx, dh = (this.vertices[5]+this.skeleton.getRootBone().y)-dy;
        if(!this.debugged) {
          console.log(slot.bone.data.name);
          console.log(attachment.uvs);
          console.log(attachment.offset);
          console.log(this.vertices);
          console.log(image,
            sx, sy,
            sw, sh,
            dx, dy,
            dw, dh);
          this.debugged = true;
        }
        
        context.drawImage(image,
          sx, sy,
          sw, sh,
          dx, dy,
          dw, dh
        );
        context.restore();
      }
    },

    initSpineObjects: function(x, y) {
      var atlasText = me.loader.getTextFile(this.settings['atlas']);
      var loader = new me.Spine.TextureLoader();
      loader.imagePath = this.settings.imagePath;
      var atlas = new spine.Atlas(atlasText, loader);
      var skeletonJson = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
      var skeletonData = skeletonJson.readSkeletonData(me.loader.getJSON(this.settings['spineData']));
      this.skeleton = new spine.Skeleton(skeletonData);

      this.skeleton.getRootBone().x = x;
      this.skeleton.getRootBone().y = y;
      this.skeleton.updateWorldTransform();

      this.stateData = new spine.AnimationStateData(skeletonData); 
      this.state = new spine.AnimationState(this.stateData);
      for(var i = 0; i < atlas.regions.length; i++) {
        var region = atlas.regions[i];
        if(region.name == this.settings['name']) {
          this.width = region.width;
          this.height = region.height;
          this.settings['spritewidth'] = this.width;
          this.settings['spriteheight'] = this.height;
        }
      }
      
    },

    update: function() {
      this.parent(this);
      this.state.update(me.timer.getTime() - this.time);
      this.state.apply(this.skeleton);
      this.skeleton.updateWorldTransform();
      this.pos.x = this.skeleton.getRootBone().x;
      this.pos.y = this.skeleton.getRootBone().y;

      this.time = me.timer.getTime();

      return true;
    }
  });

  me.Spine.TextureLoader = Object.extend({
    imagePath: null,
    load: function (page, path, a) {
      var texture = me.loader.getImage(this.imagePath);
      page.rendererObject = texture;
      page.width = texture.width;
      page.height = texture.height;
      a.updateUVs(page);
    },
    unload: function (texture) {
      delete texture;
    }
  });

  var isNullOrUndefined = function(object) {
    return object === null || typeof object === 'undefined';
  }
}).call(this);