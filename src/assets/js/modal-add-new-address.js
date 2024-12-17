'use strict';

// Select2 (jQuery)
$(function () {
  const select2 = $('.select2');

  // Select2 Initialization
  if (select2.length) {
    select2.each(function () {
      var $this = $(this);
      $this.wrap('<div class="position-relative"></div>').select2({
        placeholder: 'Select value',
        dropdownParent: $this.parent()
      });
    });
  }
});

// Add New Address form validation and logic
document.addEventListener('DOMContentLoaded', function () {
 
});
