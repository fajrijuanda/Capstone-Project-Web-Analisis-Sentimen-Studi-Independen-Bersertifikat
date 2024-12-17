/**
 * Dashboard Analytics
 */

'use strict';

(function () {
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

  let cardColor, headingColor, labelColor, legendColor, borderColor, shadeColor, grayColor;
  if (isDarkStyle) {
    cardColor = config.colors_dark.cardColor;
    labelColor = config.colors_dark.textMuted;
    legendColor = config.colors_dark.bodyColor;
    headingColor = config.colors_dark.headingColor;
    borderColor = config.colors_dark.borderColor;
    shadeColor = 'dark';
    grayColor = '#5E6692'; // gray color is for stacked bar chart
  } else {
    cardColor = config.colors.cardColor;
    labelColor = config.colors.textMuted;
    legendColor = config.colors.bodyColor;
    headingColor = config.colors.headingColor;
    borderColor = config.colors.borderColor;
    shadeColor = '';
    grayColor = '#817D8D';
  }
  // swiper loop and autoplay
  // --------------------------------------------------------------------
  const swiperWithPagination = document.querySelector('#swiper-with-pagination-cards');
  if (swiperWithPagination) {
    new Swiper(swiperWithPagination, {
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false
      },
      pagination: {
        clickable: true,
        el: '.swiper-pagination'
      }
    });
  }

  // Support Tracker - Radial Bar Chart
  // --------------------------------------------------------------------
  const supportTrackerEl = document.querySelector('#supportTracker'),
    supportTrackerOptions = {
      series: [100],
      labels: ['Completed Task'],
      chart: {
        height: 320,
        type: 'radialBar'
      },
      plotOptions: {
        radialBar: {
          offsetY: 10,
          startAngle: -140,
          endAngle: 130,
          hollow: {
            size: '65%'
          },
          track: {
            background: cardColor,
            strokeWidth: '100%'
          },
          dataLabels: {
            name: {
              offsetY: -20,
              color: labelColor,
              fontSize: '13px',
              fontWeight: '400',
              fontFamily: 'Public Sans'
            },
            value: {
              offsetY: 10,
              color: headingColor,
              fontSize: '38px',
              fontWeight: '400',
              fontFamily: 'Public Sans'
            }
          }
        }
      },
      colors: [config.colors.primary],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.5,
          gradientToColors: [config.colors.primary],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 0.6,
          stops: [30, 70, 100]
        }
      },
      stroke: {
        dashArray: 10
      },
      grid: {
        padding: {
          top: -20,
          bottom: 5
        }
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      },
      responsive: [
        {
          breakpoint: 1025,
          options: {
            chart: {
              height: 330
            }
          }
        },
        {
          breakpoint: 769,
          options: {
            chart: {
              height: 280
            }
          }
        }
      ]
    };
  if (typeof supportTrackerEl !== undefined && supportTrackerEl !== null) {
    const supportTracker = new ApexCharts(supportTrackerEl, supportTrackerOptions);
    supportTracker.render();
  }

  // Memperbarui data analytics tanpa reload halaman
  async function refreshAnalyticsData() {
    if (!supportTracker) {
      console.error('Support tracker belum diinisialisasi.');
      initializeSupportTracker(); // Coba inisialisasi ulang
      if (!supportTracker) {
        console.error('Support tracker gagal diinisialisasi ulang.');
        return; // Hentikan eksekusi jika masih gagal
      }
    }

    updateSupportTracker(50); // Set progress ke 50% selama fetching data
    const analyticsData = await fetchAnalyticsData();
    if (analyticsData) {
      updateSupportTracker(100); // Progress 100% selesai
      renderAnalytics(analyticsData); // Render data baru
    }
  }

  const modal = document.getElementById('addNewAddress');
  modal.addEventListener('shown.bs.modal', () => {
    modal.setAttribute('aria-hidden', 'false');
  });
  modal.addEventListener('hidden.bs.modal', () => {
    modal.setAttribute('aria-hidden', 'true');
  });

  document.addEventListener('DOMContentLoaded', async () => {
    let supportTracker; // Global untuk ApexCharts
    let progressInterval; // Interval animasi
    let currentProgress = 0;

    // Form and Modal Elements
    const formElement = document.getElementById('addNewAddressForm');
    const supportTrackerOverlay = document.getElementById('supportTrackerOverlay');
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    const twitterRadio = document.getElementById('customRadioTwitter');
    const commentRadio = document.getElementById('customRadioComment');
    const tokenForm = document.querySelector('.token-form');
    const commentForm = document.querySelector('.comment-form');

    function initializeSupportTracker() {
      const supportTrackerEl = document.querySelector('#supportTracker');
      if (!supportTrackerEl) {
        console.error('Element #supportTracker tidak ditemukan di DOM.');
        return false; // Inisialisasi gagal
      }

      const options = {
        series: [0],
        labels: ['Progress'],
        chart: {
          id: 'supportTracker',
          height: 320,
          type: 'radialBar'
        },
        plotOptions: {
          radialBar: {
            offsetY: 10,
            startAngle: -140,
            endAngle: 130,
            hollow: { size: '65%' },
            track: { background: '#f4f4f4', strokeWidth: '100%' },
            dataLabels: {
              name: { offsetY: -20, color: '#5A5A5A', fontSize: '13px' },
              value: { offsetY: 10, color: '#333', fontSize: '38px' }
            }
          }
        },
        colors: ['#7367F0'],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'dark',
            shadeIntensity: 0.5,
            gradientToColors: ['#7367F0'],
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 0.6,
            stops: [30, 70, 100]
          }
        },
        stroke: { dashArray: 10 }
      };

      supportTracker = new ApexCharts(supportTrackerEl, options);
      supportTracker.render();
      return true; // Inisialisasi berhasil
    }
    const initialized = initializeSupportTracker();

    if (initialized) {
      // Tracker berhasil diinisialisasi
      fetchAnalyticsData().then(analyticsData => {
        if (analyticsData) {
          renderAnalytics(analyticsData);
        }
      });
    }

    // const analyticsData = await fetchAnalyticsData();
    // if (analyticsData) {
    //   renderAnalytics(analyticsData);
    // }

    function toggleOverlay(show) {
      if (supportTrackerOverlay) {
        supportTrackerOverlay.style.display = show ? 'flex' : 'none';
      }
    }

    // Update Support Tracker Value
    function updateSupportTracker(value) {
      supportTracker.updateSeries([value]); // Update nilai radial bar
    }

    // Animasi Progress
    function animateSupportTracker(targetDuration) {
      clearInterval(progressInterval);
      currentProgress = 0;

      const increment = 100 / (targetDuration / 100); // Naik setiap 100ms
      progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressInterval);
        }
        updateSupportTracker(Math.floor(currentProgress));
      }, 100);
    }

    // Stop Animasi Progress
    function stopSupportTracker() {
      clearInterval(progressInterval);
      updateSupportTracker(100);
    }

    // Toggle Forms
    function toggleForms() {
      if (twitterRadio.checked) {
        tokenForm.classList.remove('d-none');
        commentForm.classList.add('d-none');
      } else if (commentRadio.checked) {
        tokenForm.classList.add('d-none');
        commentForm.classList.remove('d-none');
      }
    }

    const backToTopBtn = document.getElementById('backToTopBtn');

    // Tampilkan tombol ketika user scroll ke bawah 200px
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });

    // Scroll ke atas dengan smooth behavior
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    twitterRadio.addEventListener('change', toggleForms);
    commentRadio.addEventListener('change', toggleForms);
    toggleForms(); // Initialize on load

    // Form Submission with dynamic tracker
    formElement.addEventListener('submit', function (event) {
      event.preventDefault(); // Prevent default form submission

      const formData = new FormData(formElement);
      const estimatedDuration = twitterRadio.checked ? 300000 : 10000; // 5 menit atau 5 detik
      // Tampilkan overlay dan mulai animasi tracker
      toggleOverlay(true);
      animateSupportTracker(estimatedDuration); // Animasi selama 10 detik jika fetch lambat

      fetch(formElement.action, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken
        },
        body: formData
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          stopSupportTracker(); // Stop animasi lebih awal jika respons cepat
          return response.json();
        })
        .then(data => {
          if (data.status === 'success') {
            stopSupportTracker(); // Pastikan progress ke 100%
            setTimeout(() => {
              toggleOverlay(false); // Sembunyikan overlay
              const modal = bootstrap.Modal.getInstance(document.getElementById('addNewAddress'));
              modal.hide(); // Sembunyikan modal
              formElement.reset();
              location.reload(); // Perbarui data
            }, 1000);
          } else {
            throw new Error(data.message);
          }
        })
        .catch(error => {
          console.error('Submission error:', error);
          clearInterval(progressInterval); // Hentikan progress jika ada error
          updateSupportTracker(0); // Reset progress ke 0
          toggleOverlay(false); // Sembunyikan overlay
        });
    });
  });

  let isFetching = false; // Flag untuk mencegah pemanggilan ganda

  async function fetchAnalyticsData() {
    if (isFetching) return; // Jangan lanjut jika sedang fetch data
    isFetching = true;

    try {
      const response = await fetch('/api/analytics/');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return null;
    } finally {
      isFetching = false; // Reset flag
    }
  }

  async function fetchCommentSummary() {
    try {
      const response = await fetch('/api/comment-summary/');
      if (!response.ok) {
        throw new Error('Failed to fetch comment summary');
      }

      const result = await response.json();
      if (result.status === 'success') {
        const data = result.data;

        const totalUsers = document.getElementById('total-users');
        const totalCommentsEl = document.getElementById('total-comments');
        const manualCommentsEl = document.getElementById('manual-comments');
        const twitterCommentsEl = document.getElementById('twitter-comments');
        const topicListEl = document.getElementById('popular-topics');

        if (totalUsers) totalUsers.textContent = data.total_users;
        if (totalCommentsEl) totalCommentsEl.textContent = data.total_comments;
        if (manualCommentsEl) manualCommentsEl.textContent = data.total_manual_comments;
        if (twitterCommentsEl) twitterCommentsEl.textContent = data.total_twitter_comments;

        if (topicListEl) {
          topicListEl.innerHTML = ''; // Kosongkan list sebelumnya
          data.popular_topics.forEach(topic => {
            const listItem = `
              <li class="d-flex mb-4 align-items-center">
                <p class="mb-0 fw-medium me-2 website-analytics-text-bg">${topic.total}</p>
                <p class="mb-0">${topic.topic}</p>
              </li>
            `;
            topicListEl.insertAdjacentHTML('beforeend', listItem);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching comment summary:', error);
    }
  }

  // Panggil fungsi saat halaman dimuat
  document.addEventListener('DOMContentLoaded', fetchCommentSummary);

  // Render isi Swiper Slide dan Pagination
  // Render analytics data into the Swiper component
  function renderAnalytics(data) {
    const swiperWrapper = document.querySelector('#main-swiper-wrapper');
    const paginationContainer = document.querySelector('.pagination.pagination-rounded');
    const noDataMessage = document.querySelector('#no-data-message');

    if (!swiperWrapper || !paginationContainer) {
      console.error('Swiper wrapper or pagination container not found.');
      return;
    }

    // Clear previous content
    swiperWrapper.innerHTML = '';
    paginationContainer
      .querySelectorAll('.page-item:not(.first):not(.prev):not(.next):not(.last)')
      .forEach(item => item.remove());

    // Handle no data scenario
    if (!data || !data.slides || data.slides.length === 0) {
      noDataMessage.style.display = 'block'; // Tampilkan pesan
      paginationContainer.style.display = 'none'; // Sembunyikan pagination
      return;
    } else {
      noDataMessage.style.display = 'none'; // Sembunyikan pesan
      paginationContainer.style.display = 'flex'; // Tampilkan pagination
    }

    data.slides.forEach((slide, index) => {
      const comments = slide.comments || [];
      console.log(data); // Debugging data API
      // Ambil total sentiment langsung dari slide
      const sentimentPercentage = slide.sentiment_percentage;
      slide.index = index + 1;
      // Fungsi untuk memformat tanggal agar lebih human-readable
      function formatDate(dateString) {
        if (!dateString) return 'N/A'; // Jika tidak ada tanggal, tetap "N/A"

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date);
      }

      // Default values for startDate and endDate
      const startDate =
        comments.length > 0 && comments[0].startDate
          ? formatDate(comments[0].startDate)
          : comments[0].created_at
            ? formatDate(comments[0].created_at)
            : 'N/A';

      const endDate =
        comments.length > 0 && comments[0].endDate
          ? formatDate(comments[0].endDate)
          : comments[0].created_at
            ? formatDate(comments[0].created_at)
            : 'N/A';

      const sentimentCounts = slide.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };

      const sentimentData = [
        { label: 'Positive', value: sentimentCounts.positive || 0, color: '#7367F0' },
        { label: 'Neutral', value: sentimentCounts.neutral || 0, color: '#00BAD1' },
        { label: 'Negative', value: sentimentCounts.negative || 0, color: '#DC3545' }
      ];
      // const safeValue = val => (val !== undefined && val !== null ? val.toFixed(2) : '0.00');
      // Render slide HTML
      const slideHTML = `
      <div class="swiper-slide">
        <div class="h-100">
          <div class="card-header pb-0 d-flex justify-content-between">
            <div class="card-title mb-0">
              <h5 class="mb-1">Sentiment Analytics ${slide.index}</h5>
              <p class="card-subtitle">${slide.subtitle}</p>
            </div>
            <div class="dropdown">
              <button
                class="btn btn-text-secondary rounded-pill text-muted border-0 p-2 me-n1"
                type="button"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <i class="ti ti-dots-vertical ti-md text-muted"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end">
                <a class="dropdown-item" href="javascript:void(0);">View More</a>
                <a class="dropdown-item" href="javascript:void(0);">Delete</a>
              </div>
            </div>
          </div>
          <div class="row card-body">
            <div class="card-body col-8">
              <div class="row align-items-center g-md-8">
                <div class="col-12 col-md-7 d-flex flex-column">
                  <div class="d-flex gap-2 align-items-center mb-3 flex-wrap">
                    <h2 class="mb-0">${comments.length}</h2>
                    <div class="badge rounded bg-label-success"></div>
                  </div>
                  <small class="text-body">Comments</small>
                </div>
                <div class="col-12 col-md-5 ps-xl-8">
                  <h5 class="mb-2">${slide.title}</h5>
                  <div class="row mb-4 g-3">
                    <div class="col-6">
                      <div class="d-flex">
                        <div class="avatar flex-shrink-0 me-3">
                          <span class="avatar-initial rounded bg-label-primary">
                            <i class="ti ti-calendar-event ti-28px"></i>
                          </span>
                        </div>
                        <div>
                          <h6 class="mb-0 text-nowrap">${startDate}</h6>
                          <small class="text-body">From</small>
                        </div>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="d-flex">
                        <div class="avatar flex-shrink-0 me-3">
                          <span class="avatar-initial rounded bg-label-primary">
                            <i class="ti ti-clock ti-28px"></i>
                          </span>
                        </div>
                        <div>
                          <h6 class="mb-0 text-nowrap">${endDate}</h6>
                          <small class="text-body">Until</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="border rounded p-5 mt-5">
                <div class="row gap-4 gap-sm-0">
                ${renderProgress('Positive', 'primary', sentimentPercentage.positive)}
                ${renderProgress('Neutral', 'info', sentimentPercentage.neutral)}
                ${renderProgress('Negative', 'danger', sentimentPercentage.negative)}
                </div>
              </div>
            </div>
            <div class="card-body col-4">
              
              
                <canvas id="polarChart-${index}" class="chartjs" data-height="250"></canvas>
              
              
            
            </div>
          </div>
          <div class="card-header pt-0 d-flex justify-content-between">
            <div class="card-title mb-0">
              <h5 class="mb-1">Analytics Results</h5>
            </div>
          </div>
          <div class="card-body">
            <div class="col-md mb-6 mb-md-2">
              <div class="accordion mt-4" id="accordion-${index}">
                ${renderComments(comments, index)}
              </div>
            </div>
          </div>
        </div>
      </div>`;

      swiperWrapper.insertAdjacentHTML('beforeend', slideHTML);

      setTimeout(() => initializePolarChart(`polarChart-${index}`, sentimentData), 0);
      // Add pagination items
      const pageItemHTML = `
      <li class="page-item" data-index="${index}">
        <a class="page-link" href="javascript:void(0);">${index + 1}</a>
      </li>`;
      paginationContainer.insertBefore(
        document.createRange().createContextualFragment(pageItemHTML),
        paginationContainer.querySelector('.next')
      );
    });

    initializeSwiper(data.slides.length);
  }

  const polarChart = document.getElementById('polarChart');
  if (polarChart) {
    const sentimentData = {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [data.sentiment_counts.positive, data.sentiment_counts.neutral, data.sentiment_counts.negative],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
          borderWidth: 0
        }
      ]
    };

    new Chart(polarChart, {
      type: 'polarArea',
      data: sentimentData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  function initializePolarChart(canvasId, sentimentData) {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded.');
      return;
    }

    // Urutkan data berdasarkan nilai tertinggi ke terendah
    const sortedData = sentimentData.sort((a, b) => b.value - a.value);

    const chartElement = document.getElementById(canvasId);
    if (chartElement) {
      new Chart(chartElement, {
        type: 'pie', // Ganti menjadi 'pie' atau 'doughnut'
        data: {
          labels: sortedData.map(item => item.label),
          datasets: [
            {
              data: sortedData.map(item => item.value),
              backgroundColor: sortedData.map(item => item.color),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: context => `${context.label}: ${context.raw}`
              }
            }
          }
        }
      });
    }
  }

  function renderProgress(label, color, value) {
    // Pilih ikon berdasarkan label
    const iconClass =
      {
        Positive: 'ti ti-mood-smile-beam',
        Neutral: 'ti ti-mood-neutral',
        Negative: 'ti ti-mood-angry'
      }[label] || '';

    const validValue = value || 0;

    return `
      <div class="col-12 col-sm-4">
        <div class="d-flex gap-2 align-items-center">
          <div class="badge rounded bg-label-${color} p-1">
            <i class="${iconClass} ti-sm"></i>
          </div>
          <h6 class="mb-0 fw-normal">${label}</h6>
        </div>
        <h4 class="my-2">${validValue.toFixed(2)}%</h4>
        <div class="progress w-75" style="height: 4px;">
          <div
            class="progress-bar bg-${color}"
            role="progressbar"
            style="width: ${validValue}%"
            aria-valuenow="${validValue}"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>`;
  }

  function renderComments(comments, slideIndex) {
    return comments
      .map(
        (comment, index) => `
        <div class="card accordion-item ${index === 0 ? 'active' : ''}">
          <h2 class="accordion-header d-flex align-items-center">
            <button
              type="button"
              class="accordion-button ${index === 0 ? '' : 'collapsed'}"
              data-bs-toggle="collapse"
              data-bs-target="#accordion-${slideIndex}-${index}"
              aria-expanded="${index === 0 ? 'true' : 'false'}"
            >
              <i class="${getSentimentIcon(comment)} me-2"></i>
              Comment ${index + 1}
            </button>
          </h2>
          <div
            id="accordion-${slideIndex}-${index}"
            class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
          >
            <div class="accordion-body">
              <div class="p-5 mt-5 col-6">
                <div class="row gap-4 gap-sm-0">
                  <div class="col-12 col-sm-4">
                    <div class="d-flex gap-2 align-items-center">
                      <div class="badge rounded bg-label-primary p-1">
                        <i class="ti ti-mood-smile-beam ti-sm"></i>
                      </div>
                      <h6 class="mb-0 fw-normal">Positive</h6>
                    </div>
                    <h4 class="my-2">${comment.positive.toFixed(2)}%</h4>
                    <div class="progress w-75" style="height: 4px;">
                      <div
                        class="progress-bar"
                        role="progressbar"
                        style="width: ${comment.positive}%"
                        aria-valuenow="${comment.positive}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="d-flex gap-2 align-items-center">
                      <div class="badge rounded bg-label-info p-1">
                        <i class="ti ti-mood-neutral ti-sm"></i>
                      </div>
                      <h6 class="mb-0 fw-normal">Neutral</h6>
                    </div>
                    <h4 class="my-2">${comment.neutral.toFixed(2)}%</h4>
                    <div class="progress w-75" style="height: 4px;">
                      <div
                        class="progress-bar bg-info"
                        role="progressbar"
                        style="width: ${comment.neutral}%"
                        aria-valuenow="${comment.neutral}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="d-flex gap-2 align-items-center">
                      <div class="badge rounded bg-label-danger p-1">
                        <i class="ti ti-mood-angry ti-sm"></i>
                      </div>
                      <h6 class="mb-0 fw-normal">Negative</h6>
                    </div>
                    <h4 class="my-2">${comment.negative.toFixed(2)}%</h4>
                    <div class="progress w-75" style="height: 4px;">
                      <div
                        class="progress-bar bg-danger"
                        role="progressbar"
                        style="width: ${comment.negative}%"
                        aria-valuenow="${comment.negative}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-wrap" style="font-size: 1.2rem; line-height: 1.6;">
                ${highlightSentiments(comment.text)}
              </p>
            </div>
          </div>
        </div>`
      )
      .join('');
  }

  // Fungsi untuk menambahkan highlight pada teks sentimen
  // Fungsi untuk menambahkan highlight pada teks sentimen berdasarkan jenis sentimen
  function highlightSentiments(text, keywords) {
    if (!keywords || typeof keywords !== 'object') return text;

    // Membangun regex dinamis untuk setiap jenis sentimen
    const positiveRegex =
      keywords.positive && keywords.positive.length > 0
        ? new RegExp(`\\b(${keywords.positive.join('|')})\\b`, 'gi')
        : null;
    const neutralRegex =
      keywords.neutral && keywords.neutral.length > 0
        ? new RegExp(`\\b(${keywords.neutral.join('|')})\\b`, 'gi')
        : null;
    const negativeRegex =
      keywords.negative && keywords.negative.length > 0
        ? new RegExp(`\\b(${keywords.negative.join('|')})\\b`, 'gi')
        : null;

    // Ganti teks sesuai jenis sentimen dengan highlight warna berbeda
    let highlightedText = text;

    if (positiveRegex) {
      highlightedText = highlightedText.replace(
        positiveRegex,
        match => `<span style="color: #7367f0; font-weight: bold;">${match}</span>` // Hijau untuk positive
      );
    }

    if (neutralRegex) {
      highlightedText = highlightedText.replace(
        neutralRegex,
        match => `<span style="color: #00bad1; font-weight: bold;">${match}</span>` // Biru untuk neutral
      );
    }

    if (negativeRegex) {
      highlightedText = highlightedText.replace(
        negativeRegex,
        match => `<span style="color: #dc3545; font-weight: bold;">${match}</span>` // Merah untuk negative
      );
    }

    return highlightedText;
  }

  function initializeSwiper(totalSlides) {
    const swiperInstance = new Swiper('.swiper-3d-container', {
      effect: 'slide',
      autoHeight: true,
      slidesPerView: 1,
      loop: false,
      autoplay: false,
      on: {
        slideChangeTransitionEnd: function () {
          this.updateAutoHeight(); // Update height jika ada perubahan konten
        }
      }
    });
    
    document.addEventListener('shown.bs.collapse', () => {
      // Perbarui tinggi Swiper setiap kali accordion terbuka
      if (swiperInstance) {
        swiperInstance.updateAutoHeight();
      }
    });

    document.addEventListener('hidden.bs.collapse', () => {
      // Perbarui tinggi Swiper setiap kali accordion tertutup
      if (swiperInstance) {
        swiperInstance.updateAutoHeight();
      }
    });
    const paginationContainer = document.querySelector('.pagination.pagination-rounded');

    paginationContainer.querySelector('.first').addEventListener('click', () => swiperInstance.slideTo(0));
    paginationContainer.querySelector('.last').addEventListener('click', () => swiperInstance.slideTo(totalSlides - 1));
    paginationContainer.querySelector('.prev').addEventListener('click', () => swiperInstance.slidePrev());
    paginationContainer.querySelector('.next').addEventListener('click', () => swiperInstance.slideNext());

    paginationContainer.querySelectorAll('.page-item[data-index]').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index, 10);
        swiperInstance.slideTo(index);
      });
    });

    swiperInstance.on('slideChange', () => updateActivePagination(swiperInstance.activeIndex));
  }

  function updateActivePagination(activeIndex) {
    const paginationContainer = document.querySelector('.pagination.pagination-rounded');
    paginationContainer.querySelectorAll('.page-item').forEach(item => item.classList.remove('active'));
    const activeItem = paginationContainer.querySelector(`.page-item[data-index="${activeIndex}"]`);
    if (activeItem) activeItem.classList.add('active');
  }

  function getSentimentIcon(comment) {
    if (comment.positive > comment.neutral && comment.positive > comment.negative) {
      return 'ti ti-mood-smile-beam text-primary';
    } else if (comment.neutral > comment.positive && comment.neutral > comment.negative) {
      return 'ti ti-mood-neutral text-info';
    } else {
      return 'ti ti-mood-angry text-danger';
    }
  }
})();
