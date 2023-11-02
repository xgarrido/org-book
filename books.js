var books = {
    $title: document.getElementById('title'),
    $el: document.getElementById('books'),
    utils: {
        extend: function(object){
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i=0, source; source=args[i]; i++){
        	if (!source) continue;
        	for (var property in source){
        	    object[property] = source[property];
        	}
            }
            return object;
        }
    },
    config: {
    	yearLength: 100,          // 120px per year
    	hideAge: true,            // Hide age from year axis
    	customStylesheetURL: null // Custom stylesheet
    },
    start: function(){
    	books.loadConfig(function(config){
    	    books.config = books.utils.extend(books.config, config);
    	    if (books.config.customStylesheetURL) books.injectStylesheet(books.config.customStylesheetURL);

    	    books.fetch(function(response){
    		var data = books.parse(response);
    		var title = books.parseTitle(response);
    		books.render(title, data);
    	    });
    	});
    },
    loadConfig: function(fn){
    	var xhr = new XMLHttpRequest();
    	xhr.open('GET', 'config.json', true);
    	xhr.onload = function(){
    	    if (xhr.status == 200){
    		fn(JSON.parse(xhr.responseText));
    	    } else {
    		fn({});
    	    }
    	};
    	xhr.onerror = xhr.onabort = function(){
    	    fn({});
    	};
    	xhr.send();
    },
    injectStylesheet: function(url){
    	var link = document.createElement('link');
    	link.rel = 'stylesheet';
    	link.href = url;
    	document.body.appendChild(link);
    },
    fetch: function(fn){
    	var xhr = new XMLHttpRequest();
    	xhr.open('GET', 'books.org', true);
    	xhr.onload = function(){
    	    if (xhr.status == 200) fn(xhr.responseText);
    	};
    	xhr.send();
    },
    parse: function(response){
    	var data = [];
        var color = '#bbbbbb';
    	var list = response.match(/\s+[^\n\r]+/ig);
        var topushed = true;
        list.forEach(function(l){
    	    var matches = l.match(/\s([^|]+)/g);
            if (matches != null){
                if (matches[0] == null || matches[1] == null ||
                    matches[3] == null || matches[4] == null) {
                    if (/Policier/.test(l)){
                        color = '#e74c3c';
                    } else if (/Société/.test(l)){
                        color = '#3399cc';
                    } else if (/Science/.test(l)){
                        color = '#67ad00';
                    } else if (/Roman/.test(l)){
                        color = '#f1c40f';
                    } else if (/Histoire/.test(l)){
                        color = '#e67e22';
                    } else if (/Non/.test(l)) {
                        topushed = false;
                    } else if (/À lire/.test(l)) {
                        topushed = false;
                    }
                    // console.log(l);
                    return;
                }
                if (/Titre/.test(matches[1])) return;
                var author = matches[0].replace(/^\s+|\s+$/g, "");
    	        var title = matches[1].replace(/^\s+|\s+$/g, "");
                var start = matches[3].replace(/^\s+|\s+$/g, "");
                var stop = matches[4].replace(/^\s+|\s+$/g, "");
                if (stop == "") stop = "present"
                var time = start + '-' + stop
                if (topushed) {
                    data.push({
    	                time: books.parseTime(time),
    	                author: author,
                        title: title,
                        color: color
    	            });
                }
            }
    	});
    	return data;
    },
    parseTitle: function(response){
    	return response.match(/\#\+TITLE\:([^\r\n]+)/)[1];
    },
    parseTime: function(time, point){
    	if (!point) point = 'start';
    	var data = {};
    	if (/^\~\d+$/.test(time)){ // ~YYYY
    	    data = {
    		startYear: parseInt(time.slice(1), 10),
    		estimate: true
    	    };
    	} else if (/^\d+$/.test(time)){ // YYYY
    	    data[point + 'Year'] = parseInt(time, 10);
    	} else if (/^\d+\/\d+$/.test(time)){ // MM/YYYY
    	    var t = time.split('/');
    	    data[point + 'Month'] = parseInt(t[0], 10);
    	    data[point + 'Year'] = parseInt(t[1], 10);
    	} else if (/^\d+\/\d+\/\d+$/.test(time)){ // DD/MM/YYYY
    	    var t = time.split('/');
    	    data[point + 'Date'] = parseInt(t[0], 10);
    	    data[point + 'Month'] = parseInt(t[1], 10);
    	    data[point + 'Year'] = parseInt(t[2], 10);
    	} else if (/\d\-/.test(time)){ // TIME-TIME
    	    var splitTime = time.split('-');
    	    var startTime = books.parseTime(splitTime[0]);
    	    var endTime = books.parseTime(splitTime[1],'end');
    	    for (var k in startTime) { data[k] = startTime[k] }
    	    for (var k in endTime) { data[k] = endTime[k] }
    	} else if (time == '~' || time == 'present'){ // NOW
    	    var now = new Date();
    	    data.endYear = now.getFullYear();
    	    data.endMonth = now.getMonth()+1;
    	    data.endDate = now.getDate();
    	}
        data.title = time.replace('-', '&nbsp-&nbsp');
    	return data;
    },
    firstYear: null,
    renderEvent: function(d){
    	var firstYear = books.firstYear;
    	var yearLength = books.config.yearLength;
    	var monthLength = yearLength/12;
    	var dayLength = monthLength/30;

    	var time = d.time;
    	var estimate = time.estimate;
    	var startYear = time.startYear;
    	var startMonth = time.startMonth;
    	var startDate = time.startDate;
    	var endYear = time.endYear;
    	var endMonth = time.endMonth;
    	var endDate = time.endDate;
    	var width = 0;

    	// Calculate offset
    	var startTime = new Date(firstYear, 0, 1);
    	var endTime = new Date(startYear, startMonth ? startMonth-1 : 0, startDate || 1);
    	var daysDiff = (endTime - startTime)/(24*60*60*1000);
    	offset = daysDiff*dayLength;

    	// Calculate width
    	if (endYear){
    	    var _endMonth = endMonth ? endMonth-1 : 11;
    	    var _endDate = endDate || new Date(endYear, _endMonth+1, 0).getDate();
    	    startTime = new Date(startYear, startMonth ? startMonth-1 : 0, startDate || 1);
    	    endTime = new Date(endYear, _endMonth, _endDate);
    	    daysDiff = (endTime - startTime)/(24*60*60*1000);
    	    width = daysDiff*dayLength;
    	} else {
    	    if (startDate){
    		width = dayLength;
    	    } else if (startMonth){
    		width = monthLength;
    	    } else {
    		width = yearLength;
    	    }
    	}

    	// Parse Markdown links in the text
    	// credit: http://stackoverflow.com/a/9268827
    	var link = null;
    	//while(link = d.text.match(/\[([^\]]+)\]\(([^)"]+)(?: \"([^\"]+)\")?\)/)) {
    	while(link = d.title.match(/\[\[([^\]]+)\]\[([^\]]+)\]\]/)) {
    	    d.text = d.title.replace(link[0], '<a style="color: ' + d.color + '" href="' + link[1] + '">' + link[2] + '</a>');
    	}

    	return '<div class="event" style="margin-left: ' + offset.toFixed(2) + 'px">'
    	    + '<div class="time" style="color: ' + d.color + ';width: ' + width.toFixed(2) + 'px"></div>'
    	    + '<b>' + d.time.title + '</b> ' + d.author + '&nbsp;-&nbsp;' + d.title
    	    + '</div>';
    	return '';
    },
    renderYears: function(firstYear, lastYear){
    	var dayLength = books.config.yearLength/12/30;
    	var html = '';
    	var days = 0;
    	var hideAge = books.config.hideAge;
    	for (var y=firstYear, age = 0; y<=lastYear+1; y++, age++){
    	    html += '<section class="year" style="left: ' + (days*dayLength).toFixed(2) + 'px">'
    		+ y + (hideAge ? '' : (' (' + age + ')'))
    		+ '</section>';
    	    days += (y % 4 == 0) ? 366 : 365;
    	}
    	return html;
    },
    render: function(title, data){
    	document.title = title;
    	books.$title.innerHTML = title;

    	// Get the first and last year for the year axis
    	var firstYear = new Date().getFullYear();
    	var lastYear = firstYear;
    	data.forEach(function(d){
    	    var time = d.time;
    	    var startYear = time.startYear;
    	    var endYear = time.endYear;
    	    if (startYear && startYear < firstYear) firstYear = startYear;
    	    if (endYear && endYear > lastYear) lastYear = endYear;
    	});
    	books.firstYear = firstYear;

    	var html = books.renderYears(firstYear, lastYear);
    	data.forEach(function(d){
    	    html += books.renderEvent(d);
    	});
    	books.$el.innerHTML = html;
    }
};


var slider = {
    startingMousePostition: {},
    containerOffset: {},
    init: function(){
	window.addEventListener('mousedown', function(event){
	    slider.startingMousePostition = {
		x: event.clientX,
		y: event.clientY
	    };
	    slider.containerOffset = {
		x: books.$el.scrollLeft,
		y: books.$el.scrollTop
	    };
	    window.addEventListener('mousemove', slider.slide);
	});
	window.addEventListener('mouseup', function(event){
	    window.removeEventListener('mousemove', slider.slide);
	});
    },
    slide: function(event){
	event.preventDefault();
	var x = slider.containerOffset.x + (slider.startingMousePostition.x - event.clientX);
	var y = slider.containerOffset.y + (slider.startingMousePostition.y - event.clientY);
	books.$el.scrollLeft = x;
	books.$el.scrollTop = y;
    }
};
// var slider = {
//     startingMousePostition: {},
//     startingPagePosition: {},
//     init: function(){
// 	window.addEventListener('mousedown', function(event){
// 	    slider.startingMousePostition = {
// 		x: event.clientX,
// 		y: event.clientY
// 	    };
// 	    slider.startingPagePosition = {
// 		x: window.pageXOffset,
// 		y: window.pageYOffset
// 	    };
// 	    window.addEventListener('mousemove', slider.slide);
// 	});
// 	window.addEventListener('mouseup', function(event){
// 	    window.removeEventListener('mousemove', slider.slide);
// 	});
//     },
//     slide: function(event){
// 	event.preventDefault();
// 	var x = slider.startingPagePosition.x + (slider.startingMousePostition.x - event.clientX);
// 	var y = slider.startingPagePosition.y + (slider.startingMousePostition.y - event.clientY);
// 	window.scrollTo(x, y);
//     }
// };

books.start();
slider.init();
