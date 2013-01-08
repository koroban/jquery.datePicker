(function($){
  $.fn.datePicker = function(opts) {
    if (opts && opts.command) {
        if (opts.command == 'updateData') {
            this.get(0).datePicker.updateData(opts.data);
        }
        return this;
    }

    var defaults = {selected: null, minimumDate: null, maximumDate: null, firstDay: 0, data: {}};
    var months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
    var abbreviations = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec');
    var days = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
    var daySelector = 'td:not(.m):not(:empty)';
    var today = new Date();
    var hlData = {};

    return this.each(function() {
      if (this.datePicker) { return false; }
      var options = $.extend({}, defaults, opts);
      var $input = $(this);
      var $container = currentDate = mode = null;
      var self = {
        initialize: function() {
          this.updateData(options.data);
          $container = self.initializeContainer()
            .append(self.buildMonth(new Date()))
            .delegate(daySelector, 'click', self.clicked)
            .delegate('td:not(:empty)', 'hover', self.hover)
            .delegate('.prev', 'click', self.loadPrevious)
            .delegate('.next', 'click', self.loadNext)
            .delegate('.month', 'click', self.pickMonth)
            .delegate('.year', 'click', self.pickYear)
            .click(function(){return false;});
        },
        parseDate: function(value) { return new Date(value); },
        loadPrevious: function() {
          $container.empty().append(self.buildMonth(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1)));
        },
        loadNext: function() {
          $container.empty().append(self.buildMonth(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1)));
        },
        hover: function() {
          $(this).toggleClass('hover');
        },
        updateData: function(data) {
          for (var ky in data) {
            parts = ky.split('-');
            for (x in parts) {
                parts[x] = parseInt(parts[x]);
            }

            if (!(parts[0] in hlData)) {
                hlData[parts[0]] = {};
            }
            if (!(parts[1] in hlData[parts[0]])) {
                hlData[parts[0]][parts[1]] = {};
            }

            hlData[parts[0]][parts[1]][parts[2]] = data[ky];
          };
        },
        clicked: function() {
          var $cell = $(this);
          if (mode == 'month') {
            $container.empty().append(self.buildMonth(new Date(currentDate.getFullYear(), (4*($cell.parent().index()-1)) + $cell.index(), 1)));
          } else if (mode == 'year') {
            currentDate = new Date($cell.text(), 0, 1);
            self.pickMonth();
          } else {
            $container.find('td.selected').removeClass('selected');
            $cell.addClass('selected');
            var date = new Date(currentDate.getFullYear(), currentDate.getMonth(), $cell.text());
            if (options.selected != null) { options.selected(date, $cell); }
          }
        },
        initializeContainer: function() {
            x=$('<div>').addClass('calendar');
            $input.html(x);
            return x;
        },
        pickYear: function() {
          mode = 'year';
          var table = document.createElement('table');
          var start = currentDate.getFullYear() - 6;
          if (options.minimumDate && options.minimumDate > start) { start = options.minimumDate; }
          for (var i = 0; i < 3; ++i) {
            var row = table.insertRow(-1);
            for (var j = 0; j < 4; ++j) {
              var cell = row.insertCell(-1);
              cell.innerHTML = start + (4*i) + j;
            }
          }
          $container.empty().append(table);
        },
        pickMonth: function() {
          mode = 'month';
          var table = document.createElement('table');
          var header = table.insertRow(-1);
          var year = header.insertCell(-1);
          year.colSpan = 4;
          year.className = 'm year';
          year.innerHTML = currentDate.getFullYear();

          //could make this static...
          for (var i = 0; i < 3; ++i) {
            var row = table.insertRow(-1);
            for (var j = 0; j < 4; ++j) {
              var cell = row.insertCell(-1);
              cell.innerHTML = abbreviations[4*i+j];
            }
          }
          $container.empty().append(table);
        },
        buildMonth: function(date) {
          mode = 'day';
          var first = new Date(date.getFullYear(), date.getMonth(), 2 - options.firstDay );
          var last = new Date(date.getFullYear(), date.getMonth()+1, 0);
          currentDate = first;
          var firstDay = first.getDay();
          var totalDays = last.getDate();
          var weeks = Math.ceil((totalDays + firstDay) / 7);
          var table = document.createElement('table');
          var hl_today = (today.getFullYear() == date.getFullYear() && today.getMonth() == date.getMonth()) ? today.getDate() : undefined;
          var hl = (date.getFullYear() in hlData && date.getMonth()+1 in hlData[date.getFullYear()]) ? hlData[date.getFullYear()][date.getMonth()+1] : {};

          var row = table.insertRow(-1);
          row.className = 'head';
          weekend_cols = [];
          for(var i = 0, count = 0; count < 7; count++, i++) {
            var cell = row.insertCell(-1);
            if (i+options.firstDay > days.length-1) {
              i = options.firstDay * -1;
            }
            offset = i+options.firstDay;
            if (offset == 0 || offset == 6) {
                weekend_cols.push(count)
            }
            cell.innerHTML = days[offset];
          }

          for (var i = 0, count = 1; i < weeks; ++i) {
            var row = table.insertRow(-1);
            for (var j = 0; j < 7; ++j, ++count) {
              var cell = row.insertCell(-1);
              if (count > firstDay && count <= totalDays + firstDay) {
                vl = count - firstDay;
                if (hl_today && hl_today == vl) {
                  cell.className = 'today';
                } else if (j == weekend_cols[0] || j == weekend_cols[1]) {
                  cell.className = 'weekend';
                }
                if (vl in hl) {
                    cell.className += ' hl';
                    vl = '<span title="' + hl[vl] + '">' + vl + '</span>';
                }
                cell.innerHTML = vl;
              }
            }
          }

          var header = table.insertRow(0);
          self.addHeaderCell(header, '<div class="prev">&laquo;</div>', 1);
          self.addHeaderCell(header, '<div class="month">' + months[date.getMonth()] + ' ' + date.getFullYear() + '</div>', 5);
          self.addHeaderCell(header, '<div class="next">&raquo;</div>', 1);

          var $table = $(table);
          if (options.minimumDate && options.minimumDate >= first) { $table.find('.prev').hide(); }
          if (options.maximumDate && options.maximumDate <= last) { $table.find('.next').hide(); }
          return $table;
        },
        addHeaderCell: function(header, html, colspan) {
          var cell = header.insertCell(-1);
          cell.innerHTML = html;
          cell.className = 'm '; //very stupid IE (all versions) fix
          cell.colSpan = colspan;
        },
        format: function(date) {
          return months[date.getMonth()] + ' ' + date.getDate() + ' ' + date.getFullYear();
        }
      };
      this.datePicker = self;
      self.initialize();
    });
  }
})(jQuery);
