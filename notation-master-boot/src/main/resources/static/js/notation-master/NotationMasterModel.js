/**
 * 
 */
"use strict";

var NotationMaster = NotationMaster || {};
var TouchEvent = TouchEvent || function(){}

NotationMaster.modelController = (function($){
	
	var vf = Vex.Flow;
	var contentCanvas = "#home-content-canvas"
	var checkAnswerButtonSelector = "#check-answer"
	var answerCount = "answer-count"
	var checkAnswerInputName = "notes-name"
	var gummyBearClass = "gummy-bear"
	var context, stave;
	var bottom = vf.Annotation.VerticalJustify.BOTTOM
	var isAnnotation = false
	var debug=false;
	var limits = {
		top: 24,
		bottom: 344,
		left: 157,
		right: 289,
		half: 10 // half of the note Y range
	}
	var englishToFrench = {
		a: 'la',
		b: 'si',
		c: 'do',
		d: 'ré',
		e: 'mi',
		f: 'fa',
		g: 'sol'
	}

	var createNote = function(note, verticalJustify) {
		var result = {}
		var n = new vf.StaveNote({keys: [note], duration: "q", auto_stem: true})
		n.addAccidental(0, new vf.Annotation(englishToFrench[note.charAt(0)]).
				setVerticalJustification(typeof verticalJustify === "undefined"? vf.Annotation.VerticalJustify.TOP: verticalJustify).
				setJustification(vf.Annotation.JustifyString.LEFT))
		result.noteWithAnnotation = n;
		result.noteWithoutAnnotation = new vf.StaveNote({keys: [note], duration: "q", auto_stem: true})
		var fn="audio/"+note+".mp3"
		//result.audio = new Audio(fn)
		msgDiv.addText("loaded "+fn)
		result.getAudio = function() {
			if (typeof this.audio === "undefined") {
				this.audio = new Audio()
				$(this.audio).on('loadstart',function(e){
					$.mobile.loading("show")
				})
				$(this.audio).on('playing',function(e){
					$.mobile.loading("hide")
				})
				this.audio.src=fn
				msgDiv.addText("loaded "+fn)
			}
			return this.audio
		}
		return result;
	}
	
	var createAllNotes = function() {
		return [createNote("c/6", bottom),
		createNote("b/5", bottom),
		createNote("a/5", bottom),
		createNote("g/5", bottom),
		createNote("f/5"),
		createNote("e/5"),
		createNote("d/5"),
		createNote("c/5"),
		createNote("b/4"),
		createNote("a/4", bottom),
		createNote("g/4"),
		createNote("f/4"),
		createNote("e/4"),
		createNote("d/4"),
		createNote("c/4"),
		createNote("b/3"),
		createNote("a/3")]
	}
	
	var notes

	var msgDiv;
	var currentAudio;
	var currentNote;
	
	var renderPage = function(note) {
		currentNote = note;
		renderStaff($(contentCanvas)[0])
		renderNote(note)
	}
	var renderInitial = function() {
		renderPage(notes[14])
	};
	
	var renderStaff = function(canvas) {
		var width=375
		var height=375
		var renderer = new vf.Renderer(canvas, vf.Renderer.Backends.CANVAS);
		// Configure the rendering context.
		renderer.resize(width, height);
		context = renderer.getContext();
		context.scale(4.0,4.0);
		context.setFont("Arial", 30, "").setBackgroundFillStyle("#eed");

		// Create a stave of width 400 at position 10, 40 on the canvas.
		stave = new vf.Stave(1, 1, 80, {space_above_staff_ln: 2.5, space_below_staff_ln: 0});

		// Add a clef and time signature.
		stave.addClef("treble");//.addTimeSignature("4/4");

		// Connect it to the rendering context and draw!
		stave.setContext(context).draw();
	}
	
	var stopPlaying = function() {
		if (typeof currentAudio !== "undefined") {
			clearTimeout(currentAudio.timer)
			currentAudio.audio.pause()
			currentAudio.audio.currentTime=0
		} else currentAudio = {}
	}
	
	var tmoutMilli = 3000
	
	var startDelayPlaying = function(note) {
		stopPlaying()
		currentAudio.audio = note.getAudio()
		currentAudio.timer=setTimeout(function(){
			msgDiv.addText("Playing note "+note.noteWithAnnotation.keys[0])
			//currentAudio.audio.load()
			currentAudio.audio.play()
		}, tmoutMilli)
		msgDiv.addText("Play note "+note.noteWithAnnotation.keys[0]+" in "+tmoutMilli+" milliseconds")
	}
	
	var startPlaying = function(note) {
		var taudio=note.getAudio()
		stopPlaying()
		currentAudio.audio = taudio
		msgDiv.addText("Playing note "+note.noteWithAnnotation.keys[0])
		currentAudio.audio.play()
	}
	
	var renderNote = function(aNote) {
		// add voice with 1 note
		var audioDelay = {}
		var voice = new vf.Voice({num_beats: 1, beat_value: 4})
		voice.addTickables([isAnnotation?aNote.noteWithAnnotation:aNote.noteWithoutAnnotation])
		var formatter = new vf.Formatter().joinVoices([voice]).format([voice], 200)
		voice.draw(context, stave)
		//startDelayPlaying(aNote)
	}
	
	var displayKeys = function(obj) {
		if (typeof obj === "object") {
			return obj.keys[0]
		} else {
			return obj
		}
	}
	
	var displayTouches = function(offset) {
		var result="<br>"
		$.each(offset, function(key, val){
			result+=" "+key+"="+val
		})
		return result
	}
	var oldN=-1
	
	var isDraggableRectangle = function(x, y) {
		if (x > limits.left && x < limits.right && y > limits.top-limits.half && y < limits.bottom+limits.half) return true;
		else return false;
	}


	var displayCoord = function(e){
		var xOffset = offset(e, 'X');
		var yOffset = offset(e, 'Y');
		var x=xOffset.offsetX;
		var y=yOffset.offsetY;
		var n;
		if (isDraggableRectangle(x, y)) {
			n=y-limits.top+limits.half;
			n=Math.trunc(n / 20);
			var msg="X="+x+" Y="+y+" n="+n+" notes="+notes[n].noteWithAnnotation.keys[0]+displayTouches(xOffset)+displayTouches(yOffset);
			if (debug) {
				e.target.title = msg
				msgDiv.addText(msg)
			}
			if (n!==oldN) renderPage(notes[n])
			oldN=n;
		} else {
			//e.target.title = ""
			//msgDiv.addText('')
		}
	}
		
	var offset = function(e, offType) {
		var result={};
		var isTouch=e.originalEvent instanceof TouchEvent;
		var offsetTargetName=offType==='Y'?'offsetTop':'offsetLeft';
		var pageName="client"+offType
		var offsetName="offset"+offType
		if (isTouch) {
			result[pageName]=e.originalEvent.targetTouches[0][pageName]
			result[offsetTargetName]=e.originalEvent.targetTouches[0].target[offsetTargetName]
			result[offsetName]=result[pageName] - result[offsetTargetName];
		} else {
			result[offsetName]=e[offsetName];
		}
		return result
	}
	var renderAnswer = function(div){
		div.append('<div class="'+gummyBearClass+'"/>')
		var gummydiv=div.find('div.'+gummyBearClass)
		div.append('<fieldset data-role="controlgroup" data-type="horizontal"></fieldset>')
		var fieldSet=div.find('fieldset')
		$.each(englishToFrench,function(key,val){
			fieldSet.append('<input type="radio" name="'+checkAnswerInputName+'" id="note-'+key+'" value="'+val+'"><label for="note-'+key+'">'+val+'<span data-count="0" class="'+answerCount+'"><br>0</span></label>')
		})
		fieldSet.append('<button id="check-answer" class="ui-btn ui-btn-inline">?</button>')
		//fieldSet.append('<span id="'+answerCount+'">0</span>')
	}
	var playAnswer = function(e){
		$.mobile.loading("show")
		if (!isDraggableRectangle(offset(e, 'X').offsetX, offset(e, 'Y').offsetY)) {
			setTimeout(function(){
				startPlaying(currentNote)
			},0)
		} else {
			$.mobile.loading("hide")
		}
	}
	
	var ncols=2
	var nrows=3
	var col = function(index) {
		return realIndex(index) % ncols
	}
	var row = function(index) {
		return Math.trunc(realIndex(index)/ncols)
	}
	var realIndex = function(index) {
		return index % (ncols*nrows)
	}
	
	var gummyBearNo = function(index) {
		return Math.trunc(index / (ncols*nrows))
	}
	
	var gummyBearColors = {blue:0, green:0, orange:0, purple:0, red:0, yellow:0}
	
	var gummyBearColorsClone = $.extend({}, gummyBearColors)

	
	var randomColor = function() {
		var k=Object.keys(gummyBearColorsClone)
		var l=k.length
		var i=Math.floor(Math.random()*l);
		var color=k[i]
		if (k.length>1) delete gummyBearColorsClone[color]
		else gummyBearColorsClone = $.extend({}, gummyBearColors) // replenish colors
		return color
	}
	
	var drawImage = function(canvas, index) {
		var img=canvas.data('img')
		var scale=3
		var iw=img.width
		var ih=img.height
		var pieceWidth=Math.floor(iw/ncols)
		var pieceHeight=Math.floor(ih/nrows)
		var context=canvas[0].getContext('2d')
		canvas[0].width=img.width/scale
		canvas[0].height=img.height/scale
		var ri=realIndex(index)
		for (var i = 0; i <= ri; i++) {
			var x=col(i)*pieceWidth
			var y=row(i)*pieceHeight
			context.drawImage(
				img,
				// image rectangle
				x, y, pieceWidth, pieceHeight,
				// canvas rectangle
				x/scale, y/scale, pieceWidth/scale, pieceHeight/scale
			)
		}
//		context.drawImage(img, 0, 0)
	}
	
	var renderGummyBear = function(index) {
		var gummyId='gummy-canvas-'+gummyBearNo(index)
		var gummyCanvas=$('#'+gummyId)
		if (gummyCanvas.length===0) {
			var gummydiv=$(contentCanvas).parent().find('div.'+gummyBearClass)
			gummydiv.append('<canvas id="'+gummyId+'" class="'+gummyBearClass+'" width="100" height="100"/>')
			gummyCanvas=$('#'+gummyId)
			var img=new Image()
			gummyCanvas.data('img', img)
			img.onload=function(e) {
				drawImage(gummyCanvas, index)
			}
//			img.on('load', function(e) {
//				drawImage(gummyCanvas, index)
//			})
			img.src="images/gummy_bear_"+randomColor()+'.png'
		} else {
			drawImage(gummyCanvas, index)
		}
		
	}
	
	var prevNote=""
	var currentIndex = 0
	var checkAnswer = function(e){
		var answer=$('input[name="'+checkAnswerInputName+'"]:checked')
		var note=englishToFrench[currentNote.noteWithAnnotation.keys[0].charAt(0)]
		// no cheating by answering the previous note
		if (answer.val()===note && prevNote!==note) {
//		if (1===1) {
			var span=answer.parent().find('span.'+answerCount)
			var ac=parseInt(span.attr('data-count'))+1
			span.attr('data-count', ac)
			span.html('<br>'+ac)
			renderGummyBear(currentIndex++)
		}
		prevNote=note
	}
	
	var init = function(theDebug) {
		debug=theDebug
		var cc=$(contentCanvas)
		renderAnswer(cc.parent())
		var d=$(document)
		cc.parent().append('<div data-debug="'+debug+'" id="msgDiv"/>')
		msgDiv=$("#msgDiv")
		notes = createAllNotes()
		renderInitial();
		d.on('mousemove', contentCanvas, displayCoord)
		d.on('touchmove', contentCanvas, displayCoord)
		d.on('click', contentCanvas+', '+checkAnswerButtonSelector, playAnswer)
		d.on('click', checkAnswerButtonSelector, checkAnswer)
	}
	return {init: init};
})(jQuery);
jQuery.prototype.addText = function(msg) {
	this.html(msg+"<br>"+this.html())
}

String.prototype.toEnumCase = function() {
    return this.replace(/^([a-z])|[\s-_](\w)/g, function(match, p1, p2, offset) {
        if (p2) return " "+p2.toUpperCase();
        return p1.toUpperCase();        
    });
};


$(function(e, ui){
	NotationMaster.modelController.init(false);
});
