(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Grid = {
    canvas: null,
    grid_size: 50,
    min_grid_size:14,
    lines: [], //to keep track of the lines created so they can be removed

    //Removes the current Grid
    removeGrid: function() {
        for (var i = 0; i < Grid.lines.length; i++) {
            Grid.canvas.remove(Grid.lines[i]);
        }
    },

    //Removes the current grid and recreates it based on the grid size
    createGrid: function() {
        Grid.removeGrid();
        var line;
        //create the harizontal lines of the grid
        for (i = 0; i < this.canvas.width; i += this.grid_size) {
            line = new fabric.Line([i, 0, i, this.canvas.height * 2], {
                stroke: '#ccc',
                selectable: false
            });
            Grid.lines.push(line);
            Grid.canvas.add(line);
            Grid.canvas.sendToBack(line);
        }

        //create the vertical lines of the grid
        for (i = 0; i < Grid.canvas.height; i += Grid.grid_size) {
            line = new fabric.Line([0, i, Grid.canvas.width * 2, i], {
                stroke: '#ccc',
                selectable: false
            });
            Grid.lines.push(line);
            Grid.canvas.add(line);
            Grid.canvas.sendToBack(line);
        }
    }
};

//Monitors for changes in the grid spacing input field and re-creates the grid if a change is detected
$('#grid-size-input').change(function() {
    var new_grid_size = parseInt($('#grid-size-input').val());

    if (!isNaN(new_grid_size) && new_grid_size > Grid.min_grid_size) {
        Grid.grid_size = new_grid_size;
        Grid.createGrid();
    }
});

module.exports = Grid;
},{}],2:[function(require,module,exports){
var Node=require('./Node');
//Controlls the current mode
var ModeController={
	canvas: null,
	mode: 'move',
	new_node:null,

	clearNode:function(){
		if(ModeController.new_node){
			ModeController.canvas.remove(ModeController.new_node.circle);
			ModeController.new_node=null;
		}
	}
};

$('#eraser-button').on('click',function(){
	ModeController.mode='erase';
	ModeController.clearNode();
});

$('#move-button').on('click',function(){
	ModeController.mode='move';
	ModeController.clearNode();
});

$('#add-member-button').on('click',function(){
	ModeController.mode='add_member';
	ModeController.clearNode();
});

$('#add-node-button').on('click',function(){
	if(ModeController.mode!=='add_node'){ //if not already in add node mode
		ModeController.new_node=new Node(100,100, ModeController.canvas);
		ModeController.mode='add_node';
	}
});

module.exports=ModeController;

},{"./Node":3}],3:[function(require,module,exports){
function Node(left, top,canv){
	this.circle = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 5,
      radius: 12,
      fill: '#fff',
      stroke: '#666',
      selectable: true
    });


    this.circle.hasControls = this.circle.hasBorders = false;
    this.circle.connected_members=[];

    if(canv){
        Node.canvas = canv;
        Node.canvas.add(this.circle);
    }
    
    return this;
}
Node.prototype.addMember=function(x1,y1,x2,y2){
	var line=new fabric.Line([this.circle.left,this.circle.top,x1,y1],{
	  fill: 'red',
      stroke: 'red',
      strokeWidth: 5,
      selectable: false
	});

	this.circle.connected_members.push(line);
	Node.canvas.add(line);
};
module.exports=Node;
},{}],4:[function(require,module,exports){
var ResizeController={
	canvas: null,
	grid: null,
	initial:true,
	resize_grid: true, //whether the grid should be regenerated after a resize event

	//resizes canvas based on current and future window dimensions, as well as resizes the grid
	resizeCanvas: function(){
		if(ResizeController.canvas){
			ResizeController.canvas.setHeight($(window).height()-120);
	    	ResizeController.canvas.setWidth($(window).width()-2);
	    	ResizeController.canvas.renderAll();
		}

		if(ResizeController.grid && (ResizeController.resize_grid || ResizeController.initial)){
	    	ResizeController.grid.createGrid();
	    	ResizeController.initial=false;
	    }
	}
};
//Resizes the canvas and grid upon a window resize
$(window).on('resize',function(){
	ResizeController.resizeCanvas();
});

module.exports=ResizeController;
},{}],5:[function(require,module,exports){
  var ModeController = require('./ModeController');
  var Node = require('./Node');
  var Grid = require('./Grid');
  var ResizeController = require('./ResizeController');

  var canvas = new fabric.Canvas('truss-canvas', {
      selection: true
  });

  ModeController.canvas = canvas;
  Grid.canvas = canvas;
  ResizeController.canvas = canvas;
  ResizeController.grid = Grid;
  ResizeController.resizeCanvas(); //creates the grid as well, and recreates it upon a window resize 

  fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

  canvas.on('mouse:move', function(event) {
      if (ModeController.mode === 'add_node') {
          ModeController.new_node.circle.set({
              'left': event.e.x,
              'top': event.e.y - 105
          });
          canvas.renderAll();
      }
  });

  canvas.on('mouse:up', function(event) {
      if (ModeController.mode === 'add_node') {
          //for some reason have to remove and re-add node to avoid weird glitcheness
          canvas.remove(ModeController.new_node.circle);
          canvas.add(ModeController.new_node.circle);
          ModeController.new_node = new Node(event.e.x, event.e.y - 105, canvas);
      }
  });

  $('#redraw').on('click', function() {
      canvas.renderAll();
      canvas.calcOffset();
      console.log('redraw');
  });
  var previous_fill;
  var hover_fill = 'red';
  canvas.on('mouse:over', function(e) {
      if (ModeController.mode === 'erase') {
          previous_fill = e.target.getFill();
          e.target.setFill(hover_fill);
          canvas.renderAll();
      }
  });

  canvas.on('mouse:out', function(e) {
      if (ModeController.mode === 'erase') {
          e.target.setFill(previous_fill);
          canvas.renderAll();
      }
  });
  var node = new Node(50, 50, canvas);
  node.addMember(5, 6, 8, 11);

   // function makeCircle(left, top, line1, line2, line3, line4) {
   //   var c = new fabric.Circle({
   //     left: left,
   //     top: top,
   //     strokeWidth: 5,
   //     radius: 12,
   //     fill: '#fff',
   //     stroke: '#666',
   //     selectable: true
   //   });
   //   c.hasControls = c.hasBorders = false;

   //   c.line1 = line1;
   //   c.line2 = line2;
   //   c.line3 = line3;
   //   c.line4 = line4;

   //   return c;
   // }

   // function makeLine(coords) {
   //   return new fabric.Line(coords, {
   //     fill: 'red',
   //     stroke: 'blue',
   //     strokeWidth: 5,
   //     selectable: false
   //   });
   // }

   // var line = makeLine([ 250, 125, 250, 175 ]),
   //     line2 = makeLine([ 250, 175, 250, 250 ]),
   //     line3 = makeLine([ 250, 250, 300, 350]),
   //     line4 = makeLine([ 250, 250, 200, 350]),
   //     line5 = makeLine([ 250, 175, 175, 225 ]),
   //     line6 = makeLine([ 250, 175, 325, 225 ]);

   // canvas.add(line, line2, line3, line4, line5, line6);
   // canvas.add(Node(5,5));
   // canvas.add(
   //   makeCircle(line.get('x1'), line.get('y1'), null, line),
   //   makeCircle(line.get('x2'), line.get('y2'), line, line2, line5, line6),
   //   makeCircle(line2.get('x2'), line2.get('y2'), line2, line3, line4),
   //   makeCircle(line3.get('x2'), line3.get('y2'), line3),
   //   makeCircle(line4.get('x2'), line4.get('y2'), line4),
   //   makeCircle(line5.get('x2'), line5.get('y2'), line5),
   //   makeCircle(line6.get('x2'), line6.get('y2'), line6)
   // );
  canvas.on('object:moving', function(e) {
      var target = e.target;

      if (target.type === 'circle') {
          for (var i = 0; i < target.connected_members.length; i++) {
              target.connected_members[i].set({
                  'x1': target.left,
                  'y1': target.top
              });
          }
      }
      // if(p.line1){
      // 	p.line1.set({ 'x2': p.left, 'y2': p.top });
      // }
      // if(p.line2){
      // 	p.line2.set({ 'x1': p.left, 'y1': p.top });
      // }
      // if(p.line3){
      // 	p.line3.set({ 'x1': p.left, 'y1': p.top });
      // }
      // if(p.line4){
      // 	p.line4.set({ 'x1': p.left, 'y1': p.top });
      // }
      canvas.renderAll();
  });

  function startSimulation() {
      return false;
  }
},{"./Grid":1,"./ModeController":2,"./Node":3,"./ResizeController":4}]},{},[5]);