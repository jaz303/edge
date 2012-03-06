// Date extensions

// strftime implementation adapted from:
// http://dren.ch/js/strftime.js, version 0.11 by Daniel Rench

(function() {
  
  var ISO8601_MATCHER = /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2})(\.(\d{1,3}))?(Z)?)?$/;
  
  var MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June', 'July',
		'August', 'September', 'October', 'November', 'December'
  ];
  
  var WEEKDAYS = [
		'Sunday', 'Monday', 'Tuesday', 'Wednesday',
		'Thursday', 'Friday', 'Saturday'
  ];
  
  var DPM = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

  Date.parseISO8601 = function(str) {
    var match = (str || '').match(ISO8601_MATCHER);
    if (match) {
      var year  = match[1],
          month = match[2],
          day   = match[3],
          hour  = match[5] || 0,
          min   = match[6] || 0,
          sec   = match[7] || 0,
          mill  = match[9] || 0,
          utc   = match[10] == 'Z';
      if (utc) {
        return new Date(Date.UTC(year, month, day, hour, min, sec, mill));
      } else {
        return new Date(year, month, day, hour, min, sec, mill);
      }
    } else {
      throw "invalid ISO-8601 date string '" + str + "'";
    }
  };
  
  var FORMATTERS = {
		A: function (d) { return WEEKDAYS[d.getDay()] },
		a: function (d) { return WEEKDAYS[d.getDay()].substring(0,3) },
		B: function (d) { return MONTHS[d.getMonth()] },
		b: function (d) { return MONTHS[d.getMonth()].substring(0,3) },
		C: function (d) { return Math.floor(d.getFullYear()/100); },
		c: function (d) { return d.toString() },
		D: function (d) { return FORMATTERS.m(d) + '/' + FORMATTERS.d(d) + '/' + FORMATTERS.y(d); },
		d: function (d) { return d.getDate().pad(2,'0') },
		e: function (d) { return d.getDate().pad(2,' ') },
		F: function (d) { return FORMATTERS.Y(d) + '-' + FORMATTERS.m(d) + '-' + FORMATTERS.d(d); },
		H: function (d) { return d.getHours().pad(2,'0') },
		I: function (d) { return ((d.getHours() % 12 || 12).pad(2)) },
		j: function (d) {
				var t = d.getDate();
				var m = d.getMonth() - 1;
				if (m > 1) {
					var y = d.getYear();
					if (((y % 100) == 0) && ((y % 400) == 0)) ++t;
					else if ((y % 4) == 0) ++t;
				}
				while (m > -1) t += DPM[m--];
				return t.pad(3,'0');
			},
		k: function (d) { return d.getHours().pad(2,' ') },
		l: function (d) { return ((d.getHours() % 12 || 12).pad(2,' ')) },
		M: function (d) { return d.getMinutes().pad(2,'0') },
		m: function (d) { return (d.getMonth()+1).pad(2,'0') },
		n: function (d) { return "\n" },
		p: function (d) { return (d.getHours() > 11) ? 'PM' : 'AM' },
		R: function (d) { return FORMATTERS.H(d) + ':' + FORMATTERS.M(d) },
		r: function (d) { return FORMATTERS.I(d) + ':' + FORMATTERS.M(d) + ':' + FORMATTERS.S(d) + ' ' + FORMATTERS.p(d); },
		S: function (d) { return d.getSeconds().pad(2,'0') },
		s: function (d) { return Math.floor(d.getTime()/1000) },
		T: function (d) { return FORMATTERS.H(d) + ':' + FORMATTERS.M(d) + ':' + FORMATTERS.S(d); },
		t: function (d) { return "\t" },
    /*		U: function (d) { return false }, */
		u: function (d) { return(d.getDay() || 7) },
    /*		V: function (d) { return false }, */
		v: function (d) { return FORMATTERS.e(d) + '-' + FORMATTERS.b(d) + '-' + FORMATTERS.Y(d); },
      /*		W: function (d) { return false }, */
		w: function (d) { return d.getDay() },
		X: function (d) { return d.toTimeString() }, // wrong?
		x: function (d) { return d.toDateString() }, // wrong?
		Y: function (d) { return d.getFullYear() },
		y: function (d) { return (d.getYear() % 100).pad(2) },
    //		Z: function (d) { return d.toString().match(/\((.+)\)$/)[1]; },
    //		z: function (d) { return d.getTimezoneOffset() }, // wrong
    //		z: function (d) { return d.toString().match(/\sGMT([+-]\d+)/)[1]; },
		'%': function (d) { return '%' }
  };
  
  FORMATTERS['+'] = FORMATTERS.c;
  FORMATTERS['h'] = FORMATTERS.b;

  Date.prototype.strftime = function(fmt) {
    var r = '';
		var n = 0;
		while(n < fmt.length) {
			var c = fmt.substring(n, n+1);
			if (c == '%') {
				c = fmt.substring(++n, n+1);
				r += (FORMATTERS[c]) ? FORMATTERS[c](this) : c;
			} else r += c;
			++n;
		}
		return r;
  };

})();