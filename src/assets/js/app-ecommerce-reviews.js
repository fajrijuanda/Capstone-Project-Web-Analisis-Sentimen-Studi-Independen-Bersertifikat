/**
 * App eCommerce comment
 */

'use strict';

// Datatable (jquery)
$(function () {
  let borderColor, bodyBg, headingColor, labelColor, cardColor;

  if (isDarkStyle) {
    cardColor = config.colors_dark.cardColor;
    labelColor = config.colors_dark.textMuted;
    borderColor = config.colors_dark.borderColor;
    bodyBg = config.colors_dark.bodyBg;
    headingColor = config.colors_dark.headingColor;
  } else {
    cardColor = config.colors.cardColor;
    labelColor = config.colors.textMuted;
    borderColor = config.colors.borderColor;
    bodyBg = config.colors.bodyBg;
    headingColor = config.colors.headingColor;
  }

  const horizontalBarChartEl = document.querySelector('#horizontalBarChart');

  // AJAX Request untuk Data Top Topics
  $.ajax({
    url: '/top-topics/', // Endpoint server
    type: 'GET',
    success: function (response) {
      const labels = response.labels; // Label topik
      const data = response.data; // Jumlah komentar
  
      // Chart Configuration
      const horizontalBarChartConfig = {
        chart: { height: 360, type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '60%', distributed: true, borderRadius: 7 } },
        colors: [
          config.colors.primary,
          config.colors.info,
          config.colors.success,
          config.colors.secondary,
          config.colors.danger
        ], // 5 warna saja
        series: [{ data: data }],
        xaxis: {
          categories: labels,
          labels: { style: { colors: labelColor, fontSize: '13px' } }
        },
        tooltip: {
          y: {
            title: {
              formatter: function () {
                return ''; // Hilangkan series title
              }
            }
          }
        },        
        // grid: { strokeDashArray: 10, borderColor: borderColor },
        legend: { show: false }
      };
  
      if (horizontalBarChartEl !== null) {
        const horizontalBarChart = new ApexCharts(horizontalBarChartEl, horizontalBarChartConfig);
        horizontalBarChart.render();
      }
  
      // Update Sidebar
      const sidebarContainer = $('.sidebar-topics');
      sidebarContainer.empty();
      labels.forEach((topic, index) => {
        const percentage = ((data[index] / data.reduce((a, b) => a + b, 0)) * 100).toFixed(0);
        const colors = ['primary', 'info', 'success', 'secondary', 'danger'];
        const colorClass = `text-${colors[index % colors.length]}`;
  
        const sidebarItem = `
          <div class="d-flex align-items-baseline my-2">
            <span class="${colorClass} me-2"><i class="ti ti-circle-filled ti-12px"></i></span>
            <div>
              <p class="mb-0">${topic}</p>
              <h5>${percentage}%</h5>
            </div>
          </div>
        `;
        sidebarContainer.append(sidebarItem);
      });
    },
    error: function () {
      console.error('Failed to fetch top topics data.');
    }
  });
  
  // if (typeof horizontalBarChartEl !== undefined && horizontalBarChartEl !== null) {
  //   const horizontalBarChart = new ApexCharts(horizontalBarChartEl, horizontalBarChartConfig);
  //   horizontalBarChart.render();
  // }
  // Variable declaration for table
  var dt_customer_comment = $('.datatables-comment'),
    customerView = '/app/ecommerce/customer/details/overview/',
    sentimentObj = {
      Negative: { title: 'Negative', class: 'bg-label-danger' },
      Positive: { title: 'Positive', class: 'bg-label-primary' }
    };
  // user datatable
  if (dt_customer_comment.length) {
    var dt_comment = dt_customer_comment.DataTable({
      ajax: {
        url: 'comment', // URL endpoint untuk mengambil data
        type: 'GET',
        dataSrc: function (json) {
          console.log('Data received from server:', json); // Tampilkan semua data di console
          return json.data; // Kembalikan data ke DataTables
        }
      }, // JSON file to add data
      columns: [
        // columns according to JSON
        { data: null, defaultContent: '', orderable: false }, // Kolom checkbox
        { data: 'id' }, // ID
        { data: 'topic' }, // Topic
        { data: 'user' }, // User
        { data: 'comment' }, // Comment
        { data: 'date' }, // Date
        { data: 'sentiment' }, // Sentiment
        { data: null, orderable: false, searchable: false } // Actions
      ],
      columnDefs: [
        {
          // For Responsive
          className: 'control',
          searchable: false,
          orderable: false,
          responsivePriority: 2,
          targets: 0,
          render: function (data, type, full, meta) {
            return '';
          }
        },
        {
          // For Checkboxes
          targets: 1,
          orderable: false,
          searchable: false,
          responsivePriority: 3,
          checkboxes: true,
          render: function () {
            return '<input type="checkbox" class="dt-checkboxes form-check-input">';
          },
          checkboxes: {
            selectAllRender: '<input type="checkbox" class="form-check-input">'
          }
        },
        {
          // product
          targets: 2,
          // responsivePriority: 2,
          render: function (data, type, full, meta) {
            var $topic = full['topic'];
            // Creates full output for row
            var $row_output =
              '<div class="d-flex justify-content-start align-items-center customer-name">' +
              '<div class="d-flex flex-column">' +
              '<span class="fw-medium text-nowrap text-heading">' +
              $topic +
              '</span></a>' +
              '</div>' +
              '</div>';
            return $row_output;
          }
        },
        {
          // user
          targets: 3,
          responsivePriority: 1,
          render: function (data, type, full, meta) {
            var $name = full['username'],
              $email = full['email'],
              $avatar = full['avatar'];

            if ($avatar) {
              // For Avatar image
              var $output = '<img src="' + $avatar + '" alt="Avatar" class="rounded-circle">';
            } else {
              // For Avatar badge
              var stateNum = Math.floor(Math.random() * 6);
              var states = ['success', 'danger', 'warning', 'info', 'dark', 'primary', 'secondary'];
              var $state = states[stateNum],
                $name = full['username'],
                $initials = $name.match(/\b\w/g) || [];
              $initials = (($initials.shift() || '') + ($initials.pop() || '')).toUpperCase();
              $output = '<span class="avatar-initial rounded-circle bg-label-' + $state + '">' + $initials + '</span>';
            }
            // Creates full output for row
            var $row_output =
              '<div class="d-flex justify-content-start align-items-center customer-name">' +
              '<div class="avatar-wrapper">' +
              '<div class="avatar avatar-sm me-4">' +
              $output +
              '</div>' +
              '</div>' +
              '<div class="d-flex flex-column">' +
              '<a href="' +
              customerView +
              '"><span class="fw-medium">' +
              $name +
              '</span></a>' +
              '<small class="text-nowrap">' +
              $email +
              '</small>' +
              '</div>' +
              '</div>';
            return $row_output;
          }
        },
        {
          // comment
          targets: 4,
          responsivePriority: 2,
          sortable: false,
          render: function (data, type, full, meta) {
            var $comment = full['comment'];

            function capitalizeFirstLetter(str) {
              if (typeof str !== 'string') {
                return str; // Return the input as it is if it's not a string
              }

              if (str.length === 0) {
                return str; // Return an empty string if the input is an empty string
              }

              return str.charAt(0).toUpperCase() + str.slice(1);
            }

            var $comment = '<div>' + '<small class="text-break pe-3">' + $comment + '</small>' + '</div>';

            return $comment;
          }
        },
        {
          // date
          targets: 5,
          render: function (data, type, full, meta) {
            var date = new Date(full.date); // convert the date string to a Date object
            var formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return '<span class="text-nowrap">' + formattedDate + '</span>';
          }
        },
        {
          // Sentiment badge
          targets: 6,
          render: function (data, type, full, meta) {
            var badgeClass =
              data === 'Positive'
                ? 'bg-label-primary'
                : data === 'Neutral'
                  ? 'bg-label-info'
                  : data === 'Negative'
                    ? 'bg-label-danger'
                    : 'bg-label-secondary';
            return `<span class="badge ${badgeClass}">${data}</span>`;
          }
        },

        {
          // Actions
          targets: -1,
          title: 'Actions',
          searchable: false,
          orderable: false,
          render: function (data, type, full, meta) {
            return (
              '<div class="text-xxl-center">' +
              '<div class="dropdown">' +
              '<a href="javascript:;" class="btn btn-icon btn-text-secondary waves-effect waves-light rounded-pill dropdown-toggle hide-arrow p-0" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical ti-md"></i></a>' +
              '<div class="dropdown-menu dropdown-menu-end">' +
              '<a href="javascript:;" class="dropdown-item">Download</a>' +
              '<a href="javascript:;" class="dropdown-item">Edit</a>' +
              '<a href="javascript:;" class="dropdown-item">Duplicate</a>' +
              '<div class="dropdown-divider"></div>' +
              '<a href="javascript:;" class="dropdown-item delete-record text-danger">Delete</a>' +
              '</div>' +
              '</div>' +
              '</div>'
            );
          }
        }
      ],
      order: [[2, 'asc']],
      dom:
        '<"card-header d-flex align-items-md-center align-items-start py-0 flex-wrap flex-md-row flex-column"' +
        '<"me-5 ms-n4"f>' +
        '<"dt-action-buttons text-xl-end text-lg-start text-md-end text-start d-flex align-items-start align-items-sm-center justify-content-md-end pt-0 gap-sm-2 gap-6 flex-wrap flex-sm-row flex-column mb-6 mb-sm-0"l <"topic_filter mx-2"> <"comment_filter">  <"mx-0 me-md-n3 mt-sm-0"B>>' +
        '>t' +
        '<"row mx-2"' +
        '<"col-sm-12 col-md-6"i>' +
        '<"col-sm-12 col-md-6"p>' +
        '>',

      language: {
        sLengthMenu: '_MENU_',
        search: '',
        searchPlaceholder: 'Search comment',
        paginate: {
          next: '<i class="ti ti-chevron-right ti-sm"></i>',
          previous: '<i class="ti ti-chevron-left ti-sm"></i>'
        }
      },
      // Buttons with Dropdown
      buttons: [
        {
          extend: 'collection',
          className: 'btn btn-label-secondary dropdown-toggle ms-sm-2 me-3 waves-effect waves-light',
          text: '<i class="ti ti-upload ti-xs me-2"></i>Export',
          buttons: [
            {
              extend: 'print',
              text: '<i class="ti ti-printer me-2" ></i>Print',
              className: 'dropdown-item',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6],
                // prevent avatar to be print
                format: {
                  body: function (inner, coldex, rowdex) {
                    if (inner.length <= 0) return inner;
                    var el = $.parseHTML(inner);
                    var result = '';
                    $.each(el, function (index, item) {
                      if (item.classList !== undefined && item.classList.contains('customer-name')) {
                        result = result + item.lastChild.firstChild.textContent;
                      } else if (item.innerText === undefined) {
                        result = result + item.textContent;
                      } else result = result + item.innerText;
                    });
                    return result;
                  }
                }
              },
              customize: function (win) {
                //customize print view for dark
                $(win.document.body)
                  .css('color', headingColor)
                  .css('border-color', borderColor)
                  .css('background-color', bodyBg);
                $(win.document.body)
                  .find('table')
                  .addClass('compact')
                  .css('color', 'inherit')
                  .css('border-color', 'inherit')
                  .css('background-color', 'inherit');
              }
            },
            {
              extend: 'csv',
              text: '<i class="ti ti-file me-2" ></i>Csv',
              className: 'dropdown-item',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6],
                // prevent avatar to be display
                format: {
                  body: function (inner, coldex, rowdex) {
                    if (inner.length <= 0) return inner;
                    var el = $.parseHTML(inner);
                    var result = '';
                    $.each(el, function (index, item) {
                      if (item.classList !== undefined && item.classList.contains('customer-name')) {
                        result = result + item.lastChild.firstChild.textContent;
                      } else if (item.innerText === undefined) {
                        result = result + item.textContent;
                      } else result = result + item.innerText;
                    });
                    return result;
                  }
                }
              }
            },
            {
              extend: 'excel',
              text: '<i class="ti ti-file-export me-2"></i>Excel',
              className: 'dropdown-item',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6],
                // prevent avatar to be display
                format: {
                  body: function (inner, coldex, rowdex) {
                    if (inner.length <= 0) return inner;
                    var el = $.parseHTML(inner);
                    var result = '';
                    $.each(el, function (index, item) {
                      if (item.classList !== undefined && item.classList.contains('customer-name')) {
                        result = result + item.lastChild.firstChild.textContent;
                      } else if (item.innerText === undefined) {
                        result = result + item.textContent;
                      } else result = result + item.innerText;
                    });
                    return result;
                  }
                }
              }
            },
            {
              extend: 'pdf',
              text: '<i class="ti ti-file-text me-2"></i>Pdf',
              className: 'dropdown-item',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6],
                // prevent avatar to be display
                format: {
                  body: function (inner, coldex, rowdex) {
                    if (inner.length <= 0) return inner;
                    var el = $.parseHTML(inner);
                    var result = '';
                    $.each(el, function (index, item) {
                      if (item.classList !== undefined && item.classList.contains('customer-name')) {
                        result = result + item.lastChild.firstChild.textContent;
                      } else if (item.innerText === undefined) {
                        result = result + item.textContent;
                      } else result = result + item.innerText;
                    });
                    return result;
                  }
                }
              }
            },
            {
              extend: 'copy',
              text: '<i class="ti ti-copy me-2"></i>Copy',
              className: 'dropdown-item',
              exportOptions: {
                columns: [1, 2, 3, 4, 5, 6],
                // prevent avatar to be display
                format: {
                  body: function (inner, coldex, rowdex) {
                    if (inner.length <= 0) return inner;
                    var el = $.parseHTML(inner);
                    var result = '';
                    $.each(el, function (index, item) {
                      if (item.classList !== undefined && item.classList.contains('customer-name')) {
                        result = result + item.lastChild.firstChild.textContent;
                      } else if (item.innerText === undefined) {
                        result = result + item.textContent;
                      } else result = result + item.innerText;
                    });
                    return result;
                  }
                }
              }
            }
          ]
        }
      ],
      // For responsive popup
      responsive: {
        details: {
          display: $.fn.dataTable.Responsive.display.modal({
            header: function (row) {
              var data = row.data();
              return 'Details of ' + data['customer'];
            }
          }),
          type: 'column',
          renderer: function (api, rowIdx, columns) {
            var data = $.map(columns, function (col, i) {
              return col.title !== '' // ? Do not show row in modal popup if title is blank (for check box)
                ? '<tr data-dt-row="' +
                    col.rowIndex +
                    '" data-dt-column="' +
                    col.columnIndex +
                    '">' +
                    '<td>' +
                    col.title +
                    ':' +
                    '</td> ' +
                    '<td>' +
                    col.data +
                    '</td>' +
                    '</tr>'
                : '';
            }).join('');

            return data ? $('<table class="table"/><tbody />').append(data) : false;
          }
        }
      },
      initComplete: function () {
        // Adding role filter once table initialized

        // Adding topic filter
        this.api()
          .columns(2) // Kolom Topic
          .every(function () {
            var column = this;
            var select = $('<select id="topicFilter" class="form-select"><option value="">All Topics</option></select>')
              .appendTo('.topic_filter') // Tempatkan dropdown ke .topic_filter
              .on('change', function () {
                var val = $.fn.dataTable.util.escapeRegex($(this).val());
                column.search(val ? '^' + val + '$' : '', true, false).draw();
              });

            // Isi dropdown dengan topic unik dari kolom
            column
              .data()
              .unique()
              .sort()
              .each(function (d, j) {
                select.append('<option value="' + d + '">' + d + '</option>');
              });
          });
        this.api()
          .columns(6) // Kolom Sentiment
          .every(function () {
            var column = this;
            var select = $('<select id="comment" class="form-select"><option value=""> All </option></select>')
              .appendTo('.comment_filter')
              .on('change', function () {
                var val = $.fn.dataTable.util.escapeRegex($(this).val());
                column.search(val ? '^' + val + '$' : '', true, false).draw();
              });

            column
              .data()
              .unique()
              .sort()
              .each(function (d, j) {
                select.append('<option value="' + d + '" class="text-capitalize">' + d + '</option>');
              });
          });
      }
    });
  }

  // Delete Record
  $('.datatables-comment tbody').on('click', '.delete-record', function () {
    dt_comment.row($(this).parents('tr')).remove().draw();
  });

  // Filter form control to default size
  // ? setTimeout used for multilingual table initialization
  setTimeout(() => {
    $('.dataTables_filter .form-control').removeClass('form-control-sm');
    $('.dataTables_filter').addClass('mb-0 mb-md-6');
    $('.dataTables_length .form-select').removeClass('form-select-sm');
    $('.dataTables_length').addClass('ms-n2 me-2 me-sm-0 mb-0 mb-sm-6');
  }, 300);
});
