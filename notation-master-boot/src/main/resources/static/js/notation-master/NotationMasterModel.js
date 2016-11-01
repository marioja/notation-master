/**
 * 
 */
"use strict";

var NotationMaster = NotationMaster || {};
var TouchEvent = TouchEvent || function(){}

NotationMaster.modelController = (function($){
	
	var vf = Vex.Flow;
	var contentCanvasSelector = "#home-content-canvas"
	var contentDivSelector = "#home-content"
	var checkAnswerButtonSelector = "#check-answer"
	var topRowClass = "horizontal-top"
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

	var createNote = function(clef, note, verticalJustify) {
		var result = {}
		var n = new vf.StaveNote({keys: [note], duration: "q", auto_stem: true, clef: clef})
		n.addAccidental(0, new vf.Annotation(englishToFrench[note.charAt(0)]).
				setVerticalJustification(typeof verticalJustify === "undefined"? vf.Annotation.VerticalJustify.TOP: verticalJustify).
				setJustification(vf.Annotation.JustifyString.LEFT))
		result.noteWithAnnotation = n;
		result.noteWithoutAnnotation = new vf.StaveNote({keys: [note], duration: "q", auto_stem: true, clef: clef})
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
	
	var clefs = {
		treble: 'treble',
		bass: 'bass'
	}
	
	var currentClef = clefs.treble
	
	var createAllNotes = function(clef) {
		switch (clef) {
		case clefs.treble:	
			return createAllTrebleClefNotes()
			break;

		case clefs.bass:	
			return createAllBassClefNotes()
			break;

		default:
			break;
		}
	}
	
	var createAllTrebleClefNotes = function() {
		/*00*/return [createNote(clefs.treble, "c/6", bottom),
		/*01*/createNote(clefs.treble, "b/5", bottom),
		/*02*/createNote(clefs.treble, "a/5", bottom),
		/*03*/createNote(clefs.treble, "g/5", bottom),
		/*04*/createNote(clefs.treble, "f/5"),
		/*05*/createNote(clefs.treble, "e/5"),
		/*06*/createNote(clefs.treble, "d/5"),
		/*07*/createNote(clefs.treble, "c/5"),
		/*08*/createNote(clefs.treble, "b/4"),
		/*09*/createNote(clefs.treble, "a/4", bottom),
		/*10*/createNote(clefs.treble, "g/4"),
		/*11*/createNote(clefs.treble, "f/4"),
		/*12*/createNote(clefs.treble, "e/4"),
		/*13*/createNote(clefs.treble, "d/4"),
		/*14*/createNote(clefs.treble, "c/4"),
		/*15*/createNote(clefs.treble, "b/3"),
		/*16*/createNote(clefs.treble, "a/3")]
	}
	
	var createAllBassClefNotes = function() {
		/*00*/return [createNote(clefs.bass, "e/4"),
		/*01*/createNote(clefs.bass, "d/4"),
		/*02*/createNote(clefs.bass, "c/4"),
		/*03*/createNote(clefs.bass, "b/3"),
		/*04*/createNote(clefs.bass, "a/3"),
		/*05*/createNote(clefs.bass, "g/3"),
		/*06*/createNote(clefs.bass, "f/3"),
		/*07*/createNote(clefs.bass, "e/3"),
		/*08*/createNote(clefs.bass, "d/3"),
		/*09*/createNote(clefs.bass, "c/3"),
		/*10*/createNote(clefs.bass, "b/2"),
		/*11*/createNote(clefs.bass, "a/2"),
		/*12*/createNote(clefs.bass, "g/2"),
		/*13*/createNote(clefs.bass, "f/2"),
		/*14*/createNote(clefs.bass, "e/2"),
		/*15*/createNote(clefs.bass, "d/2"),
		/*16*/createNote(clefs.bass, "c/2")]
	}

	var notes = {}

	var msgDiv;
	var currentAudio;
	var currentNote;
	
	var renderMusic = function(note) {
		currentNote = note;
		renderStaff($(contentCanvasSelector)[0])
		renderNote(note)
	}
	var renderInitialMusic = function(clef) {
		currentClef=clef
		setClefText()
//		renderPage(currentClef === clefs.treble ? notes[clefs.treble][14] : notes[clefs.bass][2])
		pickANote()
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
		stave.addClef(currentClef);//.addTimeSignature("4/4");

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

	var Mode = {
		learn: 'learn',
		play: 'play'
	}
	
	var mode = Mode.learn;

	var displayCoord = function(e){
		if (mode===Mode.learn) return;
		var xOffset = offset(e, 'X');
		var yOffset = offset(e, 'Y');
		var x=xOffset.offsetX;
		var y=yOffset.offsetY;
		var n;
		if (isDraggableRectangle(x, y)) {
			n=y-limits.top+limits.half;
			n=Math.trunc(n / 20);
			var msg="X="+x+" Y="+y+" n="+n+" notes="+notes[currentClef][n].noteWithAnnotation.keys[0]+displayTouches(xOffset)+displayTouches(yOffset);
			if (debug) {
				e.target.title = msg
				msgDiv.addText(msg)
			}
			if (n!==oldN) renderMusic(notes[currentClef][n])
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
	var renderAnswer = function(contentDiv){
		contentDiv.append('<div class="'+topRowClass+'"><div class="'+gummyBearClass+'"/></div>')
		contentDiv.append('<fieldset data-role="controlgroup" data-type="horizontal"></fieldset>')
		var fieldSet=contentDiv.find('fieldset')
		$.each(englishToFrench,function(key,val){
			fieldSet.append('<input type="radio" name="'+checkAnswerInputName+'" id="note-'+key+'" value="'+val+'"><label for="note-'+key+'">'+val+'<span data-count="0" class="'+answerCount+'"><br>0</span></label>')
		})
		fieldSet.append('<button id="check-answer" class="ui-btn ui-btn-inline">?</button>')
		//fieldSet.append('<span id="'+answerCount+'">0</span>')
		renderOptions()
	}
	var prevNoteObj
	var playAnswer = function(e){
		$.mobile.loading("show")
		if (!isDraggableRectangle(offset(e, 'X').offsetX, offset(e, 'Y').offsetY)) {
			setTimeout(function(){
				startPlaying(mode === Mode.play ? currentNote : prevNoteObj)
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
	}
	
	var setClefText = function() {
		var setClef=false
		var msc=$('#'+switchClef)
		msc.find('a').contents().each(function(val, key){
			console.log('val=%s key=%s', val, key.nodeType)
			if (key.nodeType === 3) {
				key.nodeValue=currentClef
				setClef=true
				msc.click()
			}
		})
		if (!setClef) msc.text(currentClef)
	}
	
	var switchClef = "main-switch-clef"
	var selectLimits = "main-select-limits"
	var selectHigh = "-high"
	var selectLow = "-low"
		
	var createNotesSelect = function(clef, name) {
		var ss=''
		ss+='<label for="'+name+'">'+name+'</label>'
		ss+='<select name="'+name+'" id="'+name+'">'
		for (var i = 0; i < 17; i++) {
			ss+='<option value="'+i+'">'+notes[clef][i].noteWithoutAnnotation.keys[0]+'</option>'
		}
		ss+='</select>'
		return ss
	}
	var createLimits = function() {
		var ss=''
		ss+='<fieldset data-role="controlgroup" data-type="horizontal">'
		ss+='<h3>Treble low/high</h3>'
		ss+=createNotesSelect(clefs.treble, clefs.treble+selectLow)
		ss+=createNotesSelect(clefs.treble, clefs.treble+selectHigh)
		ss+='</fieldset>'
		ss+='<fieldset data-role="controlgroup" data-type="horizontal">'
		ss+='<h3>Bass low/high</h3>'
		ss+=createNotesSelect(clefs.bass, clefs.bass+selectLow)
		ss+=createNotesSelect(clefs.bass, clefs.bass+selectHigh)
		ss+='</fieldset>'
		return ss;
	}
	
	var setNotesOptionsStatus = function(select, up, selectedValue) {
		var options=select.find('option')
		var disabledSetting=false
		if (up) disabledSetting=true
		for (var i = 0; i < options.length; i++) {
			var o=$(options[i])
			if (up && parseInt(o.val()) === selectedValue) disabledSetting=false
			if (disabledSetting) o.attr('disabled','disabled')
			else o.removeAttr('disabled')
			if (!up && parseInt(o.val()) === selectedValue) disabledSetting=true
		}
	}
	
	var trebleLow, trebleHigh, bassLow, bassHigh
	
	var setNotesLimitsSelects = function() {
//		trebleLow=$('#'+clefs.treble+selectLow)
//		trebleHigh=$('#'+clefs.treble+selectHigh)
//		bassLow=$('#'+clefs.bass+selectLow)
//		bassHigh=$('#'+clefs.bass+selectHigh)
		setNotesOptionsStatusLimits($('#'+clefs.treble+selectLow), false)
		setNotesOptionsStatusLimits($('#'+clefs.treble+selectHigh), false)
		setNotesOptionsStatusLimits($('#'+clefs.bass+selectLow), false)
		setNotesOptionsStatusLimits($('#'+clefs.bass+selectHigh), false)
//		trebleLow.val(learnNotesLimit.treble.low)
//		setNotesOptionsStatus(trebleHigh, false, trebleLow.val())
//		trebleHigh.val(learnNotesLimit.treble.high)
//		setNotesOptionsStatus(trebleLow, true, trebleHigh.val())
//		bassLow.val(learnNotesLimit.bass.low)
//		setNotesOptionsStatus(bassHigh, false, bassLow.val())
//		bassHigh.val(learnNotesLimit.bass.high)
//		setNotesOptionsStatus(bassLow, true, bassHigh.val())
	}

	var setNotesOptionsStatusLimits = function(select, updateLimits) {
		var limit, up, correspondingSelect
		switch (select.attr('name')) {
			case clefs.treble+selectLow:
				correspondingSelect=$('#'+clefs.treble+selectHigh)
				if (updateLimits) learnNotesLimit.treble.low=parseInt(select.val())
				limit=learnNotesLimit.treble.low
				up=false
				break;
				
			case clefs.treble+selectHigh:
				correspondingSelect=$('#'+clefs.treble+selectLow)
				if (updateLimits) learnNotesLimit.treble.high=parseInt(select.val())
				limit=learnNotesLimit.treble.high
				up=true
				break;
				
			case clefs.bass+selectLow:
				correspondingSelect=$('#'+clefs.bass+selectHigh)
				if (updateLimits) learnNotesLimit.bass.low=parseInt(select.val())
				limit=learnNotesLimit.bass.low
				up=false
				break;
				
			case clefs.bass+selectHigh:
				correspondingSelect=$('#'+clefs.bass+selectLow)
				if (updateLimits) learnNotesLimit.bass.high=parseInt(select.val())
				limit=learnNotesLimit.bass.high
				up=true
				break;
			default:
				
				break;
		}
		select.val(limit)
		setNotesOptionsStatus(correspondingSelect, up, limit)
		
	}
	
	var changeLimits = function(e) {
		setNotesOptionsStatusLimits($(e.target), true)
		initializeNotes()
		setNotesLimitsSelects()
		
	}

	var renderOptions = function() {
		var gummydiv=$(contentDivSelector).find('div.'+gummyBearClass)
		gummydiv=$(gummydiv[0])
		var cl=''
		var setTreble="main-set_treble"
		var setBass="main-set-bass"
		cl+='<ul data-role="listview" data-inset="true" data-shadow="false">'
		cl+='<li data-role="collapsible" data-iconpos="right" data-inset="false">'
		cl+='<h2 id="'+switchClef+'">clef</h2><ul data-role="listview">'
		cl+='<li><a data-ajax="false" href="javascript:void(0)" id="'+setTreble+'"><img src="images/treble.png"></a></li>'
		cl+='<li><a data-ajax="false" href="javascript:void(0)" id="'+setBass+'"><img src="images/bass.png"></a></li>'
		cl+='</ul>'
		cl+='<li data-role="collapsible" data-iconpos="right" data-inset="false">'
		cl+='<h2 id="'+selectLimits+'">Limits</h2>'
		cl+=createLimits()
		cl+='</li></li>'
		cl+='</ul>'
		gummydiv.append(cl)
		$('#'+selectLimits).parent().on('change', 'select', changeLimits)
		$(document).on('click','#'+setTreble,function(e){renderInitialMusic(clefs.treble)})
		$(document).on('click','#'+setBass,function(e){renderInitialMusic(clefs.bass)})
	}
	
	var renderGummyBear = function(index) {
		var gummyId='gummy-canvas-'+gummyBearNo(index)
		var gummyCanvas=$('#'+gummyId)
		if (gummyCanvas.length===0) {
			var gummydiv=$(contentDivSelector).find('div.'+topRowClass)
			gummydiv=$(gummydiv[gummydiv.length-1])
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
	
	var findNoteIndex = function(noteArray, note) {
		for (var i = 0; i < noteArray.length; i++) {
			if (noteArray[i].noteWithoutAnnotation.keys[0] === note) return i
		}
		throw note+" not found"
	}
	
	// initialized in initializeNotes
	var learnNotesLimit = {
		treble: {
			high: 0,
			low: 0
		},
		bass: {
			high: 0,
			low: 0
		}
	}
	
	var createLearnNotes = function(clef) {
		var aNotes={}
		for (var n = learnNotesLimit[clef].high; n <= learnNotesLimit[clef].low; n++) {
			aNotes[n]=notes[clef][n]
		}
		return aNotes
	}
	
	var learnNotes = {}
	
	var pickANote = function() {
		var k=Object.keys(learnNotes[currentClef])
		var l=k.length
		var i=Math.floor(Math.random()*l);
		var aNote=learnNotes[currentClef][k[i]]
		if (k.length>1) delete learnNotes[currentClef][k[i]]
		else learnNotes[currentClef] = createLearnNotes(currentClef) // replenish colors
		renderMusic(aNote)
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
		prevNoteObj=currentNote
		if (mode === Mode.learn) pickANote()
	}

	var initializeNotes = function() {
		notes[clefs.treble]=createAllNotes(clefs.treble)
		learnNotesLimit[clefs.treble].high = pageTrebleHigh === "null" ? 10 : findNoteIndex(notes[clefs.treble], pageTrebleHigh)
		learnNotesLimit[clefs.treble].low = pageTrebleLow === "null" ? 14 : findNoteIndex(notes[clefs.treble], pageTrebleLow)
		notes[clefs.bass]=createAllNotes(clefs.bass)
		learnNotesLimit[clefs.bass].high = pageBassHigh === "null" ? 2 : findNoteIndex(notes[clefs.bass], pageBassHigh)
		learnNotesLimit[clefs.bass].low = pageBassLow === "null" ? 6 : findNoteIndex(notes[clefs.bass], pageBassLow)		
		learnNotes = {
			treble: createLearnNotes(clefs.treble),
			bass: createLearnNotes(clefs.bass)
		}
	}
	
	var init = function(theDebug) {
		debug=theDebug
		var cc=$(contentDivSelector)
		var d=$(document)
		cc.append('<div data-debug="'+debug+'" id="msgDiv"/>')
		msgDiv=$("#msgDiv")
		initializeNotes()
		renderAnswer(cc)
		setNotesLimitsSelects()
		renderInitialMusic(clefs.treble);
//		for (var i = 5; i < 36; i+=6) {
//			renderGummyBear(i)
//		}
		d.on('mousemove', contentCanvasSelector, displayCoord)
		d.on('touchmove', contentCanvasSelector, displayCoord)
		d.on('click', contentCanvasSelector+', '+checkAnswerButtonSelector, playAnswer)
		d.on('click', checkAnswerButtonSelector, checkAnswer)
	}
	return {
		init: init
	};
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
