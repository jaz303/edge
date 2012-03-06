Number.prototype.pad = function(n, p) {
  var s = '' + this;
	p = p || '0';
	while (s.length < n) s = p + s;
	return s;
}